import type { Team } from "./team";

/**
 * PowerRanking — one team's place in the league's power order.
 *
 * FORMULA (documented here, implemented in src/data/analytics.ts):
 *
 *   score = 0.40 * norm(winPct)
 *         + 0.30 * norm(pointsFor per game)
 *         + 0.15 * norm(last-3-games winPct)      // recent form
 *         + 0.15 * norm(-pointsAgainst per game)  // defense: fewer = better
 *
 * where norm(x) is min-max normalization across the ten teams, and ties
 * on a component (all-equal values) normalize to 0.5 so a meaningless
 * stat can't tilt the order. Rationale: record is what matters (40%),
 * points-for separates good records from lucky ones (30%), and form +
 * points-against break ties with signal the standings ignore (15% each).
 * A team that hasn't played returns null rankings — never a fabricated
 * order from all-zero rows.
 */
export type PowerRanking = {
  team: Team;
  /** 1-based power rank. */
  rank: number;
  /** Composite score in [0, 1]. */
  score: number;
  /** Rank computed with data through the previous week, null when none. */
  previousRank: number | null;
  /** Movement vs last week: positive = climbed. */
  movement: number;
};
