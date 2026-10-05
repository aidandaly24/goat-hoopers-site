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
  DraftPick,
  Transaction,
} from "@/domain";
import {
  fetchLeague,
  fetchRosters,
  fetchUsers,
  fetchDraftPicks,
  fetchTransactions,
  fetchPlayerDirectory,
  type RawPlayerEntry,
} from "./sleeper";
import {
  toSeason,
  toTeams,
  toStandings,
  buildDraftPicks,
  toTransactions,
} from "./transform";

export interface SeasonHubData {
  season: Season;
  teams: Team[];
  standings: Standing[];
  draftPicks: DraftPick[];
  transactions: Transaction[];
}

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
 * Everything the season-hub surface needs, in one call.
 * Fetches independent resources in parallel.
 */
export async function getSeasonHubData(): Promise<SeasonHubData> {
  const [league, rosters, users] = await Promise.all([
    fetchLeague(),
    fetchRosters(),
    fetchUsers(),
  ]);

  const season = toSeason(league);
  const teams = toTeams(rosters, users);
  const standings = toStandings(teams);

  // Draft board (rookie draft). Immutable once complete.
  // The player directory is only fetched when a pick's embedded metadata
  // is missing a name — it's ~3MB and can't sit in Next's data cache.
  let draftPicks: DraftPick[] = [];
  if (season.draftId) {
    try {
      const picks = await fetchDraftPicks(season.draftId);
      const needsDirectory = picks.some(
        (p) => !p.metadata?.first_name && !p.metadata?.last_name
      );
      const directory = needsDirectory ? await safePlayerDirectory() : null;
      draftPicks = buildDraftPicks(picks, rosters, users, directory);
    } catch {
      draftPicks = [];
    }
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

  return { season, teams, standings, draftPicks, transactions };
}
