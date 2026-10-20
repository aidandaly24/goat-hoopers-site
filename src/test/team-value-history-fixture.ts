/** Explicitly synthetic presentation fixtures; no upstream/DB/application loader. */
import { shiftHistoryDay, type TeamHistoryPoint, type TeamHistoryPriceKind, type TeamValueHistoryDetail, type TeamValueHistoryEnvelope } from "@/domain/team-value-history";

export function teamValueHistoryFixture(state = "mixed"): TeamValueHistoryEnvelope {
  const leagueRange = { from: "2025-10-19", toExclusive: "2026-10-21" };
  const point = (day: string, priceKind: TeamHistoryPriceKind, subtotalCents: number | null, continuityId: string | null,
    priced = subtotalCents === null ? 0 : 3, standalone = false, pricedSetId = "synthetic-set-a"): TeamHistoryPoint => ({
    id: `synthetic-point-${day}`, day, valuationAt: `${day}T12:00:00.000000Z`, seasonId: day < "2026-08-13" ? "2025" : "2026",
    rosterRef: `synthetic-roster-${day}`, rosterStatus: "replayed", rosterCount: 3, priced, subtotalCents, priceKind, continuityId, pricedSetId, standalone,
  });
  let points = [point("2025-10-19", "unavailable", null, null), point("2026-06-30", "reconstructed", 28000, null, 3, true),
    point("2026-10-08", "recorded", 30000, "synthetic-recorded-a"), point("2026-10-09", "recorded", 31000, "synthetic-recorded-a"),
    point("2026-10-10", "unavailable", null, null), point("2026-10-11", "reconstructed", 32000, "synthetic-model-b"),
    point("2026-10-12", "reconstructed", 32500, "synthetic-model-b"),
    point("2026-10-13", "mixed", 16000, "synthetic-partial", 2, false, "synthetic-set-b"),
    point("2026-10-14", "mixed", 17000, "synthetic-partial", 2, false, "synthetic-set-c"),
    point("2026-10-15", "mixed", 18000, "synthetic-partial", 2, false, "synthetic-set-c"),
    point("2026-10-16", "mixed", 19000, "synthetic-partial", 2, false, "synthetic-set-c"),
    point("2026-10-17", "unavailable", null, null), point("2026-10-18", "recorded", 33000, "synthetic-recorded-c"),
    point("2026-10-19", "recorded", 33500, "synthetic-recorded-c")];
  if (state === "empty") points = [];
  if (state === "one") points = points.filter(item => item.day === "2026-06-30");
  const loadedRange = state === "paged" ? { ...leagueRange, toExclusive: "2026-10-19" } : leagueRange;
  return { version: 1, team: { id: "synthetic-team", name: "Synthetic Basketball Club" }, generation: "synthetic-history-v1", asOf: "2026-10-20T12:00:00Z",
    resolution: "day", timeZone: "UTC", recordedTimestampConvention: "UTC-assumed", leagueRange,
    requestedRange: leagueRange, loadedRange,
    seasons: [{ id: "2025", label: "2025 season", leagueId: "synthetic-2025", range: { from: leagueRange.from, toExclusive: "2026-08-13" } },
      { id: "2026", label: "2026 season", leagueId: "synthetic-2026", range: { from: "2026-08-13", toExclusive: leagueRange.toExclusive } }],
    coverage: { roster: [{ ...leagueRange, status: "replayed", reason: "Synthetic replay evidence; no real historical ownership is claimed." }],
      valuation: [{ from: leagueRange.from, toExclusive: "2026-06-30", status: "unavailable", reason: "Synthetic window without eligible price observations." }] },
    points: points.filter(item => item.day < loadedRange.toExclusive), page: { nextCursor: state === "paged" ? "synthetic-page-2" : null },
    currentQuote: { at: "2026-10-20T12:00:00Z", subtotalCents: 34000, priced: 3, rosterCount: 3 },
    sourceNotes: ["All identities, dates, values, moves and source references in this fixture are synthetic.", "The earlier annual example is standalone. No line is inferred across its price gap."] };
}

export function teamValueHistoryDetailFixture(day: string): TeamValueHistoryDetail {
  const envelope = teamValueHistoryFixture(), point = envelope.points.find(item => item.day === day);
  const priced = point?.priced ?? 0, subtotalCents = point?.subtotalCents ?? null;
  const at = point?.valuationAt ?? `${day}T12:00:00.000000Z`;
  const players = ["Synthetic guard", "Synthetic wing with a long descriptive name", "Synthetic big"].map((name, index) => {
    const known = index < priced;
    const value = known ? index === priced - 1 ? subtotalCents! - Math.floor(subtotalCents! / priced) * (priced - 1) : Math.floor(subtotalCents! / priced) : null;
    const recorded = point?.priceKind === "recorded" || point?.priceKind === "mixed" && index === 0;
    return { id: `synthetic-player-${index}`, name, priceCents: value,
      price: known ? recorded ? { kind: "recorded" as const, quoteId: `synthetic-quote-${day}-${index}`, recordedAt: at, nativeTimestamp: at.slice(0, -1), availableFrom: at, validUntil: null }
        : { kind: "reconstructed" as const, source: point?.standalone ? "annual" as const : "event-log" as const, datasetId: "synthetic-dataset", modelVersion: "synthetic-model", inputCutoff: at, availableFrom: at, validUntil: null } : null,
      missingReason: known ? null : "No eligible dated quote in this synthetic example" };
  });
  return { version: 1, teamId: envelope.team.id, generation: envelope.generation, day, valuationAt: at,
    pointId: point?.id ?? null, rosterRef: point?.rosterRef ?? `synthetic-roster-${day}`, rosterStatus: "replayed", rosterCount: 3, priced, subtotalCents,
    rosterEvidence: ["Synthetic roster proof; not independently verified league data."], players,
    movesRange: { from: day === envelope.leagueRange.from ? day : shiftHistoryDay(day, -1), toExclusive: shiftHistoryDay(day, 1) },
    moves: [{ id: `synthetic-move-${day}`, sourceId: `synthetic-source-${day}`, sourceRef: "Synthetic source receipt", origin: "transaction", type: "waiver", status: "complete",
      effectiveAt: `${day}T07:00:00Z`, precision: "instant", day: null, leg: 9, rosterIds: [1], waiverBid: 7, draftPicks: [],
      adds: [{ id: "synthetic-player-0", name: "Synthetic guard", rosterId: 1 }], drops: [{ id: "synthetic-former-player", name: "Synthetic former player", rosterId: 1 }], note: "Synthetic move for interaction testing." },
    { id: "synthetic-boundary", sourceId: "synthetic-boundary-evidence", sourceRef: "Synthetic reconciliation receipt", origin: "boundary-reconciliation", type: "boundary-reconciliation", status: "derived",
      effectiveAt: null, day: null, precision: "unknown", leg: null, rosterIds: [], waiverBid: null, draftPicks: null,
      adds: [], drops: [], note: "Effective time unknown; this derived boundary is not a source transaction." }], movesTruncated: false };
}
