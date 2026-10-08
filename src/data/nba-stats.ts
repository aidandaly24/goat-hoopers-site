/**
 * Player fundamentals for the stock market (valuation v2).
 *
 * Sleeper exposes per-player season stat totals
 * (`/stats/nba/regular/{season}`) — one call returns the whole league,
 * keyed by Sleeper player_id, so no name matching is needed. This module
 * turns those raw totals into `PlayerStatProfile`s (trailing fantasy PPG
 * in our league's scoring, career minutes, league-draft pedigree) and
 * caches them in `player_stat_cache`, refreshed at most once a day.
 *
 * Layering (per AGENTS.md): the pure math (fppg from raw totals) lives in
 * `transform.ts`. This module is the impure shell — it fetches, caches,
 * and returns plain data. It receives its dependencies as parameters so
 * tests can drive it without the network or a database.
 */

import { sql } from "drizzle-orm";
import type { PlayerStatProfile } from "../domain/stock";
import { playerStatCache, type Db } from "./db";
import { fppgUnderScoring } from "./transform";

export type SeasonStatLines = Record<string, Record<string, number>>;

export type StatClientDeps = {
  /** Drizzle db, or null when unavailable — the market still prices, it just refetches stats. */
  db: Db | null;
  /** League scoring: stat field → points per unit. */
  scoring: Record<string, number>;
  /** Raw season stat lines. */
  fetchSeasonStats: (season: string) => Promise<SeasonStatLines>;
  /** player_id → earliest league rookie-draft overall pick. */
  leaguePicks: Record<string, number>;
  /** Completed seasons, newest first, e.g. ["2025", "2024", "2023", "2022", "2021"]. */
  seasons: string[];
};

/** Staleness bound for the fundamentals cache. */
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Build stat profiles from raw season lines. Pure: no network, no DB.
 * Exported for tests.
 */
export function buildStatProfiles(args: {
  seasons: SeasonStatLines[];
  seasonNames: string[];
  scoring: Record<string, number>;
  leaguePicks: Record<string, number>;
}): Record<string, PlayerStatProfile> {
  const { seasons, seasonNames, scoring, leaguePicks } = args;

  const perGame = (lines: SeasonStatLines) => {
    const out: Record<string, { fppg: number; games: number; minutes: number }> =
      {};
    for (const [id, line] of Object.entries(lines)) {
      if (id.startsWith("TEAM_")) continue; // team defense entries, not players
      const calc = fppgUnderScoring(line, scoring);
      if (calc) out[id] = calc;
    }
    return out;
  };

  const perSeason = seasons.map(perGame);
  const [lastPg, prevPg] = perSeason;

  const ids = new Set<string>();
  for (const pg of perSeason) {
    for (const id of Object.keys(pg)) ids.add(id);
  }
  for (const id of Object.keys(leaguePicks)) ids.add(id);

  const profiles: Record<string, PlayerStatProfile> = {};
  for (const id of ids) {
    const l = lastPg[id];
    const p = prevPg[id];
    const fppg =
      l && p
        ? Math.round((0.65 * l.fppg + 0.35 * p.fppg) * 100) / 100
        : l
          ? l.fppg
          : null;
    const seasonHistory = perSeason
      .map((pg, i) => {
        const s = pg[id];
        return s
          ? { season: seasonNames[i], fppg: s.fppg, games: s.games }
          : null;
      })
      .filter((s): s is { season: string; fppg: number; games: number } => s !== null);
    profiles[id] = {
      fppg,
      careerMinutes: Math.round(
        perSeason.reduce((sum, pg) => sum + (pg[id]?.minutes ?? 0), 0)
      ),
      emaFppg: null, // filled by the in-season game-log updater (not yet wired)
      emaGames: 0,
      leaguePick: leaguePicks[id] ?? null,
      seasonHistory,
    };
  }
  return profiles;
}

async function readCache(
  db: Db | null
): Promise<{ profiles: Record<string, PlayerStatProfile>; fresh: boolean } | null> {
  if (!db) return null;
  try {
    const rows = await db.select().from(playerStatCache);
    if (rows.length === 0) return { profiles: {}, fresh: false };
    const newest = Math.max(...rows.map((r) => r.updatedAt.getTime()));
    const profiles: Record<string, PlayerStatProfile> = {};
    for (const r of rows) {
      profiles[r.playerId] = {
        fppg: r.fppg,
        careerMinutes: r.careerMinutes ?? 0,
        emaFppg: r.emaFppg,
        emaGames: r.emaGames ?? 0,
        leaguePick: r.leaguePick,
        seasonHistory: (r.seasonHistory as PlayerStatProfile["seasonHistory"]) ?? [],
      };
    }
    return { profiles, fresh: Date.now() - newest < CACHE_TTL_MS };
  } catch {
    return null; // table missing etc. — caller refetches
  }
}

async function writeCache(
  db: Db | null,
  profiles: Record<string, PlayerStatProfile>
): Promise<void> {
  if (!db) return;
  try {
    const entries = Object.entries(profiles);
    // Chunked upserts — one giant statement can blow the free-tier limits.
    for (let i = 0; i < entries.length; i += 250) {
      const chunk = entries.slice(i, i + 250).map(([playerId, p]) => ({
        playerId,
        fppg: p.fppg,
        careerMinutes: p.careerMinutes,
        emaFppg: p.emaFppg,
        emaGames: p.emaGames,
        leaguePick: p.leaguePick,
        seasonHistory: p.seasonHistory,
        updatedAt: new Date(),
      }));
      await db
        .insert(playerStatCache)
        .values(chunk)
        .onConflictDoUpdate({
          target: playerStatCache.playerId,
          set: {
            fppg: sql`excluded.fppg`,
            careerMinutes: sql`excluded.career_minutes`,
            emaFppg: sql`excluded.ema_fppg`,
            emaGames: sql`excluded.ema_games`,
            leaguePick: sql`excluded.league_pick`,
            seasonHistory: sql`excluded.season_history`,
            updatedAt: new Date(),
          },
        });
    }
  } catch {
    // Cache write failure must never break the page — profiles are in memory.
  }
}

/**
 * Player fundamentals, cached daily. Returns {} when both the cache and
 * the stats feed are unreachable — the valuation engine then prices on
 * pedigree alone (documented degradation, not a crash).
 */
export async function getStatProfiles(
  deps: StatClientDeps
): Promise<Record<string, PlayerStatProfile>> {
  const cached = await readCache(deps.db);
  const hasSeasonHistory =
    cached != null &&
    Object.values(cached.profiles).some((p) => p.seasonHistory.length > 0);
  // Self-healing: rows written before the season_history column existed
  // carry no history — refresh once instead of serving them for a day.
  if (
    cached &&
    cached.fresh &&
    hasSeasonHistory &&
    Object.keys(cached.profiles).length > 0
  ) {
    return cached.profiles;
  }

  try {
    const lines = await Promise.all(
      deps.seasons.map((s) => deps.fetchSeasonStats(s))
    );
    const profiles = buildStatProfiles({
      seasons: lines,
      seasonNames: deps.seasons,
      scoring: deps.scoring,
      leaguePicks: deps.leaguePicks,
    });
    // Preserve in-season EMA state across refreshes (a stats refresh
    // must not wipe the game-log updater's work).
    if (cached) {
      for (const [id, p] of Object.entries(cached.profiles)) {
        if (profiles[id] && p.emaGames > 0) {
          profiles[id].emaFppg = p.emaFppg;
          profiles[id].emaGames = p.emaGames;
        }
      }
    }
    await writeCache(deps.db, profiles);
    return profiles;
  } catch {
    // Feed unreachable — serve stale cache if we have it.
    return cached?.profiles ?? {};
  }
}
