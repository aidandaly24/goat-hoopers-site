/**
 * LineupPowerSnapshot — the prospective legal-lineup Power contract
 * (issue #190, contract published in comment 6433681384).
 *
 * One snapshot projects ONE matchup week (horizon "next-week") for every
 * team: the sum over the team's legal 11 starting slots of each slot's
 * projected single-game counted contribution, under lock-in semantics —
 * one counted game per slot, never a per-game rate multiplied by games.
 *
 * The per-slot basis is performance evidence only (counted-game receipts
 * and season game logs, via observed fantasy PPG under league scoring).
 * Asset prices, pick values and roster valuations are never inputs: this
 * is a performance projection, not a market number. The retrospective
 * composite in `power.ts` (winPct / PF / form / PA) is a different,
 * backward-looking concept and is NOT a snapshot.
 *
 * Honesty rules, enforced by the producer in `src/data/lineup-power.ts`
 * and checked by `isLineupPowerSnapshot`:
 * - `coverage: "complete"` — all 11 slots contribute, and no projected
 *   slot rests solely on prior-season evidence.
 * - `coverage: "partial"` — all 11 slots contribute, but at least one
 *   projected slot rests solely on prior-season evidence. The total is a
 *   real 11-slot sum, flagged as weaker-evidenced.
 * - `coverage: "unavailable"` — fewer than 11 slots can contribute, so
 *   no honest team total exists: `projectedCountedPoints` is null and
 *   `slotsProjected` records how many slots did contribute. A partial
 *   sum is never emitted — ranking one against complete totals would
 *   fabricate a rank.
 *
 * Snapshots are immutable once produced. `priorSnapshotId` chains to the
 * comparable prior snapshot (same horizon); movement is always computed
 * against that real prior, never reconstructed after the fact.
 */

export type LineupPowerCoverage = "complete" | "partial" | "unavailable";

export type LineupPowerTeam = {
  rosterId: string;
  /** Sum of the 11 slots' projected counted contributions; null unless every slot contributes. */
  projectedCountedPoints: number | null;
  coverage: LineupPowerCoverage;
  /** Of the legal 11: how many slots carry a determined contribution. */
  slotsProjected: number;
};

export type LineupPowerSnapshot = {
  /** Content-addressed identity (`lp1:<sha256>` of the canonical snapshot body). */
  snapshotId: string;
  /** True generation time (ISO timestamp). */
  asOf: string;
  /** The week being projected. */
  week: number;
  /** One matchup week; widening requires a contract change. */
  horizon: "next-week";
  teams: LineupPowerTeam[];
  /** Comparable prior snapshot (same horizon), null when none exists. */
  priorSnapshotId: string | null;
};

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const exactKeys = (v: Record<string, unknown>, keys: string[]) =>
  Object.keys(v).length === keys.length && keys.every(k => k in v);
const finitePoints = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v) && Math.abs(v) <= 1000;
const teamIdValid = (v: unknown): v is string =>
  typeof v === "string" && /^\d{1,3}$/.test(v) && Number(v) >= 1 && Number(v) <= 99;

/** Structural + semantic guard for the published contract shape. */
export function isLineupPowerSnapshot(v: unknown): v is LineupPowerSnapshot {
  if (!isRecord(v) || !exactKeys(v, ["snapshotId", "asOf", "week", "horizon", "teams", "priorSnapshotId"])) return false;
  if (typeof v.snapshotId !== "string" || !/^lp1:[0-9a-f]{64}$/.test(v.snapshotId)) return false;
  if (typeof v.asOf !== "string" || !/^\d{4}-\d{2}-\d{2}T/.test(v.asOf) || !Number.isFinite(Date.parse(v.asOf))) return false;
  if (!Number.isInteger(v.week) || (v.week as number) < 1 || (v.week as number) > 30) return false;
  if (v.horizon !== "next-week") return false;
  if (v.priorSnapshotId !== null && (typeof v.priorSnapshotId !== "string" || !/^lp1:[0-9a-f]{64}$/.test(v.priorSnapshotId))) return false;
  if (v.priorSnapshotId === v.snapshotId) return false;
  if (!Array.isArray(v.teams) || v.teams.length !== 10) return false;
  const seen = new Set<string>();
  for (const t of v.teams) {
    if (!isRecord(t) || !exactKeys(t, ["rosterId", "projectedCountedPoints", "coverage", "slotsProjected"])) return false;
    if (!teamIdValid(t.rosterId) || seen.has(t.rosterId)) return false;
    seen.add(t.rosterId);
    if (!Number.isInteger(t.slotsProjected) || (t.slotsProjected as number) < 0 || (t.slotsProjected as number) > 11) return false;
    if (t.coverage === "unavailable") {
      // No honest total exists; anything else would be a fabricated rank input.
      if (t.projectedCountedPoints !== null || t.slotsProjected === 11) return false;
    } else {
      if (!finitePoints(t.projectedCountedPoints) || (t.projectedCountedPoints as number) < 0) return false;
      if (t.slotsProjected !== 11) return false;
    }
  }
  return true;
}

/**
 * 1-based Power rank per team, from `projectedCountedPoints` descending.
 * Only teams carrying a total are ranked; unavailable teams get null —
 * never a rank estimated from a partial sum. Tied totals share a rank
 * (standard competition ranking: the next distinct total skips ahead).
 */
export function lineupPowerRanks(snapshot: LineupPowerSnapshot): Record<string, number | null> {
  const totals = snapshot.teams
    .filter(t => t.projectedCountedPoints !== null)
    .map(t => t.projectedCountedPoints as number)
    .sort((a, b) => b - a);
  const ranks: Record<string, number | null> = {};
  for (const team of snapshot.teams) {
    ranks[team.rosterId] = team.projectedCountedPoints === null
      ? null
      : totals.findIndex(total => total === team.projectedCountedPoints) + 1;
  }
  return ranks;
}

/**
 * Rank movement vs the comparable prior snapshot: positive = climbed
 * (same sign convention as `PowerRanking.movement`). Null per team when
 * either snapshot leaves the team unranked, and null for every team when
 * the two snapshots are not comparable (different horizon — impossible
 * under the current contract — or the same snapshot).
 */
export function lineupPowerMovement(
  current: LineupPowerSnapshot,
  prior: LineupPowerSnapshot,
): Record<string, number | null> {
  const comparable = current.horizon === prior.horizon && current.snapshotId !== prior.snapshotId;
  const currentRanks = lineupPowerRanks(current);
  const priorRanks = lineupPowerRanks(prior);
  const movement: Record<string, number | null> = {};
  for (const team of current.teams) {
    const now = currentRanks[team.rosterId];
    const before = priorRanks[team.rosterId];
    movement[team.rosterId] = comparable && now !== null && before !== null && before !== undefined
      ? before - now
      : null;
  }
  return movement;
}
