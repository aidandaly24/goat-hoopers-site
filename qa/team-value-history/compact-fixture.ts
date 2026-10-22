/** Explicitly synthetic 368-day / 15-observation UI regression; no source I/O. */
import { shiftHistoryDay, type TeamValueHistoryDetail } from "@/domain/team-value-history";
import { teamValueHistoryFixture } from "@/test/team-value-history-fixture";

export function compactHistory(view = "a") {
  const history = teamValueHistoryFixture("empty");
  const leagueRange = { from: "2025-10-20", toExclusive: view === "b" ? "2026-10-24" : "2026-10-23" };
  history.team = { id: "1", name: "Fixture Club 1" };
  history.generation = `synthetic-compact-${view}`;
  history.asOf = view === "b" ? "2026-10-23T00:10:00.000Z" : "2026-10-22T00:10:00.000Z";
  history.leagueRange = history.requestedRange = history.loadedRange = leagueRange;
  history.seasons[0].range = { from: leagueRange.from, toExclusive: "2026-08-13" };
  history.seasons[1].range = { from: "2026-08-13", toExclusive: leagueRange.toExclusive };
  history.coverage = {
    roster: [{ ...leagueRange, status: "replayed", reason: "Synthetic membership only; not live roster evidence." }],
    valuation: [{ ...leagueRange, status: "partial", reason: "Synthetic sparse history; all missing days remain unpriced." }],
  };
  history.points = Array.from({ length: 15 }, (_, index) => {
    const day = shiftHistoryDay("2026-10-07", index), partial = index === 14;
    return { id: `compact-${day}`, day, valuationAt: `${day}T04:00:00.123456Z`, seasonId: "2026", rosterRef: `compact-roster-${day}`,
      rosterStatus: "replayed" as const, rosterCount: 4, priced: partial ? 1 : 4,
      subtotalCents: (partial ? 12300 : 30000 + index * 1000) + (view === "b" ? 100 : 0),
      priceKind: "recorded" as const, continuityId: "compact-observed", pricedSetId: partial ? "compact-partial" : "compact-full", standalone: false };
  });
  const last = history.points.at(-1)!;
  history.currentQuote = { at: last.valuationAt, subtotalCents: last.subtotalCents, priced: 1, rosterCount: 4 };
  history.sourceNotes = ["Synthetic source note deliberately kept out of the first view. No missing historical prices are fabricated."];
  return history;
}

export function compactDetail(day: string, view = "a"): TeamValueHistoryDetail {
  const h = compactHistory(view), point = h.points.find(item => item.day === day);
  const known = !!point || day >= "2026-10-22", priced = point?.priced ?? 0;
  const valuationAt = point?.valuationAt ?? (day === h.asOf.slice(0, 10) ? h.asOf : `${day}T23:59:59.999Z`);
  return { version: 1, teamId: h.team.id, generation: h.generation, day, valuationAt,
    pointId: point?.id ?? null, rosterRef: point?.rosterRef ?? `compact-roster-${day}`,
    rosterStatus: known ? "replayed" : "ambiguous", rosterCount: known ? 4 : null, priced, subtotalCents: point?.subtotalCents ?? null,
    rosterEvidence: [known ? "Synthetic replay basis, not independently verified ownership." : "Synthetic fixture has no membership evidence for this day."],
    players: known ? Array.from({ length: 4 }, (_, index) => {
      const eligible = index < priced;
      return { id: `compact-player-${index}`, name: `Synthetic player ${index + 1} with a readable long identity`,
        priceCents: eligible ? Math.floor(point!.subtotalCents! / priced) + (index === priced - 1 ? point!.subtotalCents! % priced : 0) : null,
        price: eligible ? { kind: "recorded" as const, quoteId: `compact-quote-${day}-${index}`, recordedAt: valuationAt,
          nativeTimestamp: valuationAt.slice(0, -1), availableFrom: valuationAt, validUntil: null } : null,
        missingReason: eligible ? null : "No dated quote in this synthetic fixture" };
    }) : [], moves: [], movesRange: { from: day, toExclusive: shiftHistoryDay(day, 1) }, movesTruncated: false };
}
