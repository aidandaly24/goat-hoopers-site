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
