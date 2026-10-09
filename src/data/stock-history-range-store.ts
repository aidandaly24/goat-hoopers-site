import { sql, type SQL } from "drizzle-orm";
import { getDb, type Db } from "./db";
import type { StockHistoryRangeRequest, StockHistoryRecord } from "../domain/stock-history-range";

export type StockHistoryRangeRows = {
  records: StockHistoryRecord[];
  anchor: StockHistoryRecord | null;
  anchorAmbiguous: boolean;
  generation: string | null;
  declaredModelVersion: string | null;
};
export type StockHistoryRangeStore = {
  read(request: StockHistoryRangeRequest): Promise<StockHistoryRangeRows>;
};

/** Parameterized SELECTs only. One lookahead plus one preceding model anchor.
 * Native observed time remains native; only the timestamptz model date uses UTC. */
export function stockHistoryRangeQuery(r: StockHistoryRangeRequest, withGeneration = true): SQL {
  const last = r.cursor?.last;
  if (r.kind === "observed") {
    const after = last ? sql`AND (snapshot_at, id) > (${last.date}::timestamp, ${last.id}::uuid)` : sql``;
    return sql`WITH page AS (
      SELECT id, player_id AS "playerId", price_cents AS "priceCents",
        to_char(snapshot_at, 'YYYY-MM-DD"T"HH24:MI:SS.US') AS date,
        'live'::text AS source, NULL::text AS season
      FROM stock_snapshots
      WHERE player_id = ${r.playerId} AND snapshot_at >= ${r.from}::date AND snapshot_at < ${r.to}::date
        ${after}
      ORDER BY snapshot_at, id LIMIT ${r.limit + 1}
    ) SELECT COALESCE(jsonb_agg(to_jsonb(page) ORDER BY date COLLATE "C", id), '[]'::jsonb) AS records,
      NULL::jsonb AS anchor, FALSE AS "anchorAmbiguous", NULL::text AS generation,
      NULL::text AS "declaredModelVersion" FROM page`;
  }
  const after = last ? sql`AND (date, source COLLATE "C", id) >
    (${last.date}::timestamptz, ${last.source}::text COLLATE "C", ${last.id}::uuid)` : sql``;
  const before = last ? sql`(date, source COLLATE "C", id) <=
    (${last.date}::timestamptz, ${last.source}::text COLLATE "C", ${last.id}::uuid)` :
    sql`date < ${`${r.from}T00:00:00.000000Z`}::timestamptz`;
  const generation = withGeneration ? sql`(SELECT dataset_id FROM price_history_import_state WHERE id = 'current')` : sql`NULL::text`;
  const model = withGeneration ? sql`(SELECT manifest->>'modelVersion' FROM price_history_import_state WHERE id = 'current')` : sql`NULL::text`;
  return sql`WITH page AS (
    SELECT id, player_id AS "playerId", price_cents AS "priceCents", source, season,
      to_char(date AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS date
    FROM price_history
    WHERE player_id = ${r.playerId} AND date >= ${`${r.from}T00:00:00.000000Z`}::timestamptz
      AND date < ${`${r.to}T00:00:00.000000Z`}::timestamptz ${after}
    ORDER BY price_history.date, source COLLATE "C", id LIMIT ${r.limit + 1}
  ), preceding AS (
    SELECT id, player_id AS "playerId", price_cents AS "priceCents", source, season,
      to_char(date AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS date
    FROM price_history WHERE player_id = ${r.playerId} AND ${before}
    ORDER BY price_history.date DESC, source COLLATE "C" DESC, id DESC LIMIT 1
  ) SELECT (SELECT COALESCE(jsonb_agg(to_jsonb(page) ORDER BY date COLLATE "C", source COLLATE "C", id), '[]'::jsonb) FROM page) AS records,
    (SELECT to_jsonb(preceding) FROM preceding) AS anchor,
    EXISTS (SELECT 1 FROM price_history other JOIN preceding p
      ON other.player_id = p."playerId" AND other.date = p.date::timestamptz AND other.id <> p.id) AS "anchorAmbiguous",
    ${generation} AS generation, ${model} AS "declaredModelVersion"`;
}

function missingManifest(error: unknown): boolean {
  const e = error as { code?: string; message?: string; cause?: unknown };
  return !!e && ((e.code === "42P01" && !!e.message?.includes("price_history_import_state")) ||
    (!!e.cause && e.cause !== error && missingManifest(e.cause)));
}

export function getStockHistoryRangeStore(db?: Db | null): StockHistoryRangeStore | null {
  try {
    if (db === null) return null;
    const client = db ?? getDb();
    return { async read(request) {
      let result;
      try {
        result = await client.execute<StockHistoryRangeRows>(stockHistoryRangeQuery(request));
      } catch (error) {
        // Old installs may retain model rows without a publication table. Still
        // expose their exact records, but never invent a generation or carry.
        if (request.kind !== "modeled" || !missingManifest(error)) throw error;
        result = await client.execute<StockHistoryRangeRows>(stockHistoryRangeQuery(request, false));
      }
      const row = result.rows[0];
      if (!row) throw new Error("Missing history read envelope");
      return row;
    } };
  } catch {
    return null;
  }
}
