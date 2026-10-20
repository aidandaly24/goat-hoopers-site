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
import styles from "./TeamValueHistory.module.css";

const money = (cents: number) => `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fullDay = (day: string) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${day}T00:00:00Z`));
const status = (value: string) => value === "verified" ? "Independently verified roster" : value === "replayed" ? "Replayed roster · not independently verified at every date" : "Roster cannot be verified for this date";
const priceLabel = (point: TeamHistoryPoint) => point.rosterCount === 0 ? "Empty roster" : point.priceKind === "recorded" ? "Recorded model quote"
  : point.priceKind === "reconstructed" ? "Reconstructed estimate" : point.priceKind === "mixed" ? "Recorded + reconstructed sources" : "Historical valuation unavailable";
type DetailState = { key: string } & ({ kind: "loading" } | { kind: "ready"; value: TeamValueHistoryDetail } | { kind: "error"; changed: boolean });

function SelectedRoster({ detail }: { detail: TeamValueHistoryDetail }) {
  return <div className={styles.inspection} data-history-detail>
    <p className={styles.caption}>{status(detail.rosterStatus)}. {detail.priced} of {detail.rosterCount ?? "unknown"} players priced.</p>
    {detail.players.length ? <ul className={styles.players}>{detail.players.map(player => <li key={player.id}>
      <div><a href={`/player/${encodeURIComponent(player.id)}`}>{player.name}</a><small>{player.id}</small></div>
      <div className={styles.playerPrice}><strong>{player.priceCents === null ? "Unpriced" : money(player.priceCents)}</strong>
        <small>{player.price?.kind === "recorded" ? "Recorded model" : player.price ? `Reconstructed · ${player.price.modelVersion}` : player.missingReason}</small>
        {player.price && <details className={styles.proof}><summary>Price source</summary><p>{player.price.kind === "recorded"
          ? <>Quote {player.price.quoteId} · {player.price.nativeTimestamp} UTC (source timezone convention).</>
          : <>{player.price.source} · model {player.price.modelVersion} · dataset {player.price.datasetId} · inputs through {player.price.inputCutoff}.</>}</p>
          <p>Eligible from {player.price.availableFrom}{player.price.validUntil ? ` until ${player.price.validUntil} (exclusive)` : "; no open-ended carry inferred"}.</p></details>}
      </div>
    </li>)}</ul> : <p>{detail.rosterCount === 0 ? "No players on this roster at the selected date." : "The historical roster is unavailable for this date."}</p>}
    <div className={styles.moves}><h4>Moves around this date</h4>
      <p className={styles.caption}>{fullDay(detail.movesRange.from)} – {fullDay(shiftHistoryDay(detail.movesRange.toExclusive, -1))} · UTC</p>
      {detail.moves.length ? <ol>{detail.moves.map(move => <li key={move.id}>
        <strong>{move.origin === "boundary-reconciliation" ? "Boundary reconciliation" : move.type.replaceAll("_", " ")}</strong>
        <span>{move.precision === "instant" ? `${move.effectiveAt} UTC` : move.precision === "day" ? fullDay(move.day!) : "Effective date unknown"}</span>
        {move.adds.length > 0 && <p>Added: {move.adds.map(player => player.name).join(", ")}</p>}
        {move.drops.length > 0 && <p>Dropped: {move.drops.map(player => player.name).join(", ")}</p>}
        {move.note && <p>{move.note}</p>}
        <small>{move.origin === "transaction" ? "Completed source transaction" : "Derived source event"} · {move.sourceId} · {move.sourceRef}</small>
      </li>)}</ol> : <p>No sourced moves returned in this window.</p>}
      {detail.movesTruncated && <p className={styles.caption}>More moves exist in this window; this is a bounded selection.</p>}
      <a href="/transactions">Full transaction history</a>
    </div>
    {detail.rosterEvidence.length > 0 && <details className={styles.evidence}><summary>Roster evidence</summary><ul>{detail.rosterEvidence.map((note, index) => <li key={index}>{note}</li>)}</ul></details>}
  </div>;
}

/** Serializable server entrypoint. Existing homepage wiring is owned by Muse. */
export function TeamValueHistory(props: { history: TeamValueHistoryEnvelope; detailEndpoint?: string; pageEndpoint?: string }) {
  if (!isTeamValueHistoryEnvelope(props.history)) return <p className={styles.notice}>Team history is unavailable. No value has been substituted.</p>;
  return <HistoryView key={`${props.history.team.id}/${props.history.generation}/${props.history.asOf}/${props.history.requestedRange.from}/${props.history.requestedRange.toExclusive}`} {...props} />;
}

function HistoryView({ history, detailEndpoint, pageEndpoint }: { history: TeamValueHistoryEnvelope; detailEndpoint?: string; pageEndpoint?: string }) {
  const id = useId();
  const [envelope, setEnvelope] = useState(history), [range, setRange] = useState(history.requestedRange);
  const [preset, setPreset] = useState(history.requestedRange.from === history.leagueRange.from && history.requestedRange.toExclusive === history.leagueRange.toExclusive ? "all" : "custom");
  const [draft, setDraft] = useState({ from: range.from, through: shiftHistoryDay(range.toExclusive, -1) });
  const lastPoint = history.points.filter(point => point.day >= range.from && point.day < range.toExclusive).sort((a, b) => a.day.localeCompare(b.day)).at(-1);
  const [selectedDay, setSelectedDay] = useState(lastPoint?.day ?? shiftHistoryDay(range.toExclusive, -1));
  const [dateError, setDateError] = useState(""), [inspecting, setInspecting] = useState(false), [attempt, setAttempt] = useState(0);
  const [detail, setDetail] = useState<DetailState>({ key: "", kind: "loading" });
  const [pageState, setPageState] = useState<"idle" | "loading" | "error" | "changed">("idle");
  const cache = useRef(new Map<string, TeamValueHistoryDetail>()), pageRequest = useRef<AbortController | null>(null), pageSequence = useRef(0);
  const client = useMemo(() => createTeamHistoryClient(globalThis.fetch.bind(globalThis), { detail: detailEndpoint, page: pageEndpoint }), [detailEndpoint, pageEndpoint]);
  const points = envelope.points.filter(point => point.day >= range.from && point.day < range.toExclusive);
  const point = points.find(point => point.day === selectedDay);
  const detailKey = `${envelope.team.id}/${envelope.generation}/${selectedDay}`;
  const rangeLoaded = historyRangeContains(envelope.loadedRange, range);
  const sameRequestedRange = envelope.requestedRange.from === range.from && envelope.requestedRange.toExclusive === range.toExclusive;
  const days = (Date.parse(`${range.toExclusive}T00:00:00Z`) - Date.parse(`${range.from}T00:00:00Z`)) / 86400000;
  const dayIndex = (Date.parse(`${selectedDay}T00:00:00Z`) - Date.parse(`${range.from}T00:00:00Z`)) / 86400000;

  useEffect(() => {
    if (!inspecting) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const cached = cache.current.get(detailKey);
        const value = cached ?? await client.detail({ teamId: envelope.team.id, generation: envelope.generation, day: selectedDay }, controller.signal);
        if (controller.signal.aborted) return;
        if (point && !historyDetailMatchesPoint(value, point)) throw new TeamHistoryReadError("changed", "History details changed");
        cache.current.set(detailKey, value);
        if (cache.current.size > 16) cache.current.delete(cache.current.keys().next().value!);
        setDetail({ key: detailKey, kind: "ready", value });
      } catch (error) {
        if (!controller.signal.aborted) setDetail({ key: detailKey, kind: "error", changed: error instanceof TeamHistoryReadError && error.kind === "changed" });
      }
    }, 200);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [attempt, client, detailKey, envelope.generation, envelope.team.id, inspecting, point, selectedDay]);
  useEffect(() => () => { pageRequest.current?.abort(); }, []);

  function selectDay(day: string) {
    if (!validHistoryDay(day) || day < range.from || day >= range.toExclusive || day === selectedDay) return;
    setSelectedDay(day); setDetail({ key: "", kind: "loading" });
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
    if (!validHistoryRange(next) || !historyRangeContains(envelope.leagueRange, next)) { setDateError("Choose a valid range within the league's recorded bounds."); return; }
    setDateError(""); setRange(next); setPreset(label); setDraft({ from: next.from, through: shiftHistoryDay(next.toExclusive, -1) });
    const day = selectedDay < next.from ? next.from : selectedDay >= next.toExclusive ? shiftHistoryDay(next.toExclusive, -1) : selectedDay;
    setSelectedDay(day); if (day !== selectedDay) setDetail({ key: "", kind: "loading" }); setPageState("idle");
    if (!historyRangeContains(envelope.loadedRange, next) && pageEndpoint) void loadRange(next, false);
  }
  const currentDetail = detail.key === detailKey ? detail : null;
  const retryDetail = () => { cache.current.delete(detailKey); setDetail({ key: detailKey, kind: "loading" }); setAttempt(value => value + 1); };
  return <section className={styles.root} data-team-value-history aria-label={`${envelope.team.name} historical roster valuation`}>
    <SectionHeading eyebrow={envelope.team.name} title="Team value over time" />
    <p className={styles.intro}>The players you owned, with value shown only where the sources support it.</p>
    <div className={styles.presets} role="group" aria-label="History range presets">
      {[{ id: "all", label: "All time" }, ...envelope.seasons.map(season => ({ id: `season:${season.id}`, label: season.label })), { id: "recent", label: "Last 30 days" }].map(item =>
        <button key={item.id} type="button" className={controls.secondary} aria-pressed={preset === item.id}
          onClick={() => applyRange(historyPresetRange(envelope, item.id), item.id)}>{item.label}</button>)}
    </div>
    <form className={styles.rangeForm} onSubmit={event => { event.preventDefault(); if (!validHistoryDay(draft.from) || !validHistoryDay(draft.through)) { setDateError("Enter both calendar dates."); return; } applyRange({ from: draft.from, toExclusive: shiftHistoryDay(draft.through, 1) }, "custom"); }}>
      <label>From<input type="date" required value={draft.from} min={envelope.leagueRange.from} max={shiftHistoryDay(envelope.leagueRange.toExclusive, -1)} onChange={event => setDraft({ ...draft, from: event.target.value })} /></label>
      <label>Through<input type="date" required value={draft.through} min={envelope.leagueRange.from} max={shiftHistoryDay(envelope.leagueRange.toExclusive, -1)} onChange={event => setDraft({ ...draft, through: event.target.value })} /></label>
      <button className={controls.quiet} type="submit">Apply dates</button>
    </form>
    <p className={styles.caption}>Calendar days in UTC · Through includes the full selected day. Daily data does not establish intraday values.</p>
    {dateError && <p className={styles.notice} role="alert">{dateError}</p>}
    <TeamValueHistoryChart points={points} range={range} selectedDay={selectedDay} />
    <div className={styles.selection}>
      <label htmlFor={`${id}-day`}>Inspect day · UTC</label>
      <div className={styles.dayControls}>
        <button type="button" className={controls.secondary} aria-label="Previous day" disabled={dayIndex <= 0} onClick={() => selectDay(shiftHistoryDay(selectedDay, -1))}><span className={styles.previousIcon}><ControlIcon name="sort-down" /></span></button>
        <input id={`${id}-day`} type="date" value={selectedDay} min={range.from} max={shiftHistoryDay(range.toExclusive, -1)} onChange={event => selectDay(event.target.value)} />
        <button type="button" className={controls.secondary} aria-label="Next day" disabled={dayIndex >= days - 1} onClick={() => selectDay(shiftHistoryDay(selectedDay, 1))}><span className={styles.nextIcon}><ControlIcon name="sort-down" /></span></button>
      </div>
      <input className={styles.scrubber} type="range" aria-label="Inspect history day" aria-valuetext={`${fullDay(selectedDay)} UTC`} min="0" max={days - 1} step="1" value={dayIndex} disabled={days === 1} onChange={event => selectDay(shiftHistoryDay(range.from, Number(event.target.value)))} />
    </div>
    <div className={styles.readout} role="status" aria-live="polite" aria-atomic="true" data-history-readout>
      <span>{fullDay(selectedDay)} · UTC</span>
      <strong>{point?.subtotalCents !== null && point?.subtotalCents !== undefined ? money(point.subtotalCents) : "Valuation unavailable"}</strong>
      <span>{point ? `${!historyPointComplete(point) && point.subtotalCents !== null ? "Known-value subtotal · " : ""}${priceLabel(point)}` : "No historical quote shown for this day"}</span>
      <small>{point ? `${point.priced} of ${point.rosterCount ?? "unknown"} roster players priced · ${status(point.rosterStatus)}` : "Unknown prices are not $0. Inspect any available roster and moves below."}</small>
    </div>
    {(!rangeLoaded || envelope.page.nextCursor !== null && sameRequestedRange) && <div className={styles.pageNotice}>
      <p>{pageState === "loading" ? "Loading this history range…" : "Some dates in this range have not loaded. The full requested time window stays visible."}</p>
      {pageEndpoint && pageState !== "loading" && <button type="button" className={controls.secondary} onClick={() => void loadRange(range, envelope.page.nextCursor !== null && sameRequestedRange)}>Load more history</button>}
    </div>}
    {(pageState === "error" || pageState === "changed") && <p className={styles.notice} role="status">{pageState === "changed" ? "History changed. Refresh the page for the new history." : "More history could not be loaded. Existing points remain available."}</p>}
    <details className={styles.details} open={inspecting} onToggle={event => { const open = event.currentTarget.open; if (open !== inspecting) { setInspecting(open); if (open) setDetail({ key: "", kind: "loading" }); } }}>
      <summary>Roster &amp; moves · {fullDay(selectedDay)}</summary>
      {inspecting && (currentDetail?.kind === "ready" ? <SelectedRoster detail={currentDetail.value} /> : currentDetail?.kind === "error" ? <div className={styles.notice} role="status">
        <p>{currentDetail.changed ? "History changed. Refresh the page to inspect the new roster evidence." : "Roster details could not be loaded for this date. The chart remains available."}</p>
        {!currentDetail.changed && detailEndpoint && <button type="button" className={controls.secondary} onClick={retryDetail}>Retry roster details</button>}
      </div> : <p className={styles.notice} role="status">Loading roster and nearby moves…</p>)}
    </details>
    {envelope.currentQuote && <p className={styles.current}>Current modeled quote: {envelope.currentQuote.subtotalCents === null ? "unavailable" : money(envelope.currentQuote.subtotalCents)} · {envelope.currentQuote.priced}/{envelope.currentQuote.rosterCount} priced · {envelope.currentQuote.at}. Separate from recorded history.</p>}
    <details className={styles.evidence}><summary>About this history</summary>
      <p>Recorded points are captured modeled FAAB quotes. Reconstructed estimates were calculated later from dated inputs. Neither is a sale price or team performance.</p>
      <p>Recorded source timestamps use the existing UTC convention. Historical ownership and price coverage are separate.</p>
      <ul>{envelope.sourceNotes.map((note, index) => <li key={index}>{note}</li>)}</ul>
      {(["roster", "valuation"] as const).map(key => <div key={key}><strong>{key === "roster" ? "Roster coverage" : "Valuation coverage"}</strong><ul>{envelope.coverage[key].filter(item => item.from < range.toExclusive && item.toExclusive > range.from).map((item, index) => <li key={index}>{fullDay(item.from)} – {fullDay(shiftHistoryDay(item.toExclusive, -1))}: {item.status.replaceAll("_", " ")} · {item.reason}</li>)}</ul></div>)}
    </details>
  </section>;
}
