import type { Team } from "./team";
import type { Player } from "./player";

/**
 * Season — league-level metadata for the current season.
 */
export interface Season {
  leagueName: string;
  seasonYear: string;
  /** Sleeper league status, e.g. "in_season", "pre_draft". */
  status: string;
  totalTeams: number;
  /** Rookie draft id, if the league has one. */
  draftId: string | null;
}

/**
 * DraftPick — one selection in the rookie draft.
 *
 * `pickedBy` is the Team that made the pick (owner at draft time).
 */
export interface DraftPick {
  /** Overall pick number, 1-based. */
  pickNumber: number;
  round: number;
  /** Draft slot (1-based position in round order). */
  draftSlot: number;
  pickedBy: Team;
  player: Player;
}
