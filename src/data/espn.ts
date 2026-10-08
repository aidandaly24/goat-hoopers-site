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
 *
 * Hardened against prototype pollution (#48): only own properties resolve,
 * so "constructor"/"toString"/"__proto__" keys can never leak Object
 * prototype members into a URL, and non-string values are rejected.
 */
export function resolveEspnId(sleeperId: string, map: EspnIdMap): string | null {
  if (!Object.prototype.hasOwnProperty.call(map, sleeperId)) return null;
  const v: unknown = map[sleeperId];
  if (typeof v === "string" && v.length > 0) return v;
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return null;
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
import { type LiveGame, type LiveGameStatus, type LiveSlate } from "@/domain/live-game";

const SCOREBOARD_URL =
  "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard";
/** Poll cadence while games are live/upcoming (rule 14). */
const POLL_MS = 60_000;

/** Raw ESPN shapes — every leaf is unknown until validated below (P2-4). */
type RawStatusType = {
  id?: unknown;
  state?: unknown;
  completed?: unknown;
  shortDetail?: unknown;
} | null | undefined;

type RawCompetitor = {
  homeAway?: unknown;
  score?: unknown;
  team?: { abbreviation?: unknown; displayName?: unknown } | null;
};

type RawEvent = {
  id?: unknown;
  competitions?: unknown;
  status?: { type?: unknown } | null;
};

/** Non-empty string guard for renderable fields (P2-4). */
function asNonEmptyString(v: unknown): string | null {
  return typeof v === "string" && v.trim().length > 0 ? v : null;
}

/** Finite, non-negative score; malformed scores become 0, never NaN (P2-4). */
function asScore(v: unknown): number {
  const n =
    typeof v === "string"
      ? Number.parseInt(v, 10)
      : typeof v === "number"
        ? v
        : NaN;
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
}

function asStatusType(v: unknown): RawStatusType {
  return typeof v === "object" && v !== null
    ? (v as Exclude<RawStatusType, null | undefined>)
    : undefined;
}

/**
 * Classify the ESPN lifecycle (P2-3). Trusts `status.type.state`
 * ("pre"/"in"/"post") first, falls back to the legacy numeric `id`
 * ("1"/"2"/"3") when state is absent. Returns null for missing, unknown,
 * canceled, or postponed statuses — never defaults to "scheduled", so an
 * unrecognized game can't authorize polling forever.
 */
export function toStatus(type: unknown): LiveGameStatus | null {
  const t = asStatusType(type);
  if (!t) return null;
  const state = typeof t.state === "string" ? t.state : null;
  if (state !== null) {
    if (state === "in") return "in-progress";
    if (state === "post") return "final";
    if (state === "pre") return "scheduled";
    return null;
  }
  const id = typeof t.id === "string" ? t.id : null;
  if (id === "2") return "in-progress";
  if (id === "3") return "final";
  if (id === "1") return "scheduled";
  return null;
}

/**
 * Map one ESPN event to a LiveGame; null when the shape is unexpected.
 * Never throws on malformed input — a bad event is skipped without losing
 * valid siblings (P2-4).
 */
export function toLiveGame(event: unknown): LiveGame | null {
  if (typeof event !== "object" || event === null) return null;
  const e = event as RawEvent;
  const id = asNonEmptyString(e.id);
  if (!id) return null;

  const competitions = Array.isArray(e.competitions) ? e.competitions : null;
  const first = competitions?.[0];
  const rawCompetitors =
    typeof first === "object" &&
    first !== null &&
    Array.isArray((first as { competitors?: unknown }).competitors)
      ? ((first as { competitors?: unknown }).competitors as unknown[])
      : null;
  if (!rawCompetitors) return null;

  const isCompetitor = (c: unknown): c is RawCompetitor =>
    typeof c === "object" && c !== null;
  const away = rawCompetitors.find(
    (c): c is RawCompetitor => isCompetitor(c) && c.homeAway === "away",
  );
  const home = rawCompetitors.find(
    (c): c is RawCompetitor => isCompetitor(c) && c.homeAway === "home",
  );
  const awayAbbr = asNonEmptyString(away?.team?.abbreviation);
  const homeAbbr = asNonEmptyString(home?.team?.abbreviation);
  if (!awayAbbr || !homeAbbr) return null;

  const statusType =
    typeof e.status === "object" && e.status !== null
      ? (e.status as { type?: unknown }).type
      : undefined;
  const status = toStatus(statusType);
  if (!status) return null;

  const clock = asNonEmptyString(
    asStatusType(statusType)?.shortDetail,
  );
  if (!clock) return null;

  return {
    id,
    awayAbbr,
    awayName: asNonEmptyString(away?.team?.displayName) ?? awayAbbr,
    homeAbbr,
    homeName: asNonEmptyString(home?.team?.displayName) ?? homeAbbr,
    awayScore: asScore(away?.score),
    homeScore: asScore(home?.score),
    status,
    clock,
  };
}

/**
 * Fetch today's scoreboard and map it to a LiveSlate.
 * The provider's day.date rides along so the poller can detect the
 * provider's day rollover independently of the browser clock (P2-2).
 * Throws on network/HTTP/shape errors — the hook converts to null.
 */
export async function fetchLiveGames(
  signal?: AbortSignal,
): Promise<LiveSlate> {
  const res = await fetch(SCOREBOARD_URL, { signal });
  if (!res.ok) throw new Error(`ESPN scoreboard HTTP ${res.status}`);
  const data: unknown = await res.json();
  if (typeof data !== "object" || data === null) {
    throw new Error("ESPN shape changed");
  }
  const { events } = data as { events?: unknown };
  if (!Array.isArray(events)) throw new Error("ESPN shape changed");
  const games: LiveGame[] = [];
  for (const event of events) {
    const game = toLiveGame(event);
    if (game) games.push(game);
  }
  const day = (data as { day?: unknown }).day;
  const slateDate =
    typeof day === "object" && day !== null
      ? asNonEmptyString((day as { date?: unknown }).date)
      : null;
  return { games, slateDate };
}

