"use client";

import { useEffect, useId, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { HomeTeamSummary } from "@/domain/personalized-home";
import {
  historyDetailMatchesPoint, historyInstantKey, historyPointComplete, historyRangeContains, isTeamValueHistoryEnvelope,
  shiftHistoryDay, validHistoryDay, validHistoryRange,
  type TeamHistoryPoint, type TeamHistoryRange, type TeamValueHistoryDetail, type TeamValueHistoryEnvelope,
} from "@/domain/team-value-history";
import { SectionHeading } from "@/ui/SectionHeading";
import controls from "@/ui/controls.module.css";
import { createTeamHistoryClient, TeamHistoryReadError } from "./TeamValueHistoryClient";
import { TeamValueHistoryChart } from "./TeamValueHistoryChart";
import { TeamValueHistoryDetail as DayDetail } from "./TeamValueHistoryDetail";
import { historyDayCount, historyInitialRange, historyObservationRange, historyPreviousPoint, historyValueChanges } from "./team-value-history-view";
import styles from "./TeamValueHistory.module.css";

const money = (cents: number) => `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const signedMoney = (cents: number) => (cents < 0 ? "−" : "+") + money(Math.abs(cents));
const fullDay = (day: string) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${day}T00:00:00Z`));
const shortStatus = (value: string) => value === "verified" ? "Verified roster" : value === "replayed" ? "Replayed roster · unverified" : value === "ambiguous" ? "Ambiguous roster" : "Roster unavailable";
const priceLabel = (point: TeamHistoryPoint) => point.rosterCount === 0 ? "Empty roster" : point.priceKind === "recorded" ? "Saved snapshot"
  : point.priceKind === "reconstructed" ? "Reconstructed model" : point.priceKind === "mixed" ? "Mixed sources" : "No dated price";
type PageState = "idle" | "loading" | "error" | "changed";
type DetailState = { key: string } & ({ kind: "loading" } | { kind: "ready"; value: TeamValueHistoryDetail } | { kind: "error"; changed: boolean });
type HistoryProps = {
  history: TeamValueHistoryEnvelope; detailEndpoint?: string; pageEndpoint?: string;
  currentValue?: Pick<HomeTeamSummary, "market"> & {
    team: Pick<HomeTeamSummary["team"], "id">;
    valuation: Pick<HomeTeamSummary["valuation"], "total" | "priced" | "unpriced" | "complete" | "knownRoster">;
  };
};

/** The timeline selects the day; detail stays directly beneath it. */
export function TeamValueHistory(props: HistoryProps) {
  if (!isTeamValueHistoryEnvelope(props.history)) return <p className={styles.notice}>Team history is unavailable. No value has been substituted.</p>;
  return <HistoryView key={props.history.team.id} {...props} />;
}

function RefreshHistory() {
  const router = useRouter(), [pending, startTransition] = useTransition();
  return <button type="button" className={controls.secondary} disabled={pending} aria-busy={pending}
    onClick={event => {
      event.currentTarget.closest("[data-team-value-history]")?.querySelector<HTMLElement>("[data-history-timeline]")?.focus({ preventScroll: true });
      startTransition(() => router.refresh());
    }}>{pending ? "Refreshing history…" : "Refresh history"}</button>;
}

function HistoryView({ history, detailEndpoint, pageEndpoint, currentValue }: HistoryProps) {
  const id = useId();
  // A new server envelope takes precedence over pages from an older props delivery.
  // Keeping the team subtree mounted preserves selection and keyboard focus.
  const [pageEnvelope, setPageEnvelope] = useState<{ source: TeamValueHistoryEnvelope; value: TeamValueHistoryEnvelope } | null>(null);
  const envelope = pageEnvelope?.source === history ? pageEnvelope.value : history;
  const [zoomRange, setRange] = useState(() => historyInitialRange(history.points, history.leagueRange));
  const [preset, setPreset] = useState(() => zoomRange.from === history.leagueRange.from && zoomRange.toExclusive === history.leagueRange.toExclusive ? "all" : "values");
  const boundedRange = { from: zoomRange.from < envelope.leagueRange.from ? envelope.leagueRange.from : zoomRange.from,
    toExclusive: zoomRange.toExclusive > envelope.leagueRange.toExclusive ? envelope.leagueRange.toExclusive : zoomRange.toExclusive };
  const range = preset === "all" ? envelope.leagueRange : validHistoryRange(boundedRange) ? boundedRange : envelope.leagueRange;
  const [selection, setSelectedDay] = useState(() => [...history.points].filter(point => point.subtotalCents !== null).sort((a, b) => a.day.localeCompare(b.day)).at(-1)?.day ?? shiftHistoryDay(history.leagueRange.toExclusive, -1));
  const selectedDay = selection < range.from ? range.from : selection >= range.toExclusive ? shiftHistoryDay(range.toExclusive, -1) : selection;
  const viewKey = `${envelope.team.id}/${envelope.generation}/${envelope.asOf}`;
  const [rangeError, setRangeError] = useState(""), [inspecting, setInspecting] = useState(false), [attempt, setAttempt] = useState(0);
  const [detail, setDetail] = useState<DetailState>({ key: "", kind: "loading" });
  const [comparison, setComparison] = useState<DetailState>({ key: "", kind: "loading" });
  const [invalidView, setInvalidView] = useState<string | null>(null);
  const viewChanged = invalidView === viewKey;
  const [pageStatus, setPageStatus] = useState<{ key: string; kind: PageState }>({ key: "", kind: "idle" });
  const pageState = pageStatus.key === viewKey ? pageStatus.kind : "idle";
  const setPageState = (kind: PageState) => setPageStatus({ key: viewKey, kind });
  const cache = useRef(new Map<string, TeamValueHistoryDetail>());
  const pageRequest = useRef<AbortController | null>(null), pageSequence = useRef(0);
  const client = useMemo(() => createTeamHistoryClient(globalThis.fetch.bind(globalThis), { detail: detailEndpoint, page: pageEndpoint }), [detailEndpoint, pageEndpoint]);
  const points = useMemo(() => envelope.points.filter(point => point.day >= range.from && point.day < range.toExclusive).sort((a, b) => a.day.localeCompare(b.day)), [envelope.points, range.from, range.toExclusive]);
  const changes = useMemo(() => historyValueChanges(points), [points]);
  const selectedChange = changes.find(change => change.day === selectedDay);
  const point = points.find(point => point.day === selectedDay);
  const previousPoint = useMemo(() => point?.subtotalCents != null ? historyPreviousPoint(envelope.points, selectedDay) : undefined, [envelope.points, point, selectedDay]);
  const detailKey = `${viewKey}/${selectedDay}`;
  const previousKey = previousPoint ? `${viewKey}/${previousPoint.day}` : "";
  const selectedLoaded = selectedDay >= envelope.loadedRange.from && selectedDay < envelope.loadedRange.toExclusive;
  const rangeLoaded = historyRangeContains(envelope.loadedRange, range);
  const sameRequestedRange = envelope.requestedRange.from === range.from && envelope.requestedRange.toExclusive === range.toExclusive;


  useEffect(() => {
    if (!inspecting || viewChanged) return;
    const controller = new AbortController();
    async function read(day: string, expected?: TeamHistoryPoint) {
        const key = `${viewKey}/${day}`;
        const value = cache.current.get(key) ?? await client.detail({ teamId: envelope.team.id, generation: envelope.generation, day }, controller.signal);
        if (controller.signal.aborted) throw new DOMException("Aborted", "AbortError");
        if (historyInstantKey(value.valuationAt)! > historyInstantKey(envelope.asOf)!) throw new TeamHistoryReadError("changed", "History details exceed this view's cutoff");
        if (expected && !historyDetailMatchesPoint(value, expected)) throw new TeamHistoryReadError("changed", "History details changed");
        cache.current.set(key, value);
        if (cache.current.size > 16) cache.current.delete(cache.current.keys().next().value!);
        return value;
    }
    const failed = (key: string, set: typeof setDetail) => (error: unknown) => {
      if (!controller.signal.aborted) {
        const changed = error instanceof TeamHistoryReadError && error.kind === "changed";
        if (changed) { cache.current.clear(); setInvalidView(viewKey); controller.abort(); }
        set({ key, kind: "error", changed });
      }
    };
    const timer = setTimeout(() => {
      // At most two lazy detail reads. They start together; selected evidence
      // displays independently of comparison failure or latency.
      void read(selectedDay, point).then(value => { if (!controller.signal.aborted) setDetail({ key: detailKey, kind: "ready", value }); }, failed(detailKey, setDetail));
      if (previousPoint) void read(previousPoint.day, previousPoint).then(value => {
        if (!controller.signal.aborted) setComparison({ key: previousKey, kind: "ready", value });
      }, failed(previousKey, setComparison));
    }, 200);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [attempt, cache, client, detailKey, envelope.asOf, envelope.generation, envelope.team.id, inspecting, point, previousPoint, previousKey, selectedDay, viewChanged, viewKey]);
  useEffect(() => {
    const viewCache = cache.current;
    viewCache.clear();
    return () => { viewCache.clear(); pageRequest.current?.abort(); };
  }, [viewKey]);

  function selectDay(day: string) {
    if (!validHistoryDay(day) || day < range.from || day >= range.toExclusive) return;
    if (day !== selectedDay || !inspecting) { setDetail({ key: "", kind: "loading" }); setComparison({ key: "", kind: "loading" }); }
    setSelectedDay(day); setInspecting(true);
  }
  async function loadRange(next: TeamHistoryRange, append: boolean) {
    pageRequest.current?.abort();
    const sequence = ++pageSequence.current, controller = new AbortController(); pageRequest.current = controller;
    setPageState("loading");
    try {
      const page = await client.page({ teamId: envelope.team.id, generation: envelope.generation, range: next,
        ...(append && envelope.page.nextCursor ? { cursor: envelope.page.nextCursor } : {}) }, controller.signal);
      if (controller.signal.aborted || sequence !== pageSequence.current) return;
      for (const item of page.points) {
        const prior = envelope.points.find(known => known.day === item.day);
        if (prior && JSON.stringify(prior) !== JSON.stringify(item)) throw new TeamHistoryReadError("changed", "History point changed");
      }
      if (append) {
        if (page.loadedRange.from > envelope.loadedRange.toExclusive || page.loadedRange.toExclusive < envelope.loadedRange.from
          || page.page.nextCursor !== null && page.page.nextCursor === envelope.page.nextCursor) throw new TeamHistoryReadError("invalid", "History page did not advance");
        const merged = new Map(envelope.points.map(item => [item.id, item]));
        for (const item of page.points) {
          if (merged.has(item.id) && JSON.stringify(merged.get(item.id)) !== JSON.stringify(item)) throw new TeamHistoryReadError("changed", "History point changed");
          merged.set(item.id, item);
        }
        const combined = { ...page, points: [...merged.values()], loadedRange: {
          from: page.loadedRange.from < envelope.loadedRange.from ? page.loadedRange.from : envelope.loadedRange.from,
          toExclusive: page.loadedRange.toExclusive > envelope.loadedRange.toExclusive ? page.loadedRange.toExclusive : envelope.loadedRange.toExclusive,
        } };
        if (!isTeamValueHistoryEnvelope(combined)) throw new TeamHistoryReadError("invalid", "History display limit reached");
        setPageEnvelope({ source: history, value: combined });
      } else setPageEnvelope({ source: history, value: page });
      setPageState("idle");
    } catch (error) {
      if (!controller.signal.aborted && sequence === pageSequence.current) {
        const changed = error instanceof TeamHistoryReadError && error.kind === "changed";
        if (changed) { cache.current.clear(); setInvalidView(viewKey); }
        setPageState(changed ? "changed" : "error");
      }
    }
  }
  function applyRange(next: TeamHistoryRange, label: string) {
    pageRequest.current?.abort(); ++pageSequence.current;
    if (!validHistoryRange(next) || !historyRangeContains(envelope.leagueRange, next)) { setRangeError("This range is unavailable."); return; }
    setRangeError(""); setRange(next); setPreset(label);
    const day = selectedDay < next.from ? next.from : selectedDay >= next.toExclusive ? shiftHistoryDay(next.toExclusive, -1) : selectedDay;
    setSelectedDay(day); if (day !== selectedDay) { setDetail({ key: "", kind: "loading" }); setComparison({ key: "", kind: "loading" }); }
    setPageState("idle");
    if (!historyRangeContains(envelope.loadedRange, next) && pageEndpoint) void loadRange(next, false);
  }
  const currentDetail = !viewChanged && detail.key === detailKey ? detail : null;
  const readyDetail = currentDetail?.kind === "ready" ? currentDetail.value : null;
  const readout = point ?? readyDetail;
  const current = currentValue?.team.id === envelope.team.id ? currentValue : null;
  const currentTotal = current?.valuation.total !== null && current?.valuation.total !== undefined
    && Number.isFinite(current.valuation.total) && current.valuation.total >= 0 ? current.valuation.total : null;
  const currentTime = current?.market && Number.isFinite(new Date(current.market.updatedAt).getTime())
    ? new Date(current.market.updatedAt).toISOString() : null;
  const currentComparison = previousPoint && comparison.key === previousKey ? comparison : null;
  const retryDetail = () => { cache.current.delete(detailKey); setDetail({ key: detailKey, kind: "loading" }); setAttempt(value => value + 1); };
  const retryComparison = () => { cache.current.delete(previousKey); setComparison({ key: previousKey, kind: "loading" }); setAttempt(value => value + 1); };
  return <section className={styles.root} data-team-value-history aria-label={`${envelope.team.name} historical roster valuation`}>
    <div className={styles.heading}><SectionHeading eyebrow={envelope.team.name} title="Value history" /></div>
    {rangeError && <p className={styles.notice} role="alert">{rangeError}</p>}
    <TeamValueHistoryChart points={points} range={range} selectedDay={selectedDay} onSelectDay={selectDay} caption={<>
      <div className={styles.presets} role="group" aria-label="Timeline range">
        <button type="button" className={controls.quiet} aria-pressed={preset === "values"}
          onClick={() => applyRange(historyObservationRange(envelope.points, envelope.leagueRange), "values")}>Values</button>
        <button type="button" className={controls.quiet} aria-pressed={preset === "all"}
          onClick={() => applyRange(envelope.leagueRange, "all")}>All days</button>
      </div>
      <div className={styles.readout} role="status" aria-live="polite" aria-atomic="true" data-history-readout>
        <span>{fullDay(selectedDay)} · UTC</span>
        <strong>{readout?.subtotalCents != null ? money(readout.subtotalCents) : selectedLoaded ? "Value not recorded" : "Summary not loaded"}</strong>
        <small>{point ? `${!historyPointComplete(point) && point.subtotalCents !== null ? "Subtotal · " : ""}${priceLabel(point)}` : readyDetail?.rosterCount === 0 ? "Empty roster" : "No dated price"}
          {readout && <span data-history-roster-status>{" · "}{readout.priced}/{readout.rosterCount ?? "unknown"} priced</span>}</small>
      </div>
    </>} />
    {viewChanged && <div className={styles.notice} role="status">
        <p>History changed. Refresh to inspect the new roster evidence.</p><RefreshHistory />
    </div>}
    <details id={`${id}-explanation`} className={styles.details} data-history-inspector aria-label={`Day explanation for ${fullDay(selectedDay)}`}
      onToggle={event => { if (event.currentTarget.open) setInspecting(true); }}>
      <summary>Roster &amp; moves</summary>
      {readout && <p className={styles.caption}>{shortStatus(readout.rosterStatus)}</p>}
      {viewChanged ? <p className={styles.caption}>Refresh history before inspecting this day.</p>
        : currentDetail?.kind === "ready" ? <DayDetail detail={currentDetail.value}
          previous={currentComparison?.kind === "ready" ? currentComparison.value : undefined}
          comparisonLoading={!!previousPoint && (!currentComparison || currentComparison.kind === "loading")}
          comparisonError={currentComparison?.kind === "error" ? currentComparison.changed ? "changed" : "unavailable" : undefined}
          retryComparison={retryComparison} /> : currentDetail?.kind === "error" ? <div className={styles.notice} role="status">
          <p>{currentDetail.changed ? "History changed. Refresh the page to inspect the new roster evidence." : "Day details could not be loaded."}</p>
          {!currentDetail.changed && detailEndpoint && <button type="button" className={controls.secondary} onClick={retryDetail}>Retry day details</button>}
        </div> : <p className={styles.notice} role="status">Loading roster and moves…</p>}
    </details>
    {(!rangeLoaded || envelope.page.nextCursor !== null && sameRequestedRange) && <div className={styles.pageNotice}>
      <p>{pageState === "loading" ? "Loading history…" : "Some dates in this range have not loaded."}</p>
      {pageEndpoint && pageState !== "loading" && <button type="button" className={controls.secondary} onClick={() => void loadRange(range, envelope.page.nextCursor !== null && sameRequestedRange)}>Load more history</button>}
    </div>}
    {(pageState === "error" || pageState === "changed") && <p className={styles.notice} role="status">{pageState === "changed" ? "History changed. Refresh the page for the new history." : "More history could not be loaded. Existing points remain available."}</p>}
    <details className={styles.evidence}><summary>Sources</summary>
      <p data-history-value-basis>The value above uses today’s roster and current modeled prices. This graph uses the roster and saved prices at the selected historical time. Different dates, rosters or price coverage can produce different totals.</p>
      {selectedChange && <p>Saved roster-value difference since {fullDay(selectedChange.previousDay)}: {signedMoney(selectedChange.cents)}. Price and membership changes can both contribute.</p>}
      {current && <p data-history-current-model>Current roster value above{!current.valuation.complete && currentTotal !== null ? " subtotal" : ""}: {currentTotal === null ? "unavailable" : money(Math.round(currentTotal * 100))} · {current.valuation.priced}/{current.valuation.knownRoster ? current.valuation.priced + current.valuation.unpriced : "unknown"} priced{currentTime && <> · calculated <time dateTime={currentTime}>{currentTime}</time></>}. Inputs may be cached.</p>}
      {readout && <p>Selected {readout.subtotalCents === null ? "roster inspection" : "snapshot"}: <time dateTime={readout.valuationAt}>{readout.valuationAt}</time>.</p>}
      <p className={styles.caption} data-history-coverage>{envelope.points.filter(item => item.subtotalCents !== null).length} loaded value observations across {historyDayCount(envelope.leagueRange)} calendar days, beginning {fullDay(envelope.leagueRange.from)}. Missing prices are not filled.</p>
      <p className={styles.caption}>All days opens the full league calendar. Only dates with retained price evidence have values; missing snapshots and older unrecorded prices are not recreated.</p>
      <p className={styles.caption}>Hover or tap for a date and value. Values focuses the loaded observations; All days keeps every league day accessible. Recorded, reconstructed and partial observations retain their source styles; no line is drawn through a missing day.</p>
      {envelope.currentQuote && <p>Saved quote for current roster{envelope.currentQuote.subtotalCents !== null && envelope.currentQuote.priced < envelope.currentQuote.rosterCount ? " subtotal" : ""}: {envelope.currentQuote.subtotalCents === null ? "unavailable" : money(envelope.currentQuote.subtotalCents)}
        {" · "}{envelope.currentQuote.priced}/{envelope.currentQuote.rosterCount} priced{envelope.currentQuote.rosterCount === 0 ? " · Empty roster" : ""} · {envelope.currentQuote.at}. Separate from the selected historical value.</p>}
      <ul>{envelope.sourceNotes.map((note, index) => <li key={index}>{note}</li>)}</ul>
      {(["roster", "valuation"] as const).map(key => <div key={key}><strong>{key === "roster" ? "Roster coverage" : "Value coverage"}</strong><ul>{envelope.coverage[key].filter(item => item.from < range.toExclusive && item.toExclusive > range.from).map((item, index) => <li key={index}>{fullDay(item.from)} – {fullDay(shiftHistoryDay(item.toExclusive, -1))}: {item.status.replaceAll("_", " ")} · {item.reason}</li>)}</ul></div>)}
    </details>
  </section>;
}
