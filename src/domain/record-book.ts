import type { MatchupHighlight } from "./stats";
import type { Team } from "./team";

/**
 * RecordBook — the league's all-time lists, computed from every final
 * matchup. All lists are top-5, newest-first ties broken by recency.
 * Null/empty in the preseason: no games, no records.
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
