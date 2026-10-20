import { historyPointComplete, shiftHistoryDay, type TeamHistoryPoint, type TeamHistoryRange, type TeamValueHistoryDetail } from "@/domain/team-value-history";

export const historyDayCount = (range: TeamHistoryRange) =>
  Math.round((Date.parse(range.toExclusive + "T00:00:00Z") - Date.parse(range.from + "T00:00:00Z")) / 86400000);

/** Calendar positions come from the requested bounds, never the available quotes. */
export function historyCalendarDays(range: TeamHistoryRange): string[] {
  return Array.from({ length: historyDayCount(range) }, (_, index) => shiftHistoryDay(range.from, index));
}

export function historyDayAtPosition(range: TeamHistoryRange, ratio: number): string {
  const index = Math.max(0, Math.min(historyDayCount(range) - 1, Math.floor((Number.isFinite(ratio) ? ratio : 0) * historyDayCount(range))));
  return shiftHistoryDay(range.from, index);
}

export function historyCalendarMonths(range: TeamHistoryRange): { id: string; label: string; days: string[] }[] {
  const months = new Map<string, string[]>();
  for (const day of historyCalendarDays(range)) {
    const month = day.slice(0, 7);
    if (!months.has(month)) months.set(month, []);
    months.get(month)!.push(day);
  }
  return [...months].map(([id, days]) => ({ id, days, label: new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(id + "-01T00:00:00Z")) }));
}

export type HistoryValueChange = { day: string; previousDay: string; cents: number; priceKind: TeamHistoryPoint["priceKind"] };

/** Differences compare observations, never fill the intervening calendar days.
 * Recorded complete totals may include roster changes. Other sources also need
 * the producer's continuity assertion; a source/model switch is not a gain. */
export function historyValueChanges(points: readonly TeamHistoryPoint[]): HistoryValueChange[] {
  const observations = points.filter(point => point.subtotalCents !== null).sort((a, b) => a.day.localeCompare(b.day));
  return observations.flatMap((point, index) => {
    const before = observations[index - 1];
    const comparable = before && before.priceKind === point.priceKind && (point.priceKind === "recorded"
      || point.continuityId !== null && point.continuityId === before.continuityId && !point.standalone && !before.standalone);
    return comparable && historyPointComplete(before) && historyPointComplete(point)
      ? [{ day: point.day, previousDay: before.day, cents: point.subtotalCents! - before.subtotalCents!, priceKind: point.priceKind }] : [];
  });
}

export function historyPreviousPoint(points: readonly TeamHistoryPoint[], day: string): TeamHistoryPoint | undefined {
  return points.filter(point => point.day < day && point.subtotalCents !== null)
    .reduce<TeamHistoryPoint | undefined>((latest, point) => !latest || point.day > latest.day ? point : latest, undefined);
}

type HistoryPlayer = TeamValueHistoryDetail["players"][number];
export type HistoryPlayerChange = { id: string; name: string; beforeCents: number | null; afterCents: number | null; deltaCents: number | null };
export type HistoryRosterComparison = {
  previousDay: string; daysApart: number; continuing: HistoryPlayerChange[];
  entered: HistoryPlayer[]; exited: HistoryPlayer[]; totalDifferenceCents: number | null;
};

/** Two same-generation dated observations; never prices from currentQuote.
 * Entry/exit means membership between observations, not a trade's priced legs. */
export function compareHistoryRosters(before: TeamValueHistoryDetail, after: TeamValueHistoryDetail): HistoryRosterComparison | null {
  if (before.teamId !== after.teamId || before.generation !== after.generation || before.day >= after.day
    || !["verified", "replayed"].includes(before.rosterStatus) || !["verified", "replayed"].includes(after.rosterStatus)) return null;
  const prior = new Map(before.players.map(player => [player.id, player]));
  const current = new Map(after.players.map(player => [player.id, player]));
  const continuing = after.players.flatMap(player => {
    const old = prior.get(player.id);
    if (!old) return [];
    const p = old.price, q = player.price;
    const sameBasis = p?.kind === "recorded" && q?.kind === "recorded"
      ? p.quoteId !== q.quoteId || old.priceCents === player.priceCents
      : p?.kind === "reconstructed" && q?.kind === "reconstructed" && p.source === q.source
        && p.datasetId === q.datasetId && p.modelVersion === q.modelVersion;
    return [{ id: player.id, name: player.name, beforeCents: old.priceCents, afterCents: player.priceCents,
      deltaCents: sameBasis && old.priceCents !== null && player.priceCents !== null ? player.priceCents - old.priceCents : null }];
  });
  const completeRecorded = (detail: TeamValueHistoryDetail) => detail.subtotalCents !== null && detail.priced === detail.rosterCount
    && detail.players.every(player => player.price?.kind === "recorded");
  return { previousDay: before.day, daysApart: historyDayCount({ from: before.day, toExclusive: after.day }), continuing,
    entered: after.players.filter(player => !prior.has(player.id)), exited: before.players.filter(player => !current.has(player.id)),
    totalDifferenceCents: completeRecorded(before) && completeRecorded(after) && continuing.every(player => player.deltaCents !== null)
      ? after.subtotalCents! - before.subtotalCents! : null };
}

export function historyLargestChanges(changes: readonly HistoryValueChange[], limit = 5): HistoryValueChange[] {
  return changes.filter(change => change.cents !== 0)
    .sort((a, b) => Math.abs(b.cents) - Math.abs(a.cents) || b.day.localeCompare(a.day)).slice(0, limit);
}

export function historyUnpricedRanges(points: readonly TeamHistoryPoint[], range: TeamHistoryRange): TeamHistoryRange[] {
  const priced = new Set(points.filter(point => point.subtotalCents !== null).map(point => point.day));
  const gaps: TeamHistoryRange[] = [];
  for (const day of historyCalendarDays(range)) {
    if (priced.has(day)) continue;
    const previous = gaps.at(-1);
    if (previous?.toExclusive === day) previous.toExclusive = shiftHistoryDay(day, 1);
    else gaps.push({ from: day, toExclusive: shiftHistoryDay(day, 1) });
  }
  return gaps;
}
