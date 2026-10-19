/**
 * Weekly player evidence — read-only, points-only observed fantasy-week facts.
 *
 * Contract (issue #190, Aidan's 04:08 UTC ruling): for exactly one previous
 * completed fantasy week of the current league/state season, return the
 * canonical league/season/week, the source roster IDs, and the recorded
 * per-player fantasy points from Sleeper's matchup payload
 * (`players_points`, week-attributed by the API's own week number).
 *
 * Hard limits, enforced by the types and the validation below:
 * - Games played is UNCONSTRUCTIBLE from supported sources. Every player row
 *   carries `participation: "unknown"` and `gamesPlayed: null`, always.
 *   Numeric zero is a recorded zero — never a played/DNP/injury claim.
 * - No best/rough verdicts, no form averages, no interval sums. Source facts
 *   only. This does NOT satisfy CompletedPlayerWeek or its positive-games
 *   gate — including for positive points.
 * - Completion is established by state advancement (the state's leg has moved
 *   past the candidate week), never by points presence: unplayed/preseason
 *   weeks return non-null all-zero points, so a points-presence check would
 *   falsely certify a preseason week as a completed week of zeros.
 * - One matchup read covers all ten teams (`GET /league/{id}/matchups/{W}`).
 *   No per-team or per-player fanout, no recorder, no provider, no SQL,
 *   no credentials, no infrastructure. Staleness is bounded by the injected
 *   matchup reader's own cache (the default wiring reuses the existing
 *   300-second Sleeper cache); completed-week payloads are stable and any
 *   Sleeper revision is re-read after revalidate.
 * - Types are local to this file until the adapter PR and contract pass
 *   review. Dot owns the shared RawMatchupEntry extension and any app
 *   integration afterward; this module never imports sleeper.ts (per its
 *   header, only transform.ts and league.ts loaders may) and takes all I/O
 *   as injected dependencies (rule 11).
 */

export type ObservedPlayerPoints = {
  /** Sleeper player id. */
  playerId: string;
  /**
   * Recorded fantasy points for the week. Null means no recorded value
   * (absent from `players_points` or non-numeric). A numeric zero is a
   * recorded zero with participation UNKNOWN — it is not a DNP claim and
   * not a scoreless-appearance claim.
   */
  points: number | null;
  /** Always "unknown": weekly games played cannot be established. */
  participation: "unknown";
  /** Always null: explicit, not omitted. */
  gamesPlayed: null;
};

export type ObservedTeamWeek = {
  rosterId: number;
  matchupId: number;
  /** Recorded team fantasy points for the week (null when Sleeper reports none). */
  teamPoints: number | null;
  players: ObservedPlayerPoints[];
};

export type ObservedPlayerWeekCoverage = {
  /** Teams with player-point data. */
  teams: number;
  /** Teams expected (10 for this league). */
  teamsTotal: number;
  /** Total player rows returned. */
  players: number;
  /** Rows carrying a finite recorded points value. */
  playersWithPoints: number;
  /** Rows dropped for corrupt (non-numeric, non-null) point values. */
  droppedCorruptRows: number;
};

export type ObservedPlayerWeek = {
  leagueId: string;
  /** Canonical season, e.g. "2026". */
  season: string;
  /** The completed fantasy week number (exactly one previous leg). */
  week: number;
  teams: ObservedTeamWeek[];
  coverage: ObservedPlayerWeekCoverage;
};

export type WeeklyPlayerEvidenceUnavailableReason =
  | "no_previous_week"
  | "preseason"
  | "season_mismatch"
  | "invalid_state"
  | "fetch_failed"
  | "malformed_matchups"
  | "missing_player_points"
  | "no_recorded_production";

export type WeeklyPlayerEvidenceResult =
  | { status: "ok"; week: ObservedPlayerWeek }
  | {
      status: "unavailable";
      reason: WeeklyPlayerEvidenceUnavailableReason;
      /** Human sentence for logs/docs; never shown as a data value. */
      detail: string;
    };

/** Minimal league shape the adapter reads. */
export type EvidenceLeagueInput = {
  season: string;
};

/** Minimal NBA state shape the adapter reads. */
export type EvidenceStateInput = {
  season: string;
  /** "pre" | "regular" | "post" (others rejected). */
  season_type: string;
  /** Current week number of the NBA season. */
  week: number;
  /**
   * Sleeper NBA's matchup round. The repo's canonical leg
   * (`state.leg ?? state.week`); preseason is zero. When the state's leg has
   * advanced past week W, week W has ended — this is the completion signal.
   */
  leg?: number | null;
  /** YYYY-MM-DD; the season has tipped off once now >= this date (UTC). */
  season_start_date?: string | null;
};

export type WeeklyPlayerEvidenceDeps = {
  /** Canonical league id the evidence is for; echoed in the output. */
  leagueId: string;
  league: () => Promise<EvidenceLeagueInput>;
  state: () => Promise<EvidenceStateInput>;
  /** Raw matchup entries for a week; shape validated at runtime. */
  matchups: (week: number) => Promise<unknown>;
  now?: () => number;
};

const SEASON_RE = /^20\d{2}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
/** Matches the repo's existing leg bounds (league.ts weekly-context checks). */
const MAX_LEG = 30;
/** This league's team count; entries must cover all ten rosters. */
const TEAM_COUNT = 10;

function unavailable(
  reason: WeeklyPlayerEvidenceUnavailableReason,
  detail: string,
): WeeklyPlayerEvidenceResult {
  return { status: "unavailable", reason, detail };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

type ValidatedEntry = {
  rosterId: number;
  matchupId: number;
  teamPoints: number | null;
  playersPoints: Record<string, unknown> | null;
  rosterPlayers: string[];
};

/** Runtime schema check for one matchup entry; null when malformed. */
function validateEntry(raw: unknown): ValidatedEntry | null {
  if (!isPlainObject(raw)) return null;
  const { roster_id, matchup_id, points, players_points, players } = raw;
  if (!Number.isSafeInteger(roster_id) || !Number.isSafeInteger(matchup_id)) {
    return null;
  }
  if (points !== null && !(typeof points === "number" && Number.isFinite(points))) {
    return null;
  }
  const rosterPlayers =
    Array.isArray(players) && players.every((p): p is string => typeof p === "string")
      ? players
      : [];
  return {
    rosterId: roster_id as number,
    matchupId: matchup_id as number,
    teamPoints: points as number | null,
    playersPoints: isPlainObject(players_points) ? players_points : null,
    rosterPlayers,
  };
}

/**
 * Resolve and validate the single candidate week: exactly one previous leg
 * of the current league/state season. Returns the week number or an
 * unavailable result. Preseason, missing/invalid state, season mismatches
 * and out-of-range legs all fail closed.
 */
function resolveCandidateWeek(
  league: EvidenceLeagueInput,
  state: EvidenceStateInput,
  nowMs: number,
): { week: number } | WeeklyPlayerEvidenceResult {
  if (!SEASON_RE.test(league.season) || !SEASON_RE.test(state.season)) {
    return unavailable("invalid_state", "League or NBA state season is not a valid season year.");
  }
  if (league.season !== state.season) {
    return unavailable(
      "season_mismatch",
      `League season ${league.season} does not match NBA state season ${state.season}.`,
    );
  }
  if (state.season_type === "pre") {
    return unavailable("preseason", "NBA state is preseason; no completed week exists.");
  }
  if (state.season_type !== "regular" && state.season_type !== "post") {
    return unavailable(
      "invalid_state",
      `Unexpected NBA season_type ${JSON.stringify(state.season_type)}.`,
    );
  }
  const leg = state.leg ?? state.week;
  if (!Number.isSafeInteger(leg) || (leg as number) < 0 || (leg as number) > MAX_LEG) {
    return unavailable("invalid_state", "NBA state leg/week is missing or out of range.");
  }
  if ((leg as number) < 2) {
    return unavailable(
      "no_previous_week",
      `Current leg is ${leg as number}; no previous completed week exists yet.`,
    );
  }
  const startDate = state.season_start_date;
  if (
    typeof startDate !== "string" ||
    !DATE_RE.test(startDate) ||
    !Number.isFinite(Date.parse(`${startDate}T00:00:00Z`))
  ) {
    return unavailable("invalid_state", "NBA season_start_date is missing or invalid.");
  }
  // Sleeper's fantasy week 1 begins before tip-off (observed 2026: leg 1 with a
  // future season_start_date). Until the season has tipped off, any candidate
  // week is preseason — reject rather than certify a 0–0 week as completed.
  if (nowMs < Date.parse(`${startDate}T00:00:00Z`)) {
    return unavailable(
      "preseason",
      `Season tips off ${startDate}; the candidate week is preseason.`,
    );
  }
  return { week: (leg as number) - 1 };
}

/**
 * Read-only, points-only adapter. Returns recorded per-player fantasy points
 * for the single previous completed week, or a typed unavailable result.
 * Makes exactly one matchup read (all ten teams); no writes, no fanout.
 */
export async function getObservedPlayerWeek(
  deps: WeeklyPlayerEvidenceDeps,
): Promise<WeeklyPlayerEvidenceResult> {
  const nowMs = deps.now ? deps.now() : Date.now();

  let league: EvidenceLeagueInput;
  let state: EvidenceStateInput;
  try {
    [league, state] = await Promise.all([deps.league(), deps.state()]);
  } catch {
    return unavailable("fetch_failed", "League or NBA state read failed.");
  }

  const candidate = resolveCandidateWeek(league, state, nowMs);
  if ("status" in candidate) return candidate;
  const week = candidate.week;

  let rawEntries: unknown;
  try {
    rawEntries = await deps.matchups(week);
  } catch {
    return unavailable("fetch_failed", `Matchup read failed for week ${week}.`);
  }
  if (!Array.isArray(rawEntries)) {
    return unavailable("malformed_matchups", `Week ${week} matchups are not an array.`);
  }
  const entries: ValidatedEntry[] = [];
  for (const raw of rawEntries) {
    const entry = validateEntry(raw);
    if (!entry) {
      return unavailable("malformed_matchups", `Week ${week} has a malformed matchup entry.`);
    }
    entries.push(entry);
  }
  // Structural check: all ten teams, paired by matchup_id (same idiom as the
  // repo's weekly-context loader). Placeholder or partial weeks fail closed.
  if (entries.length !== TEAM_COUNT) {
    return unavailable(
      "malformed_matchups",
      `Week ${week} returned ${entries.length} entries, expected ${TEAM_COUNT}.`,
    );
  }
  const byMatchup = new Map<number, number[]>();
  const rosterIds = new Set<number>();
  for (const entry of entries) {
    rosterIds.add(entry.rosterId);
    const group = byMatchup.get(entry.matchupId) ?? [];
    group.push(entry.rosterId);
    byMatchup.set(entry.matchupId, group);
  }
  const paired = [...byMatchup.values()].every((group) => group.length === 2);
  const allRosters =
    rosterIds.size === TEAM_COUNT &&
    [...rosterIds].every((id) => Number.isSafeInteger(id) && id >= 1 && id <= TEAM_COUNT);
  if (!paired || !allRosters) {
    return unavailable(
      "malformed_matchups",
      `Week ${week} entries are not ten paired rosters.`,
    );
  }

  const withPoints = entries.filter((entry) => entry.playersPoints !== null);
  if (withPoints.length === 0) {
    return unavailable(
      "missing_player_points",
      `Week ${week} entries carry no players_points payload.`,
    );
  }

  const teams: ObservedTeamWeek[] = [];
  let players = 0;
  let playersWithPoints = 0;
  let droppedCorruptRows = 0;
  let positiveProduction = false;

  for (const entry of entries) {
    const pointsMap = entry.playersPoints ?? {};
    const ids = new Set<string>([
      ...Object.keys(pointsMap),
      ...entry.rosterPlayers,
    ]);
    const rows: ObservedPlayerPoints[] = [];
    for (const id of ids) {
      const rawValue: unknown = pointsMap[id];
      if (typeof rawValue === "number" && Number.isFinite(rawValue)) {
        if (rawValue > 0) positiveProduction = true;
        playersWithPoints += 1;
        rows.push({ playerId: id, points: rawValue, participation: "unknown", gamesPlayed: null });
      } else if (rawValue === undefined || rawValue === null) {
        // No recorded value: reported as null, distinct from a recorded zero.
        rows.push({ playerId: id, points: null, participation: "unknown", gamesPlayed: null });
      } else {
        // Corrupt value (e.g. non-numeric string): dropped and counted, never
        // coerced into a fact.
        droppedCorruptRows += 1;
      }
    }
    rows.sort((a, b) => (a.playerId < b.playerId ? -1 : a.playerId > b.playerId ? 1 : 0));
    players += rows.length;
    teams.push({
      rosterId: entry.rosterId,
      matchupId: entry.matchupId,
      teamPoints: entry.teamPoints,
      players: rows,
    });
  }

  // Data-quality guard: a completed week with zero recorded production across
  // every roster is a placeholder/unplayed week (Sleeper returns all-zero
  // points for unplayed weeks), not a week of zeros. Fail closed.
  if (!positiveProduction) {
    return unavailable(
      "no_recorded_production",
      `Week ${week} is complete per state but has no recorded player production; refusing to certify a placeholder week.`,
    );
  }

  teams.sort((a, b) => a.rosterId - b.rosterId);
  return {
    status: "ok",
    week: {
      leagueId: deps.leagueId,
      season: state.season,
      week,
      teams,
      coverage: {
        teams: withPoints.length,
        teamsTotal: TEAM_COUNT,
        players,
        playersWithPoints,
        droppedCorruptRows,
      },
    },
  };
}

/**
 * Pure helper: the observed rows for one roster, intersected with a current
 * roster's player ids (historical-roster/current-roster intersection for
 * consumers). Source facts only — no verdicts.
 */
export function observedPlayersForCurrentRoster(
  week: ObservedPlayerWeek,
  rosterId: number,
  currentRosterPlayerIds: ReadonlySet<string> | readonly string[],
): ObservedPlayerPoints[] {
  const team = week.teams.find((t) => t.rosterId === rosterId);
  if (!team) return [];
  const ids =
    currentRosterPlayerIds instanceof Set
      ? currentRosterPlayerIds
      : new Set(currentRosterPlayerIds);
  return team.players.filter((p) => ids.has(p.playerId));
}
