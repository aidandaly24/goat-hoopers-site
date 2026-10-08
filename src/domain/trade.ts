import type { StockQuote } from "./stock";

/**
 * Trade analyzer — price a hypothetical trade in FAAB dollars.
 *
 * Two sides of picked players are summed at their stock-market prices;
 * the verdict bands follow the issue spec: within 10% = fair,
 * 10–25% = leans, 25%+ = fleece. The percentage is measured against the
 * smaller side's total (how much more the winner banks vs what they give).
 */

export type TradeSide = "A" | "B";

export type TradeVerdict =
  | { kind: "empty" }
  | { kind: "fair"; diff: number; pct: number }
  | { kind: "leans"; winner: TradeSide; diff: number; pct: number }
  | { kind: "fleece"; winner: TradeSide; diff: number; pct: number };

export function tradeTotal(picks: StockQuote[]): number {
  return picks.reduce((sum, p) => sum + p.price, 0);
}

/**
 * Pure verdict for two sides of a hypothetical trade. Returns "empty"
 * until both sides hold at least one player — no verdict on a vacuum.
 */
export function analyzeTrade(
  sideA: StockQuote[],
  sideB: StockQuote[]
): TradeVerdict {
  if (sideA.length === 0 || sideB.length === 0) return { kind: "empty" };
  const a = tradeTotal(sideA);
  const b = tradeTotal(sideB);
  const diff = Math.abs(a - b);
  const smaller = Math.min(a, b);
  // Prices are clamped to >= 1 upstream, but never divide by zero.
  const pct = smaller > 0 ? diff / smaller : 0;
  const winner: TradeSide = a >= b ? "A" : "B";
  if (pct <= 0.1) return { kind: "fair", diff, pct };
  if (pct <= 0.25) return { kind: "leans", winner, diff, pct };
  return { kind: "fleece", winner, diff, pct };
}
