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
 * - Bounds are explicit and apply to the read as a whole: player ids,
 *   a half-open native-day range, a hard per-query row cap, a query
 *   budget and a cumulative row budget. Snapshots are retained
 *   append-only (#224 retention correction), so a window can span
 *   years: one span probe locates the populated span, day-chunks under
 *   the cap page through it, and any cap, budget exhaustion or failed
 *   chunk fails closed (`truncated`, or the error propagates) — a
 *   partial enumeration is never reported as a complete quote set.
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
 * Hard row bound for ONE batched read (one day-chunk). A team's lifetime
 * player scope is bounded by its anchor roster plus its move
 * counterparties and snapshots land at most daily, so a 31-day chunk
 * lands in the low thousands at most. The cap exists to fail closed,
 * not to page; paging happens across chunks, never inside one read.
 */
export const MAX_RECORDED_QUOTE_ROWS = 5000;

/** Days per paged chunk when reading a window (see readWindow). */
export const RECORDED_QUOTE_CHUNK_DAYS = 31;

/**
 * Whole-read budgets for one readWindow call, probe included. The read
 * as a whole — not just each query — is bounded: at most this many
 * queries and this many cumulative rows. Both sit far above any real
 * team window (a two-season populated span is ~25 chunks and, with
 * duplicate batches tolerated, well under 100k rows for one team's
 * scope) and exist so a pathological scope fails closed (`truncated`)
 * instead of enumerating without limit. Records are fixed-shape
 * four-field rows, so the row budget bounds transfer bytes linearly.
 */
export const MAX_RECORDED_QUOTE_QUERIES = 64;
export const MAX_RECORDED_QUOTE_TOTAL_ROWS = 100_000;

/** Add days to a `YYYY-MM-DD` day string (UTC calendar math). */
function addHistoryDays(day: string, days: number): string {
  const ms = Date.parse(`${day}T00:00:00.000Z`);
  if (Number.isNaN(ms)) throw new Error(`Invalid history day: ${day}`);
  return new Date(ms + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/**
 * Split a half-open day window into consecutive half-open chunks of at
 * most RECORDED_QUOTE_CHUNK_DAYS days. ISO day strings compare
 * chronologically, so chunking is pure string/date math. An empty or
 * inverted window yields no chunks.
 */
export function recordedQuoteChunks(request: RecordedQuoteWindow): RecordedQuoteWindow[] {
  const chunks: RecordedQuoteWindow[] = [];
  let fromDay = request.fromDay;
  while (fromDay < request.toDay) {
    const next = addHistoryDays(fromDay, RECORDED_QUOTE_CHUNK_DAYS);
    const toDay = next < request.toDay ? next : request.toDay;
    chunks.push({ playerIds: request.playerIds, fromDay, toDay });
    fromDay = toDay;
  }
  return chunks;
}

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
 * The retained span actually populated inside a requested window: the
 * earliest and latest native snapshot timestamps for the scope, or
 * nulls when the window holds no snapshots. One indexed probe lets
 * readWindow page only the populated span — the empty inception prefix
 * of a multi-year window costs this one query, never one query per
 * empty day or chunk.
 */
export function recordedQuoteSpanQuery(request: RecordedQuoteWindow) {
  const ids = [...new Set(request.playerIds)];
  return sql`
  SELECT jsonb_build_object(
      'earliest', to_char(min(snapshot_at), 'YYYY-MM-DD"T"HH24:MI:SS.US'),
      'latest', to_char(max(snapshot_at), 'YYYY-MM-DD"T"HH24:MI:SS.US')
    ) AS span
  FROM stock_snapshots
  WHERE player_id IN (${sql.join(ids.map(id => sql`${id}`), sql`, `)})
    AND snapshot_at >= ${request.fromDay}::timestamp
    AND snapshot_at < ${request.toDay}::timestamp`;
}

type RecordedQuoteSpan = { earliest: string | null; latest: string | null };

function readSpan(rows: { span?: unknown } | undefined): RecordedQuoteSpan {
  const span = rows?.span;
  if (!span || typeof span !== "object") throw new Error("Missing recorded-quote span envelope");
  const { earliest, latest } = span as Record<string, unknown>;
  const valid = (value: unknown) => value === null || typeof value === "string";
  if (!valid(earliest) || !valid(latest) || (earliest === null) !== (latest === null)) {
    throw new Error("Malformed recorded-quote span envelope");
  }
  return { earliest: earliest as string | null, latest: latest as string | null };
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
        // The read as a whole is bounded (dot's #224 requirement): one
        // span probe, then day-chunks over the POPULATED span only,
        // under a per-chunk row cap, a cumulative row budget and a
        // query budget. Chunks are consecutive and each is ordered
        // (snapshot_at, id), so concatenation preserves the window's
        // global deterministic order, duplicates and timestamp ties
        // included — rows are returned verbatim, never deduplicated.
        // Any cap, budget exhaustion or failed chunk fails the window
        // closed (truncated, or the error propagates to the producer's
        // load-failure path): a partial enumeration is never reported
        // as complete. The { quotes, truncated } contract — and with it
        // the producer's th2 pinned-cutoff/generation semantics — is
        // unchanged.
        let queries = 0;
        const spanResult = await client.execute<{ span: RecordedQuoteSpan }>(recordedQuoteSpanQuery(request));
        queries += 1;
        const span = readSpan(spanResult.rows[0]);
        if (span.earliest === null || span.latest === null) return { quotes: [], truncated: false };
        const fromDay = span.earliest.slice(0, 10) > request.fromDay ? span.earliest.slice(0, 10) : request.fromDay;
        const latestNext = addHistoryDays(span.latest.slice(0, 10), 1);
        const toDay = latestNext < request.toDay ? latestNext : request.toDay;
        const quotes: RecordedQuote[] = [];
        for (const chunk of recordedQuoteChunks({ playerIds: request.playerIds, fromDay, toDay })) {
          if (queries >= MAX_RECORDED_QUOTE_QUERIES) return { quotes, truncated: true };
          const result = await client.execute<{ records: RecordedQuote[] }>(recordedQuoteQuery(chunk));
          queries += 1;
          const rows = result.rows[0];
          if (!rows || !Array.isArray(rows.records)) throw new Error("Missing recorded-quote read envelope");
          if (rows.records.length > MAX_RECORDED_QUOTE_ROWS) {
            quotes.push(...rows.records.slice(0, MAX_RECORDED_QUOTE_ROWS));
            return { quotes, truncated: true };
          }
          quotes.push(...rows.records);
          if (quotes.length > MAX_RECORDED_QUOTE_TOTAL_ROWS) {
            quotes.length = MAX_RECORDED_QUOTE_TOTAL_ROWS;
            return { quotes, truncated: true };
          }
        }
        return { quotes, truncated: false };
      },
    };
  } catch {
    return null;
  }
}
