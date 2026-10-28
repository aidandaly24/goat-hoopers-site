import "server-only";
import { createHash } from "node:crypto";
import type { LineupPowerCoverage, LineupPowerSnapshot, LineupPowerTeam } from "@/domain/lineup-power";
import { GOAT_LINEUP_POLICY } from "@/domain/ai-lineup-policy";
import { fetchLeague, fetchNbaState, fetchRosters, fetchSeasonStats, type RawLeague, type RawNbaState, type RawRoster } from "./sleeper";
import { fppgUnderScoring } from "./transform";
import { canonicalJson } from "./ai-decider/weekly";

/**
 * LineupPowerSnapshot producer (issue #190; contract in
 * `src/domain/lineup-power.ts`, published on #190 comment 6433681384).
 *
 * The per-slot primitive is the one the #149 in-season forecast uses for
 * `projectedRemainingPoints`: each slot contributes ONE counted game —
 * a proven locked or determinate final counted value when the projected
 * week's evidence carries one, otherwise one projected counting game at
 * the player's observed fantasy PPG under league scoring. Never
 * PPG × games, never a price, never a valuation.
 *
 * Evidence is performance only: Sleeper season stats (current season,
 * falling back to the prior season) scored by `fppgUnderScoring` — the
 * same basis the forecast evidence loader uses. The legal lineup is the
 * declared active lineup under the eleven-starter policy
 * (`GOAT_LINEUP_POLICY`): the roster's starters, eleven slots; bench,
 * taxi and IR players are never projected.
 *
 * Coverage is honest by construction (see the domain contract): a team
 * total exists only when all 11 slots contribute; a total resting on
 * any prior-season-only projection is `partial`; anything less is
 * `unavailable` with a null total — a partial sum is never emitted.
 */

/* ------------------------------ evidence ------------------------------ */

/** One legal starting slot's evidence for the projected week. Server-built only. */
export type LineupPowerSlotEvidence = {
  playerId: string;
  /**
   * Proven locked counted points in the projected week, when lock
   * evidence exists. A locked slot contributes exactly this — never a
   * fresh projection on top of it.
   */
  lockedPoints: number | null;
  /**
   * Proven determinate counted points for a slot whose counted game is
   * settled and who has no games remaining in the projected week.
   */
  finalPoints: number | null;
  /** Observed fantasy PPG under league scoring: ONE projected counted game. */
  projectionPpg: number | null;
  projectionBasis: "current" | "prior" | null;
};

export type LineupPowerTeamEvidence = {
  rosterId: string;
  /** The legal starting slots — exactly the eleven-starter policy's slots. */
  starters: LineupPowerSlotEvidence[];
};

export type LineupPowerEvidence = {
  /** Generation time (ISO timestamp), becomes the snapshot's `asOf`. */
  asOf: string;
  /** The week being projected (the current leg's next week). */
  week: number;
  teams: LineupPowerTeamEvidence[];
};

/* ------------------------------- builder ------------------------------ */

const LEGAL_SLOTS = GOAT_LINEUP_POLICY.starterSlots.length; // 11
const round2 = (v: number) => Math.round(v * 100) / 100;
const usablePoints = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v) && v >= 0 && Math.abs(v) <= 1000;

type SlotContribution = { points: number; kind: "locked" | "final" | "projected"; basis: "current" | "prior" | null };

/**
 * One slot's counted contribution, in lock-in precedence: a proven lock
 * beats a proven final, which beats a projection. A structurally
 * inconsistent slot (PPG without a basis, a basis without a PPG,
 * out-of-range values) contributes nothing rather than a guess.
 */
export function lineupPowerSlotContribution(slot: LineupPowerSlotEvidence): SlotContribution | null {
  if (usablePoints(slot.lockedPoints)) return { points: slot.lockedPoints, kind: "locked", basis: null };
  if (slot.lockedPoints !== null) return null;
  if (usablePoints(slot.finalPoints)) return { points: slot.finalPoints, kind: "final", basis: null };
  if (slot.finalPoints !== null) return null;
  if (slot.projectionPpg === null) return null;
  if (!usablePoints(slot.projectionPpg)) return null;
  if (slot.projectionBasis !== "current" && slot.projectionBasis !== "prior") return null;
  return { points: slot.projectionPpg, kind: "projected", basis: slot.projectionBasis };
}

export function buildLineupPowerTeam(team: LineupPowerTeamEvidence): LineupPowerTeam {
  if (team.starters.length > LEGAL_SLOTS) {
    // Malformed evidence: an over-long lineup has no legal 11 to
    // attribute contributions to, so nothing counts. This keeps the
    // producer's unavailable representation inside the snapshot guard,
    // which never accepts unavailable with slotsProjected === 11.
    return { rosterId: team.rosterId, projectedCountedPoints: null, coverage: "unavailable", slotsProjected: 0 };
  }
  const contributions = team.starters.map(lineupPowerSlotContribution);
  const slotsProjected = contributions.filter(c => c !== null).length;
  if (team.starters.length !== LEGAL_SLOTS || slotsProjected !== LEGAL_SLOTS) {
    // No honest 11-slot total exists: unavailable, never a partial sum.
    // (Length is at most LEGAL_SLOTS here, so slotsProjected < 11.)
    return { rosterId: team.rosterId, projectedCountedPoints: null, coverage: "unavailable", slotsProjected };
  }
  const settled = contributions as SlotContribution[];
  const coverage: LineupPowerCoverage = settled.some(c => c.kind === "projected" && c.basis === "prior") ? "partial" : "complete";
  return {
    rosterId: team.rosterId,
    projectedCountedPoints: round2(settled.reduce((sum, c) => sum + c.points, 0)),
    coverage,
    slotsProjected,
  };
}

/**
 * Assemble an immutable snapshot from evidence. Deterministic: teams
 * are ordered by roster id and the snapshot id is a content hash of the
 * canonical body, so the same evidence always yields the same snapshot.
 * `priorSnapshotId` chains to the comparable prior snapshot (or null).
 */
export function buildLineupPowerSnapshot(evidence: LineupPowerEvidence, priorSnapshotId: string | null): LineupPowerSnapshot {
  const teams = evidence.teams
    .map(buildLineupPowerTeam)
    .sort((a, b) => Number(a.rosterId) - Number(b.rosterId));
  const body = { asOf: evidence.asOf, week: evidence.week, horizon: "next-week" as const, teams, priorSnapshotId };
  const snapshotId = `lp1:${createHash("sha256").update(canonicalJson(body)).digest("hex")}`;
  return { snapshotId, ...body };
}

/* -------------------------------- loader ------------------------------ */

export type LineupPowerDeps = {
  league: typeof fetchLeague;
  state: typeof fetchNbaState;
  rosters: typeof fetchRosters;
  stats: typeof fetchSeasonStats;
  now: () => number;
};

export const lineupPowerDeps: LineupPowerDeps = {
  league: fetchLeague, state: fetchNbaState, rosters: fetchRosters, stats: fetchSeasonStats, now: Date.now,
};

/**
 * Live evidence assembly from the Sleeper data layer. The projected
 * week is the current leg's next week; its matchup leg does not exist
 * in any public source yet, so no slot carries locked or final points —
 * every slot is a one-game projection at observed PPG. (If a future
 * source can prove next-week locks, it fills those fields; the builder
 * already honors them.) Any source failure aborts the load: a snapshot
 * is never produced from partial league evidence.
 */
export async function loadLineupPowerEvidence(deps: LineupPowerDeps = lineupPowerDeps): Promise<LineupPowerEvidence> {
  const [league, state, rosters] = await Promise.all([deps.league(), deps.state(), deps.rosters()]);
  if (state.season_type !== "regular" || league.season !== state.season || !/^20\d{2}$/.test(state.season)
    || !Number.isSafeInteger(state.leg) || state.leg! < 1 || state.leg! + 1 > 30
    || !state.previous_season || !/^20\d{2}$/.test(state.previous_season) || Number(state.previous_season) >= Number(state.season)) {
    throw new Error("lineup_power_context");
  }
  if (rosters.length !== 10) throw new Error("lineup_power_evidence");
  const scoring: Record<string, number> = { ...league.scoring_settings };
  const [currentStats, priorStats] = await Promise.all([deps.stats(state.season), deps.stats(state.previous_season)]);
  const teams = rosters.map((roster: RawRoster): LineupPowerTeamEvidence => {
    const starters = (roster.starters ?? []).filter(id => id !== "0");
    return {
      rosterId: String(roster.roster_id),
      starters: starters.map((playerId): LineupPowerSlotEvidence => {
        const current = currentStats[playerId] ? fppgUnderScoring(currentStats[playerId], scoring) : null;
        const prior = !current && priorStats[playerId] ? fppgUnderScoring(priorStats[playerId], scoring) : null;
        return {
          playerId,
          lockedPoints: null,
          finalPoints: null,
          projectionPpg: current?.fppg ?? prior?.fppg ?? null,
          projectionBasis: current ? "current" : prior ? "prior" : null,
        };
      }),
    };
  });
  return { asOf: new Date(deps.now()).toISOString(), week: state.leg! + 1, teams };
}

/** Produce one snapshot from live evidence, chained to `priorSnapshotId` (null when none). */
export async function produceLineupPowerSnapshot(
  priorSnapshotId: string | null,
  deps: LineupPowerDeps = lineupPowerDeps,
): Promise<LineupPowerSnapshot> {
  return buildLineupPowerSnapshot(await loadLineupPowerEvidence(deps), priorSnapshotId);
}

export type { RawLeague, RawNbaState, RawRoster };
