/**
 * espn.ts — Sleeper player_id -> ESPN athlete id resolution.
 *
 * Headshots render from ESPN's CDN (a.espncdn.com/i/headshots/nba/players/full/{espnId}.png).
 * Sleeper ships no image URLs (#48 verified), so the site needs this mapping to
 * show faces. Dependency-inversion seam (rule 11):
 *
 *   - `resolveEspnId(sleeperId, map)` is pure and takes the map as a parameter,
 *     so tests and callers can point it at any mapping — the seed map today,
 *     Aidan's full mapping table when it lands, a fake in a dev check.
 *   - Components never import this module (let alone the seed map); they
 *     receive the resolved `espnId` as a plain domain value.
 *
 * Today the only checked-in source is SEED_ESPN_ID_MAP: a tiny set of ESPN ids
 * verified by hand (ESPN athlete pages + the headshot PNGs themselves returning
 * 200 at 600x436). When Aidan's agent delivers the full Sleeper -> ESPN table
 * (committed on #48), swap SEED_ESPN_ID_MAP at the wiring points in league.ts
 * — zero component edits (acceptance criterion 4).
 *
 * Plain <img> only for headshots, never next/image (Hobby's 1,000
 * image-optimizations/month budget); next.config remotePatterns untouched.
 */

/** Sleeper player_id -> ESPN athlete id. */
export type EspnIdMap = Record<string, string>;

/**
 * Pure lookup: the ESPN id for a Sleeper player, or null when the map has no
 * entry (players without a headshot render the initials fallback).
 */
export function resolveEspnId(sleeperId: string, map: EspnIdMap): string | null {
  return map[sleeperId] ?? null;
}

/**
 * The seed map: ESPN ids verified 2026-10-08 (ESPN athlete pages + headshot
 * PNGs checked live). Keys are Sleeper player_ids.
 *
 * - "4866" AJ Dybantsa      -> 5142718
 * - "4884" Nate Ament        -> 5164559
 * - "4889" Bennett Stirtz    -> 5241364
 * - "4871" Mikel Brown Jr.   -> 5101761
 * - "4742" Nolan Traore       -> 5279130 (spot check)
 * - "2275" Day'Ron Sharpe    -> 4432194 (spot check)
 * - "1362" LeBron James       -> 1966    (spot check)
 */
export const SEED_ESPN_ID_MAP: EspnIdMap = {
  "4866": "5142718",
  "4884": "5164559",
  "4889": "5241364",
  "4871": "5101761",
  "4742": "5279130",
  "2275": "4432194",
  "1362": "1966",
};

/**
 * The ESPN CDN headshot URL for an athlete id. Pure formatter — no fetch —
 * so components can stay presentational while the URL pattern lives with the
 * rest of the ESPN knowledge in the data layer.
 */
export function headshotUrl(espnId: string): string {
  return `https://a.espncdn.com/i/headshots/nba/players/full/${espnId}.png`;
}

// ---------------------------------------------------------------------------
// Live scoreboard (issue #56, Phase 1 of #47)
//
// Sleeper has no live-game data, so Phase 1 polls ESPN's public scoreboard
// API directly from the browser. This keeps Vercel invocations, Neon usage,
// and cron jobs at $0 (rule 14): the fetch happens client-side, at most once
// per 60s, and only while games are live or scheduled today.
//
// Failure contract: any error (network, blocked, bad shape) resolves to
// null and the ticker silently parks on News/Stocks. Never throws to the
// component, never a broken marquee.
//
import { type LiveGame, type LiveGameStatus } from "@/domain/live-game";

const SCOREBOARD_URL =
  "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard";
/** Poll cadence while games are live/upcoming (rule 14). */
const POLL_MS = 60_000;

/** Minimal ESPN scoreboard shape — only the fields we read. */
type EspnCompetitor = {
  homeAway?: string;
  score?: string;
  team?: { abbreviation?: string; displayName?: string };
};

type EspnEvent = {
  id?: string;
  competitions?: Array<{
    competitors?: EspnCompetitor[];
  }>;
  status?: {
    type?: { id?: string; shortDetail?: string };
  };
};

function toStatus(espnTypeId: string | undefined): LiveGameStatus {
  if (espnTypeId === "2") return "in-progress";
  if (espnTypeId === "3") return "final";
  return "scheduled";
}

/** Map one ESPN event to a LiveGame; null when the shape is unexpected. */
function toLiveGame(event: EspnEvent): LiveGame | null {
  const competitors = event.competitions?.[0]?.competitors;
  if (!event.id || !competitors) return null;
  const away = competitors.find((c) => c.homeAway === "away");
  const home = competitors.find((c) => c.homeAway === "home");
  if (!away?.team?.abbreviation || !home?.team?.abbreviation) return null;
  const clock = event.status?.type?.shortDetail?.trim();
  if (!clock) return null;
  return {
    id: event.id,
    awayAbbr: away.team.abbreviation,
    awayName: away.team.displayName ?? away.team.abbreviation,
    homeAbbr: home.team.abbreviation,
    homeName: home.team.displayName ?? home.team.abbreviation,
    awayScore: Number.parseInt(away.score ?? "0", 10) || 0,
    homeScore: Number.parseInt(home.score ?? "0", 10) || 0,
    status: toStatus(event.status?.type?.id),
    clock,
  };
}

/**
 * Fetch today's scoreboard and map it to LiveGames.
 * Throws on network/HTTP/shape errors — the hook converts to null.
 */
export async function fetchLiveGames(
  signal?: AbortSignal
): Promise<LiveGame[]> {
  const res = await fetch(SCOREBOARD_URL, { signal });
  if (!res.ok) throw new Error(`ESPN scoreboard HTTP ${res.status}`);
  const data = (await res.json()) as { events?: EspnEvent[] };
  if (!Array.isArray(data.events)) throw new Error("ESPN shape changed");
  const games: LiveGame[] = [];
  for (const event of data.events) {
    const game = toLiveGame(event);
    if (game) games.push(game);
  }
  return games;
}

