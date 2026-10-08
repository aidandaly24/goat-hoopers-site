import type { FranchiseHistory, LeagueHistory } from "@/domain";
import {
  FRANCHISE_DISCONTINUITY,
  FRANCHISE_TIMELINES,
  HALL_OF_FAME,
  LEAGUE_RECORDS_2025,
  SEASON_2025_CHAMPION,
  SEASON_2025_STANDINGS,
  franchiseFinals,
  franchiseTitles,
} from "./history-2025";
import { getTeams } from "./league";

/**
 * League history loader — the trophy room's data.
 *
 * The 2025 founding season is baked into history-2025.ts (final, verified).
 * The 2026 season is live: no champion yet, and franchise all-time records
 * combine the baked 2025 numbers with the current season's live totals.
 */
export async function getLeagueHistory(): Promise<LeagueHistory> {
  return {
    founded: "2025",
    champions: [SEASON_2025_CHAMPION],
    records: LEAGUE_RECORDS_2025,
    hallOfFame: HALL_OF_FAME,
  };
}

/**
 * One franchise's history, for its team page. All-time record = 2025
 * (baked) + 2026 (live). Returns null when the roster doesn't exist.
 */
export async function getFranchiseHistory(
  teamId: string
): Promise<FranchiseHistory | null> {
  const teams = await getTeams();
  const team = teams.find((t) => t.id === teamId);
  if (!team) return null;

  const past = SEASON_2025_STANDINGS[teamId] ?? { wins: 0, losses: 0 };

  return {
    teamId,
    teamName: team.name,
    founded: "2025",
    championships: franchiseTitles(teamId).length,
    finalsAppearances: franchiseFinals(teamId),
    allTime: {
      wins: past.wins + team.wins,
      losses: past.losses + team.losses,
    },
    titleSeasons: franchiseTitles(teamId),
    timeline: FRANCHISE_TIMELINES[teamId] ?? [],
    discontinuity: FRANCHISE_DISCONTINUITY[teamId],
  };
}
