import type { Player } from "./player";
import type { Team } from "./team";
import type { Matchup } from "./matchup";
import type { Transaction } from "./transaction";

/** A bounded homepage summary of a real franchise, not a replacement TeamProfile. */
export type ClubhouseDirectoryEntry = {
  identity: Pick<Team, "id" | "name" | "managerName" | "avatar">;
  currentRecord: Pick<Team, "wins" | "losses" | "ties"> | null;
  /** Current roster references retain only fields this homepage actually uses. */
  players: Pick<Player, "id" | "fullName" | "position" | "nbaTeam">[];
  /** Editorial anchors, checked against players; not computed power rankings. */
  featuredPlayerIds: string[];
  previousSeason: {
    season: string;
    wins: number;
    losses: number;
    finish: number;
    ownerNote: string | null;
  } | null;
  opener: { leagueWeek: number; opponentId: string } | null;
  recentMove: { dateLabel: string; text: string } | null;
};

/** Live homepage projection; dated review fixtures remain separate. */
export type LiveClubhouseDirectoryEntry = ClubhouseDirectoryEntry & {
  currentMatchup: Matchup | null;
  latestMove: Transaction | null;
};
