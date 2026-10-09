import type { StockDetail, StockQuote } from "@/domain";

export const syntheticStocks: StockQuote[] = Array.from({ length: 30 }, (_, index) => ({
  playerId: `shell-synthetic-${index}`, playerName: `Synthetic player ${index + 1}`, position: "PG",
  nbaTeam: null, price: 30 - index, prevPrice: 20, change: 10 - index,
  changePct: 50 - index, trend: "up", ownership: 0, rookiePick: null,
}));

// Vite-only alias for the existing detail-client seam. Never calls fetch.
export async function fetchStockDetail(playerId: string): Promise<StockDetail> {
  return {
    playerId,
    spark: [{ date: "2025-01-01", price: 10, source: "backtest" }, { date: "2026-10-08", price: 30, source: "live" }],
    seasonHistory: Array.from({ length: 5 }, (_, index) => ({ season: String(2025 - index), fppg: 40 - index, games: 50 })),
    factors: (["age", "production", "injury", "dynasty", "recent", "trades", "draft", "faab"] as const).map(kind => ({
      kind, label: `Synthetic ${kind}`, delta: 1, note: "Synthetic detail for sticky heading and close checks. ".repeat(6),
    })),
  };
}
