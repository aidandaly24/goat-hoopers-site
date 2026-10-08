import type { StockQuote } from "@/domain";

export const stocks: StockQuote[] = [
  ["101", "Alpha Guard", 10],
  ["202", "Beta Wing", 11],
  ["303", "Gamma Center", 20],
  ["404", "Delta Forward", 30],
].map(([id, name, price]) => ({
  playerId: String(id),
  playerName: String(name),
  price: Number(price),
  position: "PG",
  nbaTeam: null,
  prevPrice: null,
  change: null,
  changePct: null,
  trend: "flat",
  ownership: 0,
  rookiePick: null,
}));
