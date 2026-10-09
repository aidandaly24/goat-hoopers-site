import { describe, expect, it, vi } from "vitest";
import type { StockHistoryRangePage } from "../../domain/stock-history-range";
import { fetchStockHistoryPage, StockHistoryClientError } from "../stock-history-client";

const query = { from: "2025-01-01", to: "2027-01-01", kind: "observed" as const };
const page = (): StockHistoryRangePage => ({ version: "stock-history-range-v1", playerId: "2577", requested: query,
  readStatus: "ready", records: [
    { id: "a", playerId: "2577", date: "2026-10-08T01:41:52.104607", priceCents: 8438, source: "live", season: null },
    { id: "b", playerId: "2577", date: "2026-10-08T01:41:52.104607", priceCents: 8438, source: "live", season: null }],
  precedingModelAnchor: null, nextCursor: "fixture_cursor", hasMore: true,
  returnedBounds: { first: "2026-10-08T01:41:52.104607", last: "2026-10-08T01:41:52.104607" },
  provenance: { timestampBasis: "database-local-unverified", generation: null, declaredModelVersion: null,
    consistency: "best-effort-retained", calibration: "observed-cents-unchanged", receiptTiming: "recorded-database-time" },
  coverage: { status: "unknown", retainedRangeExhausted: false, limitations: ["Earlier observations may be missing"] },
  modeledWindow: { status: "not-applicable", from: null, toExclusive: null, intervals: [] } });
const fetcher = (value: unknown, status = 200) => vi.fn(async () => Response.json(value, { status })) as unknown as typeof fetch;

describe("browser retained-history page client", () => {
  it("loads only the requested same-origin page and preserves cents, ties, microseconds and qualifiers", async () => {
    const body = page(), get = fetcher(body), signal = new AbortController().signal;
    const loaded = await fetchStockHistoryPage("2577", { ...query, cursor: "opaque_cursor" }, signal, get);
    expect(get).toHaveBeenCalledOnce();
    expect(get).toHaveBeenCalledWith("/api/stocks/2577/history?from=2025-01-01&to=2027-01-01&kind=observed&limit=200&cursor=opaque_cursor",
      { method: "GET", cache: "no-store", signal });
    expect(loaded).toEqual(body); expect(loaded.records).toHaveLength(2);
    // A supplied next cursor never triggers automatic pagination.
    expect(loaded.hasMore).toBe(true); expect(get).toHaveBeenCalledOnce();
  });
  it("preserves modeled anchors and held intervals without recalculation", async () => {
    const body = page(); body.requested = { ...query, kind: "modeled" };
    body.records = body.records.slice(0, 1).map(r => ({ ...r, date: `${r.date}Z`, source: "gamelog", season: "2025-26" }));
    body.provenance = { timestampBasis: "UTC", generation: "fixture-v1", declaredModelVersion: "fixture",
      consistency: "publication-generation", calibration: "stored-model-scale-unvalidated", receiptTiming: "historical-receipt-unknown" };
    body.modeledWindow = { status: "available", from: body.records[0].date, toExclusive: "2026-10-09T00:00:00.000000Z",
      intervals: [{ from: body.records[0].date, toExclusive: "2026-10-09T00:00:00.000000Z", anchor: body.records[0], priceCents: 8438, meaning: "held-reconstructed-estimate" }] };
    expect(await fetchStockHistoryPage("2577", body.requested, undefined, fetcher(body))).toEqual(body);
  });
  it("distinguishes successful empty, unavailable and failed source reads", async () => {
    const body = page(); body.records = []; body.readStatus = "empty";
    body.hasMore = false; body.nextCursor = null; body.returnedBounds = null; body.coverage.retainedRangeExhausted = true;
    expect((await fetchStockHistoryPage("2577", query, undefined, fetcher(body))).readStatus).toBe("empty");
    for (const readStatus of ["unavailable", "error"] as const) {
      const failed = { ...body, readStatus };
      await expect(fetchStockHistoryPage("2577", query, undefined, fetcher(failed, 503)))
        .rejects.toMatchObject({ status: 503, page: failed });
    }
  });
  it("makes generation409 an explicit restart error without retrying or reading its body", async () => {
    const get = fetcher({ error: "Reconstruction changed" }, 409);
    await expect(fetchStockHistoryPage("2577", query, undefined, get))
      .rejects.toMatchObject({ name: "StockHistoryClientError", status: 409, page: null });
    expect(get).toHaveBeenCalledOnce();
  });
  it("rejects wrong-player, wrong-range and incompatible timestamp-basis payloads", async () => {
    for (const body of [{ ...page(), playerId: "other" }, { ...page(), requested: { ...query, to: "2028-01-01" } },
      { ...page(), provenance: { ...page().provenance, timestampBasis: "UTC" } }])
      await expect(fetchStockHistoryPage("2577", query, undefined, fetcher(body))).rejects.toMatchObject({ status: 503 });
  });
  it("rejects an invalid request before fetching and propagates cancellation", async () => {
    const get = fetcher(page());
    await expect(fetchStockHistoryPage("2577", { ...query, limit: 251 }, undefined, get)).rejects.toBeInstanceOf(StockHistoryClientError);
    expect(get).not.toHaveBeenCalled();
    const aborted = new DOMException("Aborted", "AbortError");
    const cancel = vi.fn(async () => { throw aborted; }) as unknown as typeof fetch;
    await expect(fetchStockHistoryPage("2577", query, new AbortController().signal, cancel)).rejects.toBe(aborted);
  });
});
