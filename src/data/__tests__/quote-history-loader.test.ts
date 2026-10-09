/** Real league/Sleeper loaders with fake HTTP, stock-store and fundamentals seams. */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getStockDetail, getStockMarketData } from "../league";
import { getStockStore } from "../stocks";
import { getSeasonHistory } from "../nba-stats";
import type { PriceHistoryPoint } from "../../domain/stock";
import { rawTransaction } from "./fixtures";

vi.mock("../stocks", () => ({ getStockStore: vi.fn() }));
vi.mock("../nba-stats", () => ({ getStatProfiles: async () => null, getSeasonHistory: vi.fn() }));
vi.mock("../db", async original => ({ ...await original<typeof import("../db")>(), getDb: () => ({ fixture: true }) }));

const getQuoteHistory = vi.fn();
const getPricePath = vi.fn();
const saveSnapshot = vi.fn();
const directory = Object.fromEntries(["owned", "draft", "waiver", "add", "drop", "trade", "unlisted"].map(id =>
  [id, { full_name: id, age: 27, years_exp: 5 }]));
const fakeFetch = vi.fn<typeof fetch>();

beforeEach(() => {
  vi.useFakeTimers(); vi.setSystemTime(new Date("2026-10-08T12:00:00Z"));
  vi.mocked(getStockStore).mockReturnValue({ getQuoteHistory, getPricePath, saveSnapshot });
  getQuoteHistory.mockReset().mockImplementation(async (ids: string[]) => Object.fromEntries(
    ids.filter(id => id !== "draft").map(id => [id, [{ date: "2026-10-07T00:00:00.000Z", price: 10, source: "live" }]])));
  getPricePath.mockReset().mockResolvedValue([
    { date: "2024-06-30T00:00:00.000Z", price: 2, source: "backtest" },
    { date: "2025-10-01T00:00:00.000Z", price: 3, source: "gamelog" },
    { date: "2026-10-07T00:00:00.000Z", price: 10, source: "live" },
  ] satisfies PriceHistoryPoint[]);
  saveSnapshot.mockReset().mockResolvedValue(undefined);
  vi.mocked(getSeasonHistory).mockReset().mockResolvedValue([{ season: "2025", fppg: 20, games: 80 }]);
  fakeFetch.mockReset().mockImplementation(async input => {
    const path = new URL(input instanceof Request ? input.url : String(input)).pathname;
    let payload: unknown;
    if (path === "/v1/players/nba") payload = directory;
    else if (path === "/v1/state/nba") payload = { season: "2026", season_type: "pre", week: 0 };
    else if (/\/rosters$/.test(path)) payload = [{ roster_id: 1, owner_id: "manager", players: ["owned"], settings: {} }];
    else if (/\/users$/.test(path)) payload = [{ user_id: "manager", display_name: "manager", metadata: {}, avatar: null }];
    else if (/\/drafts$/.test(path)) payload = [{ draft_id: "fixture-draft", season: "2026", status: "complete", type: "linear" }];
    else if (path === "/v1/draft/fixture-draft/picks") payload = [{ player_id: "draft", pick_no: 1 }];
    else if (/\/transactions\/1$/.test(path)) payload = [
      rawTransaction({ type: "waiver", adds: { waiver: 1 }, settings: { waiver_bid: 10 } }),
      rawTransaction({ adds: { add: 1 }, drops: { drop: 1 } }),
      rawTransaction({ type: "trade", adds: { trade: 1 } }),
    ];
    else if (/\/league\/[^/]+$/.test(path)) payload = { name: "Fixture", season: "2026", total_rosters: 10,
      settings: { waiver_budget: 200 }, scoring_settings: { pts: 1 } };
    else throw new Error(`Unexpected offline provider request: ${path}`);
    return new Response(JSON.stringify(payload), { status: 200, headers: { "Content-Type": "application/json" } });
  });
  vi.stubGlobal("fetch", fakeFetch);
});
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

describe("quote/detail read wiring", () => {
  it("requests the shared candidate set once, without charts on the public quote path", async () => {
    const market = await getStockMarketData();
    const ids = ["owned", "draft", "waiver", "add", "drop", "trade"];
    expect(getQuoteHistory).toHaveBeenCalledExactlyOnceWith(ids);
    expect(market.stocks.map(stock => stock.playerId).sort()).toEqual([...ids].sort());
    expect(getPricePath).not.toHaveBeenCalled(); expect(getSeasonHistory).not.toHaveBeenCalled();
    expect(market.stocks.every(stock => !("spark" in stock))).toBe(true);
    expect(market.stocks.find(stock => stock.playerId === "draft")?.prevPrice).toBeNull();
    expect(market.stocks.find(stock => stock.playerId === "trade")?.prevPrice).toBe(10);
    expect(saveSnapshot).toHaveBeenCalledOnce(); // Fake only; publication logic remains untouched.
  });

  it("loads only the selected player's source-labelled chart and preserves the current modeled point", async () => {
    const market = await getStockMarketData();
    const quote = market.stocks.find(stock => stock.playerId === "owned")!;
    getQuoteHistory.mockClear(); saveSnapshot.mockClear();
    const detail = await getStockDetail("owned");
    expect(getQuoteHistory).toHaveBeenCalledOnce();
    expect(getPricePath).toHaveBeenCalledExactlyOnceWith("owned", 39);
    expect(detail?.spark).toEqual([
      ...await getPricePath.mock.results[0].value,
      { date: "2026-10-08T12:00:00.000Z", price: quote.price, source: "live" },
    ]);
    expect(detail?.seasonHistory).toEqual([{ season: "2025", fppg: 20, games: 80 }]);
    expect(getSeasonHistory).toHaveBeenCalledExactlyOnceWith({ fixture: true }, "owned");
    expect(saveSnapshot).not.toHaveBeenCalled();
  });

  it("caps detail at forty points with the unchanged modeled point last", async () => {
    getPricePath.mockResolvedValue(Array.from({ length: 40 }, (_, i) => ({
      date: new Date(Date.UTC(2025, 0, i + 1)).toISOString(), price: i, source: "gamelog",
    })));
    const detail = await getStockDetail("owned");
    expect(detail?.spark).toHaveLength(40);
    expect(getPricePath).toHaveBeenCalledExactlyOnceWith("owned", 39);
    expect(detail?.spark[0].date).toBe("2025-01-01T00:00:00.000Z");
    expect(detail?.spark.at(-2)?.date).toBe("2025-02-09T00:00:00.000Z");
    expect(detail?.spark.at(-1)?.date).toBe("2026-10-08T12:00:00.000Z");
    expect(detail?.spark.at(-1)?.source).toBe("live");
  });

  it("does not query chart/season history for an unlisted player", async () => {
    expect(await getStockDetail("unlisted")).toBeNull();
    expect(getPricePath).not.toHaveBeenCalled(); expect(getSeasonHistory).not.toHaveBeenCalled();
  });

  it("keeps valid quotes and null baselines when the quote read rejects", async () => {
    getQuoteHistory.mockRejectedValue(new Error("fixture read failed"));
    const market = await getStockMarketData();
    expect(market.stocks).toHaveLength(6); expect(market.hasHistory).toBe(false);
    expect(market.stocks.every(stock => stock.prevPrice === null && stock.changePct === null)).toBe(true);
    expect(market.trending).toEqual([]); expect(market.falling).toEqual([]);
    expect(getPricePath).not.toHaveBeenCalled();
  });
});
