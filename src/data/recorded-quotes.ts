/**
 * recorded-quotes.ts — read-only batched adapter over `stock_snapshots`
 * for team-value history (issue #217).
 *
 * Why a new adapter instead of reusing the stock store: the v1 history
 * contract needs each recorded quote's ORIGINAL row id, integer cents and
 * exact native timestamp string as provenance. `StockStore.getSnapshotHistory`
 * drops row ids and round-trips timestamps through JS `Date` (losing the
 * native microsecond string), so it cannot feed the history producer.
 *
 * Conventions, shared with `stock-history-range-store.ts`:
 * - Parameterized SELECTs only; the timestamp leaves Postgres via
 *   `to_char(...)` so no JS Date conversion ever touches it.
 * - `snapshot_at` is timezone-less; the history contract reads it as UTC
 *   (the envelope declares `recordedTimestampConvention: "UTC-assumed"`).
 * - This module NEVER writes. In particular it never calls the market
 *   loader's snapshot-saving path — API reads stay read-only.
 * - Bounds are explicit: player ids, a half-open native-day range and a
 *   hard row cap. Hitting the cap reports `truncated` so the producer can
 *   fail closed instead of admitting a partial quote set.
 */
import { sql, type SQL } from "drizzle-orm";
import { getDb, type Db } from "./db";

/** One recorded modeled quote, exactly as retained in `stock_snapshots`. */
export type RecordedQuote = {
  /** Original `stock_snapshots.id` — the quote's durable provenance id. */
  quoteId: string;
  /** Sleeper player_id. */
  playerId: string;
  /** Price in integer cents — never converted to float dollars here. */
  priceCents: number;
  /**
   * Timezone-less `snapshot_at` rendered by Postgres as
   * `YYYY-MM-DD"T"HH24:MI:SS.US`. Read as UTC by contract convention.
   */
  nativeTimestamp: string;
};

export type RecordedQuoteWindow = {
  playerIds: readonly string[];
  /** Inclusive first native calendar day, `YYYY-MM-DD`. */
  fromDay: string;
  /** Exclusive end native calendar day, `YYYY-MM-DD`. */
  toDay: string;
};

export type RecordedQuoteRows = {
  quotes: RecordedQuote[];
  /** True when the row cap cut the window short — the set is incomplete. */
  truncated: boolean;
};

export type RecordedQuoteStore = {
  readWindow(request: RecordedQuoteWindow): Promise<RecordedQuoteRows>;
};

/**
 * Hard row bound for one batched read. The retained window is at most
 * ~30 daily snapshot runs; a team's lifetime player scope is bounded by
 * its anchor roster plus its move counterparties, so real reads land in
 * the low hundreds. The cap exists to fail closed, not to page.
 */
export const MAX_RECORDED_QUOTE_ROWS = 5000;

/** The batched window query. One lookahead row detects truncation. */
export function recordedQuoteQuery(request: RecordedQuoteWindow, cap = MAX_RECORDED_QUOTE_ROWS): SQL {
  const ids = sql.join([...new Set(request.playerIds)].map(id => sql`${id}`), sql`, `);
  return sql`WITH page AS (
    SELECT id::text AS "quoteId", player_id AS "playerId", price_cents AS "priceCents",
      to_char(snapshot_at, 'YYYY-MM-DD"T"HH24:MI:SS.US') AS "nativeTimestamp"
    FROM stock_snapshots
    WHERE player_id IN (${ids})
      AND snapshot_at >= ${request.fromDay}::timestamp AND snapshot_at < ${request.toDay}::timestamp
    ORDER BY snapshot_at, id
    LIMIT ${cap + 1}
  ) SELECT COALESCE(jsonb_agg(to_jsonb(page) ORDER BY "nativeTimestamp" COLLATE "C", "quoteId"), '[]'::jsonb) AS records
    FROM page`;
}

/**
 * The store to use. Returns null when no database is provisioned — the
 * history producer then reports the recorded source as unavailable
 * rather than inventing a series. An injected Db supports offline tests;
 * explicit null selects no store.
 */
export function getRecordedQuoteStore(db?: Db | null): RecordedQuoteStore | null {
  try {
    if (db === null) return null;
    const client = db ?? getDb();
    return {
      async readWindow(request) {
        if (request.playerIds.length === 0) return { quotes: [], truncated: false };
        const result = await client.execute<{ records: RecordedQuote[] }>(recordedQuoteQuery(request));
        const rows = result.rows[0];
        if (!rows || !Array.isArray(rows.records)) throw new Error("Missing recorded-quote read envelope");
        const quotes = rows.records.slice(0, MAX_RECORDED_QUOTE_ROWS);
        return { quotes, truncated: rows.records.length > MAX_RECORDED_QUOTE_ROWS };
      },
    };
  } catch {
    return null;
  }
}
