import type { DraftPick } from "./draft";
import type { Matchup } from "./matchup";
import type { Player } from "./player";
import type { Team } from "./team";
import type { Transaction } from "./transaction";

/**
 * TeamProfile — everything /teams/[rosterId] needs about one fantasy team.
 *
 * The public face of a franchise: identity + record, the full roster,
 * their draft capital, recent wire activity, and the season's game log.
 * The logged-in /team page composes this with private data (FAAB rewards)
 * instead of duplicating it.
 */
export type TeamProfile = {
  /** The team identity + record. Never null — the loader 404s otherwise. */
  team: Team;
  /** Full roster, in Sleeper order. */
  players: Player[];
  /** This season's matchups (finals and upcoming), newest week first. */
  matchups: Matchup[];
  /**
   * Active streak, ending with the latest final week: positive = wins,
   * negative = losses, 0 = no games played yet. "W3" / "L2" style.
   * Computed from completed weeks only — a live partial in the
   * in-progress week never extends or breaks a streak (issue #224 P1).
   */
  streak: number;
  /**
   * The in-progress week while it is being played (Sleeper's current
   * week), or null in the offseason / before any tip. A matchup in this
   * week may carry live scores without being final — Sleeper serves
   * current-week points live — so surfaces must render this week's
   * matchups as live, never "Final".
   */
  inProgressWeek: number | null;
  /** This team's rookie-draft picks, in pick order. */
  draftPicks: DraftPick[];
  /** Recent transactions involving this team, newest first. */
  transactions: Transaction[];
};
