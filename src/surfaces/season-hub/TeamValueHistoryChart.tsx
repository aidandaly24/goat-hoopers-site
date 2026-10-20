import { historyPointComplete, historySegments, shiftHistoryDay, type TeamHistoryPoint, type TeamHistoryRange } from "@/domain/team-value-history";
import { historyDayAtPosition, historyDayCount, historyLargestChanges, historyUnpricedRanges, historyValueChanges } from "./team-value-history-view";
import styles from "./TeamValueHistory.module.css";

const money = (cents: number) => "$" + (cents / 100).toLocaleString("en-US", { maximumFractionDigits: 2 });
const date = (day: string) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(day + "T00:00:00Z"));
const kind = (point: TeamHistoryPoint) => (point.priceKind === "recorded" ? styles.recorded
  : point.priceKind === "reconstructed" ? styles.reconstructed : styles.mixed) + (historyPointComplete(point) ? "" : " " + styles.partial);

/** Private client-subtree view. The entire calendar, including gaps, is selectable. */
export function TeamValueHistoryChart({ points, range, selectedDay, onSelectDay }: {
  points: TeamHistoryPoint[]; range: TeamHistoryRange; selectedDay: string; onSelectDay?: (day: string) => void;
}) {
  const values = points.flatMap(point => point.subtotalCents === null ? [] : [point.subtotalCents]);
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
  return <figure className={styles.figure} data-team-history-chart>
    <figcaption className={styles.legend}>
      <span><i className={styles.recorded} />Recorded model</span>
      <span><i className={styles.reconstructed} />Reconstructed</span>
      <span><i className={styles.partial} />Partial subtotal</span>
      <span><i className={styles.gapKey} />No loaded value</span>
      {points.some(point => point.priceKind === "mixed") && <span><i className={styles.mixed} />Mixed sources</span>}
    </figcaption>
    <div className={styles.plot}>
      <div className={styles.yAxis} aria-hidden="true"><span>{values.length ? money(max) : "FAAB"}</span><span>{values.length ? money(min) : "—"}</span></div>
      <div className={styles.plotCanvas} data-history-timeline role={onSelectDay ? "slider" : undefined}
        tabIndex={onSelectDay ? 0 : undefined} aria-label={onSelectDay ? "Select a history day" : undefined}
        aria-valuemin={onSelectDay ? 0 : undefined} aria-valuemax={onSelectDay ? days - 1 : undefined}
        aria-valuenow={onSelectDay ? selectedIndex : undefined}
        aria-valuetext={onSelectDay ? date(selectedDay) + " UTC, " + (selected?.subtotalCents != null ? money(selected.subtotalCents) + " " + selected.priceKind : "valuation unavailable") : undefined}
        onClick={onSelectDay ? event => {
          const bounds = event.currentTarget.getBoundingClientRect();
          onSelectDay(historyDayAtPosition(range, ((event.clientX - bounds.left) / bounds.width * 600 - 8) / 584));
        } : undefined}
        onKeyDown={onSelectDay ? event => {
          const amounts: Record<string, number> = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1, PageUp: -7, PageDown: 7 };
          const next = event.key === "Home" ? range.from : event.key === "End" ? shiftHistoryDay(range.toExclusive, -1)
            : event.key in amounts ? shiftHistoryDay(selectedDay, amounts[event.key]) : null;
          if (next !== null) {
            event.preventDefault();
            onSelectDay(next < range.from ? range.from : next >= range.toExclusive ? shiftHistoryDay(range.toExclusive, -1) : next);
          }
        } : undefined}>
        <svg viewBox="0 0 600 184" preserveAspectRatio="none" role={onSelectDay ? undefined : "img"} aria-hidden={onSelectDay ? true : undefined}
          aria-label={"Daily modeled FAAB valuations, " + date(range.from) + " through " + date(shiftHistoryDay(range.toExclusive, -1)) + ". " + values.length + " priced dates of " + days + " calendar days. Gaps are not filled."}>
          {historyUnpricedRanges(points, range).map(gap => <rect key={gap.from} x={edge(gap.from)} y="0" width={edge(gap.toExclusive) - edge(gap.from)} height="184" className={styles.gapBand} data-history-gap>
            <title>{"No loaded supported valuation: " + date(gap.from) + " through " + date(shiftHistoryDay(gap.toExclusive, -1))}</title>
          </rect>)}
          {[12, 90, 168].map(row => <line key={row} x1="8" x2="592" y1={row} y2={row} className={styles.gridLine} />)}
          <line x1={x(selectedDay)} x2={x(selectedDay)} y1="0" y2="184" className={styles.selectedLine} />
          {segments.map(segment => <g key={segment[0].id} className={kind(segment[0])} data-history-segment data-segment-points={segment.length}>
            {segment.length > 1 && segment[0].priceKind === "recorded" && segment.every(historyPointComplete) && <polygon className={styles.area} aria-hidden="true" data-history-area
              points={x(segment[0].day) + ",168 " + segment.map(point => x(point.day) + "," + y(point.subtotalCents!)).join(" ") + " " + x(segment.at(-1)!.day) + ",168"} />}
            {segment.length > 1 && segment[0].priceKind !== "unavailable" && <polyline fill="none" vectorEffect="non-scaling-stroke"
              points={segment.map(point => x(point.day) + "," + y(point.subtotalCents!)).join(" ")} />}
            {segment.map((point, index) => {
              const important = largest.has(point.day);
              if (segment.length > 2 && index !== 0 && index !== segment.length - 1 && point.day !== selectedDay && !important) return null;
              const title = date(point.day) + ": " + money(point.subtotalCents!) + " · " + point.priceKind + " · " + point.priced + "/" + point.rosterCount + " priced";
              return historyPointComplete(point) ? <circle key={point.id} cx={x(point.day)} cy={y(point.subtotalCents!)} r={point.day === selectedDay ? 4 : important ? 3.5 : segment.length === 1 ? 2.5 : 1.5}
                vectorEffect="non-scaling-stroke" data-history-point={point.id} data-history-change={important ? point.day : undefined}><title>{title}</title></circle>
                : <rect key={point.id} x={x(point.day) - 2.5} y={y(point.subtotalCents!) - 2.5} width="5" height="5" className={styles.partial}
                  vectorEffect="non-scaling-stroke" data-history-point={point.id}><title>{title}</title></rect>;
            })}
          </g>)}
        </svg>
      </div>
    </div>
    <div className={styles.xAxis}><span>{date(range.from)}</span><span>{date(shiftHistoryDay(range.toExclusive, -1))}</span></div>
    <p className={styles.caption}>{values.length} of {days} days have a supported valuation. {onSelectDay ? "Select the timeline or a calendar day to inspect it. Arrow keys move one day; Page Up/Down one week." : "Unpriced days remain visible."}</p>
  </figure>;
}
