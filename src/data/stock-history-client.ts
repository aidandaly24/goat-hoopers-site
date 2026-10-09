import type { StockHistoryKind, StockHistoryRangePage, StockHistoryRecord } from "../domain/stock-history-range";

export type StockHistoryPageQuery = {
  from: string;
  to: string;
  kind: StockHistoryKind;
  cursor?: string;
  limit?: number;
};
export type LoadStockHistoryPage = (
  playerId: string, query: StockHistoryPageQuery, signal?: AbortSignal,
) => Promise<StockHistoryRangePage>;

/** 409 requires a fresh modeled sequence; 503 retains source availability detail. */
export class StockHistoryClientError extends Error {
  constructor(readonly status: number, readonly page: StockHistoryRangePage | null = null) {
    super(status === 409 ? "History changed; restart this range" :
      status === 400 ? "Invalid history request" : "History is unavailable");
    this.name = "StockHistoryClientError";
  }
}

const object = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;
const nullableString = (v: unknown) => v === null || typeof v === "string";

function isPage(v: unknown, playerId: string, q: StockHistoryPageQuery, limit: number): v is StockHistoryRangePage {
  const basis = q.kind === "observed" ? "database-local-unverified" : "UTC";
  const record = (r: unknown): r is StockHistoryRecord => object(r) && typeof r.id === "string" &&
    r.playerId === playerId && typeof r.date === "string" &&
    (q.kind === "observed" ? /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}$/ :
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z$/).test(r.date) &&
    Number.isSafeInteger(r.priceCents) && (r.priceCents as number) >= 0 &&
    typeof r.source === "string" && nullableString(r.season);
  return object(v) && v.version === "stock-history-range-v1" && v.playerId === playerId &&
    object(v.requested) && v.requested.from === q.from && v.requested.to === q.to && v.requested.kind === q.kind &&
    ["ready", "empty", "unavailable", "error"].includes(String(v.readStatus)) &&
    Array.isArray(v.records) && v.records.length <= limit && v.records.every(record) &&
    (v.precedingModelAnchor === null || record(v.precedingModelAnchor)) &&
    typeof v.hasMore === "boolean" && nullableString(v.nextCursor) &&
    (v.hasMore ? typeof v.nextCursor === "string" && v.nextCursor.length > 0 : v.nextCursor === null) &&
    (v.returnedBounds === null || object(v.returnedBounds) && typeof v.returnedBounds.first === "string" && typeof v.returnedBounds.last === "string") &&
    object(v.provenance) && v.provenance.timestampBasis === basis && nullableString(v.provenance.generation) &&
    nullableString(v.provenance.declaredModelVersion) && typeof v.provenance.consistency === "string" &&
    typeof v.provenance.calibration === "string" && typeof v.provenance.receiptTiming === "string" &&
    object(v.coverage) && v.coverage.status === "unknown" && typeof v.coverage.retainedRangeExhausted === "boolean" &&
    Array.isArray(v.coverage.limitations) && v.coverage.limitations.every(x => typeof x === "string") &&
    object(v.modeledWindow) && ["available", "not-applicable", "unversioned", "ambiguous", "unavailable"].includes(String(v.modeledWindow.status)) &&
    nullableString(v.modeledWindow.from) && nullableString(v.modeledWindow.toExclusive) &&
    Array.isArray(v.modeledWindow.intervals) && v.modeledWindow.intervals.every(i => object(i) &&
      typeof i.from === "string" && typeof i.toExclusive === "string" &&
      (i.priceCents === null || Number.isSafeInteger(i.priceCents) && (i.priceCents as number) >= 0) &&
      (i.anchor === null || record(i.anchor)) && ["held-reconstructed-estimate", "before-first-estimate"].includes(String(i.meaning)));
}

/** One same-origin page on demand. No polling, caching, normalization or server imports. */
export async function fetchStockHistoryPage(playerId: string, query: StockHistoryPageQuery,
  signal?: AbortSignal, fetcher: typeof fetch = fetch): Promise<StockHistoryRangePage> {
  const limit = query.limit ?? 200;
  if (!/^[0-9]{1,20}$/.test(playerId) || !/^\d{4}-\d{2}-\d{2}$/.test(query.from) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(query.to) || query.from >= query.to ||
      !["observed", "modeled"].includes(query.kind) || !Number.isInteger(limit) || limit < 1 || limit > 250 ||
      (query.cursor !== undefined && (!/^[A-Za-z0-9_-]+$/.test(query.cursor) || query.cursor.length > 2048)))
    throw new StockHistoryClientError(400);
  const params = new URLSearchParams({ from: query.from, to: query.to, kind: query.kind, limit: String(limit) });
  if (query.cursor) params.set("cursor", query.cursor);
  const response = await fetcher(`/api/stocks/${playerId}/history?${params}`, { method: "GET", cache: "no-store", signal });
  if (response.status === 409) throw new StockHistoryClientError(409);
  let value: unknown;
  try { value = await response.json(); } catch { throw new StockHistoryClientError(response.ok ? 503 : response.status); }
  const page = isPage(value, playerId, query, limit) ? value : null;
  if (!response.ok) throw new StockHistoryClientError(response.status, page);
  if (!page || !["ready", "empty"].includes(page.readStatus)) throw new StockHistoryClientError(503, page);
  return page;
}
