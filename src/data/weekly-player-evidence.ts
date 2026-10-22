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
 * payload is retained in a single-slot cache (24h TTL — completed-week
 * payloads are effectively immutable; revisions are re-read after the TTL,
 * and a failed re-read yields an explicit unavailable, never last-good
 * evidence presented as fresh). The slot and any in-flight load are keyed
 * by validated league id + season + target week, so a payload can never be
 * served under a different league/season context than the one it was read
 * for, and concurrent callers share exactly one in-flight load per key.
 * State, league and rosters are loaded through the injected sources on
 * every call and are never cached here, so week determination cannot go
 * stale inside this module.
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
  /** Canonical league id, validated from the league payload (required). */
  leagueId: string;
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
  leagueId: string;
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

const SEASON_FORMAT = /^\d{4}$/;
const START_DATE_FORMAT = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Decide the one certifiable week from the raw state + league payloads.
 *
 * Source-leg semantics (verified against the live payload and this repo):
 * Sleeper calls the NBA fantasy week number "leg" — this league's own
 * transactions carry the week in `leg` (transform.ts maps t.leg to week),
 * RawNbaState documents "Sleeper NBA uses leg; preseason is zero", and
 * every sampled live state payload carried `leg`. Certification therefore
 * requires `leg` itself. The state's `week` field is NOT used as a
 * fallback: league.ts's `state.leg ?? state.week` is a display derivation,
 * and nothing in the source establishes that `week` alone bounds a
 * completed score window for the NBA — so a state without `leg` is
 * explicitly unavailable rather than certified on weaker evidence. When
 * both are present they must agree. The adapter certifies only leg - 1:
 * the current and any future week are incomplete by construction.
 *
 * Context is validated, not merely present: the season must be a
 * four-digit year on both payloads (a matching but malformed season such
 * as "bad" certifies nothing), and the season must be certifiably
 * started. `season_start_date`, when present, must be a real calendar
 * date — its components must survive a UTC round-trip, because Date.UTC
 * silently normalizes impossible dates ("2026-02-31" becomes Mar 3) —
 * must agree with the season and must not lie in the future. When the
 * date is absent the pre-start check is not waived: the only
 * certifiable bound is October 1 of the season's year (seasons tip in
 * October of their labelled year — the state receipt carries
 * 2026-10-20 for season "2026"), and a clock before that bound is
 * certainly pre-start, hence uncertifiable. `regular` and
 * `season_has_scores: true` already occur before tipoff, so a leg-2
 * state whose season has not started yet is a contradictory/pre-start
 * context, not a completed week, however its placeholder matchups look.
 * League status is never consulted — a "complete" league cannot certify
 * a week the state does not bound (e.g. arbitrary historical or
 * placeholder weeks).
 */
export function resolveObservedWeekContext(
  stateRaw: unknown,
  leagueRaw: unknown,
  nowMs: number = Date.now(),
): ObservedWeekContextResult {
  if (!isRecord(stateRaw))
    return {
      ok: false,
      reason: "state-invalid",
      detail: "NBA state payload is not an object.",
    };
  const season = stateRaw.season;
  if (typeof season !== "string" || !SEASON_FORMAT.test(season))
    return {
      ok: false,
      reason: "state-invalid",
      detail: "NBA state season is not a four-digit year.",
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
  const startDate = stateRaw.season_start_date;
  if (startDate !== undefined) {
    const match =
      typeof startDate === "string" ? START_DATE_FORMAT.exec(startDate) : null;
    if (!match)
      return {
        ok: false,
        reason: "state-invalid",
        detail: "NBA state season_start_date is not a YYYY-MM-DD date.",
      };
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const startMs = Date.UTC(year, month - 1, day);
    // Shape is not validity: Date.UTC silently normalizes impossible
    // components (month 00 rolls back a year, Feb 31 becomes Mar 3), so
    // the parsed components must survive a round-trip unchanged.
    const roundTripped = new Date(startMs);
    if (
      roundTripped.getUTCFullYear() !== year ||
      roundTripped.getUTCMonth() !== month - 1 ||
      roundTripped.getUTCDate() !== day
    )
      return {
        ok: false,
        reason: "state-invalid",
        detail: `NBA state season_start_date (${startDate}) is not a real calendar date.`,
      };
    if (match[1] !== season)
      return {
        ok: false,
        reason: "state-invalid",
        detail: `NBA state season_start_date (${startDate}) disagrees with its season (${season}).`,
      };
    if (startMs > nowMs)
      return {
        ok: false,
        reason: "state-invalid",
        detail: `NBA state season_start_date (${startDate}) is in the future; the season has not started, so no week is complete.`,
      };
  } else if (nowMs < Date.UTC(Number(season), 9, 1)) {
    // An absent start date never waives the pre-start check. Without the
    // date, the only certifiable bound is the earliest the season could
    // possibly have begun: seasons tip in October of their labelled year
    // (the state receipt carries 2026-10-20 for season "2026"). A clock
    // before that October is certainly pre-start, so the season is
    // uncertifiable as started and no week can be complete.
    return {
      ok: false,
      reason: "state-invalid",
      detail: `NBA state season ${season} carries no season_start_date and the current time precedes October ${season}, the earliest that season could begin; the season has not started, so no week is complete.`,
    };
  }
  const leg = stateRaw.leg;
  if (leg === undefined)
    return {
      ok: false,
      reason: "state-invalid",
      detail:
        "NBA state carries no leg; week alone does not certify a completed score window.",
    };
  if (!isWeekNumber(leg))
    return {
      ok: false,
      reason: "state-invalid",
      detail: "NBA state leg is not a non-negative integer.",
    };
  const week = stateRaw.week;
  if (week !== undefined && !isWeekNumber(week))
    return {
      ok: false,
      reason: "state-invalid",
      detail: "NBA state week is not a non-negative integer.",
    };
  if (week !== undefined && leg !== week)
    return {
      ok: false,
      reason: "state-invalid",
      detail: `NBA state leg (${leg}) and week (${week}) disagree.`,
    };
  const currentWeek = leg;
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
  const leagueId = leagueRaw.league_id;
  if (typeof leagueId !== "string" || leagueId.length === 0)
    return {
      ok: false,
      reason: "league-invalid",
      detail:
        "League payload carries no valid league_id; source identity is required, never certified as nullable.",
    };
  return {
    ok: true,
    context: {
      leagueId,
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
  const rosterMatches = rostersRaw.filter(
    (entry) => isRecord(entry) && entry.roster_id === teamId,
  );
  if (rosterMatches.length === 0)
    return unavailable(
      "team-not-found",
      `No current roster with id ${teamId}.`,
    );
  if (rosterMatches.length > 1)
    return unavailable(
      "rosters-invalid",
      `Duplicate current roster entries for roster ${teamId}; current roster identity is ambiguous.`,
    );
  const roster = rosterMatches[0];
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
 * is cached in a single slot (at most one payload is ever retained) keyed
 * by validated league id + season + target week: a payload is served only
 * to a context whose key matches the key it was read under, so one
 * league/season's points can never be attributed to another. Loads are
 * single-flight per key — concurrent callers share one in-flight promise,
 * so the one-read bound holds under parallel renders — and a failed load
 * clears its in-flight entry without touching the slot, so the next call
 * retries rather than serving anything stale. State, league and rosters
 * are loaded fresh on every call through the sources, whose own upstream
 * caching bounds their cost.
 */
export function createWeeklyPlayerEvidence(
  options: WeeklyPlayerEvidenceOptions,
): WeeklyPlayerEvidence {
  const { sources } = options;
  const now = options.now ?? (() => Date.now());
  const ttlMs = options.matchupCacheTtlMs ?? OBSERVED_WEEK_MATCHUP_CACHE_TTL_MS;
  let slot: { key: string; fetchedAt: number; payload: unknown } | null =
    null;
  const inflight = new Map<string, Promise<unknown>>();

  const cacheKey = (context: ObservedWeekContext): string =>
    `${context.leagueId}|${context.season}|${context.targetWeek}`;

  async function loadMatchupsPayload(
    context: ObservedWeekContext,
  ): Promise<unknown> {
    const key = cacheKey(context);
    if (slot && slot.key === key && now() - slot.fetchedAt < ttlMs)
      return slot.payload;
    const existing = inflight.get(key);
    if (existing) return existing;
    const promise = (async () => {
      const payload = await sources.loadMatchups(context.targetWeek);
      slot = { key, fetchedAt: now(), payload };
      return payload;
    })();
    inflight.set(key, promise);
    try {
      return await promise;
    } finally {
      if (inflight.get(key) === promise) inflight.delete(key);
    }
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
      const resolved = resolveObservedWeekContext(stateRaw, leagueRaw, now());
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
        matchupsRaw = await loadMatchupsPayload(context);
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
