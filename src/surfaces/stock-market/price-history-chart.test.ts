import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { PriceHistoryPoint } from "@/domain";
import { PriceHistoryChart } from "./PriceHistoryChart";
import { chartPoints, LONG_GAP_DAYS, nearestChartPoint, pointSource, PLOT, priceChartModel } from "./price-history-chart";

const history: PriceHistoryPoint[] = [
  { date: "2025-10-08T00:00:00Z", price: 10, source: "backtest" },
  { date: "2026-01-08T00:00:00Z", price: 20, source: "gamelog" },
  { date: "2026-09-08T00:00:00Z", price: 25, source: "live" },
  { date: "2026-10-01T00:00:00Z", price: 27, source: "live" },
  { date: "2026-10-08T00:00:00Z", price: 30, source: "live" },
];
function render(points = history) {
  return renderToStaticMarkup(createElement(PriceHistoryChart, { history: points, playerName: "Synthetic Player" }));
}

describe("bounded price history chart", () => {
  for (const [range, expected] of [["All", 5], ["1Y", 5], ["90D", 3], ["30D", 3]] as const)
    it(`filters ${range} by the latest supplied date, including the exact boundary`, () => {
      const points = chartPoints(history, range);
      expect(points).toHaveLength(expected);
      expect(points.at(-1)?.date).toBe(history.at(-1)?.date);
      expect(points.at(-1)?.current).toBe(true);
    });

  it("does not synthesize points in a sparse range or mutate history", () => {
    const original = structuredClone(history);
    const sparse = [history[0], history[history.length - 1]];
    expect(chartPoints(sparse, "30D")).toHaveLength(1);
    expect(chartPoints(sparse, "All").map((point) => point.date)).toEqual(sparse.map((point) => point.date));
    expect(history).toEqual(original);
  });

  it("retains per-point provenance and distinguishes the appended quote from recorded snapshots", () => {
    expect(chartPoints(history, "All").map(pointSource)).toEqual([
      "Reconstructed annual estimate", "Reconstructed game-log estimate",
      "Recorded site snapshot", "Recorded site snapshot", "Current modeled quote",
    ]);
    expect(pointSource(chartPoints([history[0]], "All")[0])).toBe("Reconstructed annual estimate");
  });

  it("orders dated points without confusing a filtered final record with the current quote", () => {
    const points = chartPoints([history[1], history[0], history[2], history[4]], "All");
    expect(points.map((point) => point.date)).toEqual([history[0], history[1], history[2], history[4]].map((point) => point.date));
    expect(points.filter((point) => point.current)).toHaveLength(1);
    expect(points[points.length - 1].price).toBe(30);
  });

  it("groups consecutive same-kind pairs into single straight paths with rounded geometry", () => {
    const model = priceChartModel(history, "All")!;
    // Pairs: (0,1) 92-day gap, (1,2) 243-day gap, (2,3) recorded, (3,4) current.
    // Runs: [0] isolated, [1] isolated, [2,3] recorded, [3,4] current.
    expect(model.gaps).toHaveLength(2);
    expect(model.paths.map((path) => path.kind)).toEqual(["recorded", "current"]);
    for (const path of model.paths) {
      expect(path.d.startsWith("M")).toBe(true);
      expect(path.d).toContain("L");
      expect(path.d).not.toContain("C");
      expect(path.d).not.toContain("Q");
    }
    const html = render();
    // Grid (3) + axis (2) + crosshair (1) lines remain; per-pair segment lines are gone.
    expect(html.match(/<line/g)?.length).toBe(6);
    expect(html.match(/<path /g)?.length).toBeGreaterThanOrEqual(model.paths.length + 1); // paths + current diamond
  });

  it("never bridges a 90-day gap and labels the interval honestly", () => {
    expect(LONG_GAP_DAYS).toBe(90);
    const model = priceChartModel(history, "All")!;
    expect(model.gaps.map((gap) => [gap.fromDate, gap.toDate])).toEqual([
      [history[0].date, history[1].date],
      [history[1].date, history[2].date],
    ]);
    // No path spans any gap: every path run stays on one side of each gap.
    for (let gapIndex = 0; gapIndex < model.gaps.length; gapIndex++) {
      const left = model.positions[gapIndex].x, right = model.positions[gapIndex + 1].x;
      for (const path of model.paths) {
        const xs = [...path.d.matchAll(/-?\d+(\.\d+)?/g)].map(Number).filter((_, i) => i % 2 === 0);
        expect(xs.some((x) => x > left) && xs.some((x) => x < right)).toBe(false);
      }
    }
    const html = render();
    // Honest single-sentence labels render as a wrapping HTML list outside the
    // fixed-height plot; the SVG keeps the path break and boundary markers.
    expect(html).toContain("No samples supplied between Oct 2025 – Jan 2026");
    expect(html).toContain("No samples supplied between Jan 2026 – Sept 2026");
    expect(html).toContain('aria-label="Unconnected intervals"');
    expect(html).toContain("2 long gaps not connected");
    expect(html).not.toContain("raw source data");
  });

  it("marks run endpoints, provenance boundaries and isolated samples — never interior points", () => {
    const model = priceChartModel(history, "All")!;
    // Runs: [0] isolated, [1] isolated, [2,3] recorded, [3,4] current. All endpoints marked.
    expect(model.marked).toEqual([true, true, true, true, true]);
    const dense = priceChartModel([
      { date: "2026-09-01T00:00:00Z", price: 10, source: "live" },
      { date: "2026-09-02T00:00:00Z", price: 11, source: "live" },
      { date: "2026-09-03T00:00:00Z", price: 12, source: "live" },
      { date: "2026-09-04T00:00:00Z", price: 13, source: "live" },
      { date: "2026-09-05T00:00:00Z", price: 14, source: "live" },
    ], "All")!;
    // The current-quote pair always splits from the recorded run: a boundary marker at index 3.
    expect(dense.paths.map((p) => p.kind)).toEqual(["recorded", "current"]);
    expect(dense.marked).toEqual([true, false, false, true, true]);
    const denseHtml = renderToStaticMarkup(createElement(PriceHistoryChart, { history: [
      { date: "2026-09-01T00:00:00Z", price: 10, source: "live" },
      { date: "2026-09-02T00:00:00Z", price: 11, source: "live" },
      { date: "2026-09-03T00:00:00Z", price: 12, source: "live" },
      { date: "2026-09-04T00:00:00Z", price: 13, source: "live" },
      { date: "2026-09-05T00:00:00Z", price: 14, source: "live" },
    ], playerName: "Dense" }));
    // Dots at the series start (0) and the recorded/current boundary (3);
    // index 4 is the current diamond; plus the selected-point ring.
    expect(denseHtml.match(/<circle/g)?.length).toBe(3);
  });

  it("keeps every supplied sample selectable through the native slider", () => {
    const model = priceChartModel(history, "All")!;
    expect(model.points).toHaveLength(5);
    expect(model.positions).toHaveLength(5);
    expect(model.marked).toHaveLength(5);
    const html = render();
    expect(html).toContain('max="4"');
    expect(html).toContain("Inspect a point");
    expect(html).toContain("5 / 5");
    // The initial readout reflects the last supplied point; every other point
    // stays reachable through positions/nearestChartPoint and the slider.
    expect(html).toContain('aria-valuetext="8 Oct 2026, $30.00 FAAB, Current modeled quote"');
    expect(nearestChartPoint(model.positions, model.positions[0].x)).toBe(0);
    expect(nearestChartPoint(model.positions, model.positions[2].x)).toBe(2);
  });

  it("places a live selected readout adjacent to the slider", () => {
    const html = render();
    // The readout sits directly after the slider in DOM order, so it stays
    // visible next to the active control at 200% zoom and reduced heights.
    const sliderAt = html.indexOf('type="range"');
    const outputAt = html.indexOf("<output");
    expect(sliderAt).toBeGreaterThan(-1);
    expect(outputAt).toBeGreaterThan(sliderAt);
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain("8 Oct 2026, $30.00 FAAB, Current modeled quote");
    // Native range semantics: arrows/Home/End move one supplied point per step.
    expect(html).toContain('step="1"');
    expect(html).toContain('min="0"');
  });

  it("bounds gap-label layout with at least seven gaps: HTML list, never SVG rows", () => {
    // Regression: row allocation used to be unlimited (y = 164 - row*30), so
    // the seventh label of eight annual samples landed entirely above the
    // plot. Descriptions now render as wrapping HTML outside the fixed-height
    // plot, so the layout is bounded for any gap count.
    const annual: PriceHistoryPoint[] = Array.from({ length: 8 }, (_, year) => ({
      date: `20${19 + year}-01-01T00:00:00Z`, price: 5 + year * 7, source: "backtest" as const,
    }));
    const model = priceChartModel(annual, "All")!;
    expect(model.gaps).toHaveLength(7);
    expect(model.paths).toHaveLength(0);
    expect(model.points.map((p) => p.price)).toEqual([5, 12, 19, 26, 33, 40, 47, 54]);
    for (const gap of model.gaps) {
      // No unbounded row/x geometry survives on the model.
      expect("row" in gap).toBe(false);
      expect("x" in gap).toBe(false);
      expect(gap.label).toMatch(/^No samples supplied between \w{3,4} 20\d{2} – \w{3,4} 20\d{2}\.$/);
    }
    expect(model.gaps[0].label).toBe("No samples supplied between Jan 2019 – Jan 2020.");
    expect(model.gaps[6].label).toBe("No samples supplied between Jan 2025 – Jan 2026.");
    const html = render(annual);
    // Every description renders in the HTML list; no gap text lives in the SVG.
    expect(html.match(/No samples supplied between/g)?.length).toBe(7);
    expect(html).toContain('aria-label="Unconnected intervals"');
    expect(html).not.toContain("gapLabel");
    expect(html).toContain("7 long gaps not connected");
  });

  it("handles annual-only inputs and extrema without inventing samples", () => {
    const annual: PriceHistoryPoint[] = [
      { date: "2023-01-01T00:00:00Z", price: 5, source: "backtest" },
      { date: "2024-01-01T00:00:00Z", price: 50, source: "backtest" },
      { date: "2025-01-01T00:00:00Z", price: 15, source: "backtest" },
    ];
    const model = priceChartModel(annual, "All")!;
    // Two >90-day gaps: three isolated points, no paths, all marked, all labeled.
    expect(model.gaps).toHaveLength(2);
    expect(model.paths).toHaveLength(0);
    expect(model.marked).toEqual([true, true, true]);
    expect(model.points.map((p) => p.price)).toEqual([5, 50, 15]);
    const html = render(annual);
    expect(html).toContain("2 long gaps not connected");
    expect(html.match(/No samples supplied between/g)?.length).toBe(2);
    expect(html).toContain('max="2"');
  });

  it("renders zero and negative prices without dropping points or values", () => {
    const zero: PriceHistoryPoint[] = [
      { date: "2026-09-01T00:00:00Z", price: 0, source: "live" },
      { date: "2026-09-02T00:00:00Z", price: 0, source: "live" },
      { date: "2026-09-03T00:00:00Z", price: -3, source: "gamelog" },
    ];
    const original = structuredClone(zero);
    const model = priceChartModel(zero, "All")!;
    expect(model.points.map((p) => p.price)).toEqual([0, 0, -3]);
    expect(model.positions.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y))).toBe(true);
    expect(zero).toEqual(original);
    const html = render(zero);
    expect(html).toContain("$-3.00");
  });

  it("preserves mixed-source kind grouping across several provenance changes", () => {
    const mixed: PriceHistoryPoint[] = [
      { date: "2026-09-01T00:00:00Z", price: 10, source: "backtest" },
      { date: "2026-09-02T00:00:00Z", price: 11, source: "gamelog" },
      { date: "2026-09-03T00:00:00Z", price: 12, source: "gamelog" },
      { date: "2026-09-04T00:00:00Z", price: 13, source: "live" },
      { date: "2026-09-05T00:00:00Z", price: 14, source: "live" },
    ];
    const model = priceChartModel(mixed, "All")!;
    // Pairs: estimate, estimate, estimate (gamelog side), current. Two runs.
    expect(model.paths.map((p) => p.kind)).toEqual(["estimate", "current"]);
    expect(model.gaps).toHaveLength(0);
    // Source transitions keep their provenance markers independently of line
    // styling: the backtest→gamelog boundary (0–1) and gamelog→live boundary
    // (2–3) stay marked even though the pairs render as the same "estimate"
    // path kind. The estimate/current split marks 3–4 as before.
    expect(model.marked).toEqual([true, true, true, true, true]);
    const html = render(mixed);
    expect(html).not.toContain("No samples supplied between");
  });

  for (const price of [0, 20, -5]) it(`keeps flat and single-point geometry finite at ${price}`, () => {
    const flat = history.map((point) => ({ ...point, price }));
    const model = priceChartModel(flat, "All")!;
    expect(model.positions.every((point) => Number.isFinite(point.x) && Number.isFinite(point.y))).toBe(true);
    expect(new Set(model.positions.map((point) => point.y)).size).toBe(1);
    const single = priceChartModel(flat.slice(-1), "All")!;
    expect(single.paths).toEqual([]);
    expect(single.positions[0].x).toBe((PLOT.left + PLOT.right) / 2);
    expect(single.positions[0].y).toBeGreaterThanOrEqual(PLOT.top);
    expect(single.positions[0].y).toBeLessThanOrEqual(PLOT.bottom);
  });

  it("handles equal timestamps and nearest-point ties deterministically", () => {
    const points = history.map((point) => ({ ...point, date: history[0].date }));
    const model = priceChartModel(points, "All")!;
    expect(new Set(model.positions.map((point) => point.x)).size).toBe(1);
    expect(nearestChartPoint(model.positions, PLOT.left)).toBe(points.length - 1);
    expect(model.points).toHaveLength(points.length);
  });

  it("selects the nearest supplied point and clamps pointer positions beyond each end", () => {
    const model = priceChartModel(history, "All")!;
    expect(nearestChartPoint(model.positions, -500)).toBe(0);
    expect(nearestChartPoint(model.positions, 500)).toBe(history.length - 1);
    expect(nearestChartPoint(model.positions, model.positions[2].x)).toBe(2);
  });

  it("returns no chart for empty/invalid points and never manufactures coordinates", () => {
    expect(priceChartModel([], "All")).toBeNull();
    expect(priceChartModel([{ ...history[0], date: "bad" }, { ...history[1], price: NaN }], "All")).toBeNull();
    expect(render([])).toContain("No price history is available");
    expect(render([])).not.toContain("<svg");
    expect(render([])).not.toContain('type="range"');
  });

  it("renders labeled axes, visible range choices, source legend and a native point slider", () => {
    const html = render();
    for (const label of ["30D", "90D", "1Y", "All", "FAAB $", "Date (UTC)", "Inspect a point",
      "Reconstructed estimate · dashed", "Recorded snapshot · solid", "Current modeled quote · diamond"])
      expect(html).toContain(label);
    expect(html).toContain('type="range"');
    expect(html).toContain('min="0"');
    expect(html).toContain('max="4"');
    expect(html).toContain('aria-valuetext="8 Oct 2026, $30.00 FAAB, Current modeled quote"');
    expect(html).toContain("supplied, sampled points only");
    expect(html).toContain("Daily prices between samples are not shown");
    expect(html).toContain("longer intervals between supplied samples are not connected");
  });

  for (const source of ["live", "gamelog", "backtest"] as const) it(`shows one ${source} point without claiming movement`, () => {
    const html = render([{ ...history[0], source }]);
    expect(html).toContain('max="0"');
    expect(html).toContain("disabled");
    expect(html).not.toContain('x2="NaN"');
    expect(html).toContain(source === "live" ? "Historical movement is unavailable" : "There is no movement to compare");
    expect(html).toContain(source === "live" ? "Current modeled quote" : "Reconstructed");
  });
});
