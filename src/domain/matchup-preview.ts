import type { Matchup } from "./matchup";
import type { Team } from "./team";

/**
 * MatchupPreview — the data behind one week's head-to-head preview card.
 *
 * The projection is deliberately simple and documented: each team's
 * expected score is their points-per-game (0 when unplayed), blended
 * 50/50 with the league scoring average so thin samples don't explode.
 * Win probability comes from the Elo logistic on those expectations plus
 * a small H2H-style home bump is NOT applied — there's no home court in
 * fantasy. The "pick" is the higher-probability team, shown with its
 * probability, never stated as a lock.
 */
export type MatchupPreview = {
  matchup: Matchup;
  /** Projected home-team score. */
  projectedHome: number;
  /** Projected away-team score. */
  projectedAway: number;
  /** Probability the home team wins, in [0, 1]. */
  homeWinPct: number;
  /** The model's pick: the higher-probability team. */
  pick: Team;
};
