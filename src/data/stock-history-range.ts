import type { StockHistoryCursor, StockHistoryRangePage, StockHistoryRangeRequest,
  StockHistoryRecord, HeldStoredEstimate } from "../domain/stock-history-range";
import { getStockHistoryRangeStore, type StockHistoryRangeStore, type StockHistoryRangeRows } from "./stock-history-range-store";

export class StockHistoryRangeError extends Error {
  constructor(message: string, public status: 400 | 409 = 400) { super(message); }
}
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
function day(value: string) {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) ||
      !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value)
    throw new StockHistoryRangeError("Expected a valid YYYY-MM-DD day");
  return value;
}
function timestamp(value: string, kind: string) {
  const pattern = kind === "observed" ? /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}$/ :
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z$/;
  if (!pattern.test(value)) throw new StockHistoryRangeError("Invalid history timestamp");
  // Calendar validation only: this does not assign a timezone to native time.
  const ms = `${value.slice(0, 23)}Z`;
  if (new Date(ms).toISOString() !== ms) throw new StockHistoryRangeError("Invalid history timestamp");
}
const compare = (a: StockHistoryRecord, b: StockHistoryRecord, kind: string) =>
  a.date < b.date ? -1 : a.date > b.date ? 1 :
    kind === "modeled" && a.source !== b.source ? Buffer.compare(Buffer.from(a.source), Buffer.from(b.source)) :
      a.id < b.id ? -1 : a.id > b.id ? 1 : 0;

export function parseStockHistoryRange(playerId: string, url: URL): StockHistoryRangeRequest {
  if (!/^[0-9]{1,20}$/.test(playerId)) throw new StockHistoryRangeError("Invalid player ID");
  const from = day(url.searchParams.get("from") ?? ""), to = day(url.searchParams.get("to") ?? "");
  if (from >= to) throw new StockHistoryRangeError("Expected from < to (exclusive)");
  const kind = url.searchParams.get("kind") ?? "observed";
  if (kind !== "observed" && kind !== "modeled") throw new StockHistoryRangeError("Invalid history kind");
  const rawLimit = url.searchParams.get("limit") ?? "200";
  if (!/^\d{1,3}$/.test(rawLimit) || Number(rawLimit) < 1 || Number(rawLimit) > 250)
    throw new StockHistoryRangeError("Page limit must be 1–250");
  let cursor: StockHistoryCursor | null = null;
  const encoded = url.searchParams.get("cursor");
  if (encoded) {
    try {
      if (encoded.length > 2048 || !/^[A-Za-z0-9_-]+$/.test(encoded)) throw Error();
      cursor = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
      if (!cursor || cursor.v !== 1 || cursor.playerId !== playerId || cursor.from !== from ||
          cursor.to !== to || cursor.kind !== kind ||
          !(cursor.generation === null || typeof cursor.generation === "string" && cursor.generation.length <= 128) ||
          !cursor.last || typeof cursor.last.date !== "string" || !UUID.test(cursor.last.id) ||
          typeof cursor.last.source !== "string" || cursor.last.source.length > 64) throw Error();
      timestamp(cursor.last.date, kind);
      if (cursor.last.date.slice(0, 10) < from || cursor.last.date.slice(0, 10) >= to ||
          (kind === "observed" && cursor.last.source !== "live")) throw Error();
    } catch { throw new StockHistoryRangeError("Invalid or out-of-scope history cursor"); }
  }
  return { playerId, from, to, kind, limit: Number(rawLimit), cursor };
}

function emptyPage(r: StockHistoryRangeRequest, readStatus: StockHistoryRangePage["readStatus"]): StockHistoryRangePage {
  const observed = r.kind === "observed";
  return { version: "stock-history-range-v1", playerId: r.playerId,
    requested: { from: r.from, to: r.to, kind: r.kind }, readStatus, records: [],
    precedingModelAnchor: null, nextCursor: null, hasMore: false, returnedBounds: null,
    provenance: { timestampBasis: observed ? "database-local-unverified" : "UTC",
      generation: null, declaredModelVersion: null,
      consistency: observed ? "best-effort-retained" : "unversioned",
      calibration: observed ? "observed-cents-unchanged" : "stored-model-scale-unvalidated",
      receiptTiming: observed ? "recorded-database-time" : "historical-receipt-unknown" },
    coverage: { status: "unknown", retainedRangeExhausted: false, limitations: observed ?
      ["Existing request-driven writes prune after 30 days; earlier observations may be missing.",
        "Daily observation cadence and source timezone are unverified; range uses native database calendar days."] :
      ["Game/DNP completeness and historical receipt/correction times are not recorded here.",
        "Stored reconstruction cents are model estimates on an unvalidated historical scale."] },
    modeledWindow: { status: observed ? "not-applicable" : "unavailable", from: null, toExclusive: null, intervals: [] } };
}
function validateRows(raw: StockHistoryRangeRows, r: StockHistoryRangeRequest) {
  if (!Array.isArray(raw.records) || raw.records.length > r.limit + 1 || typeof raw.anchorAmbiguous !== "boolean" ||
      !(raw.anchor === null || typeof raw.anchor === "object" && !!raw.anchor) ||
      !(raw.generation === null || typeof raw.generation === "string" && raw.generation.length <= 128) ||
      !(raw.declaredModelVersion === null || typeof raw.declaredModelVersion === "string" && raw.declaredModelVersion.length <= 64))
    throw new Error("Invalid source envelope");
  const rows = raw.anchor ? [raw.anchor, ...raw.records] : raw.records;
  const ids = new Set<string>();
  for (const row of rows) {
    timestamp(row.date, r.kind);
    if (!UUID.test(row.id) || ids.has(row.id) || row.playerId !== r.playerId || !Number.isSafeInteger(row.priceCents) || row.priceCents < 0 ||
        typeof row.source !== "string" || row.source.length > 64 ||
        !(row.season === null || typeof row.season === "string") ||
        (r.kind === "observed" && (row.source !== "live" || row.season !== null))) throw new Error("Invalid source record");
    ids.add(row.id);
  }
  for (let i = 0; i < raw.records.length; i++) {
    const row = raw.records[i];
    if (row.date.slice(0, 10) < r.from || row.date.slice(0, 10) >= r.to ||
        (i > 0 && compare(raw.records[i - 1], row, r.kind) >= 0) ||
        (r.cursor && compare({ ...row, ...r.cursor.last }, row, r.kind) >= 0)) throw new Error("Out-of-range source record");
  }
  if (raw.anchor && (r.kind !== "modeled" || raw.anchor.date >= `${r.to}T00:00:00.000000Z` ||
      (!r.cursor && raw.anchor.date >= `${r.from}T00:00:00.000000Z`) ||
      (r.cursor && compare(raw.anchor, { ...raw.anchor, ...r.cursor.last }, r.kind) > 0))) throw new Error("Invalid preceding anchor");
}

function modeledWindow(r: StockHistoryRangeRequest, raw: StockHistoryRangeRows): StockHistoryRangePage["modeledWindow"] {
  if (r.kind === "observed") return { status: "not-applicable", from: null, toExclusive: null, intervals: [] };
  if (!raw.generation) return { status: "unversioned", from: null, toExclusive: null, intervals: [] };
  const points = raw.anchor ? [raw.anchor, ...raw.records] : raw.records;
  if (raw.anchorAmbiguous || points.some((p, i) => !["gamelog", "backtest"].includes(p.source) || (i > 0 && p.date === points[i - 1].date)))
    return { status: "ambiguous", from: null, toExclusive: null, intervals: [] };
  const from = r.cursor ? raw.records[0]?.date ?? `${r.to}T00:00:00.000000Z` : `${r.from}T00:00:00.000000Z`;
  const to = raw.records[r.limit]?.date ?? `${r.to}T00:00:00.000000Z`;
  const eligible = points.filter(p => p.date < to);
  const boundaries = [from, ...eligible.filter(p => p.date > from).map(p => p.date), to];
  const intervals: HeldStoredEstimate[] = [];
  let index = -1;
  for (let i = 0; i < boundaries.length - 1; i++) {
    const start = boundaries[i];
    if (start >= boundaries[i + 1]) continue;
    while (index + 1 < eligible.length && eligible[index + 1].date <= start) index++;
    const anchor = eligible[index] ?? null;
    intervals.push({ from: start, toExclusive: boundaries[i + 1], anchor, priceCents: anchor?.priceCents ?? null,
      meaning: anchor ? "held-reconstructed-estimate" : "before-first-estimate" });
  }
  return { status: "available", from, toExclusive: to, intervals };
}

export async function getStockHistoryRange(r: StockHistoryRangeRequest,
  deps: { store?: StockHistoryRangeStore | null } = {}): Promise<StockHistoryRangePage> {
  // Validate even direct data-layer callers before SQL creation.
  const url = new URL("https://fixture.invalid/history");
  for (const [key, value] of Object.entries({ from: r.from, to: r.to, kind: r.kind, limit: String(r.limit),
    ...(r.cursor ? { cursor: Buffer.from(JSON.stringify(r.cursor)).toString("base64url") } : {}) })) url.searchParams.set(key, value);
  const request = parseStockHistoryRange(r.playerId, url);
  const store = deps.store === undefined ? getStockHistoryRangeStore() : deps.store;
  if (!store) return emptyPage(request, "unavailable");
  try {
    const raw = await store.read(request);
    validateRows(raw, request);
    if (request.kind === "modeled" && request.cursor && request.cursor.generation !== raw.generation)
      throw new StockHistoryRangeError("Reconstruction changed; restart this history range", 409);
    const page = emptyPage(request, raw.records.length ? "ready" : "empty");
    page.records = raw.records.slice(0, request.limit);
    page.precedingModelAnchor = raw.anchor;
    page.hasMore = raw.records.length > request.limit;
    page.coverage.retainedRangeExhausted = !page.hasMore;
    page.provenance.generation = raw.generation;
    page.provenance.declaredModelVersion = raw.declaredModelVersion;
    if (request.kind === "modeled" && raw.generation) page.provenance.consistency = "publication-generation";
    const last = page.records.at(-1);
    if (last) page.returnedBounds = { first: page.records[0].date, last: last.date };
    if (page.hasMore && last) page.nextCursor = Buffer.from(JSON.stringify({ v: 1, playerId: request.playerId,
      from: request.from, to: request.to, kind: request.kind, generation: raw.generation,
      last: { date: last.date, source: last.source, id: last.id } } satisfies StockHistoryCursor)).toString("base64url");
    page.modeledWindow = modeledWindow(request, raw);
    return page;
  } catch (error) {
    if (error instanceof StockHistoryRangeError && error.status === 409) throw error;
    return emptyPage(request, "error");
  }
}

/** Usable read endpoint; injected store keeps handler/SQL tests entirely offline. */
export async function stockHistoryRangeResponse(playerId: string, url: URL,
  deps: { store?: StockHistoryRangeStore | null } = {}): Promise<Response> {
  try {
    const page = await getStockHistoryRange(parseStockHistoryRange(playerId, url), deps);
    return Response.json(page, { status: page.readStatus === "error" || page.readStatus === "unavailable" ? 503 : 200,
      headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const known = error instanceof StockHistoryRangeError;
    return Response.json({ error: known ? error.message : "History unavailable" }, { status: known ? error.status : 503,
      headers: { "Cache-Control": "no-store" } });
  }
}
