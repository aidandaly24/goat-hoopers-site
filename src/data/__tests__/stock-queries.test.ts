import { describe, expect, it } from "vitest";
import { desc, inArray } from "drizzle-orm";
import { getStockStore, samplePoints, type PriceHistory } from "../stocks";
import { priceHistory, stockSnapshots, type Db } from "../db";
import { computeStockMarket, type StockMarketInput } from "../transform";
import { denseHistoryFixture, fixtureDb, reconstructed, snapshot } from "./stock-query-fixtures";

/** Frozen pre-change read shapes from main bf86c63; used only for fixture comparison. */
async function legacyHistory(db: Db, ids: string[]): Promise<PriceHistory> {
  const recon = await db.select().from(priceHistory).where(inArray(priceHistory.playerId, ids)).orderBy(priceHistory.date);
  const rows = await db.select({ playerId: stockSnapshots.playerId, priceCents: stockSnapshots.priceCents, snapshotAt: stockSnapshots.snapshotAt })
    .from(stockSnapshots).orderBy(desc(stockSnapshots.snapshotAt)).limit(10 * new Set(ids).size);
  return Object.fromEntries(ids.map(id => {
    const estimates = recon.filter(row => row.playerId === id).map(row => ({
      date: row.date.toISOString(), price: row.priceCents / 100,
      source: row.source === "gamelog" ? "gamelog" as const : "backtest" as const,
    }));
    const live = rows.filter(row => row.playerId === id).slice(0, 10).reverse().map(row => ({
      date: row.snapshotAt.toISOString(), price: row.priceCents / 100, source: "live" as const,
    }));
    return [id, samplePoints([...estimates, ...live], 40)];
  }));
}
const marketInput = (ids: string[], history: PriceHistory): StockMarketInput => ({
  players: Object.fromEntries(ids.map(id => [id, { full_name: id, age: 27, years_exp: 5 }])),
  rosteredCount: Object.fromEntries(ids.map(id => [id, 1])), totalRosters: 10,
  faabSpent: {}, faabBudget: 200, flow: {}, tradeCount: {}, draftPick: {}, statProfiles: null,
  history, now: Date.UTC(2026, 9, 8),
});

describe("SQL-bounded observed quote history", () => {
  it("selects only latest live baselines and deterministic timestamp/UUID ties", async () => {
    const { db, calls } = fixtureDb({
      reconstructed: [reconstructed("only-estimate", "2025-06-30T00:00:00Z", 99999, "backtest")],
      snapshots: [
        snapshot("a", "2026-10-01 12:00:00.123456", 1234, 9),
        snapshot("a", "2026-10-01 12:00:00.123987", 2345, 1),
        snapshot("b", "2026-10-02 00:00:00.000000", 3000, 1),
        snapshot("b", "2026-10-02 00:00:00.000000", 4000, 2),
        snapshot("b", "2026-09-01 00:00:00.000000", 9000, 3),
      ],
    });
    const history = await getStockStore(db).getQuoteHistory(["b", "a", "only-estimate", "missing"]);
    expect(history).toEqual({
      a: [{ date: "2026-10-01T12:00:00.123Z", price: 23.45, source: "live" }],
      b: [{ date: "2026-10-02T00:00:00.000Z", price: 40, source: "live" }],
    });
    expect(calls).toHaveLength(1);
    expect(calls[0].rows).toBe(2);
    expect(calls[0].sql).toContain('distinct on ("stock_snapshots"."player_id")');
    expect(calls[0].sql).toContain('order by "stock_snapshots"."player_id", "stock_snapshots"."snapshot_at" desc, "stock_snapshots"."id" desc');
    expect(calls[0].sql).not.toContain("price_history");
    expect(calls[0].sql).not.toContain(" limit ");
  });

  it.each([1, 50, 200])("returns at most P rows in one query for %i requested players", async (count) => {
    const ids = Array.from({ length: count }, (_, i) => `p${i}`);
    const { db, calls } = fixtureDb({ reconstructed: [], snapshots: ids.flatMap(id => [
      snapshot(id, "2026-10-01 00:00:00", 100), snapshot(id, "2026-10-02 00:00:00", 200),
    ]) });
    expect(Object.keys(await getStockStore(db).getQuoteHistory(ids))).toHaveLength(count);
    expect(calls).toHaveLength(1);
    expect(calls[0].rows).toBe(count);
  });

  it("handles empty, duplicate, absent and unusual requested IDs with bound parameters", async () => {
    const strange = "p' OR 1=1 --";
    const { db, calls } = fixtureDb({ reconstructed: [], snapshots: [
      snapshot("p", "2026-10-01 00:00:00", 0), snapshot(strange, "2026-10-01 00:00:00", 111),
      snapshot("__proto__", "2026-10-01 00:00:00", 222),
    ] });
    const store = getStockStore(db);
    expect(await store.getQuoteHistory([])).toEqual({}); expect(calls).toHaveLength(0);
    const history = await store.getQuoteHistory(["p", "p", "missing", "", strange, "__proto__"]);
    expect(calls).toHaveLength(1);
    expect(calls[0].params).toEqual(["p", "missing", "", strange, "__proto__"]);
    expect(calls[0].sql).not.toContain(strange);
    expect(calls[0].rows).toBe(3);
    expect(history.p[0].price).toBe(0);
    expect(Object.hasOwn(history, "__proto__")).toBe(true);
    expect(history[strange][0].price).toBe(1.11);
  });

  it("does not starve sparse requested players behind dense requested or unrelated players", async () => {
    const fixture = { reconstructed: [], snapshots: [
      snapshot("sparse", "2026-01-01 00:00:00", 500),
      ...Array.from({ length: 40 }, (_, i) => snapshot("dense", `2026-10-01 00:00:${String(i).padStart(2, "0")}`, 1000 + i)),
      ...Array.from({ length: 40 }, (_, i) => snapshot("unrelated", `2026-10-02 00:00:${String(i).padStart(2, "0")}`, 99999)),
    ] };
    const { db, calls } = fixtureDb(fixture);
    const prior = await legacyHistory(db, ["sparse", "dense"]);
    expect(prior.sparse).toEqual([]); expect(prior.dense).toEqual([]);
    calls.length = 0;
    const history = await getStockStore(db).getQuoteHistory(["sparse", "dense"]);
    expect(history.sparse[0].price).toBe(5); expect(history.dense[0].price).toBe(10.39);
    expect(calls).toHaveLength(1); expect(calls[0].rows).toBe(2);
  });

  it("keeps reconstructed-only, absent and zero-prior quote semantics", async () => {
    const { db } = fixtureDb({ reconstructed: [reconstructed("estimate", "2025-06-30T00:00:00Z", 50, "backtest")],
      snapshots: [snapshot("zero", "2026-10-01 00:00:00", 0)] });
    const history = await getStockStore(db).getQuoteHistory(["estimate", "missing", "zero"]);
    const market = computeStockMarket(marketInput(["estimate", "missing", "zero"], history));
    for (const stock of market.stocks) {
      expect(stock.prevPrice).toBe(stock.playerId === "zero" ? 0 : null);
      expect(stock.change).toBeNull(); expect(stock.changePct).toBeNull(); expect(stock.trend).toBe("flat");
    }
    expect(market.trending).toEqual([]); expect(market.falling).toEqual([]);
    expect(computeStockMarket(marketInput(["estimate"], history)).hasHistory).toBe(false);
  });

  it("degrades to no baseline for missing DB or live table, without reconstruction reads", async () => {
    for (const store of [getStockStore(), getStockStore(null)]) {
      expect(await store.getQuoteHistory(["p"])).toEqual({});
      expect(await store.getPricePath("p")).toEqual([]);
    }
    const { db, calls } = fixtureDb({ snapshots: [], reconstructed: [reconstructed("p", "2025-06-30T00:00:00Z", 100)],
      missing: new Set(["stock_snapshots"]) });
    expect(await getStockStore(db).getQuoteHistory(["p"])).toEqual({});
    expect(calls).toHaveLength(1); expect(calls[0].sql).not.toContain("price_history");
  });

  it("records synthetic transfer bounds and preserves valid prices, changes, trends and movers", async () => {
    const fixture = denseHistoryFixture(); const ids = Array.from({ length: 10 }, (_, i) => `p${i}`);
    const { db, calls } = fixtureDb(fixture);
    const before = await legacyHistory(db, ids);
    const summarize = () => ({ queries: calls.length, rows: calls.reduce((sum, c) => sum + c.rows, 0),
      bytes: calls.reduce((sum, c) => sum + c.bytes, 0) });
    const prior = summarize(); calls.length = 0;
    const after = await getStockStore(db).getQuoteHistory(ids); const next = summarize();
    expect(prior.queries).toBe(2); expect(prior.rows).toBe(1300);
    expect(next.queries).toBe(1); expect(next.rows).toBe(10); expect(next.bytes).toBeLessThan(prior.bytes);
    const market = computeStockMarket(marketInput(ids, after));
    expect(market).toEqual(computeStockMarket(marketInput(ids, before)));
    expect(market.hasHistory).toBe(true);
    expect(market.falling.length).toBeGreaterThan(0);
    console.info("Synthetic quote transfer (JSON row arrays; not live DB/network timing)", JSON.stringify({ before: prior, after: next }));
    const beforeChart = before.p0;
    calls.length = 0;
    await legacyHistory(db, ["p0"]);
    const priorDetail = summarize(); calls.length = 0;
    expect(await getStockStore(db).getPricePath("p0")).toEqual(beforeChart);
    expect(calls).toHaveLength(2);
    expect(calls.every(c => c.params[0] === "p0")).toBe(true);
    console.info("Synthetic selected-player detail transfer", JSON.stringify({ before: priorDetail, after: summarize() }));
  });
});

describe("selected-player dated/source-labelled chart history", () => {
  it("filters before limiting and returns the latest ten live points oldest-first with deterministic ties", async () => {
    const { db, calls } = fixtureDb({ reconstructed: [], snapshots: [
      ...Array.from({ length: 12 }, (_, i) => snapshot("p", `2026-09-${String(i + 1).padStart(2, "0")} 00:00:00`, i * 100, 1)),
      snapshot("p", "2026-09-12 00:00:00", 999, 2),
      ...Array.from({ length: 100 }, (_, i) => snapshot("other", "2026-10-02 00:00:00", 99999, i + 1)),
    ] });
    const points = await getStockStore(db).getPricePath("p");
    expect(points.map(p => p.price)).toEqual([3, 4, 5, 6, 7, 8, 9, 10, 11, 9.99]);
    expect(points.every(p => p.source === "live")).toBe(true);
    expect(calls).toHaveLength(2); expect(calls[1].rows).toBe(10);
    expect(calls[1].sql).toContain('where "stock_snapshots"."player_id" = $1');
    expect(calls[1].sql).toContain('order by "stock_snapshots"."snapshot_at" desc, "stock_snapshots"."id" desc limit $2');
    expect(calls[1].params).toEqual(["p", 10]);
  });

  it("preserves reconstructed dates/sources and samples a selected player's dense path", async () => {
    const { db, calls } = fixtureDb({
      reconstructed: [reconstructed("p", "2024-06-30T00:00:00Z", 100, "backtest"),
        ...Array.from({ length: 80 }, (_, i) => reconstructed("p", new Date(Date.UTC(2025, 0, i + 1)).toISOString(), 200 + i)),
        reconstructed("unrelated", "2026-06-30T00:00:00Z", 99999)],
      snapshots: [snapshot("p", "2026-10-01 00:00:00", 1234)],
    });
    const points = await getStockStore(db).getPricePath("p");
    expect(points).toHaveLength(40);
    expect(points[0]).toEqual({ date: "2024-06-30T00:00:00.000Z", price: 1, source: "backtest" });
    expect(points.at(-1)).toEqual({ date: "2026-10-01T00:00:00.000Z", price: 12.34, source: "live" });
    expect(points.slice(1, -1).every(p => p.source === "gamelog")).toBe(true);
    expect(calls[0].rows).toBe(81); expect(calls[0].params).toEqual(["p"]);
  });

  it.each(["price_history", "stock_snapshots", "both"])("keeps the available source when %s is missing", async (missing) => {
    const { db } = fixtureDb({ reconstructed: [reconstructed("p", "2025-06-30T00:00:00Z", 100, "backtest")],
      snapshots: [snapshot("p", "2026-10-01 00:00:00", 200)],
      missing: new Set(missing === "both" ? ["price_history", "stock_snapshots"] : [missing]) });
    expect((await getStockStore(db).getPricePath("p")).map(p => p.source)).toEqual(
      missing === "both" ? [] : missing === "price_history" ? ["live"] : ["backtest"]);
  });
});
