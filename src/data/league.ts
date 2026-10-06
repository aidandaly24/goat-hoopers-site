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
  Player,
  DraftPick,
  PowerRanking,
  PlayoffOdds,
  RecordBook,
  MatchupPreview,
  PlayerDetail,
  TeamProfile,
  Matchup,
} from "@/domain";
import {
  fetchLeague,
  fetchRosters,
  fetchUsers,
  fetchMatchups,
  fetchNbaState,
  fetchTransactions,
  fetchDrafts,
  fetchDraftPicks,
  fetchPlayerDirectory,
  fetchWinnersBracket,
  type RawMatchupEntry,
  type RawNbaState,
  type RawPlayerEntry,
  type RawTransaction,
} from "./sleeper";
import {
  toSeason,
  toTeam,
  toTeams,
  toStandings,
  toMatchups,
  toTransactions,
  toPlayer,
  toDraftPicks,
  computeLeagueStats,
  emptyLeagueStats,
  currentStreak,
  type LeagueStatsInput,
} from "./transform";
import {
  computePowerRankings,
  computePlayoffOdds,
  computeRecordBook,
  computeMatchupPreviews,
} from "./analytics";
/* Separate import: championRosterId is this feature's seam, kept out of
 * the shared transform import block above. */
import { championRosterId } from "./transform";

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

export type TeamDetail = {
  team: Team;
  players: Player[];
};

/**
 * One team's detail for the My Team page: identity + resolved roster.
 * Returns null when the team doesn't exist. Players degrade gracefully
 * when the directory is unreachable (stubs, not a failed page).
 */
export async function getTeamDetail(teamId: string): Promise<TeamDetail | null> {
  const [rosters, users] = await Promise.all([fetchRosters(), fetchUsers()]);
  const raw = rosters.find((r) => String(r.roster_id) === teamId);
  if (!raw) return null;
  const byId = new Map(users.map((u) => [u.user_id, u]));
  const team = toTeam(raw, byId.get(raw.owner_id));
  const ids = raw.players ?? [];
  if (ids.length === 0) return { team, players: [] };
  const directory = await safePlayerDirectory();
  const players = ids.map((pid) => toPlayer(pid, directory?.[pid]));
  return { team, players };
}

/**
 * Every team in the league. The light loader for the team directory —
 * no stats computation, no transactions.
 */
export async function getTeams(): Promise<Team[]> {
  try {
    const [rosters, users] = await Promise.all([fetchRosters(), fetchUsers()]);
    return toTeams(rosters, users);
  } catch {
    return [];
  }
}

export type TransactionHistoryData = {
  transactions: Transaction[];
  teams: Team[];
};

/**
 * Full transaction history across all played weeks (preseason = week 1
 * on the Sleeper API). Player/team names resolved via the directory,
 * fetched only when there's something to resolve. Never throws.
 */
export async function getTransactionHistory(): Promise<TransactionHistoryData> {
  let rosters: Awaited<ReturnType<typeof fetchRosters>> = [];
  let users: Awaited<ReturnType<typeof fetchUsers>> = [];
  let nbaState: RawNbaState | null = null;
  try {
    [rosters, users, nbaState] = await Promise.all([
      fetchRosters(),
      fetchUsers(),
      fetchNbaState().catch(() => null),
    ]);
  } catch {
    return { transactions: [], teams: [] };
  }
  const teams = toTeams(rosters, users);
  const maxWeek = Math.max(1, nbaState?.week ?? 1);
  const weeks = Array.from({ length: maxWeek }, (_, i) => i + 1);
  const txWeeks = await Promise.all(
    weeks.map((w) => fetchTransactions(w).catch(() => [] as RawTransaction[]))
  );
  const raw = txWeeks.flat();
  if (raw.length === 0) return { transactions: [], teams };
  const directory = await safePlayerDirectory();
  return { transactions: toTransactions(raw, teams, rosters, users, directory), teams };
}

export type DraftBoardData = {
  /** Completed rookie draft picks, in pick order. Empty when none exists. */
  picks: DraftPick[];
  teams: Team[];
};

/**
 * Light season metadata for the site chrome (footer). Just league meta +
 * NBA state — none of the standings/stats/transaction weight of
 * getSeasonHubData. Null when the API is unreachable; the footer renders
 * without the season line instead of the page failing.
 */
export async function getSeasonMeta(): Promise<Season | null> {
  try {
    const [league, nbaState] = await Promise.all([
      fetchLeague(),
      fetchNbaState().catch(() => null),
    ]);
    return toSeason(league, nbaState);
  } catch {
    return null;
  }
}

/**
 * The league's completed rookie draft board. Picks the completed 2026
 * draft, falling back to the first draft on record. Player names come
 * from pick metadata — no directory fetch needed. Never throws.
 */
export async function getDraftBoard(): Promise<DraftBoardData> {
  try {
    const [drafts, rosters, users] = await Promise.all([
      fetchDrafts(),
      fetchRosters(),
      fetchUsers(),
    ]);
    const teams = toTeams(rosters, users);
    const draft =
      drafts.find((d) => d.season === "2026" && d.status === "complete") ??
      drafts[0];
    if (!draft) return { picks: [], teams };
    const picks = toDraftPicks(await fetchDraftPicks(draft.draft_id));
    return { picks, teams };
  } catch {
    return { picks: [], teams: [] };
  }
}

/* ---------------- data tools (DATA pillar) ---------------- */

/** Completed rookie-draft picks, best-effort. Never throws. */
async function fetchDraftPicksSafe(): Promise<DraftPick[]> {
  try {
    const drafts = await fetchDrafts();
    const draft =
      drafts.find((d) => d.season === "2026" && d.status === "complete") ??
      drafts[0];
    if (!draft) return [];
    return toDraftPicks(await fetchDraftPicks(draft.draft_id));
  } catch {
    return [];
  }
}

type AnalyticsInputs = {
  teams: Team[];
  season: Season;
  /** Index 0 = week 1. */
  matchupsByWeek: Matchup[][];
  hasGames: boolean;
  currentWeek: number;
};

/**
 * Shared assembly for every data tool: teams, season (with playoff
 * settings), and every played week's matchups. Fetching lives here; the
 * math lives in the pure functions in analytics.ts. Returns nulls on
 * failure — every tool degrades to its honest empty state.
 */
async function fetchAnalyticsInputs(): Promise<AnalyticsInputs | null> {
  try {
    const [league, rosters, users, nbaState] = await Promise.all([
      fetchLeague(),
      fetchRosters(),
      fetchUsers(),
      fetchNbaState().catch(() => null),
    ]);
    const season = toSeason(league, nbaState);
    const teams = toTeams(rosters, users);
    const hasGames = nbaState !== null && nbaState.season_type !== "pre";
    if (!hasGames) {
      return { teams, season, matchupsByWeek: [], hasGames: false, currentWeek: 0 };
    }
    const currentWeek = Math.max(1, nbaState?.week ?? 1);
    const weeks = Array.from({ length: currentWeek }, (_, i) => i + 1);
    const matchupWeeks = await Promise.all(
      weeks.map((w): Promise<RawMatchupEntry[]> =>
        fetchMatchups(w).catch(() => [])
      )
    );
    const matchupsByWeek = matchupWeeks.map((raw, i) => {
      const ms = toMatchups(raw, teams);
      for (const m of ms) m.week = i + 1;
      return ms;
    });
    return { teams, season, matchupsByWeek, hasGames: true, currentWeek };
  } catch {
    return null;
  }
}

/**
 * Power rankings from live data. Null in the preseason (no real order to
 * show yet) or when the API is unreachable. Never throws.
 */
export async function getPowerRankings(): Promise<PowerRanking[] | null> {
  try {
    const input = await fetchAnalyticsInputs();
    if (!input) return null;
    return computePowerRankings({
      teams: input.teams,
      matchupsByWeek: input.matchupsByWeek,
    });
  } catch {
    return null;
  }
}

/**
 * Simulated playoff odds from live data. Null in the preseason or on
 * failure. Never throws.
 */
export async function getPlayoffOdds(): Promise<PlayoffOdds[] | null> {
  try {
    const input = await fetchAnalyticsInputs();
    if (!input) return null;
    return computePlayoffOdds({
      teams: input.teams,
      matchupsByWeek: input.matchupsByWeek,
      playoffSpots: input.season.playoffTeams,
      playoffWeekStart: input.season.playoffWeekStart,
      week: input.currentWeek,
    });
  } catch {
    return null;
  }
}

/**
 * The all-time record book from every final. Null in the preseason or on
 * failure. Never throws.
 */
export async function getRecordBook(): Promise<RecordBook | null> {
  try {
    const input = await fetchAnalyticsInputs();
    if (!input) return null;
    return computeRecordBook({ matchupsByWeek: input.matchupsByWeek });
  } catch {
    return null;
  }
}

/**
 * Projections + picks for the current week's matchups. Null in the
 * preseason or on failure. Never throws.
 */
export async function getMatchupPreviews(): Promise<MatchupPreview[] | null> {
  try {
    const input = await fetchAnalyticsInputs();
    if (!input) return null;
    return computeMatchupPreviews({
      matchupsByWeek: input.matchupsByWeek,
      teams: input.teams,
    });
  } catch {
    return null;
  }
}

/* ---------------- player + team pages ---------------- */

/**
 * One player's page data: identity, the GOAT Hoopers roster holding them
 * (null = free agent), their wire history, and their rookie-draft pick.
 * Returns null only when the league itself is unreachable — unknown player
 * ids degrade to a stub Player, never a failed page.
 */
export async function getPlayerDetail(
  playerId: string
): Promise<PlayerDetail | null> {
  try {
    const [rosters, users, directory, history, picks] = await Promise.all([
      fetchRosters(),
      fetchUsers(),
      safePlayerDirectory(),
      getTransactionHistory(),
      fetchDraftPicksSafe(),
    ]);
    const player = toPlayer(playerId, directory?.[playerId]);

    let team: Team | null = null;
    for (const r of rosters) {
      if ((r.players ?? []).includes(playerId)) {
        const user = users.find((u) => u.user_id === r.owner_id);
        team = toTeam(r, user);
        break;
      }
    }

    const transactions = history.transactions.filter(
      (t) =>
        t.adds.some((m) => m.playerId === playerId) ||
        t.drops.some((m) => m.playerId === playerId)
    );
    const draftPick = picks.find((p) => p.playerId === playerId) ?? null;

    return { player, team, transactions, draftPick };
  } catch {
    return null;
  }
}

/**
 * One team's public profile for /teams/[rosterId]: identity + record,
 * full roster, season game log with active streak, draft picks, and
 * recent wire activity. Returns null when the team doesn't exist.
 */
export async function getTeamProfile(
  rosterId: string
): Promise<TeamProfile | null> {
  try {
    const [rosters, users, directory, input, picks] = await Promise.all([
      fetchRosters(),
      fetchUsers(),
      safePlayerDirectory(),
      fetchAnalyticsInputs(),
      fetchDraftPicksSafe(),
    ]);
    const raw = rosters.find((r) => String(r.roster_id) === rosterId);
    if (!raw) return null;
    const byId = new Map(users.map((u) => [u.user_id, u]));
    const team = toTeam(raw, byId.get(raw.owner_id));

    const players = (raw.players ?? []).map((pid) =>
      toPlayer(pid, directory?.[pid])
    );

    const matchupsByWeek = input?.matchupsByWeek ?? [];
    const matchups = matchupsByWeek
      .flatMap((ms, i) =>
        ms
          .filter((m) => m.home.id === team.id || m.away.id === team.id)
          .map((m) => ({ ...m, week: i + 1 }))
      )
      .sort((a, b) => b.week - a.week);

    const streak = currentStreak(team.id, matchupsByWeek);
    const draftPicks = picks.filter((p) => p.teamId === team.id);

    // Recent wire activity for this team (best-effort).
    let transactions: Transaction[] = [];
    try {
      const history = await getTransactionHistory();
      transactions = history.transactions
        .filter((t) => t.teamIds.includes(team.id))
        .slice(0, 10);
    } catch {
      transactions = [];
    }

    return { team, players, matchups, streak, draftPicks, transactions };
  } catch {
    return null;
  }
}

/**
 * The defending champion's roster id (as a string, matching Team.id),
 * resolved from the playoff winners bracket. Null when there's no
 * completed bracket — the honest state for a league that hasn't crowned
 * anyone yet (GOAT Hoopers' first season). Surfaces pass it to
 * TeamAvatar's isChampion prop; no crown renders until this returns an
 * id, so the feature lights up automatically the moment a champion
 * exists. Never throws.
 */
export async function getDefendingChampion(): Promise<string | null> {
  try {
    return championRosterId(await fetchWinnersBracket());
  } catch {
    return null;
  }
}
