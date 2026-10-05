/**
 * Sleeper API client — the ONLY module allowed to touch https://api.sleeper.app.
 *
 * Rules:
 * - Every function here returns raw Sleeper JSON (typed as the minimal shape
 *   we need), never domain objects. Shaping into domain types happens in
 *   `transform.ts`.
 * - All requests go through `sleeperFetch`, which applies caching. League data
 *   revalidates every 5 minutes; the player directory revalidates daily.
 * - No other module in the app may import from this file except `transform.ts`
 *   and the high-level loaders in `league.ts`.
 */

const BASE = "https://api.sleeper.app/v1";

/** League id for GOAT Hoopers. Overridable via env for local experiments. */
export const LEAGUE_ID =
  process.env.SLEEPER_LEAGUE_ID ?? "1387473752807190528";

/* ---------- raw Sleeper shapes (minimal — only fields we read) ---------- */

export interface RawLeague {
  name: string;
  season: string;
  status: string;
  total_rosters: number;
  draft_id: string | null;
}

export interface RawRosterSettings {
  wins: number;
  losses: number;
  ties: number;
  fpts: number;
  fpts_decimal: number;
  fpts_against: number;
  fpts_against_decimal: number;
}

export interface RawRoster {
  roster_id: number;
  owner_id: string;
  settings: RawRosterSettings;
}

export interface RawUser {
  user_id: string;
  display_name: string;
  avatar: string | null;
  metadata: { team_name?: string };
}

export interface RawDraftPick {
  player_id: string;
  picked_by: string;
  pick_no: number;
  round: number;
  draft_slot: number;
  metadata: {
    first_name: string;
    last_name: string;
    position: string;
    team: string;
  };
}

export interface RawTransaction {
  transaction_id: string;
  type: string;
  week: number;
  created: number;
  adds: Record<string, number> | null;
  drops: Record<string, number> | null;
  draft_picks: unknown[];
}

export interface RawPlayerEntry {
  full_name?: string;
  first_name?: string;
  last_name?: string;
  position?: string;
  team?: string | null;
}

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

/** Picks for a draft. Drafts are immutable; cache 1 hour. */
export function fetchDraftPicks(draftId: string): Promise<RawDraftPick[]> {
  return sleeperFetch<RawDraftPick[]>(`/draft/${draftId}/picks`, 3600);
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
 * Full NBA player directory. Large (~3MB); Next's data cache can't hold it,
 * so this always refetches. Callers must only call it when they actually need
 * name resolution (see league.ts).
 */
export async function fetchPlayerDirectory(): Promise<
  Record<string, RawPlayerEntry>
> {
  const res = await fetch(`${BASE}/players/nba`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Sleeper API ${res.status} on /players/nba`);
  }
  return (await res.json()) as Record<string, RawPlayerEntry>;
}
