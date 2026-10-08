import type { StockQuote } from "@/domain";

type TradePicks = { a: StockQuote[]; b: StockQuote[] };

/** Known IDs only, in order; Team A claims cross-side duplicates first. */
export function decodeTrade(params: Pick<URLSearchParams, "get">, stocks: StockQuote[]): TradePicks {
  const byId = new Map(stocks.map((stock) => [stock.playerId, stock]));
  const taken = new Set<string>();
  const decode = (value: string | null): StockQuote[] => {
    const picks: StockQuote[] = [];
    for (const raw of value?.split(",") ?? []) {
      const id = raw.trim();
      if (!id) continue;
      const stock = byId.get(id);
      if (!stock || taken.has(id)) continue;
      taken.add(id);
      picks.push(stock);
    }
    return picks;
  };
  return { a: decode(params.get("a")), b: decode(params.get("b")) };
}

/** Replace only trade parameters; retain the origin, path, other params and hash. */
export function encodeTradeUrl(href: string, picks: TradePicks): string {
  const url = new URL(href);
  for (const side of ["a", "b"] as const) {
    const value = picks[side].map((stock) => stock.playerId).join(",");
    if (value) url.searchParams.set(side, value);
    else url.searchParams.delete(side);
  }
  return url.href;
}
