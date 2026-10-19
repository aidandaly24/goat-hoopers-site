/**
 * weekly-player-evidence.ts — ObservedPlayerWeek source adapter (issue #190).
 *
 * What this is: a read-only, points-only source layer over ONE completed
 * previous fantasy week. It validates the NBA state, league, rosters and
 * matchup payloads it is handed, and returns the recorded per-player fantasy
 * points (`players_points`) for the players who were on a team's roster that
 * week AND are on its current roster, with explicit coverage for everyone
 * else (departed, unrecorded, missing or invalid rows — never silently
 * dropped, never invented).
 *
 * What this is NOT: it is not `CompletedPlayerWeek`
 * (src/domain/team-player-guide.ts) and it never satisfies that contract or
 * its positive-games gate — including for positive points. This source
 * cannot establish participation: a recorded 0.0 is preserved verbatim with
 * participation "unknown", `gamesPlayed` is null for every player (no
 * supported source yields weekly games played — see
 * docs/weekly-player-evidence.md), and nothing here asserts played / DNP /
 * injury history from points, starter slots or current injury_status.
 * There are no startsAt/endsAt fields: no source publishes a fantasy week's
 * calendar bounds, and none are fabricated.
 *
 * Dependency inversion (AGENTS.md rule 11): this module imports no concrete
 * client. In particular it does NOT import src/data/sleeper.ts (only
 * transform.ts and league.ts may) and it never fetches api.sleeper.app
 * itself. Callers inject the four payload sources; production wiring —
 * passing the existing fetchMatchups / fetchNbaState / fetchLeague /
 * fetchRosters payloads through, after the RawMatchupEntry extension —
 * belongs to the integration step owned on issue #190. Until then nothing
 * in the app calls this module.
 *
 * Bounds: one matchup read for the target week covers all ten teams; the
 * payload is retained in a single-slot cache (one week, 24h TTL —
 * completed-week payloads are effectively immutable; revisions are re-read
 * after the TTL, and a failed re-read yields an explicit unavailable, never
 * last-good evidence presented as fresh). State, league and rosters are
 * loaded through the injected sources on every call and are never cached
 * here, so week determination cannot go stale inside this module.
 *
 * Failure contract: getObservedPreviousWeek never throws. Every source
 * failure, malformed payload or uncertifiable week is an explicit
 * `{ status: "unavailable", reason, detail }` result.
 */

/* ---------- injected sources (payloads arrive unvalidated) ---------- */

export type WeeklyEvidenceSources = {
  /** NBA season state payload (GET /state/nba shape). */
  loadState: () => Promise<unknown>;
  /** League object payload for the canonical league. */
  loadLeague: () => Promise<unknown>;
  /** Current rosters payload for the canonical league. */
  loadRosters: () => Promise<unknown>;
  /** Matchup entries payload for one league week (all teams in one read). */
  loadMatchups: (week: number) => Promise<unknown>;
};

/* ---------- the observed-week contract (local to this module) ---------- */

export type ObservedPlayerPoints = {
  playerId: string;
  /**
   * Recorded fantasy points from the source week's players_points map,
   * preserved exactly as served. null = the map carried no usable recorded
   * value for this player (key absent, null, non-numeric or non-finite).
   * null is NOT a zero and must never be rendered as one.
   */
  fantasyPoints: number | null;
  /** Participation is never established by this source. Always "unknown". */
  participation: "unknown";
  /** No supported source yields weekly games played. Always null. */
  gamesPlayed: null;
};

export type ObservedWeekCoverage = {
  /** Players on the team's roster in the source week (deduplicated). */
  weekRosterCount: number;
  /** Players on the team's current roster (deduplicated). */
  currentRosterCount: number;
  /** Intersected players with a finite recorded points value. */
  recordedCount: number;
  /** On the source week's roster, no longer on the current roster. */
  departedPlayerIds: string[];
  /** On the current roster, absent from the source week's roster — they
   *  have no recorded points that week and are never zero-filled. */
  unrecordedPlayerIds: string[];
  /** Intersected players whose players_points row was absent or null. */
  missingPointPlayerIds: string[];
  /** Intersected players whose players_points value was non-numeric or
   *  non-finite; their fantasyPoints is null, never the raw value. */
  invalidPointPlayerIds: string[];
  /** Player IDs appearing more than once in the source week's roster. */
  duplicateSourcePlayerIds: string[];
};

export type ObservedPlayerWeek = {
  /** Discriminator: visibly distinct from CompletedPlayerWeek. */
  kind: "observed-player-week";
  /** Canonical league id from the league payload, when it carries one. */
  leagueId: string | null;
  season: string;
  /** The completed week the points were recorded in. */
  week: number;
  /** Sleeper roster_id of the team this evidence describes. */
  teamId: number;
  /** Source roster IDs from the week's matchup entry (deduplicated,
   *  source order). */
  rosterPlayerIds: string[];
  /** Current-roster players with their recorded points for the week. */
  players: ObservedPlayerPoints[];
  coverage: ObservedWeekCoverage;
};

export type ObservedWeekUnavailableReason =
  | "state-unavailable"
  | "state-invalid"
  | "preseason"
  | "unsupported-season-type"
  | "no-completed-week"
  | "league-unavailable"
  | "league-invalid"
  | "season-mismatch"
  | "rosters-unavailable"
  | "rosters-invalid"
  | "team-not-found"
  | "matchups-unavailable"
  | "matchups-invalid"
  | "matchup-entry-missing";

export type ObservedPlayerWeekResult =
  | { status: "available"; evidence: ObservedPlayerWeek }
  | {
      status: "unavailable";
      reason: ObservedWeekUnavailableReason;
      detail: string;
    };

/* ---------- week determination (pure) ---------- */

export type ObservedWeekContext = {
  leagueId: string | null;
  season: string;
  /** The in-progress week per the source state (its leg). */
  currentWeek: number;
  /** currentWeek - 1: the only week this adapter may certify. */
  targetWeek: number;
};

export type ObservedWeekContextResult =
  | { ok: true; context: ObservedWeekContext }
  | {
      ok: false;
      reason: ObservedWeekUnavailableReason;
      detail: string;
    };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isWeekNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= 0;

/**
 * Decide the one certifiable week from the raw state + league payloads.
 *
 * Source-leg semantics (verified against the live payload and this repo):
 * Sleeper calls the NBA fantasy week number "leg" — transactions carry the
 * week in `leg` (transform.ts maps t.leg to week), RawNbaState documents
 * "Sleeper NBA uses leg; preseason is zero", and league.ts derives the
 * current week as `state.leg ?? state.week`. The adapter therefore reads
 * the current week from leg (falling back to week), requires the two to
 * agree when both are present, and certifies only leg - 1: the current and
 * any future week are incomplete by construction. League status is never
 * consulted — a "complete" league cannot certify a week the state does not
 * bound (e.g. arbitrary historical or placeholder weeks).
 */
export function resolveObservedWeekContext(
  stateRaw: unknown,
  leagueRaw: unknown,
): ObservedWeekContextResult {
  if (!isRecord(stateRaw))
    return {
      ok: false,
      reason: "state-invalid",
      detail: "NBA state payload is not an object.",
    };
  const season = stateRaw.season;
  if (typeof season !== "string" || season.length === 0)
    return {
      ok: false,
      reason: "state-invalid",
      detail: "NBA state payload carries no season.",
    };
  const leagueSeason = stateRaw.league_season;
  if (
    leagueSeason !== undefined &&
    (typeof leagueSeason !== "string" || leagueSeason !== season)
  )
    return {
      ok: false,
      reason: "state-invalid",
      detail: "NBA state league_season disagrees with its season.",
    };
  const seasonType = stateRaw.season_type;
  if (typeof seasonType !== "string" || seasonType.length === 0)
    return {
      ok: false,
      reason: "state-invalid",
      detail: "NBA state payload carries no season_type.",
    };
  if (seasonType === "pre")
    return {
      ok: false,
      reason: "preseason",
      detail: "NBA state is preseason; no week has been played.",
    };
  if (seasonType !== "regular")
    return {
      ok: false,
      reason: "unsupported-season-type",
      detail: `NBA state season_type "${seasonType}" does not bound a regular-season previous week.`,
    };
  const leg = stateRaw.leg;
  const week = stateRaw.week;
  if (leg !== undefined && !isWeekNumber(leg))
    return {
      ok: false,
      reason: "state-invalid",
      detail: "NBA state leg is not a non-negative integer.",
    };
  if (week !== undefined && !isWeekNumber(week))
    return {
      ok: false,
      reason: "state-invalid",
      detail: "NBA state week is not a non-negative integer.",
    };
  if (leg !== undefined && week !== undefined && leg !== week)
    return {
      ok: false,
      reason: "state-invalid",
      detail: `NBA state leg (${leg}) and week (${week}) disagree.`,
    };
  const currentWeek = leg ?? week;
  if (currentWeek === undefined)
    return {
      ok: false,
      reason: "state-invalid",
      detail: "NBA state carries neither leg nor week.",
    };
  if (currentWeek === 0)
    return {
      ok: false,
      reason: "state-invalid",
      detail: "NBA state leg is zero outside preseason.",
    };
  if (currentWeek > 54)
    return {
      ok: false,
      reason: "state-invalid",
      detail: `NBA state leg (${currentWeek}) is outside the sane week bound.`,
    };
  if (currentWeek < 2)
    return {
      ok: false,
      reason: "no-completed-week",
      detail: `Week ${currentWeek} is in progress; no previous week is complete.`,
    };
  if (!isRecord(leagueRaw))
    return {
      ok: false,
      reason: "league-invalid",
      detail: "League payload is not an object.",
    };
  const leagueSeasonValue = leagueRaw.season;
  if (typeof leagueSeasonValue !== "string" || leagueSeasonValue.length === 0)
    return {
      ok: false,
      reason: "league-invalid",
      detail: "League payload carries no season.",
    };
  if (leagueSeasonValue !== season)
    return {
      ok: false,
      reason: "season-mismatch",
      detail: `League season ${leagueSeasonValue} does not match state season ${season}.`,
    };
  return {
    ok: true,
    context: {
      leagueId:
        typeof leagueRaw.league_id === "string" ? leagueRaw.league_id : null,
      season,
      currentWeek,
      targetWeek: currentWeek - 1,
    },
  };
}

/* ---------- shaping one team's observed week (pure) ---------- */

type StringListResult =
  | { ok: true; ids: string[]; duplicates: string[] }
  | { ok: false };

/** Validate an unknown as an array of strings; dedupe in source order. */
function readStringList(value: unknown): StringListResult {
  if (!Array.isArray(value)) return { ok: false };
  const ids: string[] = [];
  const seen = new Set<string>();
  const duplicates: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") return { ok: false };
    if (seen.has(item)) {
      duplicates.push(item);
      continue;
    }
    seen.add(item);
    ids.push(item);
  }
  return { ok: true, ids, duplicates };
}

const unavailable = (
  reason: ObservedWeekUnavailableReason,
  detail: string,
): ObservedPlayerWeekResult => ({ status: "unavailable", reason, detail });

/**
 * Shape one team's ObservedPlayerWeek from the raw rosters + matchups
 * payloads under an already-resolved context. Only the target team's
 * matchup entry is validated strictly; other teams' entries are not this
 * call's evidence. Starter slots are never read: participation is not
 * inferred from them.
 */
export function shapeObservedPlayerWeek(input: {
  context: ObservedWeekContext;
  teamId: number;
  rostersRaw: unknown;
  matchupsRaw: unknown;
}): ObservedPlayerWeekResult {
  const { context, teamId, rostersRaw, matchupsRaw } = input;
  if (!Number.isSafeInteger(teamId) || teamId <= 0)
    return unavailable("team-not-found", `Invalid roster id ${teamId}.`);

  if (!Array.isArray(rostersRaw))
    return unavailable("rosters-invalid", "Rosters payload is not an array.");
  const roster = rostersRaw.find(
    (entry) => isRecord(entry) && entry.roster_id === teamId,
  );
  if (!roster)
    return unavailable(
      "team-not-found",
      `No current roster with id ${teamId}.`,
    );
  const current = readStringList((roster as Record<string, unknown>).players);
  if (!current.ok)
    return unavailable(
      "rosters-invalid",
      `Current roster ${teamId} carries no valid players list.`,
    );
  const currentSet = new Set(current.ids);

  if (!Array.isArray(matchupsRaw))
    return unavailable(
      "matchups-invalid",
      "Matchups payload is not an array.",
    );
  if (matchupsRaw.length === 0)
    return unavailable(
      "matchups-unavailable",
      `No matchup entries were served for week ${context.targetWeek}.`,
    );
  const entries = matchupsRaw.filter(
    (entry) => isRecord(entry) && entry.roster_id === teamId,
  );
  if (entries.length === 0)
    return unavailable(
      "matchup-entry-missing",
      `No week ${context.targetWeek} matchup entry for roster ${teamId}.`,
    );
  if (entries.length > 1)
    return unavailable(
      "matchups-invalid",
      `Duplicate week ${context.targetWeek} matchup entries for roster ${teamId}.`,
    );
  const entry = entries[0] as Record<string, unknown>;
  const weekList = readStringList(entry.players);
  if (!weekList.ok)
    return unavailable(
      "matchups-invalid",
      `Week ${context.targetWeek} entry for roster ${teamId} carries no valid players list.`,
    );
  const pointsMap = entry.players_points;
  if (!isRecord(pointsMap))
    return unavailable(
      "matchups-invalid",
      `Week ${context.targetWeek} entry for roster ${teamId} carries no players_points map.`,
    );

  const players: ObservedPlayerPoints[] = [];
  const missingPointPlayerIds: string[] = [];
  const invalidPointPlayerIds: string[] = [];
  const departedPlayerIds: string[] = [];
  let recordedCount = 0;
  for (const playerId of weekList.ids) {
    if (!currentSet.has(playerId)) {
      departedPlayerIds.push(playerId);
      continue;
    }
    const raw = pointsMap[playerId];
    if (typeof raw === "number" && Number.isFinite(raw)) {
      recordedCount += 1;
      players.push({
        playerId,
        fantasyPoints: raw,
        participation: "unknown",
        gamesPlayed: null,
      });
    } else if (raw === null || raw === undefined) {
      missingPointPlayerIds.push(playerId);
      players.push({
        playerId,
        fantasyPoints: null,
        participation: "unknown",
        gamesPlayed: null,
      });
    } else {
      invalidPointPlayerIds.push(playerId);
      players.push({
        playerId,
        fantasyPoints: null,
        participation: "unknown",
        gamesPlayed: null,
      });
    }
  }
  const weekSet = new Set(weekList.ids);
  const unrecordedPlayerIds = current.ids.filter((id) => !weekSet.has(id));

  return {
    status: "available",
    evidence: {
      kind: "observed-player-week",
      leagueId: context.leagueId,
      season: context.season,
      week: context.targetWeek,
      teamId,
      rosterPlayerIds: weekList.ids,
      players,
      coverage: {
        weekRosterCount: weekList.ids.length,
        currentRosterCount: current.ids.length,
        recordedCount,
        departedPlayerIds,
        unrecordedPlayerIds,
        missingPointPlayerIds,
        invalidPointPlayerIds,
        duplicateSourcePlayerIds: weekList.duplicates,
      },
    },
  };
}

/* ---------- the adapter factory ---------- */

/** How long the single retained matchup payload stays fresh: 24h. */
export const OBSERVED_WEEK_MATCHUP_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export type WeeklyPlayerEvidenceOptions = {
  sources: WeeklyEvidenceSources;
  /** Injectable clock (tests). Defaults to Date.now. */
  now?: () => number;
  /** Injectable matchup-payload TTL (tests). */
  matchupCacheTtlMs?: number;
};

export type WeeklyPlayerEvidence = {
  getObservedPreviousWeek: (
    teamId: number,
  ) => Promise<ObservedPlayerWeekResult>;
};

/**
 * Build the adapter around injected payload sources. The matchup payload
 * is cached in a single slot keyed by week (at most one week's payload is
 * ever retained); state, league and rosters are loaded fresh on every call
 * through the sources, whose own upstream caching bounds their cost.
 */
export function createWeeklyPlayerEvidence(
  options: WeeklyPlayerEvidenceOptions,
): WeeklyPlayerEvidence {
  const { sources } = options;
  const now = options.now ?? (() => Date.now());
  const ttlMs = options.matchupCacheTtlMs ?? OBSERVED_WEEK_MATCHUP_CACHE_TTL_MS;
  let slot: { week: number; fetchedAt: number; payload: unknown } | null =
    null;

  async function loadMatchupsPayload(week: number): Promise<unknown> {
    if (slot && slot.week === week && now() - slot.fetchedAt < ttlMs)
      return slot.payload;
    const payload = await sources.loadMatchups(week);
    slot = { week, fetchedAt: now(), payload };
    return payload;
  }

  return {
    async getObservedPreviousWeek(teamId) {
      let stateRaw: unknown;
      try {
        stateRaw = await sources.loadState();
      } catch {
        return unavailable(
          "state-unavailable",
          "NBA state could not be loaded.",
        );
      }
      let leagueRaw: unknown;
      try {
        leagueRaw = await sources.loadLeague();
      } catch {
        return unavailable(
          "league-unavailable",
          "League payload could not be loaded.",
        );
      }
      const resolved = resolveObservedWeekContext(stateRaw, leagueRaw);
      if (!resolved.ok) return unavailable(resolved.reason, resolved.detail);
      const { context } = resolved;

      let rostersRaw: unknown;
      try {
        rostersRaw = await sources.loadRosters();
      } catch {
        return unavailable(
          "rosters-unavailable",
          "Rosters payload could not be loaded.",
        );
      }
      let matchupsRaw: unknown;
      try {
        matchupsRaw = await loadMatchupsPayload(context.targetWeek);
      } catch {
        return unavailable(
          "matchups-unavailable",
          `Matchups for week ${context.targetWeek} could not be loaded.`,
        );
      }
      return shapeObservedPlayerWeek({
        context,
        teamId,
        rostersRaw,
        matchupsRaw,
      });
    },
  };
}
