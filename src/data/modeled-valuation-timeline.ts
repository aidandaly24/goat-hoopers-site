import { MODELED_TIMELINE_VERSION, type ModeledTimelineInput, type ModeledValuationTimeline,
  type ModelValuationUpdate, type ValuationAtTime, type ValuationCalendarPeriod,
  type HeldValuationInterval } from "../domain/modeled-valuation-timeline";

const DAY = 86400000;
/** Compare without truncating the microseconds retained by Postgres. */
function key(value: string): string {
  const parts = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})\.(\d{3,6})Z$/.exec(value);
  if (!parts) throw new Error("Expected a UTC ISO timestamp");
  const millisecond = `${parts[1]}.${parts[2].slice(0, 3)}Z`;
  if (new Date(millisecond).toISOString() !== millisecond) throw new Error("Invalid timestamp");
  return `${parts[1]}.${parts[2].padEnd(6, "0")}Z`;
}
const compare = (a: string, b: string) => key(a).localeCompare(key(b));
const time = (value: string) => Date.parse(key(value));
function cents(value: number) {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error("Expected nonnegative whole cents");
}
function phaseAt(calendar: readonly ValuationCalendarPeriod[], date: string) {
  // Classification becomes usable only when its calendar evidence was known.
  const period = calendar.find(p => compare(p.knownAt, date) <= 0 &&
    compare(p.from, date) <= 0 && compare(date, p.to) < 0);
  return { phase: period?.phase ?? "unknown" as const, phaseSource: period?.source ?? null };
}
function anchorAt(updates: readonly ModelValuationUpdate[], date: string): ModelValuationUpdate | null {
  let low = 0, high = updates.length;
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (compare(updates[mid].effectiveAt, date) <= 0) low = mid + 1; else high = mid;
  }
  return updates[low - 1] ?? null;
}

/** Piecewise-constant modeled value until another usable update. No daily rows,
 * no interpolation, implicit injury/DNP inference, age repricing or new scale.
 * Calendar classification and absence of updates do not change the value. */
export function buildModeledValuationTimeline(input: ModeledTimelineInput): ModeledValuationTimeline {
  const start = key(input.from), cutoff = key(input.asOf);
  if (start > cutoff || !input.playerId || !input.modelVersion || !input.calibrationVersion)
    throw new Error("Invalid timeline configuration");
  // Filter by usable timestamp before examining values or versioned assumptions.
  const updates = input.updates.filter(u => key(u.effectiveAt) <= cutoff)
    .sort((a, b) => compare(a.effectiveAt, b.effectiveAt));
  const ids = new Set<string>(), dates = new Set<string>();
  for (const update of updates) {
    cents(update.priceCents);
    if (!update.id || ids.has(update.id) || dates.has(key(update.effectiveAt)) ||
        compare(update.evidenceAsOf, update.effectiveAt) > 0 ||
        update.modelVersion !== input.modelVersion || update.calibrationVersion !== input.calibrationVersion ||
        !["game", "annual", "assumption"].includes(update.reason)) throw new Error("Invalid or ambiguous model update");
    ids.add(update.id); dates.add(key(update.effectiveAt));
  }
  const recordedSnapshots = input.recordedSnapshots.filter(q => key(q.date) <= cutoff);
  const quoteIds = new Set<string>();
  for (const quote of recordedSnapshots) {
    cents(quote.priceCents);
    if (!quote.id || quoteIds.has(quote.id)) throw new Error("Invalid retained snapshot");
    quoteIds.add(quote.id);
  }
  const calendar = input.calendar.filter(p => key(p.knownAt) <= cutoff && key(p.from) <= cutoff)
    .sort((a, b) => compare(a.from, b.from));
  for (let i = 0; i < calendar.length; i++) {
    const p = calendar[i];
    if (compare(p.from, p.to) >= 0 || !p.source || !["in-season", "offseason"].includes(p.phase) ||
        (i > 0 && compare(calendar[i - 1].to, p.from) > 0)) throw new Error("Invalid or overlapping calendar periods");
  }
  const coverage = input.coverage && key(input.coverage.knownAt) <= cutoff ? input.coverage : null;
  if (coverage && (!coverage.sourceRevision || !["complete", "partial", "unknown"].includes(coverage.status)))
    throw new Error("Invalid source coverage");
  const boundaries = new Map([[start, input.from], [cutoff, input.asOf]]);
  for (const update of updates) if (compare(update.effectiveAt, input.from) > 0)
    boundaries.set(key(update.effectiveAt), update.effectiveAt);
  for (const p of calendar) for (const boundary of [p.from, p.to, p.knownAt])
    if (compare(boundary, input.from) > 0 && compare(boundary, input.asOf) < 0)
      boundaries.set(key(boundary), boundary);
  const ordered = [...boundaries].sort(([a], [b]) => a.localeCompare(b)).map(([, value]) => value);
  const intervals: HeldValuationInterval[] = ordered.slice(0, -1).map((from, i) => {
    const anchor = anchorAt(updates, from), phase = phaseAt(calendar, from);
    return { from, to: ordered[i + 1], anchorId: anchor?.id ?? null,
      priceCents: anchor?.priceCents ?? null, evidenceAsOf: anchor?.evidenceAsOf ?? null,
      source: anchor ? "carried-model-estimate" : "unavailable", ...phase,
      meaning: !anchor ? "before-first-estimate" : phase.phase === "offseason" ?
        "held-offseason-estimate" : "held-without-new-evidence" };
  });
  return { version: MODELED_TIMELINE_VERSION, publishable: false,
    playerId: input.playerId, from: input.from, asOf: input.asOf,
    modelVersion: input.modelVersion, calibrationVersion: input.calibrationVersion,
    updates, recordedSnapshots, calendar, coverage, intervals };
}

/** Value on any date in the requested window, including the asOf endpoint.
 * A held estimate remains useful but does not imply a known game outcome. */
export function valuationAt(timeline: ModeledValuationTimeline, date: string): ValuationAtTime {
  if (compare(date, timeline.from) < 0 || compare(date, timeline.asOf) > 0) throw new Error("Query outside timeline");
  const anchor = anchorAt(timeline.updates, date);
  return { date, anchor, priceCents: anchor?.priceCents ?? null,
    source: !anchor ? "unavailable" : compare(anchor.effectiveAt, date) === 0 ? "model-update" : "carried-model-estimate",
    evidenceAgeDays: anchor ? (time(date) - time(anchor.evidenceAsOf)) / DAY : null,
    ...phaseAt(timeline.calendar, date),
    coverage: timeline.coverage && compare(timeline.coverage.knownAt, date) <= 0 ? timeline.coverage : null,
    recordedSnapshots: timeline.recordedSnapshots.filter(q => compare(q.date, date) === 0) };
}

/** Inspection/pagination contract: every eligible update can be fetched without
 * index sampling. Render intervals as steps; do not emit fake observed dots. */
export function pageTimelineUpdates(timeline: ModeledValuationTimeline, offset = 0, limit = 200) {
  if (!Number.isInteger(offset) || offset < 0 || !Number.isInteger(limit) || limit < 1 || limit > 250)
    throw new Error("Invalid timeline page");
  const updates = timeline.updates.slice(offset, offset + limit);
  return { updates, total: timeline.updates.length,
    nextOffset: offset + updates.length < timeline.updates.length ? offset + updates.length : null };
}
