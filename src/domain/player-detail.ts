import type { DraftPick } from "./draft";
import type { Player } from "./player";
import type { Team } from "./team";
import type { Transaction } from "./transaction";

/**
 * PlayerDetail — everything /player/[sleeperId] needs about one NBA player.
 *
 * Players are reference data (they exist independent of any roster), but the
 * page answers league questions too: which GOAT Hoopers roster holds them
 * (or whether they're a free agent), which of their moves hit the wire,
 * and where they went in the rookie draft.
 */
export type PlayerDetail = {
  /** The player themselves. Never null — unknown ids degrade to a stub. */
  player: Player;
  /** The GOAT Hoopers team holding this player, or null = free agent. */
  team: Team | null;
  /** League transactions involving this player, newest first. */
  transactions: Transaction[];
  /** Their rookie-draft pick, if they were drafted this season. */
  draftPick: DraftPick | null;
};
