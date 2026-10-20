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

test("area tint is confined to complete recorded continuity, and never spans a missing day or a different source", () => {
  const source = teamValueHistoryFixture();
  const html = renderToStaticMarkup(<TeamValueHistoryChart points={source.points} range={source.requestedRange} selectedDay="2026-10-19" />);
  expect(html.match(/data-history-area/g)).toHaveLength(2);
  for (const priceKind of ["reconstructed", "mixed"] as const) {
    const points = source.points.filter(point => point.day >= "2026-10-08" && point.day <= "2026-10-09").map(point => ({ ...point, priceKind }));
    expect(renderToStaticMarkup(<TeamValueHistoryChart points={points} range={source.requestedRange} selectedDay={points[0].day} />)).not.toContain("data-history-area");
  }
  const partial = source.points.filter(point => point.day >= "2026-10-08" && point.day <= "2026-10-09").map(point => ({ ...point, priced: 2 }));
  expect(renderToStaticMarkup(<TeamValueHistoryChart points={partial} range={source.requestedRange} selectedDay={partial[0].day} />)).not.toContain("data-history-area");
});

test("quiet markers retain every line vertex and the selected day without adding a trend", () => {
  const source = teamValueHistoryFixture();
  const points = source.points.filter(point => point.day >= "2026-10-14" && point.day <= "2026-10-16").map(point => ({ ...point, priceKind: "recorded" as const, priced: 3, subtotalCents: 30000 }));
  const html = renderToStaticMarkup(<TeamValueHistoryChart points={points} range={source.requestedRange} selectedDay="2026-10-14" />);
  const vertices = html.match(/<polyline[^>]*points="([^"]+)"/)![1].split(" ");
  expect(vertices).toHaveLength(3);
  expect(new Set(vertices.map(vertex => vertex.split(",")[1])).size).toBe(1);
  expect(html.match(/data-history-point=/g)).toHaveLength(2);
  const selected = renderToStaticMarkup(<TeamValueHistoryChart points={points} range={source.requestedRange} selectedDay="2026-10-15" />);
  expect(selected.match(/data-history-point=/g)).toHaveLength(3);
});
