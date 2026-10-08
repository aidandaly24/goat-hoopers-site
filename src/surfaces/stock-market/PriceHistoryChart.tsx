"use client";

import { useId, useRef, useState, type PointerEvent } from "react";
import type { PriceHistoryPoint } from "@/domain";
import { formatPrice } from "./format";
import { CHART_RANGES, PLOT, nearestChartPoint, pointSource, priceChartModel, type ChartRange } from "./price-history-chart";
import styles from "./PriceHistoryChart.module.css";

const dateLabel = (date: string) => new Intl.DateTimeFormat("en-GB", {
  day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
}).format(new Date(date));
const axisDate = (date: string) => new Intl.DateTimeFormat("en-GB", {
  month: "short", year: "numeric", timeZone: "UTC",
}).format(new Date(date));

/** Inspect only the existing bounded detail points. No fetching or repricing. */
export function PriceHistoryChart({ history, playerName }: { history: PriceHistoryPoint[]; playerName: string }) {
  const id = useId();
  const slider = useRef<HTMLInputElement>(null);
  const [range, setRange] = useState<ChartRange>("All");
  const [index, setIndex] = useState(Math.max(0, history.length - 1));
  const model = priceChartModel(history, range);
  if (!model) return <section className={styles.chart} aria-labelledby={`${id}-title`}>
    <h4 id={`${id}-title`}>Price history</h4><p>No price history is available for this player.</p>
  </section>;
  const selected = Math.min(index, model.points.length - 1);
  const point = model.points[selected], position = model.positions[selected];
  const valueText = `${dateLabel(point.date)}, ${formatPrice(point.price)} FAAB, ${pointSource(point)}`;
  const first = model.points[0], last = model.points[model.points.length - 1];
  const hasEstimates = model.points.some((point) => point.source !== "live");
  const hasRecorded = model.points.some((point) => point.source === "live" && !point.current);
  const hasCurrent = model.points.some((point) => point.current);

  function inspect(event: PointerEvent<SVGSVGElement>) {
    if (!model || !event.isPrimary) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (bounds.width <= 0) return;
    const x = (event.clientX - bounds.left) / bounds.width * PLOT.width;
    setIndex(nearestChartPoint(model.positions, x));
  }

  return <section className={styles.chart} aria-labelledby={`${id}-title`}>
    <header className={styles.header}><h4 id={`${id}-title`}>Price history</h4><span>FAAB $</span></header>
    <div className={styles.ranges} role="group" aria-label={`History range for ${playerName}`}>
      {CHART_RANGES.map((choice) => <button type="button" key={choice} aria-pressed={range === choice}
        onClick={() => { setRange(choice); setIndex(Math.max(0, (priceChartModel(history, choice)?.points.length ?? 1) - 1)); }}>{choice}</button>)}
    </div>
    <div className={styles.readout}>
      <strong className="gh-num">{formatPrice(point.price)} <small>FAAB</small></strong>
      <time dateTime={point.date}>{dateLabel(point.date)}</time>
      <span>{pointSource(point)}</span>
    </div>
    <svg className={styles.plot} viewBox={`0 0 ${PLOT.width} ${PLOT.height}`} role="img"
      aria-label={`${playerName} price history. ${model.points.length} supplied points from ${dateLabel(first.date)} to ${dateLabel(last.date)}. ${valueText}.`}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        slider.current?.focus({ preventScroll: true });
        event.currentTarget.setPointerCapture(event.pointerId);
        inspect(event);
      }} onPointerMove={inspect}>
      {model.ticks.map((tick, tickIndex) => <g key={tickIndex}>
        <line className={styles.grid} x1={PLOT.left} x2={PLOT.right} y1={tick.y} y2={tick.y} />
        <text className={styles.axis} x={PLOT.left - 8} y={tick.y + 4} textAnchor="end">{formatPrice(tick.price)}</text>
      </g>)}
      <line className={styles.axisLine} x1={PLOT.left} x2={PLOT.left} y1={PLOT.top} y2={PLOT.bottom} />
      <line className={styles.axisLine} x1={PLOT.left} x2={PLOT.right} y1={PLOT.bottom} y2={PLOT.bottom} />
      {model.segments.map((segment, segmentIndex) => <line key={segmentIndex} className={`${styles.path} ${styles[segment.kind]}`}
        x1={segment.from.x} y1={segment.from.y} x2={segment.to.x} y2={segment.to.y} />)}
      {model.positions.map((position, pointIndex) => model.points[pointIndex].current
        ? <path key={pointIndex} className={styles.currentPoint} d={`M${position.x} ${position.y - 5}l5 5-5 5-5-5Z`} />
        : <circle key={pointIndex} className={styles.point} cx={position.x} cy={position.y} r="2.5" />)}
      <line className={styles.crosshair} x1={position.x} x2={position.x} y1={PLOT.top} y2={PLOT.bottom} />
      <circle className={styles.selectedPoint} cx={position.x} cy={position.y} r="8" />
      <text className={styles.axis} x={PLOT.left} y={PLOT.bottom + 22}>{axisDate(first.date)}</text>
      {first.time !== last.time ? <text className={styles.axis} x={PLOT.right} y={PLOT.bottom + 22} textAnchor="end">{axisDate(last.date)}</text> : null}
      <text className={styles.axis} x={(PLOT.left + PLOT.right) / 2} y={PLOT.height - 2} textAnchor="middle">Date (UTC)</text>
    </svg>
    <label className={styles.sliderLabel} htmlFor={`${id}-point`}>Inspect a point <span className="gh-num">{selected + 1} / {model.points.length}</span></label>
    <input ref={slider} id={`${id}-point`} className={styles.slider} type="range" min={0} max={model.points.length - 1}
      step={1} value={selected} disabled={model.points.length === 1} aria-label={`Inspect price history for ${playerName}`}
      aria-valuetext={valueText} aria-describedby={`${id}-help`} onChange={(event) => setIndex(Number(event.target.value))} />
    <p id={`${id}-help`} className={styles.help}>{model.points.length === 1
      ? point.current ? "Current quote only in this range. Historical movement is unavailable." : "One supplied point in this range. There is no movement to compare."
      : "Touch or move across the graph to inspect. Use the slider with arrow keys, Home or End for each supplied point."}</p>
    <ul className={styles.legend} aria-label="Price sources">
      {hasEstimates ? <li><span className={styles.estimateKey} aria-hidden="true" />Reconstructed estimate · dashed</li> : null}
      {hasRecorded ? <li><span className={styles.recordedKey} aria-hidden="true" />Recorded snapshot · solid</li> : null}
      {hasCurrent ? <li><span aria-hidden="true">◇</span>Current modeled quote · diamond</li> : null}
    </ul>
    <p className={styles.note}>Showing supplied, sampled points only. Lines connect samples; daily prices between them are not shown. Reconstructed estimates are not prices recorded at the time.</p>
  </section>;
}
