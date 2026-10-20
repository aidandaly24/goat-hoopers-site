/** One browser-safe presentation contract. Producers own replay and provenance. */
export type TeamHistoryRange = { from: string; toExclusive: string };
export type TeamHistoryRosterStatus = "verified" | "replayed" | "ambiguous" | "unavailable";
export type TeamHistoryPriceKind = "recorded" | "reconstructed" | "mixed" | "unavailable";
export type TeamHistoryPoint = {
  id: string; day: string; valuationAt: string; seasonId: string; rosterRef: string;
  rosterStatus: TeamHistoryRosterStatus; rosterCount: number | null; priced: number;
  subtotalCents: number | null; priceKind: TeamHistoryPriceKind;
  /** Null means isolated. The producer asserts continuity; the UI never invents it. */
  continuityId: string | null;
  /** Required for connecting partial subtotals, even when priced counts match. */
  pricedSetId: string | null;
  standalone: boolean;
};
export type TeamHistoryCoverage = TeamHistoryRange & {
  status: "verified" | "replayed" | "ambiguous" | "unavailable" | "recorded" | "reconstructed" | "mixed" | "partial" | "not_loaded";
  reason: string;
};
export type TeamValueHistoryEnvelope = {
  version: 1; team: { id: string; name: string }; generation: string; asOf: string;
  resolution: "day"; timeZone: "UTC";
  recordedTimestampConvention: "UTC-assumed";
  leagueRange: TeamHistoryRange;
  seasons: { id: string; label: string; leagueId: string; range: TeamHistoryRange }[];
  requestedRange: TeamHistoryRange;
  /** Coverage of this accumulated summary, separate from requested/league bounds. */
  loadedRange: TeamHistoryRange;
  coverage: { roster: TeamHistoryCoverage[]; valuation: TeamHistoryCoverage[] };
  points: TeamHistoryPoint[];
  page: { nextCursor: string | null };
  currentQuote: { at: string; subtotalCents: number | null; priced: number; rosterCount: number } | null;
  sourceNotes: string[];
};
export type TeamHistoryPriceProof = {
  availableFrom: string; validUntil: string | null;
} & (
  | { kind: "recorded"; quoteId: string; recordedAt: string; nativeTimestamp: string }
  | { kind: "reconstructed"; source: "gamelog" | "annual" | "event-log"; datasetId: string; modelVersion: string; inputCutoff: string }
);
export type TeamHistoryMove = {
  id: string; sourceId: string; sourceRef: string;
  origin: "transaction" | "draft" | "boundary-reconciliation";
  type: "waiver" | "free_agent" | "trade" | "commissioner" | "draft" | "boundary-reconciliation" | "other";
  status: "complete" | "derived";
  effectiveAt: string | null; day: string | null; precision: "instant" | "day" | "unknown";
  adds: { id: string; name: string }[]; drops: { id: string; name: string }[];
  note: string | null;
};
export type TeamValueHistoryDetail = {
  version: 1; teamId: string; generation: string; day: string; valuationAt: string;
  pointId: string | null; rosterRef: string;
  rosterStatus: TeamHistoryRosterStatus; rosterCount: number | null; priced: number;
  subtotalCents: number | null; rosterEvidence: string[];
  players: { id: string; name: string; priceCents: number | null; price: TeamHistoryPriceProof | null; missingReason: string | null }[];
  movesRange: TeamHistoryRange; moves: TeamHistoryMove[]; movesTruncated: boolean;
};

export const TEAM_HISTORY_MAX_POINTS = 800;
export const TEAM_HISTORY_MAX_PLAYERS = 60;
export const TEAM_HISTORY_MAX_MOVES = 40;
const DAY = 86_400_000;

export function validHistoryDay(day: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(day) && Number.isFinite(Date.parse(`${day}T00:00:00Z`))
    && new Date(`${day}T00:00:00Z`).toISOString().slice(0, 10) === day;
}
export function shiftHistoryDay(day: string, amount: number): string {
  return new Date(Date.parse(`${day}T00:00:00Z`) + amount * DAY).toISOString().slice(0, 10);
}
/** Canonical comparison key preserves source microseconds without JS rounding. */
export function historyInstantKey(value: string): string | null {
  const match = value.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:[0-5]\d:[0-5]\d)(?:\.(\d{1,6}))?Z$/);
  if (!match || !validHistoryDay(match[1]) || match[2].slice(0, 2) > "23") return null;
  return `${match[1]}T${match[2]}.${(match[3] ?? "").padEnd(6, "0")}Z`;
}
export function validHistoryRange(range: TeamHistoryRange): boolean {
  return validHistoryDay(range.from) && validHistoryDay(range.toExclusive) && range.from < range.toExclusive;
}
export function historyRangeContains(outer: TeamHistoryRange, inner: TeamHistoryRange): boolean {
  return outer.from <= inner.from && outer.toExclusive >= inner.toExclusive;
}
export function historyPresetRange(envelope: TeamValueHistoryEnvelope, preset: "all" | "recent" | string): TeamHistoryRange {
  const range = preset === "recent" ? { from: shiftHistoryDay(envelope.asOf.slice(0, 10), -29), toExclusive: shiftHistoryDay(envelope.asOf.slice(0, 10), 1) }
    : envelope.seasons.find(season => `season:${season.id}` === preset)?.range ?? envelope.leagueRange;
  return { from: range.from < envelope.leagueRange.from ? envelope.leagueRange.from : range.from,
    toExclusive: range.toExclusive > envelope.leagueRange.toExclusive ? envelope.leagueRange.toExclusive : range.toExclusive };
}
export function historyPointComplete(point: TeamHistoryPoint): boolean {
  return point.rosterCount !== null && point.priced === point.rosterCount && point.subtotalCents !== null
    && ["verified", "replayed"].includes(point.rosterStatus);
}
export function historySegments(points: readonly TeamHistoryPoint[]): TeamHistoryPoint[][] {
  const groups: TeamHistoryPoint[][] = [];
  for (const point of [...points].sort((a, b) => a.day.localeCompare(b.day))) {
    if (point.subtotalCents === null || !["verified", "replayed"].includes(point.rosterStatus)) continue;
    const prior = groups.at(-1)?.at(-1);
    const complete = historyPointComplete(point);
    const connect = prior && point.continuityId !== null && point.continuityId === prior.continuityId
      && !point.standalone && !prior.standalone && point.seasonId === prior.seasonId
      && point.priceKind === prior.priceKind && shiftHistoryDay(prior.day, 1) === point.day
      && complete === historyPointComplete(prior)
      && (complete || (point.pricedSetId !== null && point.pricedSetId === prior.pricedSetId));
    if (connect) groups[groups.length - 1].push(point);
    else groups.push([point]);
  }
  return groups;
}

const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
const text = (value: unknown, max = 300): value is string => typeof value === "string" && value.length > 0 && value.length <= max;
const cents = (value: unknown): value is number => typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
const instant = (value: unknown): value is string => typeof value === "string" && historyInstantKey(value) !== null;
const day = (value: unknown): value is string => typeof value === "string" && validHistoryDay(value);
const range = (value: unknown): value is TeamHistoryRange => object(value) && day(value.from) && day(value.toExclusive) && value.from < value.toExclusive;
const rosterStatus = (value: unknown) => ["verified", "replayed", "ambiguous", "unavailable"].includes(String(value));
function valuation(value: Record<string, unknown>): value is Record<string, unknown> & Pick<TeamHistoryPoint, "rosterStatus" | "rosterCount" | "priced" | "subtotalCents"> {
  if (!rosterStatus(value.rosterStatus) || !(value.rosterCount === null || (cents(value.rosterCount) && value.rosterCount <= TEAM_HISTORY_MAX_PLAYERS))
    || !cents(value.priced) || !(value.subtotalCents === null || cents(value.subtotalCents))) return false;
  if (value.rosterCount === null || ["ambiguous", "unavailable"].includes(String(value.rosterStatus))) return value.priced === 0 && value.subtotalCents === null;
  return value.priced <= Number(value.rosterCount) && (value.priced > 0 ? value.subtotalCents !== null
    : Number(value.rosterCount) === 0 ? value.subtotalCents === 0 : value.subtotalCents === null);
}

/** Fail closed on malformed public DTOs; never turn a missing price into zero. */
export function isTeamValueHistoryEnvelope(value: unknown): value is TeamValueHistoryEnvelope {
  if (!object(value) || value.version !== 1 || !object(value.team) || !text(value.team.id) || !text(value.team.name)
    || !text(value.generation) || !instant(value.asOf) || value.resolution !== "day" || value.timeZone !== "UTC"
    || value.recordedTimestampConvention !== "UTC-assumed" || !range(value.leagueRange) || !range(value.requestedRange)
    || !range(value.loadedRange) || !historyRangeContains(value.leagueRange, value.requestedRange)
    || !historyRangeContains(value.requestedRange, value.loadedRange) || value.leagueRange.toExclusive > shiftHistoryDay(value.asOf.slice(0, 10), 1)
    || !Array.isArray(value.seasons) || value.seasons.length < 1 || value.seasons.length > 4
    || !Array.isArray(value.points) || value.points.length > TEAM_HISTORY_MAX_POINTS || !object(value.page)
    || !(value.page.nextCursor === null || text(value.page.nextCursor, 4096)) || !object(value.coverage)
    || !Array.isArray(value.sourceNotes) || value.sourceNotes.length > 8 || !value.sourceNotes.every(note => text(note, 1000))) return false;
  if (!value.seasons.every(season => object(season) && text(season.id) && text(season.label) && text(season.leagueId) && range(season.range))) return false;
  const ids = new Set<string>(), days = new Set<string>();
  for (const point of value.points) {
    if (!object(point) || !text(point.id) || !day(point.day) || !instant(point.valuationAt) || point.valuationAt.slice(0, 10) !== point.day
      || historyInstantKey(point.valuationAt)! > historyInstantKey(value.asOf)!
      || !text(point.seasonId) || !value.seasons.some(season => season.id === point.seasonId) || !text(point.rosterRef)
      || !valuation(point) || !["recorded", "reconstructed", "mixed", "unavailable"].includes(String(point.priceKind))
      || (point.priced > 0 && point.priceKind === "unavailable") || (point.priced === 0 && point.priceKind !== "unavailable")
      || !(point.continuityId === null || text(point.continuityId)) || !(point.pricedSetId === null || text(point.pricedSetId))
      || typeof point.standalone !== "boolean" || point.day < value.loadedRange.from || point.day >= value.loadedRange.toExclusive
      || ids.has(point.id) || days.has(point.day)) return false;
    ids.add(point.id); days.add(point.day);
  }
  for (const key of ["roster", "valuation"]) {
    const intervals = value.coverage[key];
    if (!Array.isArray(intervals) || intervals.length > 200 || !intervals.every(interval => range(interval) && "status" in interval && "reason" in interval
      && ["verified", "replayed", "ambiguous", "unavailable", "recorded", "reconstructed", "mixed", "partial", "not_loaded"].includes(String(interval.status))
      && text(interval.reason, 1000) && historyRangeContains(value.leagueRange as TeamHistoryRange, interval))) return false;
  }
  const quote = value.currentQuote;
  return quote === null || (object(quote) && instant(quote.at) && historyInstantKey(quote.at)! <= historyInstantKey(value.asOf)!
    && valuation({ ...quote, rosterStatus: "verified" }));
}

export function isTeamValueHistoryDetail(value: unknown): value is TeamValueHistoryDetail {
  if (!object(value) || value.version !== 1 || !text(value.teamId) || !text(value.generation) || !day(value.day)
    || !(value.pointId === null || text(value.pointId)) || !text(value.rosterRef)
    || !instant(value.valuationAt) || value.valuationAt.slice(0, 10) !== value.day || !valuation(value)
    || !Array.isArray(value.players) || value.players.length > TEAM_HISTORY_MAX_PLAYERS || !Array.isArray(value.rosterEvidence)
    || value.rosterEvidence.length > 12 || !value.rosterEvidence.every(ref => text(ref, 1000)) || !range(value.movesRange)
    || !Array.isArray(value.moves) || value.moves.length > TEAM_HISTORY_MAX_MOVES || typeof value.movesTruncated !== "boolean") return false;
  const at = historyInstantKey(value.valuationAt)!, ids = new Set<string>();
  let priced = 0, total = 0;
  for (const player of value.players) {
    if (!object(player) || !text(player.id) || !text(player.name) || ids.has(player.id)
      || !(player.missingReason === null || text(player.missingReason, 1000))) return false;
    ids.add(player.id);
    if (player.priceCents === null) { if (player.price !== null || !text(player.missingReason, 1000)) return false; continue; }
    if (!cents(player.priceCents) || !object(player.price)) return false;
    const proof = player.price;
    if (!instant(proof.availableFrom) || historyInstantKey(proof.availableFrom)! > at
      || !(proof.validUntil === null ? historyInstantKey(proof.availableFrom) === at
        : instant(proof.validUntil) && historyInstantKey(proof.validUntil)! > at)) return false;
    if (proof.kind === "recorded") {
      if (!text(proof.quoteId) || !instant(proof.recordedAt) || historyInstantKey(proof.recordedAt)! > historyInstantKey(proof.availableFrom)!
        || !text(proof.nativeTimestamp) || historyInstantKey(`${proof.nativeTimestamp}Z`) !== historyInstantKey(proof.recordedAt)) return false;
    } else if (proof.kind === "reconstructed") {
      if (!["gamelog", "annual", "event-log"].includes(String(proof.source)) || !text(proof.datasetId) || !text(proof.modelVersion)
        || !instant(proof.inputCutoff) || historyInstantKey(proof.inputCutoff)! > historyInstantKey(proof.availableFrom)!) return false;
    } else return false;
    priced++; total += player.priceCents;
  }
  const knownRoster = ["verified", "replayed"].includes(String(value.rosterStatus));
  if (knownRoster ? value.players.length !== value.rosterCount || priced !== value.priced || (priced > 0 || value.players.length === 0) && total !== value.subtotalCents
    : value.players.length !== 0) return false;
  const moveIds = new Set<string>();
  return value.moves.every(move => {
    if (!object(move) || !text(move.id) || moveIds.has(move.id) || !text(move.sourceId) || !text(move.sourceRef, 1000)
      || !["transaction", "draft", "boundary-reconciliation"].includes(String(move.origin))
      || !["waiver", "free_agent", "trade", "commissioner", "draft", "boundary-reconciliation", "other"].includes(String(move.type))
      || (move.origin === "transaction" ? move.status !== "complete" : move.status !== "derived")
      || !["instant", "day", "unknown"].includes(String(move.precision))
      || (move.precision === "instant" ? !instant(move.effectiveAt) : move.effectiveAt !== null)
      || (move.precision === "day" ? !day(move.day) : move.day !== null)
      || !(move.note === null || text(move.note, 1000))) return false;
    for (const key of ["adds", "drops"]) if (!Array.isArray(move[key]) || move[key].length > TEAM_HISTORY_MAX_PLAYERS
      || !move[key].every(player => object(player) && text(player.id) && text(player.name))) return false;
    moveIds.add(move.id); return true;
  });
}

export function historyDetailMatchesPoint(detail: TeamValueHistoryDetail, point: TeamHistoryPoint): boolean {
  const kinds = new Set(detail.players.flatMap(player => player.price ? [player.price.kind] : []));
  const kind = kinds.size > 1 ? "mixed" : kinds.size === 1 ? [...kinds][0] : "unavailable";
  const annual = detail.players.some(player => player.price?.kind === "reconstructed" && player.price.source === "annual");
  return (!annual || point.standalone && point.continuityId === null)
    && detail.pointId === point.id && detail.rosterRef === point.rosterRef && detail.day === point.day
    && historyInstantKey(detail.valuationAt) === historyInstantKey(point.valuationAt)
    && detail.rosterStatus === point.rosterStatus && detail.rosterCount === point.rosterCount
    && detail.priced === point.priced && detail.subtotalCents === point.subtotalCents && kind === point.priceKind;
}
