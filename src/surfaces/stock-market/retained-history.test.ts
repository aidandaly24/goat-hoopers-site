import { describe, expect, it } from "vitest";
import type { StockHistoryRangePage, StockHistoryRecord } from "@/domain/stock-history-range";
import { retainedHistoryPlot } from "./retained-history";

const record = (id: string, date: string, priceCents = 8438): StockHistoryRecord => ({
  id, playerId: "2577", date, priceCents, source: "live", season: null,
});
const page = (records: StockHistoryRecord[] = []): StockHistoryRangePage => ({
  version: "stock-history-range-v1", playerId: "2577", requested: { from: "2026-10-01", to: "2026-11-01", kind: "observed" },
  readStatus: records.length ? "ready" : "empty", records, precedingModelAnchor: null, nextCursor: null, hasMore: false,
  returnedBounds: records.length ? { first: records[0].date, last: records.at(-1)!.date } : null,
  provenance: { timestampBasis: "database-local-unverified", generation: null, declaredModelVersion: null,
    consistency: "best-effort-retained", calibration: "observed-cents-unchanged", receiptTiming: "recorded-database-time" },
  coverage: { status: "unknown", retainedRangeExhausted: true, limitations: [] },
  modeledWindow: { status: "not-applicable", from: null, toExclusive: null, intervals: [] },
});

describe("retained history geometry", () => {
  it("preserves all paged ties and exact native dates/cents without connecting observations", () => {
    const a = record("a", "2026-10-08T01:41:52.104607"), b = { ...a, id: "b" };
    const pages = [page([a]), page([b])], before = JSON.stringify(pages);
    const plot = retainedHistoryPlot(pages)!;
    expect(plot.points.map(point => point.record)).toEqual([a, b]);
    expect(plot.points[0].x).toBe(plot.points[1].x);
    expect(plot.holds).toEqual([]); expect(JSON.stringify(pages)).toBe(before);
  });
  it("draws only supplied half-open held estimates, leaving a null prefix unpriced", () => {
    const p = page([]), anchor = { ...record("model", "2026-10-08T00:00:00.000000Z", 3100), source: "gamelog", season: "2025-26" };
    p.requested.kind = "modeled";
    p.modeledWindow = { status: "available", from: "2026-10-01T00:00:00.000000Z", toExclusive: "2026-11-01T00:00:00.000000Z", intervals: [
      { from: "2026-10-01T00:00:00.000000Z", toExclusive: anchor.date, anchor: null, priceCents: null, meaning: "before-first-estimate" },
      { from: anchor.date, toExclusive: "2026-11-01T00:00:00.000000Z", anchor, priceCents: 3100, meaning: "held-reconstructed-estimate" },
    ] };
    const plot = retainedHistoryPlot([p])!;
    expect(plot.points).toEqual([]); expect(plot.holds).toHaveLength(1);
    expect(plot.holds[0].interval).toBe(p.modeledWindow.intervals[1]);
    expect(plot.holds[0].x1).toBeGreaterThan(52); expect(plot.holds[0].x2).toBe(344);
  });
  it("does not invent carry for ambiguous or unversioned windows; exact updates survive", () => {
    for (const status of ["ambiguous", "unversioned"] as const) {
      const p = page([record("update", "2026-10-08T00:00:00.000000Z", 0)]);
      p.modeledWindow.status = status;
      expect(retainedHistoryPlot([p])!.holds).toEqual([]);
      expect(retainedHistoryPlot([p])!.points[0].record.priceCents).toBe(0);
    }
  });
  it("keeps a successful empty source unpriced and uses separate calendar coordinates for native/UTC views", () => {
    expect(retainedHistoryPlot([page()])).toBeNull();
    const date = "2026-10-08T01:41:52.104607";
    expect(retainedHistoryPlot([page([record("native", date)])])!.points[0].x)
      .toBe(retainedHistoryPlot([page([record("UTC", date + "Z")])])!.points[0].x);
  });
});
