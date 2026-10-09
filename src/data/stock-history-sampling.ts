import type { PriceHistoryPoint } from "../domain/stock";

export const STOCK_CHART_POINTS = 40;

/** Select existing points only. No averaging, interpolation or price mutation.
 * Keep chronological endpoints and both sides of every provenance transition.
 * Remaining slots prefer extrema, then split the largest unsampled index gaps.
 * If provenance alone exceeds the budget, fail closed rather than hide it. */
export function samplePoints(points: readonly PriceHistoryPoint[], max: number): PriceHistoryPoint[] {
  if (!Number.isInteger(max) || max < 2) throw new Error("History budget must preserve two endpoints");
  const ordered = [...points].sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
  if (ordered.some(p => !Number.isFinite(Date.parse(p.date)) || !Number.isFinite(p.price)))
    throw new Error("Invalid history point");
  if (ordered.length <= max) return ordered;
  const selected = new Set([0, ordered.length - 1]);
  for (let i = 1; i < ordered.length; i++) {
    if (ordered[i].source !== ordered[i - 1].source) { selected.add(i - 1); selected.add(i); }
  }
  if (selected.size > max) throw new Error("History provenance boundaries exceed point budget");
  let low = 0, high = 0;
  for (let i = 1; i < ordered.length; i++) {
    if (ordered[i].price < ordered[low].price) low = i;
    if (ordered[i].price > ordered[high].price) high = i;
  }
  for (const index of [low, high]) if (selected.size < max) selected.add(index);
  while (selected.size < max) {
    const indexes = [...selected].sort((a, b) => a - b);
    let left = 0, gap = 0;
    for (let i = 1; i < indexes.length; i++) {
      if (indexes[i] - indexes[i - 1] > gap) { left = indexes[i - 1]; gap = indexes[i] - left; }
    }
    if (gap <= 1) break;
    selected.add(left + Math.floor(gap / 2));
  }
  return [...selected].sort((a, b) => a - b).map(i => ordered[i]);
}

/** The modeled current quote has its own slot and identity, even on the same date. */
export function stockDetailHistory(history: readonly PriceHistoryPoint[], current: PriceHistoryPoint): PriceHistoryPoint[] {
  return [...samplePoints(history, STOCK_CHART_POINTS - 1), current];
}
