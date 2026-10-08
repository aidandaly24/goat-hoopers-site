import { test } from "vitest";
import type { StockQuote, StockDetail, PriceHistoryPoint } from "@/domain";
import assert from "node:assert/strict";
import { DEFAULT_FILTERS, PAGE_SIZE, filterStocks, visibleStocks, priceSegments } from "./board";
import { createDetailLoader } from "./detail";
import { fetchStockDetail } from "@/data/stock-detail-client";

const quote = (playerId: string, patch: Partial<StockQuote> = {}): StockQuote => ({
  playerId, playerName: playerId, position: "PG", nbaTeam: "NYK", price: 20,
  prevPrice: 10, change: 10, changePct: 100, trend: "up", ownership: 0.1, rookiePick: null, ...patch,
});
const detail = (playerId: string): StockDetail => ({ playerId, factors: [], seasonHistory: [], spark: [] });
const stocks = [quote("Alpha", { position: "C", rookiePick: 1, price: 90 }),
  quote("Beta", { ownership: 0, price: 50, changePct: null, prevPrice: null, change: null }),
  quote("Gamma", { price: 40, changePct: -10 }), quote("Delta", { price: 30, changePct: 0 })];
const ids = (values: StockQuote[]) => values.map((s) => s.playerId);

test("search combines with position, recorded draft and roster filters", () => {
  assert.deepEqual(ids(filterStocks(stocks, { ...DEFAULT_FILTERS, query: " ALPHA ", position: "PG" })), []);
  assert.deepEqual(ids(filterStocks(stocks, { ...DEFAULT_FILTERS, query: "alpha", position: "C", drafted: true, roster: "rostered" })), ["Alpha"]);
  assert.deepEqual(ids(filterStocks(stocks, { ...DEFAULT_FILTERS, roster: "unrostered" })), ["Beta"]);
  assert.equal(filterStocks(stocks, { ...DEFAULT_FILTERS, drafted: true }).length, 1);
});
test("each sort is stable, leaves missing baselines last and preserves inputs", () => {
  const original = structuredClone(stocks);
  assert.deepEqual(ids(filterStocks(stocks, DEFAULT_FILTERS)), ["Alpha", "Beta", "Gamma", "Delta"]);
  assert.deepEqual(ids(filterStocks(stocks, { ...DEFAULT_FILTERS, sort: "change" })), ["Alpha", "Delta", "Gamma", "Beta"]);
  assert.deepEqual(ids(filterStocks(stocks, { ...DEFAULT_FILTERS, sort: "falling" })), ["Gamma", "Delta", "Alpha", "Beta"]);
  assert.deepEqual(ids(filterStocks(stocks, { ...DEFAULT_FILTERS, sort: "name" })), ["Alpha", "Beta", "Delta", "Gamma"]);
  assert.deepEqual(stocks, original);
});
test("progressive rows stop at the actual total and tolerate empty markets", () => {
  const many = Array.from({ length: 33 }, (_, i) => quote(String(i)));
  assert.equal(visibleStocks(many, PAGE_SIZE).length, 25);
  assert.equal(visibleStocks(many, PAGE_SIZE * 2).length, 33);
  assert.deepEqual(visibleStocks([], PAGE_SIZE), []);
});
test("dated paths distinguish reconstructed estimates from recorded site prices and scale actual time gaps", () => {
  const points: PriceHistoryPoint[] = [
    { date: "2026-01-01", price: 10, source: "backtest" },
    { date: "2026-01-02", price: 15, source: "gamelog" },
    { date: "2026-01-03", price: 18, source: "live" },
    { date: "2026-01-05", price: 20, source: "live" },
  ];
  const segments = priceSegments(points);
  assert.equal(segments[0].dashed, true);
  assert.equal(segments[0].coords.length, 3);
  assert.equal(segments[1].dashed, false);
  assert.equal(priceSegments(points.map((p) => ({ ...p, source: "gamelog" })))[0].dashed, true);
  assert.equal(priceSegments(points.map((p) => ({ ...p, source: "live" })))[0].dashed, false);
  assert.equal(segments[0].coords[1].split(",")[0], "70.0");
  assert.equal(segments[1].coords[1].split(",")[0], "280.0");
  assert.deepEqual(priceSegments([]), []);
  assert.deepEqual(priceSegments(points.slice(0, 1)), []);
  assert.equal(JSON.stringify(priceSegments(points.map((p) => ({ ...p, price: 10 })))).includes("NaN"), false);
});
test("details are lazy, deduplicated in flight and cached after success", async () => {
  let calls = 0;
  let resolve!: (value: StockDetail) => void;
  const load = createDetailLoader(() => { calls++; return new Promise((done) => { resolve = done; }); });
  assert.equal(calls, 0);
  const first = load("a"), second = load("a");
  assert.equal(first, second);
  await Promise.resolve();
  assert.equal(calls, 1);
  resolve(detail("a"));
  await first;
  assert.deepEqual(await load("a"), detail("a"));
  assert.equal(calls, 1);
});
test("a failed detail request can be retried exactly once and then stays cached", async () => {
  let calls = 0;
  const load = createDetailLoader(async (id) => { calls++; if (calls === 1) throw new Error("offline"); return detail(id); });
  await assert.rejects(load("a"));
  const retry = load("a");
  assert.equal(load("a"), retry);
  assert.deepEqual(await retry, detail("a"));
  await load("a");
  assert.equal(calls, 2);
});
test("different player requests remain isolated when they finish out of order", async () => {
  const pending = new Map<string, (value: StockDetail) => void>();
  const load = createDetailLoader((id) => new Promise<StockDetail>((resolve) => pending.set(id, resolve)));
  const a = load("a"), b = load("b");
  await Promise.resolve();
  pending.get("b")!(detail("b"));
  assert.equal((await b).playerId, "b");
  pending.get("a")!(detail("a"));
  assert.equal((await a).playerId, "a");
});
test("detail adapter uses the existing GET and accepts PR25 date/source points", async () => {
  const value = { ...detail("a b"), spark: [{ date: "2026-01-01T00:00:00Z", price: 10, source: "live" }] };
  let url: string | undefined;
  const result = await fetchStockDetail("a b", async (input) => { url = String(input); return Response.json(value); });
  assert.equal(url, "/api/stocks/a%20b");
  assert.deepEqual(result, value);
});
const failureCases: [string, () => Response][] = [
  ["HTTP failure", () => new Response("unavailable", { status: 404 })],
  ["invalid JSON", () => new Response("{invalid")],
  ["wrong player", () => Response.json(detail("other"))],
  ["old numeric spark contract", () => Response.json({ ...detail("a"), spark: [1, 2] })],
  ["bad provenance", () => Response.json({ ...detail("a"), spark: [{ date: "2026-01-01", price: 10, source: "unknown" }] })],
];
for (const [name, response] of failureCases) test(`${name} can recover through the same retry/cache boundary`, async () => {
  let calls = 0;
  const load = createDetailLoader((id) => fetchStockDetail(id, async () => {
    calls++; return calls === 1 ? response() : Response.json(detail(id));
  }));
  await assert.rejects(load("a"));
  assert.deepEqual(await load("a"), detail("a"));
  assert.equal(calls, 2);
});
