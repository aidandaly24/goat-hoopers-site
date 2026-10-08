/**
 * stocks.ts — price-history persistence for the player stock market.
 *
 * The valuation engine (`computeStockMarket` in `transform.ts`) is pure: it
 * takes the previous prices as an input. This module is the impure shell
 * around that seam — it loads price history from Postgres and saves the
 * new snapshot after each computation.
 *
 * Resilience contract (rule: the site renders with partial data, never
 * crashes): when the database isn't provisioned, `getStockStore()` returns
 * a no-op store. The market still computes live prices; change % and the
 * movers sections simply show their "no history yet" states.
 */
import { desc, eq, inArray, lt, sql } from "drizzle-orm";
import { createHash } from "node:crypto";
import type { PriceHistoryPoint, PriceSource } from "@/domain/stock";
import type { PriceHistoryArtifact, PriceHistoryPublicationPlan } from "../domain/price-history-import";
import { validatePriceHistoryArtifact } from "./price-history-artifact";
import { validatePublicationPlan } from "./price-history-plan";
import { getDb, priceHistory, priceHistoryImportState, stockSnapshots, type Db } from "./db";

/** player_id → price points oldest → newest, sampled for sparklines. */
export type PriceHistory = Record<string, PriceHistoryPoint[]>;

/** Max points per player in the merged sparkline history. */
const HISTORY_POINTS = 40;
/** Live snapshots kept per player (unchanged behavior). */
const LIVE_POINTS = 10;
const RETENTION_DAYS = 30;
/**
 * Minimum gap between snapshots. Fundamentals refresh daily (see
 * nba-stats.ts), so anything more frequent is pure write amplification
 * on Neon's free tier. The 5-minute era wrote ~75k rows/day; daily
 * writes ~262 rows/day against a 30-day retention.
 */
const SNAPSHOT_MIN_INTERVAL_MS = 24 * 60 * 60 * 1000;

const asSource = (s: string): PriceSource =>
  s === "gamelog" ? "gamelog" : "backtest";

/**
 * Evenly sample points down to `max`, always keeping first and last.
 * A 120px sparkline can't show 400 games; the shape survives sampling.
 */
export function samplePoints(
  points: PriceHistoryPoint[],
  max: number
): PriceHistoryPoint[] {
  if (points.length <= max) return points;
  const out: PriceHistoryPoint[] = [points[0]];
  const step = (points.length - 1) / (max - 1);
  for (let i = 1; i < max - 1; i++) {
    out.push(points[Math.round(i * step)]);
  }
  out.push(points[points.length - 1]);
  return out;
}

export type StockStore = {
  getHistory(playerIds: string[]): Promise<PriceHistory>;
  saveSnapshot(prices: Record<string, number>): Promise<void>;
  /** Full-resolution price path for one player (detail view). */
  getPricePath(playerId: string): Promise<PriceHistoryPoint[]>;
};

class DrizzleStockStore implements StockStore {
  async getHistory(playerIds: string[]): Promise<PriceHistory> {
    if (playerIds.length === 0) return {};
    const db = getDb();
    const wanted = new Set(playerIds);
    const history: PriceHistory = {};

    // Reconstructed history: gamelog dense points + backtest yearly points.
    // Filtered to wanted players in SQL — the backfill writes one row per
    // player per game (~100k+ rows), and fetching the whole table per page
    // load would be a Neon free-tier tax on every market view.
    try {
      const recon = await db
        .select()
        .from(priceHistory)
        .where(inArray(priceHistory.playerId, playerIds))
        .orderBy(priceHistory.date);
      for (const row of recon) {
        if (!wanted.has(row.playerId)) continue;
        const list = history[row.playerId] ?? [];
        list.push({
          date: row.date.toISOString(),
          price: row.priceCents / 100,
          source: asSource(row.source),
        });
        history[row.playerId] = list;
      }
    } catch {
      // Table missing (not yet provisioned) — fall through to live only.
    }

    // Live snapshots, newest-first from the store, appended after.
    // Each snapshot writes one row per priced player, so
    // LIVE_POINTS × players comfortably covers the window.
    //
    // Deliberately not SELECT DISTINCT snapshot_at + IN (...): Postgres
    // timestamps carry microseconds that JS Dates truncate to
    // milliseconds, so a Date round-tripped through the driver never
    // equals the stored value and the IN clause matches nothing.
    const rows = await db
      .select({
        playerId: stockSnapshots.playerId,
        priceCents: stockSnapshots.priceCents,
        snapshotAt: stockSnapshots.snapshotAt,
      })
      .from(stockSnapshots)
      .orderBy(desc(stockSnapshots.snapshotAt))
      .limit(LIVE_POINTS * wanted.size);
    const live: PriceHistory = {};
    for (const row of rows) {
      if (!wanted.has(row.playerId)) continue;
      const list = live[row.playerId] ?? [];
      if (list.length >= LIVE_POINTS) continue;
      list.push({
        date: row.snapshotAt.toISOString(),
        price: row.priceCents / 100,
        source: "live" as PriceSource,
      });
      live[row.playerId] = list;
    }
    for (const id of Object.keys(live)) live[id].reverse(); // oldest → newest

    // Merge: reconstructed path first, then live snapshots, sampled.
    for (const id of Object.keys(live)) {
      const merged = [...(history[id] ?? []), ...live[id]];
      history[id] = samplePoints(merged, HISTORY_POINTS);
    }
    // Players with reconstructed history but no live snapshots yet.
    for (const id of Object.keys(history)) {
      history[id] = samplePoints(history[id], HISTORY_POINTS);
    }
    return history;
  }

  async getPricePath(playerId: string): Promise<PriceHistoryPoint[]> {
    const db = getDb();
    const points: PriceHistoryPoint[] = [];
    try {
      const recon = await db
        .select()
        .from(priceHistory)
        .where(eq(priceHistory.playerId, playerId))
        .orderBy(priceHistory.date);
      for (const row of recon) {
        points.push({
          date: row.date.toISOString(),
          price: row.priceCents / 100,
          source: asSource(row.source),
        });
      }
    } catch {
      // Table missing — live only.
    }
    const live = await db
      .select()
      .from(stockSnapshots)
      .where(eq(stockSnapshots.playerId, playerId))
      .orderBy(stockSnapshots.snapshotAt);
    for (const row of live) {
      points.push({
        date: row.snapshotAt.toISOString(),
        price: row.priceCents / 100,
        source: "live",
      });
    }
    return points;
  }

  async saveSnapshot(prices: Record<string, number>): Promise<void> {
    const db = getDb();
    const entries = Object.entries(prices);
    if (entries.length === 0) return;
    // Throttle: skip the write when the latest snapshot is still fresh.
    const [latest] = await db
      .select({ at: stockSnapshots.snapshotAt })
      .from(stockSnapshots)
      .orderBy(desc(stockSnapshots.snapshotAt))
      .limit(1);
    if (latest && Date.now() - latest.at.getTime() < SNAPSHOT_MIN_INTERVAL_MS) {
      return;
    }
    await db.insert(stockSnapshots).values(
      entries.map(([playerId, price]) => ({
        playerId,
        priceCents: Math.round(price * 100),
      }))
    );
    // Prune anything older than the retention window.
    const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
    await db.delete(stockSnapshots).where(lt(stockSnapshots.snapshotAt, cutoff));
  }
}

class NoopStockStore implements StockStore {
  async getHistory(): Promise<PriceHistory> {
    return {};
  }
  async getPricePath(): Promise<PriceHistoryPoint[]> {
    return [];
  }
  async saveSnapshot(): Promise<void> {
    // No database provisioned — the market runs without history.
  }
}

/**
 * The store to use. Never throws: without DATABASE_URL this returns the
 * no-op store and the market degrades to live-prices-only mode.
 */
export function getStockStore(): StockStore {
  try {
    getDb();
    return new DrizzleStockStore();
  } catch {
    return new NoopStockStore();
  }
}

/** Atomically replace only reconstructed points and their publication manifest. */
export async function publishReconstructedPoints(db: Db, artifact: PriceHistoryArtifact, plan: PriceHistoryPublicationPlan): Promise<void> {
  validatePriceHistoryArtifact(artifact);
  validatePublicationPlan(plan, artifact);
  // Neon HTTP batch uses one transaction. The advisory lock serializes
  // publications; readers keep the old committed generation on any failure.
  type ImportQuery = Parameters<Db["batch"]>[0][number];
  const queries: [ImportQuery, ...ImportQuery[]] = [
    db.execute(sql`SELECT pg_advisory_xact_lock(138747, 38)`),
    // Abort if the reconstructed rows changed since the retained backup/plan.
    // Built-in md5 is a drift check; the reviewed artifact/backup use SHA-256.
    db.execute(sql`SELECT 1 / CASE WHEN (
      SELECT md5(COALESCE(string_agg(player_id || '|' ||
        to_char(date AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') || '|' ||
        price_cents::text || '|' || source || '|' || season || chr(10), ''
        ORDER BY player_id COLLATE "C", date, source COLLATE "C"), ''))
      FROM price_history WHERE source IN ('gamelog', 'backtest')
    ) = ${plan.reconstructedFingerprint} THEN 1 ELSE 0 END`),
    db.delete(priceHistory).where(sql`${priceHistory.source} IN ('gamelog', 'backtest')`),
  ];
  for (let i = 0; i < artifact.points.length; i += 500) {
    queries.push(db.insert(priceHistory).values(artifact.points.slice(i, i + 500).map(p => {
      const hash = createHash("sha256").update(`${artifact.manifest.datasetId}|${p.playerId}|${p.date}|${p.source}`).digest("hex");
      return { ...p, date: new Date(p.date), id: `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}` };
    })));
  }
  queries.push(db.insert(priceHistoryImportState).values({ id: "current", datasetId: artifact.manifest.datasetId, manifest: artifact.manifest })
    .onConflictDoUpdate({ target: priceHistoryImportState.id, set: { datasetId: artifact.manifest.datasetId, manifest: artifact.manifest, completedAt: new Date() } }));
  await db.batch(queries);
}
