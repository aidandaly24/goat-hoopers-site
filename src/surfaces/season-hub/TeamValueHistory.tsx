"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  historyDetailMatchesPoint, historyPointComplete, historyPresetRange, historyRangeContains, isTeamValueHistoryEnvelope,
  shiftHistoryDay, validHistoryDay, validHistoryRange,
  type TeamHistoryPoint, type TeamHistoryRange, type TeamValueHistoryDetail, type TeamValueHistoryEnvelope,
} from "@/domain/team-value-history";
import { SectionHeading } from "@/ui/SectionHeading";
import { ControlIcon } from "@/ui/ControlIcon";
import controls from "@/ui/controls.module.css";
import { createTeamHistoryClient, TeamHistoryReadError } from "./TeamValueHistoryClient";
import { TeamValueHistoryChart } from "./TeamValueHistoryChart";
import { TeamValueHistoryDetail as DayDetail } from "./TeamValueHistoryDetail";
import { historyCalendarMonths, historyLargestChanges, historyPreviousPoint, historyValueChanges } from "./team-value-history-view";
import styles from "./TeamValueHistory.module.css";

const money = (cents: number) => `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const signedMoney = (cents: number) => (cents < 0 ? "−" : "+") + money(Math.abs(cents));
const fullDay = (day: string) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${day}T00:00:00Z`));
const shortStatus = (value: string) => value === "verified" ? "Verified roster" : value === "replayed" ? "Replayed roster · unverified" : value === "ambiguous" ? "Ambiguous roster" : "Roster unavailable";
const priceLabel = (point: TeamHistoryPoint) => point.rosterCount === 0 ? "Empty roster" : point.priceKind === "recorded" ? "Recorded model quote"
  : point.priceKind === "reconstructed" ? "Reconstructed estimate" : point.priceKind === "mixed" ? "Recorded + reconstructed sources" : "Historical valuation unavailable";
type DetailState = { key: string } & ({ kind: "loading" } | { kind: "ready"; value: TeamValueHistoryDetail } | { kind: "error"; changed: boolean });

/**
 * Serializable server entrypoint; existing homepage wiring is owned by Muse.
 * Question: what was this historical roster worth, and what evidence supports it?
 * Action: choose a period/day, then inspect roster and sourced moves.
 * States: complete/partial/unavailable prices, independent roster confidence,
 * loading/error/changed generation. Narrow: fluid column, wrapping presets,
 * disclosed custom dates and native day input. Never infer missing prices,
 * trend, ownership timing or continuity from the presentation.
 */
export function TeamValueHistory(props: { history: TeamValueHistoryEnvelope; detailEndpoint?: string; pageEndpoint?: string }) {
  if (!isTeamValueHistoryEnvelope(props.history)) return <p className={styles.notice}>Team history is unavailable. No value has been substituted.</p>;
  return <HistoryView key={`${props.history.team.id}/${props.history.generation}/${props.history.asOf}/${props.history.requestedRange.from}/${props.history.requestedRange.toExclusive}`} {...props} />;
}

function HistoryView({ history, detailEndpoint, pageEndpoint }: { history: TeamValueHistoryEnvelope; detailEndpoint?: string; pageEndpoint?: string }) {
  const id = useId();
  const [envelope, setEnvelope] = useState(history), [range, setRange] = useState(history.leagueRange);
  const [preset, setPreset] = useState("all");
  const [customOpen, setCustomOpen] = useState(false);
  const [draft, setDraft] = useState({ from: range.from, through: shiftHistoryDay(range.toExclusive, -1) });
  const [selectedDay, setSelectedDay] = useState(shiftHistoryDay(range.toExclusive, -1));
  const [calendarMonth, setCalendarMonth] = useState(shiftHistoryDay(range.toExclusive, -1).slice(0, 7));
  const [dateError, setDateError] = useState(""), [inspecting, setInspecting] = useState(false), [attempt, setAttempt] = useState(0);
  const [detail, setDetail] = useState<DetailState>({ key: "", kind: "loading" });
  const [comparison, setComparison] = useState<DetailState>({ key: "", kind: "loading" });
  const [pageState, setPageState] = useState<"idle" | "loading" | "error" | "changed">("idle");
  const cache = useRef(new Map<string, TeamValueHistoryDetail>()), pageRequest = useRef<AbortController | null>(null), pageSequence = useRef(0);
  const customSummary = useRef<HTMLElement | null>(null);
  const inspector = useRef<HTMLElement | null>(null);
  const client = useMemo(() => createTeamHistoryClient(globalThis.fetch.bind(globalThis), { detail: detailEndpoint, page: pageEndpoint }), [detailEndpoint, pageEndpoint]);
  const points = useMemo(() => envelope.points.filter(point => point.day >= range.from && point.day < range.toExclusive).sort((a, b) => a.day.localeCompare(b.day)), [envelope.points, range.from, range.toExclusive]);
  const months = useMemo(() => historyCalendarMonths(range), [range]);
  const month = months.find(item => item.id === calendarMonth) ?? months.at(-1)!;
  const changes = useMemo(() => historyValueChanges(points), [points]);
  const largestChanges = historyLargestChanges(changes);
  const selectedChange = changes.find(change => change.day === selectedDay);
  const pricedDays = points.filter(point => point.subtotalCents !== null);
  const missingReason = envelope.coverage.valuation.find(item => item.from <= selectedDay && item.toExclusive > selectedDay)?.reason;
  const point = points.find(point => point.day === selectedDay);
  const previousPoint = useMemo(() => point?.subtotalCents != null ? historyPreviousPoint(envelope.points, selectedDay) : undefined, [envelope.points, point, selectedDay]);
  const detailKey = `${envelope.team.id}/${envelope.generation}/${selectedDay}`;
  const previousKey = previousPoint ? `${envelope.team.id}/${envelope.generation}/${previousPoint.day}` : "";
  const selectedLoaded = selectedDay >= envelope.loadedRange.from && selectedDay < envelope.loadedRange.toExclusive;
  const rangeLoaded = historyRangeContains(envelope.loadedRange, range);
  const sameRequestedRange = envelope.requestedRange.from === range.from && envelope.requestedRange.toExclusive === range.toExclusive;
  const days = (Date.parse(`${range.toExclusive}T00:00:00Z`) - Date.parse(`${range.from}T00:00:00Z`)) / 86400000;
  const dayIndex = (Date.parse(`${selectedDay}T00:00:00Z`) - Date.parse(`${range.from}T00:00:00Z`)) / 86400000;

  useEffect(() => {
    if (!inspecting) return;
    const controller = new AbortController();
    async function read(day: string, expected?: TeamHistoryPoint) {
        const key = `${envelope.team.id}/${envelope.generation}/${day}`;
        const value = cache.current.get(key) ?? await client.detail({ teamId: envelope.team.id, generation: envelope.generation, day }, controller.signal);
        if (controller.signal.aborted) throw new DOMException("Aborted", "AbortError");
        if (expected && !historyDetailMatchesPoint(value, expected)) throw new TeamHistoryReadError("changed", "History details changed");
        cache.current.set(key, value);
        if (cache.current.size > 16) cache.current.delete(cache.current.keys().next().value!);
        return value;
    }
    const failed = (key: string, set: typeof setDetail) => (error: unknown) => {
      if (!controller.signal.aborted) set({ key, kind: "error", changed: error instanceof TeamHistoryReadError && error.kind === "changed" });
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
  }, [attempt, client, detailKey, envelope.generation, envelope.team.id, inspecting, point, previousPoint, previousKey, selectedDay]);
  useEffect(() => () => { pageRequest.current?.abort(); }, []);

  function selectDay(day: string) {
    if (!validHistoryDay(day) || day < range.from || day >= range.toExclusive) return;
    if (day !== selectedDay || !inspecting) { setDetail({ key: "", kind: "loading" }); setComparison({ key: "", kind: "loading" }); }
    setSelectedDay(day); setCalendarMonth(day.slice(0, 7)); setInspecting(true);
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
        setEnvelope(combined);
      } else setEnvelope(page);
      setPageState("idle");
    } catch (error) { if (!controller.signal.aborted && sequence === pageSequence.current) setPageState(error instanceof TeamHistoryReadError && error.kind === "changed" ? "changed" : "error"); }
  }
  function applyRange(next: TeamHistoryRange, label: string) {
    pageRequest.current?.abort(); ++pageSequence.current;
    if (!validHistoryRange(next) || !historyRangeContains(envelope.leagueRange, next)) { setDateError("Choose a valid range within the league calendar."); setCustomOpen(true); return; }
    setDateError(""); setRange(next); setPreset(label); setDraft({ from: next.from, through: shiftHistoryDay(next.toExclusive, -1) });
    setCustomOpen(false); if (label === "custom") customSummary.current?.focus();
    const day = selectedDay < next.from ? next.from : selectedDay >= next.toExclusive ? shiftHistoryDay(next.toExclusive, -1) : selectedDay;
    setSelectedDay(day); setCalendarMonth(day.slice(0, 7)); if (day !== selectedDay) setDetail({ key: "", kind: "loading" }); setPageState("idle");
    if (!historyRangeContains(envelope.loadedRange, next) && pageEndpoint) void loadRange(next, false);
  }
  const currentDetail = detail.key === detailKey ? detail : null;
  const currentComparison = previousPoint && comparison.key === previousKey ? comparison : null;
  const retryDetail = () => { cache.current.delete(detailKey); setDetail({ key: detailKey, kind: "loading" }); setAttempt(value => value + 1); };
  const retryComparison = () => { cache.current.delete(previousKey); setComparison({ key: previousKey, kind: "loading" }); setAttempt(value => value + 1); };
  return <section className={styles.root} data-team-value-history aria-label={`${envelope.team.name} historical roster valuation`}>
    <div className={styles.heading}><SectionHeading eyebrow={envelope.team.name} title="Team value over time" /></div>
    <div className={styles.readout} role="status" aria-live="polite" aria-atomic="true" data-history-readout>
      <span>{fullDay(selectedDay)} · UTC</span>
      <strong>{point?.subtotalCents != null ? money(point.subtotalCents) : selectedLoaded ? "Valuation unavailable" : "Summary not loaded"}</strong>
      <span>{point ? `${!historyPointComplete(point) && point.subtotalCents !== null ? "Known-value subtotal · " : ""}${priceLabel(point)}` : selectedLoaded ? "No supported historical quote for this day" : "Select this day to inspect its evidence, or load the range below."}</span>
      <small>{point ? `${point.priced} of ${point.rosterCount ?? "unknown"} priced · ${shortStatus(point.rosterStatus)}` : "Roster and move evidence can still be inspected."}</small>
      {selectedChange && <p className={styles.dayChange}>{signedMoney(selectedChange.cents)} from {fullDay(selectedChange.previousDay)} · {selectedChange.priceKind === "recorded" ? "recorded" : selectedChange.priceKind} total difference. Quote and roster changes may both contribute.</p>}
      {!point && selectedLoaded && missingReason && <p className={styles.caption}>{missingReason}</p>}
    </div>
    <div className={styles.presets} role="group" aria-label="History range presets">
      {[{ id: "all", label: "All time" }, ...envelope.seasons.map(season => ({ id: `season:${season.id}`, label: season.label })), { id: "recent", label: "Last 30 days" }].map(item =>
        <button key={item.id} type="button" className={controls.secondary} aria-pressed={preset === item.id}
          onClick={() => applyRange(historyPresetRange(envelope, item.id), item.id)}>{item.label}</button>)}
    </div>
    <details className={styles.customRange} open={customOpen} onToggle={event => { if (event.currentTarget.open !== customOpen) setCustomOpen(event.currentTarget.open); }}>
      <summary ref={customSummary}>Choose dates <span>{fullDay(range.from)} – {fullDay(shiftHistoryDay(range.toExclusive, -1))}</span></summary>
      <form className={styles.rangeForm} onSubmit={event => { event.preventDefault(); if (!validHistoryDay(draft.from) || !validHistoryDay(draft.through)) { setDateError("Enter both calendar dates."); return; } applyRange({ from: draft.from, toExclusive: shiftHistoryDay(draft.through, 1) }, "custom"); }}>
      <label>From<input type="date" required value={draft.from} min={envelope.leagueRange.from} max={shiftHistoryDay(envelope.leagueRange.toExclusive, -1)} onChange={event => setDraft({ ...draft, from: event.target.value })} /></label>
      <label>Through<input type="date" required value={draft.through} min={envelope.leagueRange.from} max={shiftHistoryDay(envelope.leagueRange.toExclusive, -1)} onChange={event => setDraft({ ...draft, through: event.target.value })} /></label>
      <button className={controls.quiet} type="submit">Apply dates</button>
      </form>
      <p className={styles.caption}>UTC calendar days. Through includes the selected day.</p>
    </details>
    {dateError && <p className={styles.notice} role="alert">{dateError}</p>}
    <div className={styles.coverageSummary} data-history-coverage>
      <strong>{pricedDays.length} supported {pricedDays.length === 1 ? "day" : "days"} in this {days}-day window</strong>
      <p>League calendar: {fullDay(envelope.leagueRange.from)} – {fullDay(shiftHistoryDay(envelope.leagueRange.toExclusive, -1))}. Missing dates remain selectable.</p>
      {pricedDays.length < days && <p>{days - pricedDays.length} days have no loaded supported valuation. The full calendar stays visible; recent coverage does not reset the start.</p>}
      {pricedDays.length > 0 && <button type="button" className={controls.quiet} onClick={() => selectDay(pricedDays.at(-1)!.day)}>Inspect latest supported day · {fullDay(pricedDays.at(-1)!.day)}</button>}
      {pricedDays.length > 0 && <button type="button" className={controls.quiet} onClick={() => applyRange({ from: pricedDays[0].day, toExclusive: shiftHistoryDay(pricedDays.at(-1)!.day, 1) }, "supported")}>Zoom to dates with values</button>}
    </div>
    <TeamValueHistoryChart points={points} range={range} selectedDay={selectedDay} onSelectDay={selectDay} />
    {largestChanges.length > 0 && <div className={styles.changeList} data-history-changes>
      <h3>Largest observed changes</h3>
      <p className={styles.caption}>Differences between complete observations, not daily estimates or trade profit. Select a date for player and roster context.</p>
      <ul>{largestChanges.map(change => <li key={change.day}><button type="button" className={controls.secondary} aria-pressed={selectedDay === change.day} onClick={() => selectDay(change.day)}>
        <span>{fullDay(change.day)}</span><strong>{signedMoney(change.cents)}</strong><small>Since {fullDay(change.previousDay)} · {change.priceKind} total</small>
      </button></li>)}</ul>
    </div>}
    {pricedDays.length === 0 && <p className={styles.notice}>No supported price series in this window. Choose any day below to inspect available roster and move evidence.</p>}
    {inspecting && <button type="button" className={`${controls.quiet} ${styles.explainAction}`} onClick={() => {
      inspector.current?.focus(); inspector.current?.scrollIntoView({ block: "start" });
    }}>View explanation for {fullDay(selectedDay)}</button>}
    <div className={styles.selection}>
      <label htmlFor={`${id}-day`}>Inspect day · UTC</label>
      <div className={styles.dayControls}>
        <button type="button" className={controls.secondary} aria-label="Previous day" disabled={dayIndex <= 0} onClick={() => selectDay(shiftHistoryDay(selectedDay, -1))}><span className={styles.previousIcon}><ControlIcon name="sort-down" /></span></button>
        <input id={`${id}-day`} type="date" value={selectedDay} min={range.from} max={shiftHistoryDay(range.toExclusive, -1)} onChange={event => selectDay(event.target.value)} />
        <button type="button" className={controls.secondary} aria-label="Next day" disabled={dayIndex >= days - 1} onClick={() => selectDay(shiftHistoryDay(selectedDay, 1))}><span className={styles.nextIcon}><ControlIcon name="sort-down" /></span></button>
      </div>
      <div className={styles.calendar}>
        <label htmlFor={id + "-month"}><span id={id + "-month-label"}>Calendar month</span><select aria-labelledby={id + "-month-label"} id={id + "-month"} value={month.id} onChange={event => setCalendarMonth(event.target.value)}>
          {months.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select></label>
        <div className={styles.calendarDays} role="group" aria-label={month.label + " history days"}>
          {month.days.map(day => {
            const item = points.find(point => point.day === day);
            const loaded = day >= envelope.loadedRange.from && day < envelope.loadedRange.toExclusive;
            const coverage = !loaded ? "not-loaded" : item?.subtotalCents == null ? "unpriced" : !historyPointComplete(item) ? "partial" : item.priceKind;
            const weekday = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "UTC" }).format(new Date(day + "T00:00:00Z"));
            return <button key={day} type="button" data-history-day={day} data-coverage={coverage}
              className={styles.calendarDay} aria-pressed={selectedDay === day}
              aria-label={weekday + ", " + fullDay(day) + ", " + (coverage === "not-loaded" ? "history not loaded" : coverage === "unpriced" ? "valuation unavailable" : coverage + " valuation")}
              onClick={() => selectDay(day)}><strong>{Number(day.slice(-2))}</strong><i aria-hidden="true" /></button>;
          })}
        </div>
        <p className={styles.caption}>Every day is selectable. Filled dots: priced · outlined: partial · no dot: unpriced or not loaded.</p>
      </div>
    </div>
    {(!rangeLoaded || envelope.page.nextCursor !== null && sameRequestedRange) && <div className={styles.pageNotice}>
      <p>{pageState === "loading" ? "Loading this history range…" : "Some dates in this range have not loaded. The full requested time window stays visible."}</p>
      {pageEndpoint && pageState !== "loading" && <button type="button" className={controls.secondary} onClick={() => void loadRange(range, envelope.page.nextCursor !== null && sameRequestedRange)}>Load more history</button>}
    </div>}
    {(pageState === "error" || pageState === "changed") && <p className={styles.notice} role="status">{pageState === "changed" ? "History changed. Refresh the page for the new history." : "More history could not be loaded. Existing points remain available."}</p>}
    <section id={`${id}-explanation`} ref={inspector} tabIndex={-1} className={styles.details} data-history-inspector aria-label={"Day explanation for " + fullDay(selectedDay)}>
      <h3>What happened on {fullDay(selectedDay)}?</h3>
      {!inspecting ? <div><p>Select a calendar day, a change marker or the timeline to load its dated roster and source moves.</p>
        <button type="button" className={controls.secondary} onClick={() => selectDay(selectedDay)}>Explain this day</button></div>
        : currentDetail?.kind === "ready" ? <DayDetail detail={currentDetail.value}
          previous={currentComparison?.kind === "ready" ? currentComparison.value : undefined}
          comparisonLoading={!!previousPoint && (!currentComparison || currentComparison.kind === "loading")}
          comparisonError={currentComparison?.kind === "error" ? currentComparison.changed ? "changed" : "unavailable" : undefined}
          retryComparison={retryComparison} /> : currentDetail?.kind === "error" ? <div className={styles.notice} role="status">
          <p>{currentDetail.changed ? "History changed. Refresh the page to inspect the new roster evidence." : "Day details could not be loaded. The full calendar remains available."}</p>
          {!currentDetail.changed && detailEndpoint && <button type="button" className={controls.secondary} onClick={retryDetail}>Retry day details</button>}
        </div> : <p className={styles.notice} role="status">Loading the selected day’s roster and moves…</p>}
    </section>
    {envelope.currentQuote && <p className={styles.current}>{envelope.currentQuote.priced < envelope.currentQuote.rosterCount ? "Current modeled subtotal" : "Current modeled quote"}: {envelope.currentQuote.subtotalCents === null ? "unavailable" : money(envelope.currentQuote.subtotalCents)} · {envelope.currentQuote.priced}/{envelope.currentQuote.rosterCount} priced · {envelope.currentQuote.at}. Separate from recorded history.</p>}
    <details className={styles.evidence}><summary>About this history</summary>
      <p>Recorded points are captured modeled FAAB quotes. Reconstructed estimates were calculated later from dated inputs. Neither is a sale price or team performance.</p>
      <p>Recorded source timestamps use the existing UTC convention. Historical ownership and price coverage are separate.</p>
      <ul>{envelope.sourceNotes.map((note, index) => <li key={index}>{note}</li>)}</ul>
      {(["roster", "valuation"] as const).map(key => <div key={key}><strong>{key === "roster" ? "Roster coverage" : "Valuation coverage"}</strong><ul>{envelope.coverage[key].filter(item => item.from < range.toExclusive && item.toExclusive > range.from).map((item, index) => <li key={index}>{fullDay(item.from)} – {fullDay(shiftHistoryDay(item.toExclusive, -1))}: {item.status.replaceAll("_", " ")} · {item.reason}</li>)}</ul></div>)}
    </details>
  </section>;
}
