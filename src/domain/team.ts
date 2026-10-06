/**
 * Team — a fantasy roster in the league.
 *
 * A Team is the core identity object of the domain. Every other domain type
 * (Standing, Matchup, Transaction, StatLeader) references teams by embedding
 * the full Team object, never by re-deriving names from raw Sleeper payloads.
 * If you need a team's display name anywhere in the app, it comes from here.
 */
export type Team = {
  /** Sleeper roster_id, as a string. Stable across seasons. */
  id: string;
  /** Display name: the manager's chosen team name, falling back to their username. */
  name: string;
  /** The human manager behind the team (Sleeper display_name). */
  managerName: string;
  /** Sleeper avatar id, if set. Null when the manager has no avatar. */
  avatar: string | null;
  wins: number;
  losses: number;
  ties: number;
  /** Total fantasy points scored (fpts * 100 + fpts_decimal in Sleeper terms). */
  pointsFor: number;
  /** Total fantasy points scored against this team. */
  pointsAgainst: number;
};
