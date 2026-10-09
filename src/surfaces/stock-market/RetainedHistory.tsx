import { useCallback, useEffect, useId, useRef, useState, type FormEvent, type PointerEvent } from "react";
import { StockHistoryClientError, type LoadStockHistoryPage } from "@/data/stock-history-client";
import type { StockHistoryKind, StockHistoryRangePage } from "@/domain/stock-history-range";
import { formatPrice } from "./format";
import { retainedHistoryPlot } from "./retained-history";
import { nearestChartPoint } from "./price-history-chart";
import chart from "./PriceHistoryChart.module.css";
import styles from "./RetainedHistory.module.css";

type Range = { from: string; to: string };
type SourceState = {
  pages: StockHistoryRangePage[];
  loading: boolean;
  error: "unavailable" | "error" | "restart" | null;
};
const sourceName = (kind: StockHistoryKind) => kind === "observed" ? "Recorded snapshots" : "Reconstructed estimates";

function HistorySource({ playerId, playerName, range, kind, loadPage }: {
  playerId: string; playerName: string; range: Range; kind: StockHistoryKind; loadPage: LoadStockHistoryPage;
}) {
  const id = useId();
  const [state, setState] = useState<SourceState>({ pages: [], loading: true, error: null });
  const [index, setIndex] = useState(0);
  const request = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const slider = useRef<HTMLInputElement>(null);
  const read = useCallback((cursor?: string) => {
    controller.current?.abort();
    const active = new AbortController();
    controller.current = active;
    const sequence = ++request.current;
    void Promise.resolve().then(() => loadPage(playerId,
      { from: range.from, to: range.to, kind, limit: 200, ...(cursor ? { cursor } : {}) }, active.signal)).then(page => {
      if (active.signal.aborted || sequence !== request.current) return;
      setState(current => ({ pages: cursor ? [...current.pages, page] : [page], loading: false, error: null }));
    }, error => {
      if (active.signal.aborted || sequence !== request.current) return;
      const restart = error instanceof StockHistoryClientError && error.status === 409;
      const unavailable = error instanceof StockHistoryClientError && error.page?.readStatus === "unavailable";
      setState(current => ({ pages: restart ? [] : current.pages, loading: false,
        error: restart ? "restart" : unavailable ? "unavailable" : "error" }));
    });
  }, [loadPage, playerId, range.from, range.to, kind]);
  useEffect(() => {
    void read();
    return () => { request.current += 1; controller.current?.abort(); };
  }, [read]);
  function startRead(cursor?: string) {
    setState(current => ({ pages: cursor ? current.pages : [], loading: true, error: null }));
    void read(cursor);
  }
  const records = state.pages.flatMap(page => page.records);
  const first = state.pages[0], last = state.pages.at(-1);
  const selected = Math.min(index, Math.max(0, records.length - 1));
  const record = records[selected];
  const plot = retainedHistoryPlot(state.pages);
  const point = plot?.points[selected];
  const valueText = record ? `${record.date}, ${formatPrice(record.priceCents / 100)} FAAB, ${record.source}, record ${record.id}` : "";
  const before = state.pages.flatMap(page => page.modeledWindow.intervals).filter(interval => interval.meaning === "before-first-estimate");
  function inspect(event: PointerEvent<SVGSVGElement>) {
    if (!plot?.points.length || !event.isPrimary) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (bounds.width > 0) setIndex(nearestChartPoint(plot.points, (event.clientX - bounds.left) / bounds.width * 360));
  }

  return <section className={styles.source} aria-labelledby={`${id}-title`} aria-busy={state.loading}>
    <h5 id={`${id}-title`}>{sourceName(kind)}</h5>
    <p className={chart.note}>{kind === "observed"
      ? "Recorded cents, unchanged. Dates use the database’s calendar; its timezone is unverified. Dots mark retained snapshots only."
      : "Stored reconstructed estimates in UTC. Dashed horizontal spans hold an estimate until the next update; they are not daily observations. Dollar calibration and historical receipt timing are unverified."}</p>
    <p role="status" className={chart.help}>{state.loading ? "Loading retained history…" :
      state.error === "restart" ? "Reconstruction changed. Restart this range to avoid mixing versions." :
      state.error === "unavailable" ? "This source is temporarily unavailable." :
      state.error === "error" ? "History could not be loaded. Try again." :
      `${records.length} retained records loaded${last?.hasMore ? "; more pages available" : "; retained range exhausted"}. Coverage remains unknown.`}</p>
    {state.error && records.length ? <p className={chart.note}>{records.length} earlier loaded records remain visible. This range is partial; coverage remains unknown.</p> : null}
    {state.error ? <button className={styles.button} type="button" disabled={state.loading}
      onClick={() => startRead(state.error === "restart" ? undefined : last?.nextCursor ?? undefined)}>
      {state.error === "restart" ? `Restart ${sourceName(kind).toLowerCase()}` : `Retry ${sourceName(kind).toLowerCase()}`}</button> : null}
    {plot ? <svg className={chart.plot} viewBox="0 0 360 176" role="img"
      aria-label={`${playerName}: ${sourceName(kind).toLowerCase()}, ${records.length} loaded records. ${kind === "observed" ? "Database calendar; timezone unverified." : "UTC; held reconstructed estimates."}`}
      onPointerDown={event => {
        if (event.button !== 0) return;
        slider.current?.focus({ preventScroll: true });
        event.currentTarget.setPointerCapture(event.pointerId);
        inspect(event);
      }} onPointerMove={inspect}>
      {[plot.high, plot.low].map((cents, i) => <g key={i}>
        <line className={chart.grid} x1={52} x2={344} y1={i ? 140 : 16} y2={i ? 140 : 16} />
        <text className={chart.axis} x={44} y={i ? 144 : 20} textAnchor="end">{formatPrice(cents / 100)}</text>
      </g>)}
      {plot.holds.map((hold, i) => <path key={i} className={`${chart.path} ${chart.estimate}`} d={`M${hold.x1} ${hold.y}H${hold.x2}`} />)}
      {plot.points.map((position, i) => <circle key={i} className={chart.point} cx={position.x} cy={position.y} r={2.5} />)}
      {point ? <circle className={chart.selectedPoint} cx={point.x} cy={point.y} r={6} /> : null}
      <text className={chart.axis} x={52} y={164}>{range.from}</text>
      <text className={chart.axis} x={344} y={164} textAnchor="end">{range.to} (exclusive)</text>
    </svg> : null}
    {record ? <>
      <label className={chart.sliderLabel} htmlFor={`${id}-record`}>Inspect a retained record <span>{selected + 1} / {records.length}</span></label>
      <input ref={slider} id={`${id}-record`} className={chart.slider} type="range" min={0} max={records.length - 1} step={1}
        value={selected} disabled={records.length === 1} aria-label={`Inspect ${sourceName(kind).toLowerCase()} for ${playerName}`}
        aria-valuetext={valueText} onChange={event => setIndex(Number(event.target.value))} />
      <div className={`${chart.readout} ${styles.exact}`} aria-live="polite">
        <strong className="gh-num">{formatPrice(record.priceCents / 100)} <small>FAAB</small></strong>
        <time dateTime={record.date}>{record.date}</time>
        <span>{record.source}{record.season ? ` · ${record.season}` : ""} · Record {record.id} · {record.priceCents} cents</span>
      </div>
      <p className={chart.help}>Tap the graph to inspect. Use the slider with arrow keys, Home or End for every retained record, including records with the same timestamp.</p>
    </> : !state.loading && !state.error ? <p className={chart.help}>No retained records in this range. Missing dates are not zero prices.</p> : null}
    {before.map((interval, i) => <p key={i} className={`${chart.note} ${styles.exact}`}>No earlier reconstructed estimate for {interval.from} to {interval.toExclusive} (exclusive).</p>)}
    {kind === "modeled" && last && last.modeledWindow.status !== "available" ? <p className={chart.note}>Held spans are unavailable because the reconstruction is {last.modeledWindow.status}. Stored updates remain inspectable.</p> : null}
    {!state.error && last?.hasMore ? <button type="button" className={styles.button} disabled={state.loading}
      onClick={() => startRead(last.nextCursor!)}>Load more {sourceName(kind).toLowerCase()}</button> : null}
    {first ? <details className={styles.provenance}><summary>Source & coverage</summary>
      <p className={styles.exact}>{kind === "observed" ? "Timestamp basis: database calendar, timezone unverified." : "Timestamp basis: UTC."}
        {first.provenance.declaredModelVersion ? ` Model: ${first.provenance.declaredModelVersion}.` : " Model version not declared."}
        {first.provenance.generation ? ` Publication: ${first.provenance.generation}.` : " Publication not declared."}</p>
      <ul>{first.coverage.limitations.map((limitation, i) => <li key={i}>{limitation}</li>)}</ul>
      <p>Only loaded records and qualified held spans are shown. An exhausted retained range does not establish daily or game coverage.</p>
    </details> : null}
  </section>;
}

/** On-demand, selected-player caller. Closing/replacing the inspector aborts both sources. */
export function RetainedHistory({ playerId, playerName, initialFrom, initialTo, loadPage }: {
  playerId: string; playerName: string; initialFrom: string; initialTo: string; loadPage: LoadStockHistoryPage;
}) {
  const id = useId();
  const [draft, setDraft] = useState<Range>({ from: initialFrom, to: initialTo });
  const [selection, setSelection] = useState<{ range: Range; revision: number } | null>(null);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.from || !draft.to || draft.from >= draft.to) return;
    setSelection(current => ({ range: { ...draft }, revision: (current?.revision ?? 0) + 1 }));
  }
  return <section className={`${chart.chart} ${styles.panel}`} aria-labelledby={`${id}-title`}>
    <h4 id={`${id}-title`}>Retained history</h4>
    <p className={chart.note}>Explore stored records beyond the sampled chart. Each source loads 200 records at a time; load more when needed.</p>
    <form className={styles.range} onSubmit={submit}>
      <label>From <input type="date" required value={draft.from} onChange={event => setDraft(current => ({ ...current, from: event.target.value }))} /></label>
      <label>Before <input type="date" required value={draft.to} onChange={event => setDraft(current => ({ ...current, to: event.target.value }))} /></label>
      <button type="submit" className={styles.button} disabled={!draft.from || !draft.to || draft.from >= draft.to}>Load retained history</button>
    </form>
    {selection ? <div key={selection.revision}>
      <p className={chart.help}>Showing {selection.range.from} through {selection.range.to} (exclusive).</p>
      {(["observed", "modeled"] as const).map(kind => <HistorySource key={kind} playerId={playerId} playerName={playerName}
        range={selection.range} kind={kind} loadPage={loadPage} />)}
    </div> : null}
  </section>;
}
