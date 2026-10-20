import { isValidElement } from "react";
import { beforeEach, expect, test, vi } from "vitest";
import { shouldRenderTicker } from "./policy";

const loaders = vi.hoisted(() => ({ market: vi.fn(), news: vi.fn() }));
vi.mock("@/data/league", () => ({
  getStockMarketData: loaders.market,
  getLeagueNews: loaders.news,
}));
vi.mock("@/surfaces/stock-market/CombinedTicker", () => ({
  CombinedTicker: () => null,
}));
import TickerSlot from "./[[...segments]]/page";
import DefaultTicker from "./default";

const stock = (index: number) => ({
  playerId: `p${index}`, playerName: `Player ${index}`, price: index,
  trend: "up", changePct: 1, factors: { mustNotShip: true },
  history: [999],
});
const article = (index: number) => ({
  headline: `Headline ${index}`, outlet: { name: "Fixture", secret: true },
  body: "Must not ship",
});
const render = (segments?: string[]) => TickerSlot({ params: Promise.resolve({ segments }) });

beforeEach(() => {
  vi.resetAllMocks();
  loaders.market.mockResolvedValue({ stocks: Array.from({ length: 30 }, (_, i) => stock(i)) });
  loaders.news.mockResolvedValue(Array.from({ length: 15 }, (_, i) => article(i)));
});

test.each(["account", "admin", "login", "signup", "claim", "forgot-password", "reset-password"])(
  "%s and nested flows return null before either league loader",
  async (root) => {
    for (const segments of [[root], [root, "fixture", "nested"]]) {
      expect(await render(segments)).toBeNull();
    }
    expect(loaders.market).not.toHaveBeenCalled();
    expect(loaders.news).not.toHaveBeenCalled();
  },
);

test.each([undefined, [], ["stocks"], ["team"], ["teams", "1"], ["player", "p1"], ["accounting"], ["login-history"]].map((segments) => ({ segments })))(
  "content path $segments retains the bounded, shallow ticker DTO",
  async ({ segments }) => {
    const result = await render(segments);
    expect(isValidElement(result)).toBe(true);
    if (!isValidElement<{ stocks: unknown[]; headlines: unknown[] }>(result)) throw new Error("Expected ticker element");
    expect(result.props.stocks).toEqual(Array.from({ length: 25 }, (_, index) => ({
      playerId: `p${index}`, playerName: `Player ${index}`, price: index,
      trend: "up", changePct: 1,
    })));
    expect(result.props.headlines).toEqual(Array.from({ length: 12 }, (_, index) => ({
      text: `Headline ${index}`, publication: "Fixture",
    })));
    expect(loaders.market).toHaveBeenCalledTimes(1);
    expect(loaders.news).toHaveBeenCalledTimes(1);
  },
);

test.each(["market", "news"] as const)("%s outage preserves the silent whole-ticker fallback", async (loader) => {
  loaders[loader].mockRejectedValueOnce(new Error("Synthetic outage"));
  expect(await render(["stocks"])).toBeNull();
});

test("empty ticker and unmatched-slot fallback render nothing", async () => {
  loaders.market.mockResolvedValueOnce({ stocks: [] });
  loaders.news.mockResolvedValueOnce([]);
  expect(await render()).toBeNull();
  expect(DefaultTicker()).toBeNull();
});

test("route selection uses a whole segment and does not mutate params", () => {
  const segments = Object.freeze(["account", "setup"]);
  expect(shouldRenderTicker(segments)).toBe(false);
  expect(shouldRenderTicker(["accounting"])).toBe(true);
  expect(segments).toEqual(["account", "setup"]);
});
