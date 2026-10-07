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
import { desc, inArray, lt } from "drizzle-orm";
import { getDb, stockSnapshots } from "./db";

/** player_id → prices oldest → newest, capped at 10 points. */
export type PriceHistory = Record<string, number[]>;

const HISTORY_POINTS = 10;
const RETENTION_DAYS = 30;

export type StockStore = {
  getHistory(playerIds: string[]): Promise<PriceHistory>;
  saveSnapshot(prices: Record<string, number>): Promise<void>;
};

class DrizzleStockStore implements StockStore {
  async getHistory(playerIds: string[]): Promise<PriceHistory> {
    if (playerIds.length === 0) return {};
    const db = getDb();
    // Latest snapshot times first, then all rows at those times.
    const times = await db
      .selectDistinct({ at: stockSnapshots.snapshotAt })
      .from(stockSnapshots)
      .orderBy(desc(stockSnapshots.snapshotAt))
      .limit(HISTORY_POINTS);
    if (times.length === 0) return {};
    const rows = await db
      .select()
      .from(stockSnapshots)
      .where(
        inArray(
          stockSnapshots.snapshotAt,
          times.map((t) => t.at)
        )
      )
      .orderBy(stockSnapshots.snapshotAt);
    const wanted = new Set(playerIds);
    const history: PriceHistory = {};
    for (const row of rows) {
      if (!wanted.has(row.playerId)) continue;
      const list = history[row.playerId] ?? [];
      list.push(row.priceCents / 100);
      history[row.playerId] = list;
    }
    return history;
  }

  async saveSnapshot(prices: Record<string, number>): Promise<void> {
    const db = getDb();
    const entries = Object.entries(prices);
    if (entries.length === 0) return;
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
