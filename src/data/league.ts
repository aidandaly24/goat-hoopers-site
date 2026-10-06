/**
 * league.ts — high-level data loaders. This is what surfaces and pages call.
 *
 * Each loader fetches raw Sleeper data (via `sleeper.ts`), transforms it into
 * domain objects (via `transform.ts`), and returns it ready to render.
 * Loaders are async Server Component-friendly and resilient: a failed
 * optional section (e.g. transactions in the offseason) returns an empty
 * array instead of throwing the whole page.
 */
import type {
  Season,
  Team,
  Standing,
  LeagueStats,
  Transaction,
} from "@/domain";
import {
  fetchLeague,
  fetchRosters,
  fetchUsers,
  fetchMatchups,
  fetchNbaState,
  fetchTransactions,
  fetchPlayerDirectory,
  type RawMatchupEntry,
  type RawNbaState,
  type RawPlayerEntry,
  type RawTransaction,
} from "./sleeper";
import {
  toSeason,
  toTeams,
  toStandings,
  toMatchups,
  toTransactions,
  computeLeagueStats,
  emptyLeagueStats,
  type LeagueStatsInput,
} from "./transform";

export type SeasonHubData = {
  season: Season;
  teams: Team[];
  standings: Standing[];
  stats: LeagueStats;
  transactions: Transaction[];
};

/** Best-effort player directory; null when unavailable (offline, etc). */
async function safePlayerDirectory(): Promise<Record<
  string,
  RawPlayerEntry
> | null> {
  try {
    return await fetchPlayerDirectory();
  } catch {
    return null;
  }
}

/**
 * Assemble the plain-data input for computeLeagueStats.
 *
 * Fetching lives here; the math lives in `computeLeagueStats` (pure, takes
 * the input as a parameter). That split is the dependency-inversion seam:
 * tests pass fake inputs straight to the pure function, no network.
 *
 * In the preseason (or when the state endpoint is unreachable) this returns
 * hasGames: false and every stat stays null — the strip renders an empty
 * state instead of fake leaders.
 */
async function fetchStatsInput(teams: Team[]): Promise<LeagueStatsInput> {
  let state: RawNbaState | null = null;
  try {
    state = await fetchNbaState();
  } catch {
    state = null;
  }
  const hasGames = state !== null && state.season_type !== "pre";
  if (state === null || !hasGames) {
    return { teams, matchupsByWeek: [], transactionsByWeek: [], hasGames: false };
  }
  const currentWeek = Math.max(1, state.week);
  const weeks = Array.from({ length: currentWeek }, (_, i) => i + 1);
  const [matchupWeeks, txWeeks] = await Promise.all([
    Promise.all(
      weeks.map((w): Promise<RawMatchupEntry[]> =>
        fetchMatchups(w).catch(() => [])
      )
    ),
    Promise.all(
      weeks.map((w): Promise<RawTransaction[]> =>
        fetchTransactions(w).catch(() => [])
      )
    ),
  ]);
  return {
    teams,
    matchupsByWeek: matchupWeeks.map((raw, i) => {
      const ms = toMatchups(raw, teams);
      for (const m of ms) m.week = i + 1;
      return ms;
    }),
    transactionsByWeek: txWeeks,
    hasGames: true,
  };
}

/**
 * Everything the season-hub surface needs, in one call.
 * Fetches independent resources in parallel.
 */
export async function getSeasonHubData(): Promise<SeasonHubData> {
  const [league, rosters, users, nbaState] = await Promise.all([
    fetchLeague(),
    fetchRosters(),
    fetchUsers(),
    // Deduplicated by Next's fetch cache with the call inside
    // fetchStatsInput — no extra request.
    fetchNbaState().catch(() => null),
  ]);

  const season = toSeason(league, nbaState);
  const teams = toTeams(rosters, users);
  const standings = toStandings(teams);

  // League stats strip. Optional section: on failure the page still renders
  // with the strip's empty state.
  let stats: LeagueStats;
  try {
    stats = computeLeagueStats(await fetchStatsInput(teams));
  } catch {
    stats = emptyLeagueStats();
  }

  // Recent transactions. Week 1 in the preseason; empty is a valid state.
  // Transactions carry only player_ids, so names need the directory —
  // but only fetch it when there's actually something to resolve.
  let transactions: Transaction[] = [];
  try {
    const rawTx = await fetchTransactions(1);
    const directory = rawTx.length > 0 ? await safePlayerDirectory() : null;
    transactions = toTransactions(rawTx, teams, rosters, users, directory).slice(
      0,
      10
    );
  } catch {
    transactions = [];
  }

  return { season, teams, standings, stats, transactions };
}
