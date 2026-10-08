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
import { desc, lt } from "drizzle-orm";
import { getDb, stockSnapshots } from "./db";

/** player_id → prices oldest → newest, capped at 10 points. */
export type PriceHistory = Record<string, number[]>;

const HISTORY_POINTS = 10;
const RETENTION_DAYS = 30;
/**
 * Minimum gap between snapshots. Fundamentals refresh daily (see
 * nba-stats.ts), so anything more frequent is pure write amplification
 * on Neon's free tier. The 5-minute era wrote ~75k rows/day; daily
 * writes ~262 rows/day against a 90-day retention.
 */
const SNAPSHOT_MIN_INTERVAL_MS = 24 * 60 * 60 * 1000;

export type StockStore = {
  getHistory(playerIds: string[]): Promise<PriceHistory>;
  saveSnapshot(prices: Record<string, number>): Promise<void>;
};

class DrizzleStockStore implements StockStore {
  async getHistory(playerIds: string[]): Promise<PriceHistory> {
    if (playerIds.length === 0) return {};
    const db = getDb();
    const wanted = new Set(playerIds);
    // One query: the latest rows overall, grouped per player below.
    // Each snapshot writes one row per priced player, so
    // HISTORY_POINTS × players comfortably covers the window; the
    // per-player cap keeps it exact when the roster shifts.
    //
    // Deliberately not SELECT DISTINCT snapshot_at + IN (...): Postgres
    // timestamps carry microseconds that JS Dates truncate to
    // milliseconds, so a Date round-tripped through the driver never
    // equals the stored value and the IN clause matches nothing.
    const rows = await db
      .select()
      .from(stockSnapshots)
      .orderBy(desc(stockSnapshots.snapshotAt))
      .limit(HISTORY_POINTS * wanted.size);
    const history: PriceHistory = {};
    for (const row of rows) {
      if (!wanted.has(row.playerId)) continue;
      const list = history[row.playerId] ?? [];
      if (list.length >= HISTORY_POINTS) continue;
      list.push(row.priceCents / 100);
      history[row.playerId] = list;
    }
    // Rows arrived newest-first; the contract is oldest → newest.
    for (const id of Object.keys(history)) history[id].reverse();
    return history;
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
