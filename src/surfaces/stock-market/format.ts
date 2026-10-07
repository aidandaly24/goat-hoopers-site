/** Tiny formatters shared by the stock-market surface. */

export function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

/** +7.8% / -4.1% — always signed, one decimal. */
export function formatPct(pct: number): string {
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

/** +$6.40 / -$2.10 — always signed, two decimals. */
export function formatChange(change: number): string {
  const sign = change > 0 ? "+" : "";
  return `${sign}$${change.toFixed(2)}`;
}
