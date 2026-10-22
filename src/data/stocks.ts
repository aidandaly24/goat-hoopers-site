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
import { desc, eq, inArray, sql } from "drizzle-orm";
import { createHash } from "node:crypto";
import type { PriceHistoryPoint, PriceSource } from "@/domain/stock";
import type { PriceHistoryArtifact, PriceHistoryPublicationPlan } from "../domain/price-history-import";
import { validatePriceHistoryArtifact } from "./price-history-artifact";
import { validatePublicationPlan } from "./price-history-plan";
import { getDb, priceHistory, priceHistoryImportState, stockSnapshots, type Db } from "./db";
import { samplePoints, STOCK_CHART_POINTS } from "./stock-history-sampling";
export { samplePoints } from "./stock-history-sampling";

/** player_id → history points; quote reads return at most one live point per ID. */
export type PriceHistory = Record<string, PriceHistoryPoint[]>;

/** Max points per player in the merged sparkline history. */
const HISTORY_POINTS = STOCK_CHART_POINTS;
/** Live snapshots kept in a selected-player chart. */
const LIVE_POINTS = 10;
/** Recorded snapshots kept per player in a batched roster-history read.
 * Snapshots land at most daily (see SNAPSHOT_MIN_INTERVAL_MS) and are
 * retained append-only; this is a DISPLAY window (the latest 40 daily
 * points), not a storage limit — the full retained series is read by
 * the team-history producer through `recorded-quotes.ts`. */
const SNAPSHOT_HISTORY_POINTS = 40;
/**
 * Minimum gap between snapshots. Fundamentals refresh daily (see
 * nba-stats.ts), so anything more frequent is pure write amplification
 * on Neon's free tier. The 5-minute era wrote ~75k rows/day; daily
 * writes ~262 rows/day, retained append-only (see saveSnapshot).
 */
const SNAPSHOT_MIN_INTERVAL_MS = 24 * 60 * 60 * 1000;

const asSource = (s: string): PriceSource =>
  s === "gamelog" ? "gamelog" : "backtest";

export type StockStore = {
  /** At most one latest observed/live baseline per requested player; no reconstruction. */
  getQuoteHistory(playerIds: string[]): Promise<PriceHistory>;
  /** Every retained recorded snapshot for the requested players in one
   * query, oldest → newest per player (capped at SNAPSHOT_HISTORY_POINTS).
   * Recorded points only — never reconstruction. Powers aggregate
   * recorded-history views such as a roster's value trend. */
  getSnapshotHistory(playerIds: string[]): Promise<PriceHistory>;
  saveSnapshot(prices: Record<string, number>): Promise<void>;
  /** Selected-player chart: reconstruction + latest 10 live points; caller reserves its current-quote slot. */
  getPricePath(playerId: string, maxPoints?: number): Promise<PriceHistoryPoint[]>;
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

  async getSnapshotHistory(playerIds: string[]): Promise<PriceHistory> {
    const ids = [...new Set(playerIds)];
    if (ids.length === 0) return {};
    try {
      // The latest-40-per-player bound lives in SQL (row_number over
      // snapshot_at desc, id desc — the same ordering the previous
      // in-memory slice used), so retention growth never inflates this
      // read's transfer: one query returns one jsonb envelope of at
      // most 40 entries per player, ordered player, snapshot_at, id
      // ascending exactly as before. Timestamps ride as native strings
      // (the stock_snapshots UTC convention) and are re-anchored to Z
      // explicitly instead of relying on driver-local parsing. The
      // in-memory slice below stays as a guard with identical
      // semantics, in case a transport ever returns more than the SQL
      // bound.
      const result = await this.db.execute(sql`
        SELECT COALESCE(jsonb_agg(entry ORDER BY player_id, snapshot_at, id), '[]'::jsonb) AS records
        FROM (
          SELECT jsonb_build_object(
              'playerId', player_id,
              'priceCents', price_cents,
              'snapshotAt', to_char(snapshot_at, 'YYYY-MM-DD"T"HH24:MI:SS.US')
            ) AS entry,
            player_id, snapshot_at, id
          FROM (
            SELECT player_id, price_cents, snapshot_at, id,
              row_number() OVER (PARTITION BY player_id ORDER BY snapshot_at DESC, id DESC) AS rn
            FROM ${stockSnapshots}
            WHERE player_id IN (${sql.join(ids.map(id => sql`${id}`), sql`, `)})
          ) ranked
          WHERE rn <= ${SNAPSHOT_HISTORY_POINTS}
        ) bounded`) as unknown as { rows: Array<{ records?: unknown }> };
      const records = result.rows[0]?.records;
      if (!Array.isArray(records)) throw new Error("Missing snapshot-history read envelope");
      const grouped = new Map<string, PriceHistoryPoint[]>();
      for (const record of records) {
        const entry = record as { playerId?: unknown; priceCents?: unknown; snapshotAt?: unknown };
        if (typeof entry.playerId !== "string" || typeof entry.priceCents !== "number"
          || !Number.isFinite(entry.priceCents) || typeof entry.snapshotAt !== "string") {
          throw new Error("Malformed snapshot-history entry");
        }
        const points = grouped.get(entry.playerId) ?? [];
        points.push({
          date: new Date(`${entry.snapshotAt}Z`).toISOString(),
          price: entry.priceCents / 100, source: "live",
        });
        grouped.set(entry.playerId, points);
      }
      return Object.fromEntries([...grouped].map(([id, points]) => [
        id, points.length > SNAPSHOT_HISTORY_POINTS ? points.slice(-SNAPSHOT_HISTORY_POINTS) : points,
      ]));
    } catch {
      // Missing live table/read failure: no recorded history, never a
      // reconstructed fallback.
      return {};
    }
  }

  async getPricePath(playerId: string, maxPoints = HISTORY_POINTS): Promise<PriceHistoryPoint[]> {
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
    return samplePoints(points, maxPoints);
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
    // Append-only: snapshots are the recorded evidence base for team
    // value history (#217/#224 retention correction, Aidan directive
    // 2026-10-22). No write path ever deletes them; storage retention
    // is separate from UI/query windows, and long-range reads page
    // (see recorded-quotes.ts). The pre-correction 30-day prune would
    // have destroyed the recorded span starting 2026-11-07.
  }
}

class NoopStockStore implements StockStore {
  async getQuoteHistory(): Promise<PriceHistory> {
    return {};
  }
  async getSnapshotHistory(): Promise<PriceHistory> {
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
