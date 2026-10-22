import { useId, type ReactNode } from "react";
import type { CurrentTeamQuote } from "@/domain/current-team-quote";
import { historyPointComplete, historySegments, shiftHistoryDay, type TeamHistoryPoint, type TeamHistoryRange } from "@/domain/team-value-history";
import { historyDayAtPosition, historyDayCount, historyLargestChanges, historyUnpricedRanges, historyValueChanges } from "./team-value-history-view";
import styles from "./TeamValueHistory.module.css";

const money = (cents: number) => "$" + (cents / 100).toLocaleString("en-US", { maximumFractionDigits: 2 });
const date = (day: string) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(day + "T00:00:00Z"));
const kind = (point: TeamHistoryPoint) => (point.priceKind === "recorded" ? styles.recorded
  : point.priceKind === "reconstructed" ? styles.reconstructed : point.priceKind === "mixed" ? styles.mixed : styles.partial) + (historyPointComplete(point) ? "" : " " + styles.partial);

/** Private client-subtree view. The entire calendar, including gaps, is selectable. */
export function TeamValueHistoryChart({ points, range, selectedDay, onSelectDay, caption, currentQuote, currentSelected, onSelectCurrent }: {
  points: TeamHistoryPoint[]; range: TeamHistoryRange; selectedDay: string; onSelectDay?: (day: string) => void;
  caption?: ReactNode; currentQuote?: CurrentTeamQuote | null; currentSelected?: boolean; onSelectCurrent?: () => void;
}) {
  const instructionId = useId();
  const currentDay = currentQuote?.calculatedAt.slice(0, 10);
  const plottedCurrent = currentQuote && currentQuote.subtotalCents !== null && currentDay! >= range.from && currentDay! < range.toExclusive ? currentQuote : null;
  const values = [...points.flatMap(point => point.subtotalCents === null ? [] : [point.subtotalCents]), ...(plottedCurrent ? [plottedCurrent.subtotalCents!] : [])];
  const low = values.length ? Math.min(...values) : 0, high = values.length ? Math.max(...values) : 0;
  const pad = Math.max(100, (high - low) * .12), min = Math.max(0, low - pad), max = high + pad;
  const start = Date.parse(range.from + "T00:00:00Z"), end = Date.parse(range.toExclusive + "T00:00:00Z");
  const days = historyDayCount(range), selectedIndex = Math.round((Date.parse(selectedDay + "T00:00:00Z") - start) / 86400000);
  const edge = (day: string) => (Date.parse(day + "T00:00:00Z") - start) / (end - start) * 584 + 8;
  const x = (day: string) => edge(day) + 292 / days;
  const y = (value: number) => 12 + (1 - (value - min) / (max - min)) * 156;
  const segments = historySegments(points);
  const largest = new Set(historyLargestChanges(historyValueChanges(points)).map(change => change.day));
  const selected = points.find(point => point.day === selectedDay);
  function selectAt(event: { clientX: number; clientY: number; currentTarget: HTMLDivElement }) {
    if (!onSelectDay) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const px = event.clientX - bounds.left, py = event.clientY - bounds.top;
    let nearest: TeamHistoryPoint | undefined, distance = Infinity;
    for (const point of points) {
      if (point.subtotalCents === null) continue;
      const delta = Math.hypot(x(point.day) / 600 * bounds.width - px, y(point.subtotalCents) / 184 * bounds.height - py);
      if (delta < distance) { nearest = point; distance = delta; }
    }
    if (plottedCurrent && onSelectCurrent) {
      const delta = Math.hypot(x(currentDay!) / 600 * bounds.width - px, y(plottedCurrent.subtotalCents!) / 184 * bounds.height - py);
      if (delta <= 16 && (delta < distance || delta === distance && currentSelected)) { onSelectCurrent(); return; }
    }
    onSelectDay(nearest && distance <= 16 ? nearest.day : historyDayAtPosition(range, (px / bounds.width * 600 - 8) / 584));
  }
  const currentMarker = plottedCurrent && <path className={styles.currentMarker} data-history-current data-quote-calculation={plottedCurrent.calculationId}
    d={`M${x(currentDay!)} ${y(plottedCurrent.subtotalCents!) - 6}l6 6-6 6-6-6Z`} vectorEffect="non-scaling-stroke">
    <title>{`Current modeled quote: ${money(plottedCurrent.subtotalCents!)}${plottedCurrent.complete ? "" : " subtotal"} · ${plottedCurrent.priced}/${plottedCurrent.rosterCount} priced · ${plottedCurrent.calculatedAt}`}</title>
  </path>;
  return <figure className={styles.figure} data-team-history-chart>
    {caption && <figcaption className={styles.chartHeader}>{caption}</figcaption>}
    <div className={styles.plot}>
      <div className={styles.yAxis} aria-hidden="true"><span>{values.length ? money(max) : "FAAB"}</span><span>{values.length ? money(min) : "—"}</span></div>
      <div className={styles.plotCanvas} data-history-timeline role={onSelectDay ? "slider" : undefined}
        tabIndex={onSelectDay ? 0 : undefined} aria-label={onSelectDay ? "Team value timeline" : undefined}
        aria-describedby={onSelectDay ? instructionId : undefined}
        aria-keyshortcuts={onSelectDay ? "ArrowLeft ArrowRight ArrowUp ArrowDown Home End PageUp PageDown" : undefined}
        aria-valuemin={onSelectDay ? 0 : undefined} aria-valuemax={onSelectDay ? days - 1 : undefined}
        aria-valuenow={onSelectDay ? selectedIndex : undefined}
        aria-valuetext={onSelectDay ? currentSelected ? `Current modeled quote, ${currentQuote?.subtotalCents != null ? money(currentQuote.subtotalCents) + (currentQuote.complete ? "" : " subtotal") : "unavailable"}${currentQuote ? `, ${currentQuote.priced}/${currentQuote.rosterCount ?? "unknown"} priced` : ""}`
          : date(selectedDay) + " UTC, " + (selected?.subtotalCents != null ? money(selected.subtotalCents) + (historyPointComplete(selected) ? " " : " subtotal, ") + selected.priceKind + ", " + selected.priced + "/" + selected.rosterCount + " priced" : "valuation unavailable") : undefined}
        onFocus={onSelectDay ? () => { if (!currentSelected) onSelectDay(selectedDay); } : undefined}
        onPointerMove={onSelectDay ? event => { if (event.pointerType === "mouse") selectAt(event); } : undefined}
        onClick={onSelectDay ? event => {
          if ((event.target as Element).closest("[data-history-current]") && onSelectCurrent) { onSelectCurrent(); return; }
          const target = (event.target as Element).closest<SVGElement>("[data-history-day]");
          if (target?.dataset.historyDay) onSelectDay(target.dataset.historyDay); else selectAt(event);
        } : undefined}
        onKeyDown={onSelectDay ? event => {
          if (onSelectCurrent && currentQuote && event.key === "End") { event.preventDefault(); onSelectCurrent(); return; }
          if (currentSelected && (event.key === "ArrowLeft" || event.key === "ArrowDown")) {
            event.preventDefault();
            onSelectDay(points.filter(point => point.day <= selectedDay).at(-1)?.day ?? (selectedDay > range.from ? shiftHistoryDay(selectedDay, -1) : range.from));
            return;
          }
          const amounts: Record<string, number> = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1, PageUp: -7, PageDown: 7 };
          const next = event.key === "Home" ? range.from : event.key === "End" ? shiftHistoryDay(range.toExclusive, -1)
            : event.key in amounts ? shiftHistoryDay(selectedDay, amounts[event.key]) : null;
          if (next !== null) {
            event.preventDefault();
            if (currentQuote && onSelectCurrent && currentDay! < next && (event.key === "ArrowRight" || event.key === "ArrowUp")) { onSelectCurrent(); return; }
            onSelectDay(next < range.from ? range.from : next >= range.toExclusive ? shiftHistoryDay(range.toExclusive, -1) : next);
          }
        } : undefined}>
        <svg viewBox="0 0 600 184" preserveAspectRatio="none" role={onSelectDay ? undefined : "img"} aria-hidden={onSelectDay ? true : undefined}
          aria-label={"Daily modeled FAAB valuations, " + date(range.from) + " through " + date(shiftHistoryDay(range.toExclusive, -1)) + ". " + points.filter(point => point.subtotalCents !== null).length + (currentQuote ? " historical" : "") + " priced dates of " + days + " calendar days." + (plottedCurrent ? " A separate current modeled quote is shown." : "") + " Gaps are not filled."}>
          {historyUnpricedRanges(points, range).map(gap => <rect key={gap.from} x={edge(gap.from)} y="0" width={edge(gap.toExclusive) - edge(gap.from)} height="184" className={styles.gapBand} data-history-gap>
            <title>{"No loaded supported valuation: " + date(gap.from) + " through " + date(shiftHistoryDay(gap.toExclusive, -1))}</title>
          </rect>)}
          {[12, 90, 168].map(row => <line key={row} x1="8" x2="592" y1={row} y2={row} className={styles.gridLine} />)}
          <line x1={x(selectedDay)} x2={x(selectedDay)} y1="0" y2="184" className={styles.selectedLine} />
          {!currentSelected && currentMarker}
          {segments.map(segment => <g key={segment[0].id} className={kind(segment[0])} data-history-segment data-segment-points={segment.length}>
            {segment.length > 1 && segment[0].priceKind === "recorded" && segment.every(historyPointComplete) && <polygon className={styles.area} aria-hidden="true" data-history-area
              points={x(segment[0].day) + ",168 " + segment.map(point => x(point.day) + "," + y(point.subtotalCents!)).join(" ") + " " + x(segment.at(-1)!.day) + ",168"} />}
            {segment.length > 1 && segment[0].priceKind !== "unavailable" && <polyline fill="none" vectorEffect="non-scaling-stroke"
              points={segment.map(point => x(point.day) + "," + y(point.subtotalCents!)).join(" ")} />}
            {segment.map(point => {
              const important = largest.has(point.day);
              const title = date(point.day) + ": " + money(point.subtotalCents!) + " · " + point.priceKind + " · " + point.priced + "/" + point.rosterCount + " priced";
              return historyPointComplete(point) ? <circle key={point.id} cx={x(point.day)} cy={y(point.subtotalCents!)} r={point.day === selectedDay ? 4 : important ? 3.5 : 2.5}
                vectorEffect="non-scaling-stroke" data-history-point={point.id} data-history-day={point.day} data-history-change={important ? point.day : undefined}><title>{title}</title></circle>
                : <rect key={point.id} x={x(point.day) - 2.5} y={y(point.subtotalCents!) - 2.5} width="5" height="5" className={styles.partial}
                  vectorEffect="non-scaling-stroke" data-history-point={point.id} data-history-day={point.day}><title>{title}</title></rect>;
            })}
          </g>)}
          {currentSelected && currentMarker}
        </svg>
      </div>
    </div>
    <div className={styles.xAxis}><span>{date(range.from)}</span><span>{date(shiftHistoryDay(range.toExclusive, -1))}</span></div>
    {onSelectDay && <p id={instructionId} className={styles.srOnly}>Hover or tap a point. Arrow keys change day, PageUp and PageDown change week, and Home and End select the range edges. {currentQuote && "End selects the separate current modeled quote; left from Current returns to the latest saved point. The Current and History controls distinguish same-day or overlapping quotes. "}All days includes the full league calendar; missing prices stay unavailable.</p>}
  </figure>;
}
