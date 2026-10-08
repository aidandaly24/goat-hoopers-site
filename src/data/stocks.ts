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

/** player_id → history points; quote reads return at most one live point per ID. */
export type PriceHistory = Record<string, PriceHistoryPoint[]>;

/** Max points per player in the merged sparkline history. */
const HISTORY_POINTS = 40;
/** Live snapshots kept in a selected-player chart. */
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
  /** At most one latest observed/live baseline per requested player; no reconstruction. */
  getQuoteHistory(playerIds: string[]): Promise<PriceHistory>;
  saveSnapshot(prices: Record<string, number>): Promise<void>;
  /** Selected-player chart: reconstruction + latest 10 live points, sampled to 40. */
  getPricePath(playerId: string): Promise<PriceHistoryPoint[]>;
};

class DrizzleStockStore implements StockStore {
  constructor(private readonly db: Db) {}

  async getQuoteHistory(playerIds: string[]): Promise<PriceHistory> {
    const ids = [...new Set(playerIds)];
    if (ids.length === 0) return {};
    try {
      // SQL selects one row per requested player before transfer. Timestamp
      // ordering stays in Postgres (including microseconds); UUID breaks ties.
      const rows = await this.db
        .selectDistinctOn([stockSnapshots.playerId], {
          playerId: stockSnapshots.playerId,
          priceCents: stockSnapshots.priceCents,
          snapshotAt: stockSnapshots.snapshotAt,
        })
        .from(stockSnapshots)
        .where(inArray(stockSnapshots.playerId, ids))
        .orderBy(stockSnapshots.playerId, desc(stockSnapshots.snapshotAt), desc(stockSnapshots.id));
      return Object.fromEntries(rows.map(row => [row.playerId, [{
        date: row.snapshotAt.toISOString(), price: row.priceCents / 100, source: "live",
      }]]));
    } catch {
      // Missing live table/read failure: no baseline, never reconstructed fallback.
      return {};
    }
  }

  async getPricePath(playerId: string): Promise<PriceHistoryPoint[]> {
    const points: PriceHistoryPoint[] = [];
    try {
      const recon = await this.db
        .select({ date: priceHistory.date, priceCents: priceHistory.priceCents, source: priceHistory.source })
        .from(priceHistory)
        .where(eq(priceHistory.playerId, playerId))
        .orderBy(priceHistory.date, priceHistory.source, priceHistory.id);
      for (const row of recon) {
        points.push({ date: row.date.toISOString(), price: row.priceCents / 100, source: asSource(row.source) });
      }
    } catch {
      // Reconstruction missing — retain the observed path if available.
    }
    try {
      const live = await this.db
        .select({ snapshotAt: stockSnapshots.snapshotAt, priceCents: stockSnapshots.priceCents })
        .from(stockSnapshots)
        .where(eq(stockSnapshots.playerId, playerId))
        .orderBy(desc(stockSnapshots.snapshotAt), desc(stockSnapshots.id))
        .limit(LIVE_POINTS);
      for (const row of live.reverse()) {
        points.push({ date: row.snapshotAt.toISOString(), price: row.priceCents / 100, source: "live" });
      }
    } catch {
      // Live table missing — chart estimates remain source-labelled.
    }
    return samplePoints(points, HISTORY_POINTS);
  }

  async saveSnapshot(prices: Record<string, number>): Promise<void> {
    const db = this.db;
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
  async getQuoteHistory(): Promise<PriceHistory> {
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
 * An injected Db supports offline clients; explicit null selects the no-op store.
 */
export function getStockStore(db?: Db | null): StockStore {
  try {
    return db === null ? new NoopStockStore() : new DrizzleStockStore(db ?? getDb());
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
