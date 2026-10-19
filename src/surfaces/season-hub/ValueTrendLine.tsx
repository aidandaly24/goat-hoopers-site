"use client";

import { useEffect, useState } from "react";
import type { RosterValueTrend } from "@/domain/roster-value";
import { cs } from "./CourtsideStyles";

const WIDTH = 264;
const HEIGHT = 64;
const PAD_X = 4;
const PAD_Y = 6;

/** Honest range label: the actual first recorded date of the series,
 * pinned to the league's timezone so server and client agree. */
const dayLabel = new Intl.DateTimeFormat("en-US", {
  month: "short", day: "numeric", timeZone: "America/New_York",
});

const deltaLabel = (delta: number) => delta > 0 ? `+$${delta.toFixed(2)}` : delta < 0 ? `−$${Math.abs(delta).toFixed(2)}` : "$0.00";

/**
 * The member's roster-value trend as an inline SVG sparkline. The series
 * is recorded points only (see rosterValueTrend): the caller renders this
 * component only when a real series of at least two points exists, so
 * there is no placeholder state here. Entrance is a stroke draw —
 * transform/opacity/stroke only, 300ms ease-out, fully suppressed under
 * prefers-reduced-motion by the stylesheet. The geometry normalizes the
 * value range to the frame; the numeric delta and start date carry the
 * magnitude, the line carries the shape.
 */
export function ValueTrendLine({ trend }: { trend: RosterValueTrend }) {
  const [drawn, setDrawn] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setDrawn(true));
    return () => cancelAnimationFrame(frame);
  }, []);
  const values = trend.points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min;
  const x = (index: number) => PAD_X + (index / (trend.points.length - 1)) * (WIDTH - PAD_X * 2);
  const y = (value: number) => span > 0
    ? PAD_Y + (1 - (value - min) / span) * (HEIGHT - PAD_Y * 2)
    : HEIGHT / 2;
  const d = trend.points.map((point, index) => `${index === 0 ? "M" : "L"}${x(index).toFixed(1)},${y(point.value).toFixed(1)}`).join(" ");
  const tone = trend.delta > 0 ? "trend-up" : trend.delta < 0 ? "trend-down" : "trend-flat";
  const firstDate = new Date(trend.points[0].date);
  return (
    <div className={cs("trend")} data-value-trend>
      <svg className={cs("trend-svg")} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <path className={cs("trend-line", tone)} d={d} pathLength={1}
          style={{ strokeDashoffset: drawn ? 0 : 1 }} />
      </svg>
      <p className={cs("trend-meta")}>
        <span className={`${cs("trend-delta", tone)} gh-num`}>{deltaLabel(trend.delta)}</span>
        <span>since {dayLabel.format(firstDate)}</span>
      </p>
    </div>
  );
}
