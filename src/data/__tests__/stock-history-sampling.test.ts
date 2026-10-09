import { describe, expect, it } from "vitest";
import type { PriceHistoryPoint } from "../../domain/stock";
import { samplePoints, stockDetailHistory } from "../stock-history-sampling";

const points = (n: number): PriceHistoryPoint[] => Array.from({ length: n }, (_, i) => ({
  date: new Date(Date.UTC(2024, 0, i + 1)).toISOString(), price: 20 + i, source: "gamelog",
}));
const current: PriceHistoryPoint = { date: "2026-10-08T00:00:00.000Z", price: 108.57, source: "live" };
describe("selected-player history sampling", () => {
  it.each([40, 400])("reserves current before sampling %i historical points and preserves both endpoints", n => {
    const history = points(n), result = stockDetailHistory(history, current);
    expect(result).toHaveLength(40);
    expect(result[0]).toBe(history[0]); expect(result.at(-2)).toBe(history.at(-1));
    expect(result.at(-1)).toBe(current);
  });
  it("leaves empty/short histories and point values intact without mutating inputs", () => {
    expect(stockDetailHistory([], current)).toEqual([current]);
    const history = points(5), before = JSON.stringify(history);
    expect(stockDetailHistory(history, current)).toEqual([...history, current]);
    expect(JSON.stringify(history)).toBe(before);
  });
  it("retains a recorded and modeled quote at the same timestamp separately", () => {
    const recorded = { ...current, price: 108.31 };
    expect(stockDetailHistory([recorded], current)).toEqual([recorded, current]);
  });
  it("keeps both sides of source transitions, including two sources at the same date", () => {
    const history = points(100);
    history[50] = { ...history[50], source: "backtest" };
    history[51] = { ...history[51], date: history[50].date, source: "live" };
    history[52] = { ...history[52], source: "live" };
    const result = samplePoints(history, 39);
    for (const i of [0, 49, 50, 51, 52, 53, 99]) expect(result).toContain(history[i]);
    expect(result.indexOf(history[50])).toBeLessThan(result.indexOf(history[51]));
  });
  it("preserves narrow extrema that uniform sampling can miss", () => {
    const history = points(100);
    history[17] = { ...history[17], price: 1 }; history[73] = { ...history[73], price: 250 };
    const result = samplePoints(history, 39);
    expect(result).toContain(history[17]); expect(result).toContain(history[73]);
    expect(new Set(result).size).toBe(result.length);
    expect(result.every(p => history.includes(p))).toBe(true);
  });
  it("orders overlapping query sources by date while keeping same-date input order", () => {
    const history = points(4);
    expect(samplePoints([history[2], history[0], history[3], history[1]], 39)).toEqual(history);
  });
  it("rejects invalid budgets/data and an unrepresentable provenance sequence", () => {
    expect(() => samplePoints(points(3), 1)).toThrow();
    expect(() => samplePoints(points(3), NaN)).toThrow();
    expect(() => samplePoints([{ ...current, date: "invalid" }], 39)).toThrow();
    expect(() => samplePoints([{ ...current, price: NaN }], 39)).toThrow();
    expect(() => samplePoints(points(50).map((p, i) => ({ ...p, source: i % 2 ? "live" : "gamelog" })), 39))
      .toThrow(/provenance/);
  });
});
