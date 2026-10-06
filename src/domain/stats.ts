import type { Matchup } from "./matchup";
import type { Team } from "./team";

/**
 * StatLeader — the team topping a counting stat (points for / against).
 * Null when nobody has scored yet (preseason): surfaces render an
 * empty state, never a fake zero.
 */
export type StatLeader = {
  team: Team;
  /** Display-ready value, e.g. "1,245.5". */
  displayValue: string;
};

/** The league's longest active win streak. */
export type StreakInfo = {
  team: Team;
  /** Consecutive wins, ending with the latest final week. */
  wins: number;
};

/** The manager making the most moves. */
export type ManagerActivity = {
  team: Team;
  transactionCount: number;
};

/** A notable game: biggest blowout or closest finish of the week. */
export type MatchupHighlight = {
  matchup: Matchup;
  /** Absolute point margin. */
  margin: number;
};

/**
 * LeagueStats — every number behind the home page stats strip.
 *
 * Every field is nullable. In the preseason (or when the API has no data)
 * the loader returns nulls and the strip renders empty states — it never
 * invents leaders from all-zero rows.
 */
export type LeagueStats = {
  pointsForLeader: StatLeader | null;
  /** "Most scored on" — highest points against. */
  pointsAgainstLeader: StatLeader | null;
  longestWinStreak: StreakInfo | null;
  mostActiveManager: ManagerActivity | null;
  biggestBlowout: MatchupHighlight | null;
  closestGame: MatchupHighlight | null;
};
