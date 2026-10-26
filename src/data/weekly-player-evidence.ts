import type { CompletedPlayerWeek } from "@/domain/team-player-guide";
import weekOneReceipt from "./weekly-receipts/2026-week-01.json";

/**
 * Weekly player evidence for completed fantasy weeks (issue #190).
 *
 * Sleeper exposes no per-player counted points for NBA lock-in leagues
 * after a week closes: public matchup reads report each starter's final
 * game and ignore locks, and the authenticated matchup leg (the ground
 * truth for starters, the lock map and official team totals) carries no
 * per-player points. The committed receipts under `weekly-receipts/` are
 * generated offline by `scripts/generate-weekly-evidence.py`, which scores
 * each starter's counted game (the locked game from the leg, otherwise the
 * player's final played game) from ESPN box scores using the league's own
 * scoring settings, and reconciles every team's sum against the leg's
 * official points before the receipt may be served.
 *
 * Two honesty contracts are served from a receipt, and they are not
 * interchangeable:
 *
 * - The exact-points contract (`getCompletedPlayerWeek`, consumed by the
 *   personal guide as "Actual recorded fantasy points") serves ONLY
 *   `verified` teams — residual exactly zero. A team with any unexplained
 *   gap fails closed to the guide's unavailable state.
 * - Residual teams whose gap is fully explained by technical/flagrant
 *   fouls ESPN box scores cannot itemise (a positive multiple of the −2
 *   foul unit, at most +4) are `estimated-foul-residual`: their per-player
 *   values are box-score estimates, bounded by the disclosed residual but
 *   attributable to no individual player. They are served only through
 *   the showcase's explicitly estimated contract, never as actuals.
 * - A team whose counted games cannot be reconciled with its official
 *   total, or whose lock evidence is incomplete, is `unreconciled` and is
 *   never served anywhere. See `docs/weekly-player-evidence.md` for the
 *   full source investigation.
 */

export type WeeklyEvidenceStatus =
  | "verified"
  | "estimated-foul-residual"
  | "unreconciled";

export type WeeklyPlayerEvidence = {
  playerId: string;
  /** Verified appearances in the week's games (box-score minutes > 0). */
  gamesPlayed: number;
  /**
   * Fantasy points from the game that counted for the team's score: the
   * locked game when the matchup leg records a lock, otherwise the
   * player's final played game of the week. Null when the starter never
   * appeared in the week, or when an explicit lock's game has no
   * box-score evidence for him (the row is then unproven and the whole
   * team is `unreconciled`, so it is never served).
   */
  countedPoints: number | null;
  countedGameId: string | null;
  locked: boolean;
};

export type WeeklyTeamEvidence = {
  teamId: string;
  /** The matchup leg's official team total for the week. */
  officialPoints: number;
  /** Sum of the receipt's counted points; reconciled against the leg. */
  computedPoints: number;
  residual: number;
  status: WeeklyEvidenceStatus;
  /**
   * False when any starter's counted game lacks box-score evidence (an
   * explicit lock whose game records nothing for the player). Such a
   * team is always `unreconciled`: a coincidental sum never verifies an
   * unproven counted game.
   */
  evidenceComplete: boolean;
  players: WeeklyPlayerEvidence[];
};

export type WeeklyEvidenceReceipt = {
  season: string;
  week: number;
  /** First tip of the week (Sleeper `scores`, week-tagged games). */
  startsAt: string;
  /** First tip of the following week: an exclusive end bound. */
  endsAt: string;
  generatedAt: string;
  generator: string;
  source: string;
  teams: WeeklyTeamEvidence[];
};

export type WeekShowcasePlayer = {
  playerId: string;
  /** Proven counted points: the team's sum reconciles exactly. */
  fantasyPoints: number;
  gamesPlayed: number;
  locked: boolean;
};

export type WeekShowcaseEstimatedPlayer = {
  playerId: string;
  /**
   * Box-score estimate, NOT a recorded actual: the team's counted sum
   * overstates its official total by the team's disclosed `residual`
   * (un-itemised technical/flagrant fouls), and the overstatement cannot
   * be attributed to individual players. Never label these as actual
   * recorded points.
   */
  estimatedPoints: number;
  gamesPlayed: number;
  locked: boolean;
};

/**
 * One team's showcase entry. The `basis` discriminant keeps exact and
 * estimated weeks in separate shapes so a surface cannot render an
 * estimate through the actual-points path by accident.
 */
export type WeekShowcaseTeam =
  | {
      teamId: string;
      basis: "verified";
      officialPoints: number;
      topPlayers: WeekShowcasePlayer[];
    }
  | {
      teamId: string;
      basis: "estimated-foul-residual";
      officialPoints: number;
      /** Box-score sum; overstates `officialPoints` by `residual`. */
      computedPoints: number;
      /** Explained only by un-itemised −2 fouls; allocation unknown. */
      residual: number;
      topPlayers: WeekShowcaseEstimatedPlayer[];
    };

export type WeekShowcase = {
  season: string;
  week: number;
  startsAt: string;
  endsAt: string;
  teams: WeekShowcaseTeam[];
  /** Teams whose week could not be reconciled; surfaces show a gap, not zeros. */
  unavailableTeamIds: string[];
};

const STATUSES: readonly string[] = ["verified", "estimated-foul-residual", "unreconciled"];

/** Largest residual still explainable by un-itemised −2 fouls. */
const MAX_FOUL_RESIDUAL = 4;
const EPSILON = 0.011;

/**
 * The only statuses a residual can honestly carry: exactly zero is
 * verified; a positive multiple of the −2 foul unit within the bound is
 * explained-but-estimated; anything else (negative, non-multiple, or
 * larger) is not explained by un-itemised fouls at all.
 */
export function classifyWeeklyResidual(residual: number): WeeklyEvidenceStatus {
  if (Math.abs(residual) <= EPSILON) return "verified";
  if (residual > 0 && residual <= MAX_FOUL_RESIDUAL + EPSILON) {
    const units = residual / 2;
    if (Math.abs(units - Math.round(units)) <= EPSILON) return "estimated-foul-residual";
  }
  return "unreconciled";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function parsePlayer(value: unknown): WeeklyPlayerEvidence | null {
  if (!isRecord(value)) return null;
  if (typeof value.playerId !== "string" || value.playerId.length === 0) return null;
  if (!Number.isInteger(value.gamesPlayed) || (value.gamesPlayed as number) < 0) return null;
  if (value.countedPoints !== null && !isFiniteNumber(value.countedPoints)) return null;
  if (value.countedGameId !== null && typeof value.countedGameId !== "string") return null;
  if (typeof value.locked !== "boolean") return null;
  // A counted score requires a counted game; a DNP starter has neither.
  if ((value.countedPoints === null) !== (value.countedGameId === null)) return null;
  // A counted score normally requires an appearance. The one exception is
  // a proven zero: a locked game whose box score affirmatively records
  // the player as present without playing counts as exactly 0.
  if (value.countedPoints !== null && (value.gamesPlayed as number) < 1
    && !(value.countedPoints === 0 && value.locked === true)) return null;
  return {
    playerId: value.playerId,
    gamesPlayed: value.gamesPlayed as number,
    countedPoints: value.countedPoints as number | null,
    countedGameId: value.countedGameId as string | null,
    locked: value.locked,
  };
}

function parseTeam(value: unknown): WeeklyTeamEvidence | null {
  if (!isRecord(value)) return null;
  if (typeof value.teamId !== "string" || value.teamId.length === 0) return null;
  if (!isFiniteNumber(value.officialPoints) || !isFiniteNumber(value.computedPoints)) return null;
  if (!isFiniteNumber(value.residual)) return null;
  if (typeof value.status !== "string" || !STATUSES.includes(value.status)) return null;
  if (!Array.isArray(value.players) || value.players.length === 0) return null;
  const players: WeeklyPlayerEvidence[] = [];
  const seen = new Set<string>();
  for (const raw of value.players) {
    const player = parsePlayer(raw);
    if (!player || seen.has(player.playerId)) return null;
    seen.add(player.playerId);
    players.push(player);
  }
  // The receipt must reconcile with itself before anything is served from
  // it: the recorded computed total is the sum of the counted rows, and the
  // recorded residual is that sum against the leg's official total.
  const computed = players.reduce((sum, player) => sum + (player.countedPoints ?? 0), 0);
  if (Math.abs(computed - value.computedPoints) > EPSILON) return null;
  if (Math.abs(computed - value.officialPoints - value.residual) > EPSILON) return null;
  // The recorded status must be the status the residual can honestly
  // carry — a receipt may not upgrade an estimate to "verified", nor
  // dress an unexplained gap as a foul residual. The one override is
  // incomplete lock evidence: it fails the team closed as "unreconciled"
  // whatever the residual happens to be.
  const status = value.status as WeeklyEvidenceStatus;
  // Evidence completeness must be recorded explicitly. A receipt that
  // omits it makes no evidence claim at all, so nothing in it — least of
  // all a certified zero, whose entire proof is the generator's evidence
  // accounting — may be served.
  if (typeof value.evidenceComplete !== "boolean") return null;
  const evidenceComplete = value.evidenceComplete;
  if (!evidenceComplete) {
    if (status !== "unreconciled") return null;
  } else if (status !== classifyWeeklyResidual(value.residual)) {
    return null;
  }
  return {
    teamId: value.teamId,
    officialPoints: value.officialPoints,
    computedPoints: value.computedPoints,
    residual: value.residual,
    status,
    evidenceComplete,
    players,
  };
}

/**
 * Validate an unknown value as a weekly evidence receipt. Returns null for
 * anything malformed, internally inconsistent, or temporally impossible,
 * so a bad receipt degrades to the guide's unavailable state.
 */
export function parseWeeklyEvidenceReceipt(value: unknown): WeeklyEvidenceReceipt | null {
  if (!isRecord(value)) return null;
  if (typeof value.season !== "string" || value.season.length === 0) return null;
  if (!Number.isInteger(value.week) || (value.week as number) < 1) return null;
  if (typeof value.startsAt !== "string" || typeof value.endsAt !== "string") return null;
  const startsAt = Date.parse(value.startsAt);
  const endsAt = Date.parse(value.endsAt);
  if (!Number.isFinite(startsAt) || !Number.isFinite(endsAt) || startsAt >= endsAt) return null;
  if (typeof value.generatedAt !== "string" || !Number.isFinite(Date.parse(value.generatedAt))) return null;
  if (typeof value.generator !== "string" || typeof value.source !== "string") return null;
  if (!Array.isArray(value.teams) || value.teams.length === 0) return null;
  const teams: WeeklyTeamEvidence[] = [];
  const seen = new Set<string>();
  for (const raw of value.teams) {
    const team = parseTeam(raw);
    if (!team || seen.has(team.teamId)) return null;
    seen.add(team.teamId);
    teams.push(team);
  }
  return {
    season: value.season,
    week: value.week as number,
    startsAt: value.startsAt,
    endsAt: value.endsAt,
    generatedAt: value.generatedAt,
    generator: value.generator,
    source: value.source,
    teams,
  };
}

/** Receipts committed to the repo, validated at load; invalid ones drop out. */
export const WEEKLY_EVIDENCE_RECEIPTS: WeeklyEvidenceReceipt[] = [
  parseWeeklyEvidenceReceipt(weekOneReceipt),
].filter((receipt): receipt is WeeklyEvidenceReceipt => receipt !== null);

function findReceipt(
  receipts: readonly WeeklyEvidenceReceipt[],
  season: string,
  week: number,
): WeeklyEvidenceReceipt | null {
  return receipts.find((receipt) => receipt.season === season && receipt.week === week) ?? null;
}

function exactTeam(receipt: WeeklyEvidenceReceipt, teamId: string): WeeklyTeamEvidence | null {
  const team = receipt.teams.find((row) => row.teamId === teamId) ?? null;
  // Exact-points contract: only a zero-residual week is an actual.
  // Estimated and unreconciled teams fail closed here.
  if (!team || team.status !== "verified") return null;
  return team;
}

/**
 * The completed-week evidence for one team, in the domain contract the
 * personal player guide consumes as actual recorded points. Only
 * `verified` teams (residual exactly zero) are served; a team with any
 * residual fails closed to null and the guide shows its unavailable
 * state rather than ranking estimates as actuals. Only the week's eleven
 * starters are listed: they are the players whose participation in the
 * team's score is verified by the matchup leg. Bench players never
 * counted, so they are absent rather than zeroed.
 */
export function getCompletedPlayerWeek(
  receipts: readonly WeeklyEvidenceReceipt[],
  input: { season: string; week: number; teamId: string },
): CompletedPlayerWeek | null {
  const receipt = findReceipt(receipts, input.season, input.week);
  if (!receipt) return null;
  const team = exactTeam(receipt, input.teamId);
  if (!team) return null;
  return {
    season: receipt.season,
    week: receipt.week,
    teamId: team.teamId,
    complete: true,
    startsAt: receipt.startsAt,
    endsAt: receipt.endsAt,
    players: team.players.map((player) => ({
      playerId: player.playerId,
      fantasyPoints: player.countedPoints,
      gamesPlayed: player.gamesPlayed,
      injuryNote: null,
    })),
  };
}

/** The week before `currentWeek`, or null when there is no completed week. */
export function getPreviousCompletedPlayerWeek(
  receipts: readonly WeeklyEvidenceReceipt[],
  input: { season: string; currentWeek: number | null; teamId: string },
): CompletedPlayerWeek | null {
  if (input.currentWeek === null || input.currentWeek <= 1) return null;
  return getCompletedPlayerWeek(receipts, {
    season: input.season,
    week: input.currentWeek - 1,
    teamId: input.teamId,
  });
}

function compareShowcasePlayers(
  a: { points: number; gamesPlayed: number; playerId: string },
  b: { points: number; gamesPlayed: number; playerId: string },
): number {
  if (b.points !== a.points) return b.points - a.points;
  if (b.gamesPlayed !== a.gamesPlayed) return b.gamesPlayed - a.gamesPlayed;
  return a.playerId < b.playerId ? -1 : a.playerId > b.playerId ? 1 : 0;
}

function topCounted(team: WeeklyTeamEvidence, limit: number) {
  return team.players
    .filter((player): player is WeeklyPlayerEvidence & { countedPoints: number } => player.countedPoints !== null)
    .map((player) => ({
      playerId: player.playerId,
      points: player.countedPoints,
      gamesPlayed: player.gamesPlayed,
      locked: player.locked,
    }))
    .sort(compareShowcasePlayers)
    .slice(0, limit);
}

/**
 * League-wide best players for a completed week. Verified teams are
 * served as proven actuals; foul-residual teams are served through the
 * separate estimated shape — per-player box-score estimates with the
 * team's residual disclosed, never as actuals. Unreconciled teams are
 * reported as unavailable so a surface can show an honest gap instead of
 * inventing a ranking.
 */
export function getWeekShowcase(
  receipts: readonly WeeklyEvidenceReceipt[],
  input: { season: string; week: number; limit?: number },
): WeekShowcase | null {
  const receipt = findReceipt(receipts, input.season, input.week);
  if (!receipt) return null;
  const limit = input.limit ?? 3;
  const teams: WeekShowcase["teams"] = [];
  const unavailableTeamIds: string[] = [];
  for (const team of receipt.teams) {
    if (team.status === "unreconciled") {
      unavailableTeamIds.push(team.teamId);
      continue;
    }
    if (team.status === "estimated-foul-residual") {
      teams.push({
        teamId: team.teamId,
        basis: "estimated-foul-residual",
        officialPoints: team.officialPoints,
        computedPoints: team.computedPoints,
        residual: team.residual,
        topPlayers: topCounted(team, limit).map((player) => ({
          playerId: player.playerId,
          estimatedPoints: player.points,
          gamesPlayed: player.gamesPlayed,
          locked: player.locked,
        })),
      });
      continue;
    }
    teams.push({
      teamId: team.teamId,
      basis: "verified",
      officialPoints: team.officialPoints,
      topPlayers: topCounted(team, limit).map((player) => ({
        playerId: player.playerId,
        fantasyPoints: player.points,
        gamesPlayed: player.gamesPlayed,
        locked: player.locked,
      })),
    });
  }
  teams.sort((a, b) => (a.teamId < b.teamId ? -1 : a.teamId > b.teamId ? 1 : 0));
  unavailableTeamIds.sort();
  return {
    season: receipt.season,
    week: receipt.week,
    startsAt: receipt.startsAt,
    endsAt: receipt.endsAt,
    teams,
    unavailableTeamIds,
  };
}
