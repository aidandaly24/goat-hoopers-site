import { expect, test, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { teamValueHistoryFixture } from "@/test/team-value-history-fixture";
import { TeamValueHistoryChart } from "./TeamValueHistoryChart";
import styles from "./TeamValueHistory.module.css";

test("SVG point titles render as one server/client-safe text value under React19", () => {
  const source = teamValueHistoryFixture("one"), error = vi.spyOn(console, "error").mockImplementation(() => {});
  try {
    const html = renderToStaticMarkup(<TeamValueHistoryChart points={source.points} range={source.requestedRange} selectedDay="2026-06-30" />);
    expect(html).toContain("Jun 30, 2026: $280 · reconstructed · 3/3 priced");
    expect(error).not.toHaveBeenCalled();
    expect(html).not.toContain("<polyline");
  } finally { error.mockRestore(); }
});

test("partial coverage adds a square marker while retaining its recorded/reconstructed source treatment", () => {
  const source = teamValueHistoryFixture(), points = source.points.filter(point => point.day === "2026-10-13");
  for (const priceKind of ["recorded", "reconstructed"] as const) {
    points[0] = { ...points[0], priceKind };
    const html = renderToStaticMarkup(<TeamValueHistoryChart points={points} range={source.requestedRange} selectedDay={points[0].day} />);
    expect(html).toContain(`<rect`);
    expect(html).toContain(`class="${styles[priceKind]} ${styles.partial}"`);
  }
});
