/**
 * Sleeper API client — the ONLY module allowed to touch https://api.sleeper.app.
 *
 * Rules:
 * - Every function here returns raw Sleeper JSON (typed as the minimal shape
 *   we need), never domain objects. Shaping into domain types happens in
 *   `transform.ts`.
 * - All requests go through `sleeperFetch`, which applies caching. League data
 *   revalidates every 5 minutes; the player directory is projected to the
 *   fields we read and cached for 5 minutes (see fetchPlayerDirectory).
 * - No other module in the app may import from this file except `transform.ts`
 *   and the high-level loaders in `league.ts`.
 */

import { createTtlCache } from "./cache";

const BASE = "https://api.sleeper.app/v1";

/** League id for GOAT Hoopers. Overridable via env for local experiments. */
export const LEAGUE_ID =
  process.env.SLEEPER_LEAGUE_ID ?? "1387473752807190528";

/* ---------- raw Sleeper shapes (minimal — only fields we read) ---------- */

export type RawLeague = {
  name: string;
  season: string;
  status: string;
  total_rosters: number;
  /** Ordered starting slots; unknown when absent. */
  roster_positions?: string[];
  settings: {
    playoff_teams: number;
    playoff_week_start: number;
    divisions: number;
    /** Raw code; never infer Lock-In/Game Pick without verification. */
    game_mode?: number;
    /** Waiver budget in FAAB dollars; anchors the stock market's FAAB scale. */
    waiver_budget?: number;
  };
  /** Fantasy scoring: stat field → points per unit (e.g. { pts: 0.5 }). */
  scoring_settings: Record<string, number>;
};

export type RawRosterSettings = {
  wins: number;
  losses: number;
  ties: number;
  fpts: number;
  fpts_decimal: number;
  fpts_against: number;
  fpts_against_decimal: number;
};

export type RawRoster = {
  roster_id: number;
  owner_id: string;
  settings: RawRosterSettings;
  /** All rostered player_ids (starters + bench + taxi + IR). */
  players: string[];
  starters?: string[];
  reserve?: string[] | null;
  taxi?: string[] | null;
};

export type RawUser = {
  user_id: string;
  display_name: string;
  avatar: string | null;
  metadata: { team_name?: string };
};

export type RawNbaState = {
  /** Current week number of the NBA season. */
  week: number;
  /** "pre" | "regular" | "post". */
  season_type: string;
  season: string;
  /** Sleeper NBA uses leg; preseason is zero. */
  leg?: number;
  season_start_date?: string;
};

export type RawMatchupEntry = {
  roster_id: number;
  /** Entries sharing a matchup_id are paired against each other. */
  matchup_id: number;
  /** Fantasy points; null before the matchup is played. */
  points: number | null;
  starters?: string[];
};

export type RawTransaction = {
  transaction_id: string;
  type: string;
  /** Missing on legacy inputs; explicit non-complete records are not activity. */
  status?: string;
  /** Declared participants include trades with no player movements. */
  roster_ids?: number[];
  /** Sleeper calls the week number "leg". */
  leg: number;
  created: number;
  adds: Record<string, number> | null;
  drops: Record<string, number> | null;
  draft_picks: unknown[];
  /**
   * Waiver settings. `waiver_bid` is the FAAB spent to win the claim —
   * the stock market's real-money demand signal.
   */
  settings?: {
    waiver_bid?: number;
  } | null;
};

export type RawPlayerEntry = {
  full_name?: string;
  first_name?: string;
  last_name?: string;
  position?: string;
  team?: string | null;
  /** Age in years. */
  age?: number;
  /** e.g. "Out", "Doubtful", "Questionable", "IR", "Suspended". */
  injury_status?: string | null;
  /** Completed NBA seasons. */
  years_exp?: number;
};

/** A draft (e.g. the league's rookie draft). */
export type RawDraft = {
  draft_id: string;
  season: string;
  status: string;
  type: string;
  /** Unix ms the draft started. */
  start_time?: number;
};

export type RawDraftPick = {
  pick_no: number;
  round: number;
  draft_slot: number;
  player_id: string;
  picked_by: string;
  roster_id: number;
  metadata: {
    first_name?: string;
    last_name?: string;
    full_name?: string;
    position?: string;
    team?: string | null;
  };
};

/* ---------- fetching ---------- */

async function sleeperFetch<T>(path: string, revalidateSeconds: number): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    next: { revalidate: revalidateSeconds },
  });
  if (!res.ok) {
    throw new Error(`Sleeper API ${res.status} on ${path}`);
  }
  return (await res.json()) as T;
}

/** League metadata. Changes rarely; cache 5 min. */
export function fetchLeague(): Promise<RawLeague> {
  return sleeperFetch<RawLeague>(`/league/${LEAGUE_ID}`, 300);
}

/** Rosters with win/loss/points settings. Cache 5 min. */
export function fetchRosters(): Promise<RawRoster[]> {
  return sleeperFetch<RawRoster[]>(`/league/${LEAGUE_ID}/rosters`, 300);
}

/** League members (team names live here). Cache 5 min. */
export function fetchUsers(): Promise<RawUser[]> {
  return sleeperFetch<RawUser[]>(`/league/${LEAGUE_ID}/users`, 300);
}

/** NBA season state (current week, pre/regular/post). Cache 5 min. */
export function fetchNbaState(): Promise<RawNbaState> {
  return sleeperFetch<RawNbaState>(`/state/nba`, 300);
}

/**
 * Head-to-head matchups for a league week. Entries pair up by matchup_id.
 * Cache 5 min.
 */
export function fetchMatchups(week: number): Promise<RawMatchupEntry[]> {
  return sleeperFetch<RawMatchupEntry[]>(
    `/league/${LEAGUE_ID}/matchups/${week}`,
    300
  );
}

/**
 * Transactions for a league week. Week 0 doesn't exist on the API —
 * callers should guard. Cache 5 min.
 */
export function fetchTransactions(week: number): Promise<RawTransaction[]> {
  return sleeperFetch<RawTransaction[]>(
    `/league/${LEAGUE_ID}/transactions/${week}`,
    300
  );
}

/**
 * Drafts for the league. Usually one rookie draft per season. Cache 5 min.
 */
export function fetchDrafts(): Promise<RawDraft[]> {
  return sleeperFetch<RawDraft[]>(`/league/${LEAGUE_ID}/drafts`, 300);
}

/**
 * Every pick in a draft, in pick order. Player identity rides on the pick
 * metadata, so no directory fetch is needed. Cache 5 min.
 */
export function fetchDraftPicks(draftId: string): Promise<RawDraftPick[]> {
  return sleeperFetch<RawDraftPick[]>(`/draft/${draftId}/picks`, 300);
}

export type RawWinnersBracketEntry = {
  /** Playoff round, 1-based. The final is the highest round. */
  r: number;
  /** Matchup index within the round. */
  m: number;
  t1: number | null;
  t2: number | null;
  /** Winning roster_id. Null until the matchup is decided. */
  w: number | null;
  l: number | null;
};

/**
 * Playoff winners bracket. The champion is the winner of the final
 * (highest-round) matchup. Empty / undecided before the playoffs.
 * Cache 5 min.
 */
export function fetchWinnersBracket(): Promise<RawWinnersBracketEntry[]> {
  return sleeperFetch<RawWinnersBracketEntry[]>(
    `/league/${LEAGUE_ID}/winners_bracket`,
    300
  );
}

/**
 * Full NBA player directory. The raw payload is ~2.5MB, so each entry is
 * projected to exactly the fields the membrane reads (see RawPlayerEntry) —
 * the projected directory is ~330KB and safe to keep in memory.
 *
 * Freshness: cached per instance for 5 minutes (PLAYER_DIRECTORY_TTL_MS).
 * Player identity changes slowly, but injury_status feeds valuation, so a
 * longer TTL could ignore an injury change. On refresh failure the
 * last-good value is served; on cold-start failure this throws and callers
 * (safePlayerDirectory) degrade to null — the site renders without name
 * resolution instead of crashing.
 *
 * The projection's source and version are declared as keys
 * (PLAYER_DIRECTORY_SOURCE / PLAYER_DIRECTORY_PROJECTION_VERSION): bump
 * the version when the kept field set changes so a stale shape is
 * detectable.
 */
export const PLAYER_DIRECTORY_SOURCE = "sleeper:/players/nba";
export const PLAYER_DIRECTORY_PROJECTION_VERSION = 1;
/**
 * 5 minutes in ms. Issue #16 starts this cache at 300s: injury_status
 * feeds valuation (0.45x for Out/IR vs 1x Healthy in transform.ts), so a
 * 24h TTL could ignore an injury change for a full day. Revisit only with
 * an explicit staleness decision or a stable-identity/dynamic-overlay split.
 */
export const PLAYER_DIRECTORY_TTL_MS = 5 * 60 * 1000;

async function fetchRawPlayerDirectory(): Promise<Record<string, unknown>> {
  // no-store: the 5min TTL cache above is the single source of truth for
  // directory freshness — Next's fetch cache must not add a second layer.
  const res = await fetch(`${BASE}/players/nba`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Sleeper API ${res.status} on /players/nba`);
  }
  return (await res.json()) as Record<string, unknown>;
}

/**
 * Project the raw directory to the fields we read. Pure — safe to test
 * with fixtures. Unknown/extra upstream fields are dropped, never read.
 */
export function projectPlayerDirectory(
  raw: Record<string, unknown>,
): Record<string, RawPlayerEntry> {
  const out: Record<string, RawPlayerEntry> = {};
  for (const [playerId, entry] of Object.entries(raw)) {
    if (entry === null || typeof entry !== "object") continue;
    const e = entry as Record<string, unknown>;
    const projected: RawPlayerEntry = {};
    if (typeof e.full_name === "string") projected.full_name = e.full_name;
    if (typeof e.first_name === "string") projected.first_name = e.first_name;
    if (typeof e.last_name === "string") projected.last_name = e.last_name;
    if (typeof e.position === "string") projected.position = e.position;
    if (typeof e.team === "string" || e.team === null) projected.team = e.team;
    if (typeof e.age === "number") projected.age = e.age;
    if (typeof e.injury_status === "string" || e.injury_status === null)
      projected.injury_status = e.injury_status;
    if (typeof e.years_exp === "number") projected.years_exp = e.years_exp;
    out[playerId] = projected;
  }
  return out;
}

export type PlayerDirectoryCacheDeps = {
  /** Injectable clock (tests). */
  now?: () => number;
  /** Injectable raw fetch (tests). */
  fetchRaw?: () => Promise<Record<string, unknown>>;
  /** Injectable TTL (tests). */
  ttlMs?: number;
};

/**
 * Build a projected, cached player directory. Dependency-inverted so tests
 * can inject a fake clock and fetcher; production uses the module
 * singleton behind fetchPlayerDirectory().
 */
export function createPlayerDirectoryCache(deps: PlayerDirectoryCacheDeps = {}) {
  const {
    now,
    fetchRaw = fetchRawPlayerDirectory,
    ttlMs = PLAYER_DIRECTORY_TTL_MS,
  } = deps;
  return createTtlCache(
    async () => projectPlayerDirectory(await fetchRaw()),
    { ttlMs, now },
  );
}

const playerDirectoryCache = createPlayerDirectoryCache();

export function fetchPlayerDirectory(): Promise<
  Record<string, RawPlayerEntry>
> {
  return playerDirectoryCache.get();
}

/**
 * Season stat totals per player: player_id → { pts, reb, ast, …, gp, sp, … }.
 * This is the real-production feed the stock market's valuation v2 runs on
 * (it turned out Sleeper does expose per-player stats — the old "no stat
 * feed" comment was wrong). One call returns the whole league. Cache a day.
 */
export async function fetchSeasonStats(
  season: string
): Promise<Record<string, Record<string, number>>> {
  return sleeperFetch<Record<string, Record<string, number>>>(
    `/stats/nba/regular/${season}`,
    86400
  );
}
