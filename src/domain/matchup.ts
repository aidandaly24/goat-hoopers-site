import type { Team } from "./team";

/**
 * Matchup — one head-to-head pairing in a given week.
 *
 * Points are null when the matchup hasn't been played yet (preseason or
 * future weeks). Surfaces must handle null points as "upcoming", never as 0.
 */
export interface Matchup {
  week: number;
  home: Team;
  away: Team;
  homePoints: number | null;
  awayPoints: number | null;
}

/** True when both teams have final scores. */
export function isFinal(m: Matchup): boolean {
  return m.homePoints !== null && m.awayPoints !== null;
}

/** The winning team of a final matchup, null if not final or tied. */
export function winner(m: Matchup): Team | null {
  if (!isFinal(m)) return null;
  if (m.homePoints === m.awayPoints) return null;
  return (m.homePoints as number) > (m.awayPoints as number) ? m.home : m.away;
}
