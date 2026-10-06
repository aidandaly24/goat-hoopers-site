import type { Team } from "./team";

/**
 * Standing — a team's position in the league table.
 *
 * Derived in the data layer from raw roster settings. The rank is computed
 * after sorting (wins desc, then pointsFor desc) — it is not stored by Sleeper.
 */
export type Standing = {
  team: Team;
  /** 1-based rank in the league table. */
  rank: number;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  /** Games back from first place, in wins. Displayed as e.g. "2.0". */
  gamesBack: number;
};
