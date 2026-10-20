import { historyPointComplete, historySegments, type TeamHistoryPoint, type TeamHistoryRange } from "@/domain/team-value-history";
import styles from "./TeamValueHistory.module.css";

const money = (cents: number) => `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
const date = (day: string) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${day}T00:00:00Z`));
const kind = (point: TeamHistoryPoint) => `${point.priceKind === "recorded" ? styles.recorded
  : point.priceKind === "reconstructed" ? styles.reconstructed : styles.mixed}${historyPointComplete(point) ? "" : ` ${styles.partial}`}`;

/** Private chart view: the native day controls provide keyboard and touch input. */
export function TeamValueHistoryChart({ points, range, selectedDay }: {
  points: TeamHistoryPoint[]; range: TeamHistoryRange; selectedDay: string;
}) {
  const values = points.flatMap(point => point.subtotalCents === null ? [] : [point.subtotalCents]);
  const low = values.length ? Math.min(...values) : 0, high = values.length ? Math.max(...values) : 0;
  const pad = Math.max(100, (high - low) * .12), min = Math.max(0, low - pad), max = high + pad;
  const start = Date.parse(`${range.from}T00:00:00Z`), end = Date.parse(`${range.toExclusive}T00:00:00Z`);
  const x = (day: string) => (Date.parse(`${day}T12:00:00Z`) - start) / (end - start) * 600;
  const y = (value: number) => 12 + (1 - (value - min) / (max - min)) * 156;
  const segments = historySegments(points);
  return <figure className={styles.figure} data-team-history-chart>
    <figcaption className={styles.legend}>
      <span><i className={styles.recorded} />Recorded model</span>
      <span><i className={styles.reconstructed} />Reconstructed</span>
      <span><i className={styles.partial} />Partial subtotal</span>
      {points.some(point => point.priceKind === "mixed") && <span><i className={styles.mixed} />Mixed sources</span>}
    </figcaption>
    <div className={styles.plot}>
      <div className={styles.yAxis} aria-hidden="true"><span>{values.length ? money(max) : "FAAB"}</span><span>{values.length ? money(min) : "—"}</span></div>
      <svg viewBox="0 0 600 184" preserveAspectRatio="none" role="img"
        aria-label={`Daily modeled FAAB valuations, ${date(range.from)} through ${date(new Date(end - 86400000).toISOString().slice(0, 10))}. ${values.length} priced dates. Gaps are not filled.`}>
        {[12, 90, 168].map(row => <line key={row} x1="0" x2="600" y1={row} y2={row} className={styles.gridLine} />)}
        <line x1={x(selectedDay)} x2={x(selectedDay)} y1="0" y2="184" className={styles.selectedLine} />
        {segments.map(segment => <g key={segment[0].id} className={kind(segment[0])} data-history-segment data-segment-points={segment.length}>
          {segment.length > 1 && segment[0].priceKind !== "unavailable" && <polyline fill="none" vectorEffect="non-scaling-stroke"
            points={segment.map(point => `${x(point.day)},${y(point.subtotalCents!)}`).join(" ")} />}
          {segment.map(point => {
            const title = `${date(point.day)}: ${money(point.subtotalCents!)} · ${point.priceKind} · ${point.priced}/${point.rosterCount} priced`;
            return historyPointComplete(point) ? <circle key={point.id} cx={x(point.day)} cy={y(point.subtotalCents!)} r={point.day === selectedDay ? 5 : 3}
              vectorEffect="non-scaling-stroke" data-history-point={point.id}><title>{title}</title></circle>
              : <rect key={point.id} x={x(point.day) - 4} y={y(point.subtotalCents!) - 4} width="8" height="8"
                vectorEffect="non-scaling-stroke" data-history-point={point.id}><title>{title}</title></rect>;
          })}
        </g>)}
      </svg>
      {values.length === 0 && <p className={styles.plotEmpty}>No supported valuation in this range.<br />You can still inspect roster and move evidence.</p>}
    </div>
    <div className={styles.xAxis}><span>{date(range.from)}</span><span>{date(new Date(end - 86400000).toISOString().slice(0, 10))}</span></div>
    <p className={styles.caption}>Daily samples · UTC. Gaps and source changes stay separate. Values between samples are not observed.</p>
  </figure>;
}
