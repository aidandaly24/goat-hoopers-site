import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { PriceHistoryPoint } from "@/domain";
import { PriceHistoryChart } from "./PriceHistoryChart";
import { chartPoints, nearestChartPoint, pointSource, PLOT, priceChartModel } from "./price-history-chart";

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

  it("plots actual time gaps rather than evenly spacing sampled observations", () => {
    const model = priceChartModel(history, "All")!;
    expect(model.positions[0].x).toBe(PLOT.left);
    expect(model.positions.at(-1)?.x).toBe(PLOT.right);
    const longGap = model.positions[2].x - model.positions[1].x;
    const shortGap = model.positions[4].x - model.positions[3].x;
    expect(longGap).toBeGreaterThan(shortGap * 20);
    expect(model.segments.map((segment) => segment.kind)).toEqual(["estimate", "estimate", "recorded", "current"]);
  });

  for (const price of [0, 20, -5]) it(`keeps flat and single-point geometry finite at ${price}`, () => {
    const flat = history.map((point) => ({ ...point, price }));
    const model = priceChartModel(flat, "All")!;
    expect(model.positions.every((point) => Number.isFinite(point.x) && Number.isFinite(point.y))).toBe(true);
    expect(new Set(model.positions.map((point) => point.y)).size).toBe(1);
    const single = priceChartModel(flat.slice(-1), "All")!;
    expect(single.segments).toEqual([]);
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
    expect(html).toContain("daily prices between them are not shown");
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
