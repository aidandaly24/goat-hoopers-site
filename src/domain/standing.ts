import type { Team } from "./team";

/**
 * Standing — a team's position in the league table.
 *
 * Derived in the data layer from raw roster settings. The rank is computed
 * after sorting (wins desc, then pointsFor desc) — it is not stored by Sleeper.
 */
export type Standing = {
  team: Team;
  /**
   * 1-based rank in the league table, or null before any team has a
   * recorded result. Live points-for accumulates during the in-progress
   * week while every record is still 0–0 — ordering tied 0–0 teams by
   * that drip would fabricate a No. 1, so ranks exist only once a real
   * win, loss or tie is on the books (the same hasResults rule The
   * Table applies). Display order stays deterministic either way.
   */
  rank: number | null;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  /** Games back from first place, in wins. Displayed as e.g. "2.0". */
  gamesBack: number;
};
