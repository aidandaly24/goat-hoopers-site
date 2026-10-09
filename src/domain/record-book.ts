import type { MatchupHighlight } from "./stats";
import type { Team } from "./team";

/**
 * RecordBook — the league's current-season lists, computed from every final
 * matchup this season. All lists are top-5, newest-first ties broken by
 * recency. Null/empty in the preseason: no games, no records. The all-time
 * archive lives in the league history (Trophy Room), not here.
 */
export type TeamWeekScore = {
  team: Team;
  week: number;
  /** Fantasy points. */
  points: number;
};

export type RecordBook = {
  /** Five biggest margins of victory, all time. */
  biggestBlowouts: MatchupHighlight[];
  /** Five tightest finals, all time. */
  closestGames: MatchupHighlight[];
  /** Five highest single-week team scores, all time. */
  highestScores: TeamWeekScore[];
};
