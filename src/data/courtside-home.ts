import type { Team, Player, Matchup, Transaction } from "@/domain";
import type { LiveClubhouseDirectoryEntry } from "@/domain/clubhouse-directory";
import { SEASON_2025_STANDINGS, SEASON_2025_PLACEMENTS } from "./history-2025";

/** Editorial anchors are references, not a ranking or projected starting lineup. */
export const clubhouseAnchors: Record<string, string[]> = {
  "1": ["2133", "2308", "1511"],
  "2": ["2259", "2458", "1739"],
  "3": ["1957", "2289", "2304"],
  "4": ["2577", "2126", "1967"],
  "5": ["1658", "1085", "1822"],
  "6": ["2267", "1845", "2574"],
  "7": ["1970", "2455", "2161"],
  "8": ["4866", "1380", "2179"],
  "9": ["1362", "1945", "4760"],
  "10": ["1648", "1272", "1846"],
};

/** Pure projection over live domain objects; no network, scores or owners invented. */
export function buildLiveClubhouseDirectory(
  teams: Team[],
  playersByTeam: Record<string, Player[]>,
  matchups: Matchup[],
  transactions: Transaction[],
): LiveClubhouseDirectoryEntry[] {
  return teams.map((team) => {
    const players = playersByTeam[team.id] ?? [];
    const prior = SEASON_2025_STANDINGS[team.id];
    const currentMatchup =
      matchups.find(
        (matchup) => matchup.home.id === team.id || matchup.away.id === team.id,
      ) ?? null;
    const latestMove =
      [...transactions]
        .filter((move) => move.teamIds.includes(team.id))
        .sort((a, b) => b.createdAt - a.createdAt)[0] ?? null;
    return {
      identity: team,
      currentRecord: { wins: team.wins, losses: team.losses, ties: team.ties },
      players,
      featuredPlayerIds: (clubhouseAnchors[team.id] ?? []).filter((id) =>
        players.some((player) => player.id === id),
      ),
      previousSeason: prior
        ? {
            season: "2025",
            wins: prior.wins,
            losses: prior.losses,
            finish: SEASON_2025_PLACEMENTS[team.id],
            ownerNote:
              team.id === "8"
                ? "Under the previous manager as QBs Gremlins."
                : null,
          }
        : null,
      opener:
        currentMatchup?.week === 1
          ? {
              leagueWeek: 1,
              opponentId:
                currentMatchup.home.id === team.id
                  ? currentMatchup.away.id
                  : currentMatchup.home.id,
            }
          : null,
      recentMove: null,
      currentMatchup,
      latestMove,
    };
  });
}

/** Source-approved local portraits; unknown references retain text identity. */
export function courtsidePortrait(id: string): string | null {
  return Object.values(clubhouseAnchors).some((ids) => ids.includes(id))
    ? "/courtside/portraits/player-" + id + ".png"
    : null;
}

export function getCourtsidePortraits(): Record<string, string> {
  return Object.fromEntries(
    Object.values(clubhouseAnchors)
      .flat()
      .map((id) => [id, courtsidePortrait(id)!]),
  );
}
