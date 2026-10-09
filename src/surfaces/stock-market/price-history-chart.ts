import type { PriceHistoryPoint } from "@/domain";

export const CHART_RANGES = ["30D", "90D", "1Y", "All"] as const;
export type ChartRange = typeof CHART_RANGES[number];
export const PLOT = { width: 360, height: 220, left: 56, right: 344, top: 16, bottom: 174 };

/**
 * Display heuristic: an interval between two consecutive supplied samples at or
 * above this length is classified as a "long gap" and is never bridged by a
 * path. This describes the supplied sampled response only — it makes no claim
 * about whether raw source data exists between the samples.
 */
export const LONG_GAP_DAYS = 90;
const LONG_GAP_MS = LONG_GAP_DAYS * 86400000;
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

/** A maximal run of consecutive supplied points drawn as one straight SVG path. */
export type ChartPath = { kind: "estimate" | "recorded" | "current"; d: string };
/** A classified long interval between two supplied samples; never bridged by a path. */
export type ChartGap = { fromDate: string; toDate: string; x: number };

function pairKind(a: ChartPoint, b: ChartPoint): ChartPath["kind"] {
  if (a.current || b.current) return "current";
  if (a.source !== "live" || b.source !== "live") return "estimate";
  return "recorded";
}

const round2 = (value: number) => Math.round(value * 100) / 100;

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

  // Group consecutive same-kind pairs into single straight paths. A path run
  // breaks at a classified long gap (never bridged) or a provenance kind
  // change (a boundary worth marking). `marked` keeps a decorative dot for
  // run endpoints (series ends, gap edges, provenance boundaries) and for
  // isolated samples; every supplied point stays inspectable through the
  // pointer target, keyboard slider, and ARIA readout regardless.
  const paths: ChartPath[] = [];
  const gaps: ChartGap[] = [];
  const marked = points.map(() => false);
  let runStart = 0, runKind: ChartPath["kind"] | null = null;
  const closeRun = (end: number) => {
    marked[runStart] = true;
    marked[end] = true;
    if (runKind !== null) {
      const d = positions.slice(runStart, end + 1)
        .map((position, index) => `${index === 0 ? "M" : "L"}${round2(position.x)} ${round2(position.y)}`).join(" ");
      paths.push({ kind: runKind, d });
      runKind = null;
    }
  };
  for (let index = 0; index + 1 < points.length; index++) {
    if (points[index + 1].time - points[index].time >= LONG_GAP_MS) {
      closeRun(index);
      gaps.push({ fromDate: points[index].date, toDate: points[index + 1].date,
        x: (positions[index].x + positions[index + 1].x) / 2 });
      runStart = index + 1;
      continue;
    }
    const kind = pairKind(points[index], points[index + 1]);
    if (runKind === null) runKind = kind;
    else if (runKind !== kind) {
      closeRun(index);
      runStart = index;
      runKind = kind;
    }
  }
  closeRun(points.length - 1);
  return { points, positions, ticks, paths, gaps, marked };
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
