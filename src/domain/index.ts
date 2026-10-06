/**
 * Domain model — the shared language of the GOAT Hoopers site.
 *
 * These types are the ONLY vocabulary surfaces are allowed to use when talking
 * about league concepts. Raw Sleeper API shapes never leave `src/data/`.
 *
 * Concepts:
 * - Team: a fantasy roster (identity object — everything references this)
 * - Standing: a team's ranked position in the league table
 * - Matchup: a head-to-head pairing for a week (points null = not played)
 * - Player: an NBA player from Sleeper's directory (reference data)
 * - Transaction: waiver / free-agent / trade activity, pre-summarized
 * - Season: league metadata for the current season
 * - LeagueStats: home-page numbers — points leaders, streaks, activity,
 *   weekly matchup highlights (all nullable; null = nothing to show yet)
 *
 * Rule: if a new league concept is needed, add the type here first, then teach
 * the data layer how to build it. Never invent a parallel shape in a surface.
 */
export type { Team } from "./team";
export type { Standing } from "./standing";
export type { Matchup, } from "./matchup";
export { isFinal, winner } from "./matchup";
export type { Player } from "./player";
export type { Transaction, TransactionType } from "./transaction";
export type { Season } from "./season";
export type {
  LeagueStats,
  StatLeader,
  StreakInfo,
  ManagerActivity,
  MatchupHighlight,
} from "./stats";
