import type { PriceHistoryPoint } from "@/domain";

export const CHART_RANGES = ["30D", "90D", "1Y", "All"] as const;
export type ChartRange = typeof CHART_RANGES[number];
export const PLOT = { width: 360, height: 220, left: 56, right: 344, top: 16, bottom: 174 };
type ChartPoint = PriceHistoryPoint & { time: number; originalIndex: number; current: boolean };

/** Filter supplied points only; ranges end at the latest supplied timestamp. */
export function chartPoints(history: PriceHistoryPoint[], range: ChartRange): ChartPoint[] {
  const points = history.map((point, originalIndex) => ({ ...point,
    time: Date.parse(point.date), originalIndex,
    // The existing detail loader appends the current modeled quote as its last point.
    current: point.source === "live" && originalIndex === history.length - 1,
  })).filter((point) => Number.isFinite(point.time) && Number.isFinite(point.price))
    .sort((a, b) => a.time - b.time || a.originalIndex - b.originalIndex);
  const last = points.at(-1);
  if (!last || range === "All") return points;
  const days = range === "30D" ? 30 : range === "90D" ? 90 : 365;
  return points.filter((point) => point.time >= last.time - days * 86400000);
}

export function pointSource(point: ChartPoint): string {
  return point.current ? "Current modeled quote" : point.source === "live" ? "Recorded site snapshot" :
    point.source === "gamelog" ? "Reconstructed game-log estimate" : "Reconstructed annual estimate";
}

/** SVG geometry uses actual timestamps and prices, including flat/single-point paths. */
export function priceChartModel(history: PriceHistoryPoint[], range: ChartRange) {
  const points = chartPoints(history, range);
  if (!points.length) return null;
  const prices = points.map((point) => point.price);
  const minimum = Math.min(...prices), maximum = Math.max(...prices);
  const padding = Math.max((maximum - minimum) * .1, 1);
  const low = minimum >= 0 ? Math.max(0, minimum - padding) : minimum - padding;
  const high = maximum + padding;
  const start = points[0].time, end = points[points.length - 1].time;
  const positions = points.map((point) => ({
    x: start === end ? (PLOT.left + PLOT.right) / 2 : PLOT.left + (point.time - start) / (end - start) * (PLOT.right - PLOT.left),
    y: PLOT.bottom - (point.price - low) / (high - low) * (PLOT.bottom - PLOT.top),
  }));
  const ticks = [high, (high + low) / 2, low].map((price) => ({ price,
    y: PLOT.bottom - (price - low) / (high - low) * (PLOT.bottom - PLOT.top) }));
  const segments = positions.slice(1).map((position, index) => ({
    from: positions[index], to: position,
    kind: points[index].current || points[index + 1].current ? "current" :
      points[index].source !== "live" || points[index + 1].source !== "live" ? "estimate" : "recorded",
  }));
  return { points, positions, ticks, segments };
}

/** Nearest supplied timestamp; equal-date ties select the later supplied point. */
export function nearestChartPoint(positions: { x: number }[], x: number) {
  let nearest = 0, distance = Infinity;
  positions.forEach((position, index) => {
    const next = Math.abs(position.x - x);
    if (next <= distance) { nearest = index; distance = next; }
  });
  return nearest;
}
