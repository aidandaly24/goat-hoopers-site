import { describe, expect, it, vi } from "vitest";
import type { SQL } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import type { StockHistoryRangeRequest, StockHistoryRecord } from "../../domain/stock-history-range";
import { getStockHistoryRange, parseStockHistoryRange, stockHistoryRangeResponse } from "../stock-history-range";
import { getStockHistoryRangeStore, stockHistoryRangeQuery, type StockHistoryRangeRows,
  type StockHistoryRangeStore } from "../stock-history-range-store";
import type { Db } from "../db";
import * as rangeStore from "../stock-history-range-store";
import { GET } from "../../app/api/stocks/[playerId]/history/route";

const id = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
const record = (n: number, date: string, kind = "observed"): StockHistoryRecord => ({
  id: id(n), playerId: "2577", date, priceCents: n === 1 ? 0 : 10000 + n,
  source: kind === "observed" ? "live" : "gamelog", season: kind === "observed" ? null : "2025-26" });
const url = (kind = "observed", extras = "") => new URL(`https://fixture.invalid/api/stocks/2577/history?from=2025-01-01&to=2027-01-01&kind=${kind}${extras}`);
const request = (kind = "observed", extras = "") => parseStockHistoryRange("2577", url(kind, extras));
const payload = (records: StockHistoryRecord[] = [], extra: Partial<StockHistoryRangeRows> = {}): StockHistoryRangeRows =>
  ({ records, anchor: null, anchorAmbiguous: false, generation: null, declaredModelVersion: null, ...extra });
const fixed = (raw: StockHistoryRangeRows): StockHistoryRangeStore => ({ read: vi.fn(async () => raw) });
const sql = (r: StockHistoryRangeRequest, generation = true) => new PgDialect().sqlToQuery(stockHistoryRangeQuery(r, generation));

describe("bounded read-only selected-player history", () => {
  it("the actual Next route delegates its selected player/range to the read-only service", async () => {
    const row = record(1, "2026-10-08T01:41:52.100001");
    const store = fixed(payload([row]));
    const factory = vi.spyOn(rangeStore, "getStockHistoryRangeStore").mockReturnValue(store);
    try {
      const response = await GET(new Request(url()), { params: Promise.resolve({ playerId: "2577" }) });
      expect(response.status).toBe(200); expect((await response.json()).records).toEqual([row]);
      expect(store.read).toHaveBeenCalledWith(expect.objectContaining({ playerId: "2577", from: "2025-01-01", kind: "observed" }));
    } finally { factory.mockRestore(); }
  });
  it("the actual route rejects an invalid range before creating a database client", async () => {
    const factory = vi.spyOn(rangeStore, "getStockHistoryRangeStore");
    try {
      const response = await GET(new Request("https://fixture.invalid/api/stocks/2577/history"),
        { params: Promise.resolve({ playerId: "2577" }) });
      expect(response.status).toBe(400); expect(factory).not.toHaveBeenCalled();
    } finally { factory.mockRestore(); }
  });
  it("preserves exact native microseconds, cents, unchanged prices and timestamp ties", async () => {
    const rows = Object.freeze([Object.freeze(record(1, "2026-10-08T01:41:52.104607")),
      Object.freeze({ ...record(2, "2026-10-08T01:41:52.104607"), priceCents: 0 }),
      Object.freeze(record(3, "2026-10-08T01:41:52.104608"))]);
    const before = JSON.stringify(rows);
    const page = await getStockHistoryRange(request(), { store: fixed(payload([...rows])) });
    expect(page.records).toEqual(rows); expect(page.records[0]).toBe(rows[0]);
    expect(page.records.map(r => r.date)).not.toContain("2026-10-08T01:41:52.104Z");
    expect(page.provenance.timestampBasis).toBe("database-local-unverified");
    expect(page.provenance.calibration).toBe("observed-cents-unchanged");
    expect(page.coverage.status).toBe("unknown"); expect(page.coverage.retainedRangeExhausted).toBe(true);
    expect(page.modeledWindow.intervals).toEqual([]); expect(JSON.stringify(rows)).toBe(before);
  });
  it("pages all 501 canonical observations with no repeats, omissions or index sampling", async () => {
    const rows = Array.from({ length: 501 }, (_, i) => record(i + 1, `2026-10-08T01:41:52.${String(i).padStart(6, "0")}`));
    const calls: StockHistoryRangeRequest[] = [];
    const store: StockHistoryRangeStore = { async read(r) {
      calls.push(r); const start = r.cursor ? rows.findIndex(x => x.id === r.cursor!.last.id) + 1 : 0;
      return payload(rows.slice(start, start + r.limit + 1));
    } };
    let next = url(), collected: StockHistoryRecord[] = [];
    for (let i = 0; i < 3; i++) {
      const response = await stockHistoryRangeResponse("2577", next, { store });
      expect(response.status).toBe(200); const page = await response.json(); collected = [...collected, ...page.records];
      expect(page.coverage.status).toBe("unknown");
      if (page.nextCursor) next = url("observed", `&cursor=${page.nextCursor}`); else expect(i).toBe(2);
    }
    expect(collected).toEqual(rows); expect(calls.map(c => c.limit)).toEqual([200, 200, 200]);
  });
  it("binds SQL to one player/range, lookahead limit and native microsecond tuple cursor", () => {
    const r = request("observed", "&limit=250");
    r.cursor = { v: 1, playerId: r.playerId, from: r.from, to: r.to, kind: r.kind, generation: null,
      last: { date: "2026-10-08T01:41:52.104607", id: id(1), source: "live" } };
    const query = sql(r);
    expect(query.sql).toContain("snapshot_at >="); expect(query.sql).toContain("snapshot_at <");
    expect(query.sql).toContain("(snapshot_at, id) >"); expect(query.sql).toContain("ORDER BY snapshot_at, id LIMIT");
    expect(query.params).toContain(251); expect(query.params).toContain(r.cursor.last.date);
    expect(query.params.filter(p => p === "2577")).toHaveLength(1);
    expect(query.sql).toContain("HH24:MI:SS.US"); expect(query.sql).not.toContain("AT TIME ZONE");
    expect(query.sql).not.toMatch(/\b(insert|delete|update|count|offset)\b/i);
    expect(query.sql).not.toContain(r.cursor.last.date);
  });
  it("uses UTC model bounds, source/UUID ties and same-statement generation metadata", () => {
    const r = request("modeled", "&limit=250");
    const query = sql(r);
    expect(query.sql).toContain("date AT TIME ZONE 'UTC'");
    expect(query.sql).toContain('ORDER BY price_history.date, source COLLATE "C", id LIMIT');
    expect(query.sql).toContain('ORDER BY price_history.date DESC, source COLLATE "C" DESC, id DESC LIMIT 1');
    expect(query.sql).toContain("price_history_import_state"); expect(query.sql).toContain("EXISTS");
    expect(query.params).toContain("2025-01-01T00:00:00.000000Z"); expect(query.params).toContain(251);
    expect(query.sql).not.toMatch(/\b(insert|delete|update|count|offset)\b/i);
  });
  it("carries a preceding stored estimate through a range with no updates, without synthetic observations", async () => {
    const anchor = record(2, "2024-12-31T00:00:00.000000Z", "modeled");
    const page = await getStockHistoryRange(request("modeled"), { store: fixed(payload([], {
      anchor, generation: "fixture-generation", declaredModelVersion: "v2" })) });
    expect(page.readStatus).toBe("empty"); expect(page.modeledWindow.status).toBe("available");
    expect(page.modeledWindow.intervals).toEqual([{ from: "2025-01-01T00:00:00.000000Z",
      toExclusive: "2027-01-01T00:00:00.000000Z", priceCents: anchor.priceCents,
      anchor, meaning: "held-reconstructed-estimate" }]);
    expect(page.records).toEqual([]); expect(page.precedingModelAnchor).toBe(anchor);
    expect(page.provenance.receiptTiming).toBe("historical-receipt-unknown");
  });
  it("stops carried intervals before an unseen next-page update", async () => {
    const rows = [record(1, "2025-02-01T00:00:00.000000Z", "modeled"),
      record(2, "2025-03-01T00:00:00.000000Z", "modeled")];
    const first = await getStockHistoryRange(request("modeled", "&limit=1"), {
      store: fixed(payload(rows, { generation: "g", declaredModelVersion: "v2" })) });
    expect(first.records).toEqual([rows[0]]); expect(first.hasMore).toBe(true);
    expect(first.modeledWindow.toExclusive).toBe(rows[1].date);
    expect(first.modeledWindow.intervals[0].priceCents).toBeNull();
    expect(first.modeledWindow.intervals.at(-1)?.toExclusive).toBe(rows[1].date);
    const second = await getStockHistoryRange(request("modeled", `&limit=1&cursor=${first.nextCursor}`), {
      store: fixed(payload([rows[1]], { anchor: rows[0], generation: "g", declaredModelVersion: "v2" })) });
    expect(second.modeledWindow.from).toBe(rows[1].date);
    expect(second.modeledWindow.intervals[0].priceCents).toBe(rows[1].priceCents);
  });
  it.each(["same-time", "anchor-conflict", "unsupported-source"])("keeps exact records but disables ambiguous carry: %s", async (scenario) => {
    const a = record(1, "2025-03-01T00:00:00.000000Z", "modeled");
    const b = { ...record(2, a.date, "modeled"), source: "backtest" };
    const raw = scenario === "same-time" ? payload([b, a]) : scenario === "anchor-conflict" ?
      payload([a], { anchor: record(3, "2024-12-31T00:00:00.000000Z", "modeled"), anchorAmbiguous: true }) :
      payload([{ ...a, source: "unrecognized" }]);
    raw.generation = "g";
    const page = await getStockHistoryRange(request("modeled"), { store: fixed(raw) });
    expect(page.records).toEqual(raw.records); expect(page.modeledWindow.status).toBe("ambiguous");
    expect(page.modeledWindow.intervals).toEqual([]);
  });
  it("expires a cursor across a repaired generation instead of mixing prices", async () => {
    const rows = [record(1, "2025-02-01T00:00:00.000000Z", "modeled"), record(2, "2025-03-01T00:00:00.000000Z", "modeled")];
    const first = await getStockHistoryRange(request("modeled", "&limit=1"), { store: fixed(payload(rows, { generation: "old" })) });
    const response = await stockHistoryRangeResponse("2577", url("modeled", `&limit=1&cursor=${first.nextCursor}`), {
      store: fixed(payload([rows[1]], { anchor: rows[0], generation: "new" })) });
    expect(response.status).toBe(409); expect((await response.json()).error).toContain("restart");
  });
  it("does not claim complete coverage or fabricate carry for unversioned models", async () => {
    const row = record(1, "2025-03-01T00:00:00.000000Z", "modeled");
    const page = await getStockHistoryRange(request("modeled"), { store: fixed(payload([row])) });
    expect(page.records).toEqual([row]); expect(page.modeledWindow.status).toBe("unversioned");
    expect(page.coverage.status).toBe("unknown"); expect(page.coverage.retainedRangeExhausted).toBe(true);
    expect(page.provenance.consistency).toBe("unversioned");
  });
  it.each([null, "failed", "empty"])("distinguishes storage/read failure from an empty retained range: %s", async (mode) => {
    const store = mode === null ? null : mode === "failed" ? { read: vi.fn(async () => { throw Error("private DB details"); }) } : fixed(payload());
    const response = await stockHistoryRangeResponse("2577", url(), { store });
    const page = await response.json();
    expect(response.status).toBe(mode === "empty" ? 200 : 503);
    expect(page.readStatus).toBe(mode === null ? "unavailable" : mode === "failed" ? "error" : "empty");
    expect(page.coverage.retainedRangeExhausted).toBe(mode === "empty");
    expect(JSON.stringify(page)).not.toContain("private DB details"); expect(response.headers.get("Cache-Control")).toBe("no-store");
  });
  it.each(["&limit=251", "&limit=0", "&limit=1.5", "&from=bad", "&to=2025-01-01", "&from=2025-02-30", "&cursor=garbage"])("rejects invalid requests before any store read: %s", async (extra) => {
    const store = fixed(payload()); const u = url();
    for (const [key, value] of new URLSearchParams(extra.slice(1))) u.searchParams.set(key, value);
    expect((await stockHistoryRangeResponse("2577", u, { store })).status).toBe(400); expect(store.read).not.toHaveBeenCalled();
  });
  it("binds cursor scope and rejects invalid IDs, changed ranges and cross-source reuse", async () => {
    const rows = [record(1, "2026-10-08T01:41:52.100001"), record(2, "2026-10-08T01:41:52.100002")];
    const page = await getStockHistoryRange(request("observed", "&limit=1"), { store: fixed(payload(rows)) });
    const store = fixed(payload());
    const differentRange = url("observed", `&cursor=${page.nextCursor}`); differentRange.searchParams.set("from", "2026-01-01");
    for (const [player, u] of [["bad' ID", url()], ["999", url("observed", `&cursor=${page.nextCursor}`)],
      ["2577", url("modeled", `&cursor=${page.nextCursor}`)], ["2577", differentRange]] as const)
      expect((await stockHistoryRangeResponse(player, u, { store })).status).toBe(400);
    expect(store.read).not.toHaveBeenCalled();
  });
  it("rejects malformed, wrong-player, out-of-range, unordered and over-budget source envelopes", async () => {
    const row = record(1, "2026-10-08T01:41:52.100001");
    for (const raw of [payload([{ ...row, playerId: "999" }]), payload([{ ...row, date: "2027-01-01T00:00:00.000000" }]),
      payload([{ ...row, priceCents: -1 }]), payload([{ ...row, date: `${row.date}Z` }]),
      payload([row, row]), payload([record(2, "2026-10-08T01:41:52.100002"), row]),
      payload(Array.from({ length: 202 }, () => row))])
      expect((await getStockHistoryRange(request(), { store: fixed(raw) })).readStatus).toBe("error");
  });
  it("concrete store executes SELECT only and degrades solely for a missing manifest table", async () => {
    const envelope = payload([record(1, "2026-10-08T01:41:52.100001")]);
    const queries: SQL[] = [];
    const execute = vi.fn(async (query: SQL) => { queries.push(query); return { rows: [envelope] }; });
    const db = { execute, insert: vi.fn(), update: vi.fn(), delete: vi.fn() };
    expect(await getStockHistoryRangeStore(db as unknown as Db)!.read(request())).toBe(envelope);
    expect(execute).toHaveBeenCalledTimes(1); expect(db.insert).not.toHaveBeenCalled(); expect(db.delete).not.toHaveBeenCalled();
    const missing = Object.assign(Error('relation "price_history_import_state" does not exist'), { code: "42P01" });
    execute.mockRejectedValueOnce(missing);
    await getStockHistoryRangeStore(db as unknown as Db)!.read(request("modeled"));
    expect(new PgDialect().sqlToQuery(queries.at(-1)!).sql).not.toContain("price_history_import_state");
    execute.mockRejectedValueOnce(Error("network failure"));
    await expect(getStockHistoryRangeStore(db as unknown as Db)!.read(request("modeled"))).rejects.toThrow("network failure");
    expect(getStockHistoryRangeStore(null)).toBeNull();
  });
});
