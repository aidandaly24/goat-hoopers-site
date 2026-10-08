/**
 * The 2025 founding season, baked in.
 *
 * Source: Sleeper API, league 1282883196567977984 (previous_league_id: null —
 * 2025 was the inaugural season). Every number below was verified against
 * /rosters, /users, /matchups/{1..24}, /winners_bracket, and /transactions.
 * The season is final, so this file never changes.
 */

import type {
  ChampionBanner,
  HallOfFameEntry,
  LeagueRecord,
  TimelineEntry,
} from "@/domain";

export const SEASON_2025_CHAMPION: ChampionBanner = {
  season: "2025",
  teamId: "5",
  teamName: "Josh Diddy's Roster",
  managerName: "vannweinkauf",
  regularSeason: { wins: 17, losses: 4 },
  playoffRecord: { wins: 2, losses: 0 },
  pointDifferential: 988.0,
  finalScore: { champ: 326.0, runnerUp: 251.5 },
  runnerUpName: "papichooter",
};

/** Regular-season W-L and points, by roster_id. */
export const SEASON_2025_STANDINGS: Record<
  string,
  { wins: number; losses: number; points: number }
> = {
  "5": { wins: 17, losses: 4, points: 6038.0 },
  "1": { wins: 16, losses: 5, points: 5566.5 },
  "7": { wins: 16, losses: 5, points: 5561.5 },
  "4": { wins: 13, losses: 8, points: 5745.0 },
  "2": { wins: 12, losses: 9, points: 5306.5 },
  "6": { wins: 10, losses: 11, points: 5280.5 },
  "10": { wins: 10, losses: 11, points: 5423.5 },
  "9": { wins: 6, losses: 15, points: 4411.0 },
  "3": { wins: 4, losses: 17, points: 4637.5 },
  "8": { wins: 1, losses: 20, points: 3381.5 },
};

/** Final 2025 placements (playoffs + inverted consolation bracket). */
export const SEASON_2025_PLACEMENTS: Record<string, number> = {
  "5": 1,
  "7": 2,
  "4": 3,
  "1": 4,
  "2": 5,
  "10": 6,
  "3": 7,
  "6": 8,
  "9": 9,
  "8": 10,
};

export const LEAGUE_RECORDS_2025: LeagueRecord[] = [
  {
    id: "most-points-season",
    label: "Most points in a season",
    value: "6,038.0",
    holder: { teamId: "5", teamName: "Josh Diddy's Roster" },
    detail: "21 games, 2025 — 287.5 per week",
    season: "2025",
  },
  {
    id: "most-wins-season",
    label: "Most wins",
    value: "17",
    holder: { teamId: "5", teamName: "Josh Diddy's Roster" },
    detail: "17–4, 2025",
    season: "2025",
  },
  {
    id: "best-playoff-run",
    label: "Best playoff run",
    value: "2–0, +104.5",
    holder: { teamId: "5", teamName: "Josh Diddy's Roster" },
    detail:
      "2025 — semifinal 265.5–235.5 over The Fun Guys, final 326.0–251.5 over papichooter",
    season: "2025",
  },
  {
    id: "biggest-trade",
    label: "Biggest trade",
    value: "4 players + 2 picks",
    holder: { teamId: "6", teamName: "Huff n' Puff" },
    detail:
      "Week 4, 2025 — De'Aaron Fox to Huff n' Puff for Onyeka Okongwu, Naji Marshall, Keon Ellis, a 2026 1st (QBs Gremlins sent a 2026 3rd back)",
    season: "2025",
  },
  {
    id: "most-trades-season",
    label: "Most trades in a season",
    value: "9",
    holder: { teamId: "3", teamName: "Stephon Castle's Back" },
    detail: "2025 — the league's wiretap never slept",
    season: "2025",
  },
  {
    id: "largest-blowout",
    label: "Largest blowout",
    value: "227.0",
    holder: { teamId: "5", teamName: "Josh Diddy's Roster" },
    detail: "Week 16, 2025 — 304.0–77.0 over QBs Gremlins",
    season: "2025",
  },
  {
    id: "longest-win-streak",
    label: "Longest win streak",
    value: "11",
    holder: { teamId: "5", teamName: "Josh Diddy's Roster" },
    detail: "2025 regular season",
    season: "2025",
  },
  {
    id: "longest-losing-streak",
    label: "Most consecutive losses",
    value: "20",
    holder: { teamId: "8", teamName: "QBs Gremlins" },
    detail: "2025 — lost 20 straight to close the season",
    season: "2025",
  },
  {
    id: "highest-week-score",
    label: "Highest single-week score",
    value: "364.0",
    holder: { teamId: "5", teamName: "Josh Diddy's Roster" },
    detail: "Week 7, 2025",
    season: "2025",
  },
];

/**
 * Hall of Fame — real inductees only. To enshrine a new moment, trade, or
 * manager, add an entry here. Fictional moments stay in the newsroom.
 */
export const HALL_OF_FAME: HallOfFameEntry[] = [
  {
    id: "hof-2025-vannweinkauf",
    year: "2025",
    category: "manager",
    title: "vannweinkauf — Inaugural Champion",
    description:
      "Took Josh Diddy's Roster to 17–4 and the league's first title, then watched the final from the top of every record list. The standard everyone else is chasing.",
  },
  {
    id: "hof-2025-fox-trade",
    year: "2025",
    category: "trade",
    title: "The Fox Blockbuster",
    description:
      "Week 4: Huff n' Puff sent Onyeka Okongwu, Naji Marshall, Keon Ellis and a 2026 1st to QBs Gremlins for De'Aaron Fox — four players and two picks, the biggest deal in league history.",
  },
  {
    id: "hof-2025-tatum-trade",
    year: "2025",
    category: "trade",
    title: "The Tatum Deadline",
    description:
      "Week 21: with the title in sight, Josh Diddy's Roster paid RJ Barrett plus 2026 and 2027 firsts for Jayson Tatum. The rich got richer — and then won it all.",
  },
  {
    id: "hof-2025-one-point-five",
    year: "2025",
    category: "moment",
    title: "1.5 Points",
    description:
      "Semifinal, 2025: papichooter edged Reaves Dropper 275.0–273.5 — the slimmest margin of the playoffs — then ran into a buzzsaw in the final. So close to glory.",
  },
  {
    id: "hof-2025-worst-season",
    year: "2025",
    category: "moment",
    title: "The Worst Season Ever",
    description:
      "QBs Gremlins went 1–20 with 20 straight losses in 2025 — and turned the misery into the #1 pick, which became AJ Dybantsa under new manager NeuralNets. Rock bottom had a plan.",
  },
];

/**
 * Franchise timelines. All-time records are computed live (2025 baked +
 * 2026 in progress); the narrative lines below are the verified highlights.
 */
export const FRANCHISE_TIMELINES: Record<string, TimelineEntry[]> = {
  "5": [
    { year: "2025", title: "Inaugural champions", description: "17–4, then 2–0 in the playoffs. The greatest season in league history, full stop." },
    { year: "2026", title: "The title defense", description: "Season in progress." },
  ],
  "7": [
    { year: "2025", title: "Runner-up", description: "16–5 and a 1.5-point semifinal classic, then a 326.0–251.5 loss in the final." },
    { year: "2026", title: "Run it back", description: "Season in progress." },
  ],
  "1": [
    { year: "2025", title: "Semifinalist", description: "16–5, finished 4th after the 1.5-point heartbreak." },
    { year: "2026", title: "Unfinished business", description: "Season in progress." },
  ],
  "4": [
    { year: "2025", title: "3rd place", description: "13–8, won the bronze-medal game." },
    { year: "2026", title: "Climbing", description: "Season in progress." },
  ],
  "2": [
    { year: "2025", title: "5th place", description: "12–9 in the inaugural season." },
    { year: "2026", title: "The rookie class", description: "Drafted Mikel Brown Jr. (#6), Nate Ament (#16), and Bennett Stirtz (#26). Season in progress." },
  ],
  "10": [
    { year: "2025", title: "6th place", description: "10–11, bounced in the quarterfinal." },
    { year: "2026", title: "Rebuilding", description: "Season in progress." },
  ],
  "6": [
    { year: "2025", title: "8th place", description: "10–11. Pulled off the Fox blockbuster." },
    { year: "2026", title: "Reloading", description: "Season in progress." },
  ],
  "9": [
    { year: "2025", title: "9th place", description: "6–15 in the inaugural season." },
    { year: "2026", title: "Rebuilding", description: "Season in progress." },
  ],
  "3": [
    { year: "2025", title: "7th place", description: "4–17, but made 9 trades — the league's busiest front office." },
    { year: "2026", title: "Wheeling and dealing", description: "Season in progress." },
  ],
  "8": [
    { year: "2025", title: "Rock bottom", description: "QBs Gremlins went 1–20 with 20 straight losses — and earned the #1 pick." },
    { year: "2026", title: "New era", description: "New manager NeuralNets takes over and drafts AJ Dybantsa #1 overall." },
  ],
};

export const FRANCHISE_DISCONTINUITY: Record<string, string> = {
  "8": "Franchise changed hands after 2025: slennox's QBs Gremlins (1–20) became NeuralNets under new management.",
};

/** Roster IDs that have appeared in a final (2025: champion 5, runner-up 7). */
const FINALS_APPEARANCES_2025: Record<string, number> = { "5": 1, "7": 1 };

export function franchiseTitles(teamId: string): string[] {
  return SEASON_2025_CHAMPION.teamId === teamId ? ["2025"] : [];
}

export function franchiseFinals(teamId: string): number {
  return FINALS_APPEARANCES_2025[teamId] ?? 0;
}
