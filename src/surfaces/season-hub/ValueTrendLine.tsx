"use client";

import { useEffect, useState } from "react";
import type { RosterValueTrend } from "@/domain/roster-value";
import { cs } from "./CourtsideStyles";

const money = (value: number) => `$${Math.round(value).toLocaleString("en-US")}`;
const moneyExact = (value: number) => `${value < 0 ? "−" : "+"}$${Math.abs(value).toFixed(2)}`;
const dayLabel = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const dayFull = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

/**
 * The roster-value chart, drawn only from a genuine recorded series
 * (rosterValueTrend returns null below two recorded points, and the caller
 * renders the unavailable state instead). What the line measures is named
 * on the chart itself: today's roster repriced from recorded player
 * quotes. Recorded points are filled; the final point is the appended
 * current modeled quote — drawn hollow and captioned as not a recorded
 * snapshot. A change figure appears only between the first and last
 * RECORDED points and only when priced coverage is identical at both
 * ends; it is never presented as historical portfolio performance.
 * Entrance is transform/opacity only (Emil rules) and the line is fully
 * rendered without JS — the mounted state only gates the animation class.
 */
export function ValueTrendLine({ trend }: { trend: RosterValueTrend }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const points = trend.points;
  const recorded = points.filter((point) => !point.current);
  const firstRecorded = recorded[0];
  const lastRecorded = recorded[recorded.length - 1];
  const current = points[points.length - 1]?.current ? points[points.length - 1] : null;
  const values = points.map((point) => point.value);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const pad = rawMax === rawMin ? Math.max(1, rawMax * 0.02) : (rawMax - rawMin) * 0.12;
  const min = rawMin - pad;
  const max = rawMax + pad;
  const width = 560;
  const height = 190;
  const plot = { left: 10, right: 478, top: 18, bottom: 146 };
  const x = (index: number) => plot.left + (points.length < 2 ? 0 : (index / (points.length - 1)) * (plot.right - plot.left));
  const y = (value: number) => plot.top + (1 - (value - min) / (max - min)) * (plot.bottom - plot.top);
  const line = points.map((point, index) => `${x(index)},${y(point.value)}`).join(" ");
  const coverageEqual = firstRecorded && lastRecorded && firstRecorded.priced === lastRecorded.priced;
  const recordedDelta = firstRecorded && lastRecorded ? lastRecorded.value - firstRecorded.value : 0;
  const ariaLabel = `Team value over time. Current roster repriced from recorded player quotes, ${dayFull(firstRecorded.date)} to ${dayFull(lastRecorded.date)}, ${money(firstRecorded.value)} to ${money(lastRecorded.value)} at the recorded endpoints${current ? `, ending at a current modeled quote of ${money(current.value)}` : ""}.`;

  return (
    <figure className={cs("trend")} data-value-trend>
      <figcaption className={cs("trend-head")}>
        <span>Team value over time</span>
        <span className={cs("trend-kind")}>Current roster repriced from recorded player quotes</span>
      </figcaption>
      <div className={shown ? cs("trend-chart", "trend-in") : cs("trend-chart")}>
        <svg className={cs("trend-svg")} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={ariaLabel}>
          <polyline points={line} fill="none" strokeWidth="2" strokeDasharray="6 5" strokeLinecap="round" strokeLinejoin="round" />
          {points.map((point, index) => (
            point.current
              ? <circle key={point.date} cx={x(index)} cy={y(point.value)} r="5" className={cs("trend-point-current")} />
              : <circle key={point.date} cx={x(index)} cy={y(point.value)} r="3" className={cs("trend-point")} />
          ))}
          {current && (
            <text x={x(points.length - 1)} y={y(current.value) - 12} textAnchor="end" className={cs("trend-axis")}>current modeled quote</text>
          )}
          <text x={plot.right + 10} y={y(rawMax) + 4} className={cs("trend-axis")}>{money(rawMax)}</text>
          <text x={plot.right + 10} y={y(rawMin) + 4} className={cs("trend-axis")}>{money(rawMin)}</text>
          <text x={plot.left} y={height - 8} className={cs("trend-axis")}>{dayLabel(firstRecorded.date)}</text>
          <text x={plot.right} y={height - 8} textAnchor="end" className={cs("trend-axis")}>{dayLabel(points[points.length - 1].date)}</text>
        </svg>
      </div>
      <p className={cs("caption", "trend-meta")}>
        Recorded {dayFull(firstRecorded.date)} – {dayFull(lastRecorded.date)}.
        {current && <> The final point is the current modeled quote — not a recorded snapshot.</>}
      </p>
      {coverageEqual ? (
        <p className={cs("caption", "trend-meta")}>
          Recorded endpoints move {moneyExact(recordedDelta)} with {firstRecorded.priced} of {trend.participants} series players priced at both ends. A repricing of today’s roster — not the team’s historical value or performance.
        </p>
      ) : (
        <p className={cs("caption", "trend-meta")}>
          Priced coverage changes across the recorded points ({firstRecorded.priced} of {trend.participants} series players at the first, {lastRecorded.priced} at the last), so no single change figure is shown.
        </p>
      )}
    </figure>
  );
}
