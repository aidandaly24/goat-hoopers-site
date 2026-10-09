import type { HeldStoredEstimate, StockHistoryRangePage, StockHistoryRecord } from "@/domain/stock-history-range";

/** Calendar coordinates only. Never assign a timezone to native observed dates. */
function calendarCoordinate(date: string): number {
  const [year, month, day, hour = 0, minute = 0, second = 0, fraction = 0] = date.match(/\d+/g)!.map(Number);
  return Date.UTC(year, month - 1, day, hour, minute, second) + fraction / 1000;
}

export function retainedHistoryPlot(pages: StockHistoryRangePage[]) {
  const records = pages.flatMap(page => page.records);
  // Only the loader's explicitly qualified, half-open held intervals are drawn.
  const intervals = pages.flatMap(page => page.modeledWindow.status === "available" ? page.modeledWindow.intervals : []);
  const priced = intervals.filter((interval): interval is HeldStoredEstimate & { priceCents: number } =>
    interval.priceCents !== null && interval.meaning === "held-reconstructed-estimate");
  const values = [...records.map(record => record.priceCents), ...priced.map(interval => interval.priceCents)];
  if (!values.length) return null;
  let low = values[0], high = values[0];
  for (const value of values) { low = Math.min(low, value); high = Math.max(high, value); }
  const padding = Math.max((high - low) * .1, 1);
  low = Math.max(0, low - padding); high += padding;
  const first = calendarCoordinate(pages[0].requested.from), last = calendarCoordinate(pages[0].requested.to);
  const x = (date: string) => 52 + (calendarCoordinate(date) - first) / (last - first) * 292;
  const y = (cents: number) => 16 + (high - cents) / (high - low) * 124;
  return {
    low, high,
    points: records.map((record: StockHistoryRecord) => ({ record, x: x(record.date), y: y(record.priceCents) })),
    holds: priced.map(interval => ({ interval, x1: x(interval.from), x2: x(interval.toExclusive), y: y(interval.priceCents) })),
  };
}
