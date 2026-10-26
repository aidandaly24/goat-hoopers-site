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
 * A team whose counted games cannot be reconciled with its official total
 * is marked `unreconciled` in the receipt and is never served here: the
 * guide falls back to its existing unavailable state for that team instead
 * of showing numbers no source can prove. See
 * `docs/weekly-player-evidence.md` for the full source investigation.
 */

export type WeeklyEvidenceStatus =
  | "verified"
  | "verified-foul-residual"
  | "unreconciled";

export type WeeklyPlayerEvidence = {
  playerId: string;
  /** Verified appearances in the week's games (box-score minutes > 0). */
  gamesPlayed: number;
  /**
   * Fantasy points from the game that counted for the team's score: the
   * locked game when the matchup leg records a lock, otherwise the
   * player's final played game of the week. Null only when the starter
   * never appeared in the week.
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
  fantasyPoints: number;
  gamesPlayed: number;
  locked: boolean;
};

export type WeekShowcase = {
  season: string;
  week: number;
  startsAt: string;
  endsAt: string;
  teams: {
    teamId: string;
    officialPoints: number;
    status: Exclude<WeeklyEvidenceStatus, "unreconciled">;
    topPlayers: WeekShowcasePlayer[];
  }[];
  /** Teams whose week could not be reconciled; surfaces show a gap, not zeros. */
  unavailableTeamIds: string[];
};

const STATUSES: readonly string[] = ["verified", "verified-foul-residual", "unreconciled"];

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
  if (value.countedPoints !== null && (value.gamesPlayed as number) < 1) return null;
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
  if (Math.abs(computed - value.computedPoints) > 0.011) return null;
  if (Math.abs(computed - value.officialPoints - value.residual) > 0.011) return null;
  const status = value.status as WeeklyEvidenceStatus;
  if (status === "verified" && Math.abs(value.residual) > 0.011) return null;
  if (status === "verified-foul-residual" && (Math.abs(value.residual) <= 0.011 || Math.abs(value.residual) > 4)) return null;
  if (status === "unreconciled" && Math.abs(value.residual) <= 4) return null;
  return {
    teamId: value.teamId,
    officialPoints: value.officialPoints,
    computedPoints: value.computedPoints,
    residual: value.residual,
    status,
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

function verifiedTeam(receipt: WeeklyEvidenceReceipt, teamId: string): WeeklyTeamEvidence | null {
  const team = receipt.teams.find((row) => row.teamId === teamId) ?? null;
  if (!team || team.status === "unreconciled") return null;
  return team;
}

/**
 * The completed-week evidence for one team, in the domain contract the
 * personal player guide consumes. Only the week's eleven starters are
 * listed: they are the players whose participation in the team's score is
 * verified by the matchup leg. Bench players never counted, so they are
 * absent rather than zeroed.
 */
export function getCompletedPlayerWeek(
  receipts: readonly WeeklyEvidenceReceipt[],
  input: { season: string; week: number; teamId: string },
): CompletedPlayerWeek | null {
  const receipt = findReceipt(receipts, input.season, input.week);
  if (!receipt) return null;
  const team = verifiedTeam(receipt, input.teamId);
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

function compareShowcasePlayers(a: WeekShowcasePlayer, b: WeekShowcasePlayer): number {
  if (b.fantasyPoints !== a.fantasyPoints) return b.fantasyPoints - a.fantasyPoints;
  if (b.gamesPlayed !== a.gamesPlayed) return b.gamesPlayed - a.gamesPlayed;
  return a.playerId < b.playerId ? -1 : a.playerId > b.playerId ? 1 : 0;
}

/**
 * League-wide best players for a completed week: every reconciled team's
 * top `limit` counted performances. Unreconciled teams are reported as
 * unavailable so a surface can show an honest gap instead of inventing a
 * ranking.
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
    const topPlayers = team.players
      .filter((player): player is WeeklyPlayerEvidence & { countedPoints: number } => player.countedPoints !== null)
      .map((player) => ({
        playerId: player.playerId,
        fantasyPoints: player.countedPoints,
        gamesPlayed: player.gamesPlayed,
        locked: player.locked,
      }))
      .sort(compareShowcasePlayers)
      .slice(0, limit);
    teams.push({
      teamId: team.teamId,
      officialPoints: team.officialPoints,
      status: team.status,
      topPlayers,
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
