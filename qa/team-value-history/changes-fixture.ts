/** Synthetic reproduction of the user's eight-player comparison, not live history. */
import { type TeamValueHistoryDetail, type TeamHistoryPoint } from "@/domain/team-value-history";
import { compactHistory } from "./compact-fixture";

const names = ["Tobias Harris", "Damian Lillard", "Joel Embiid", "Myles Turner", "Derrick White", "Grayson Allen", "Anthony Edwards", "Payton Pritchard"];
const prices = [2435, 3000, 4000, 2000, 1500, 2500, 5000, 1200];

export function changesDetail(day: string, mode = "changed"): TeamValueHistoryDetail {
  const after = day === "2026-10-20", at = `${day}T04:00:00.123456Z`;
  if (day !== "2026-10-19" && day !== "2026-10-20") return {
    version: 1, teamId: "1", generation: `synthetic-changes-${mode}`, day,
    valuationAt: day === "2026-10-22" ? "2026-10-22T00:10:00.000Z" : `${day}T23:59:59.999Z`,
    pointId: null, rosterRef: `synthetic-unknown-${day}`, rosterStatus: "ambiguous", rosterCount: null,
    priced: 0, subtotalCents: null, players: [], rosterEvidence: ["No synthetic price or membership evidence for this date."],
    moves: [], movesRange: { from: day, toExclusive: new Date(Date.parse(`${day}T00:00:00Z`) + 86400000).toISOString().slice(0, 10) }, movesTruncated: false,
  };
  const players = names.map((name, index) => {
    const missing = mode === "unknown" && !after && index === 1;
    const priceCents = missing ? null : after && index === 0 && mode !== "unchanged" ? 1096 : prices[index];
    return { id: index < 4 ? `1-player-${index}` : `synthetic-history-${index}`, name, priceCents,
      price: priceCents === null ? null : { kind: "recorded" as const, quoteId: `synthetic-${mode}-${day}-${index}`,
        recordedAt: at, nativeTimestamp: at.slice(0, -1), availableFrom: at, validUntil: null },
      missingReason: missing ? "No retained earlier quote in this synthetic example" : null };
  });
  return { version: 1, teamId: "1", generation: `synthetic-changes-${mode}`, day, valuationAt: at,
    pointId: `synthetic-change-point-${day}`, rosterRef: `synthetic-roster-${day}`, rosterStatus: "replayed",
    rosterCount: players.length, priced: players.filter(p => p.price !== null).length,
    subtotalCents: players.reduce((sum, p) => sum + (p.priceCents ?? 0), 0), players,
    rosterEvidence: ["Synthetic dated roster basis; not independent live ownership evidence.", "Full provenance remains available without crowding the changed-price rows."],
    moves: [], movesRange: { from: day, toExclusive: day === "2026-10-19" ? "2026-10-20" : "2026-10-21" }, movesTruncated: false };
}

export function changesHistory(mode = "changed") {
  const h = compactHistory(); h.generation = `synthetic-changes-${mode}`;
  h.points = ["2026-10-19", "2026-10-20"].map(day => {
    const d = changesDetail(day, mode);
    return { id: d.pointId!, day, valuationAt: d.valuationAt, seasonId: "2026", rosterRef: d.rosterRef,
      rosterStatus: d.rosterStatus, rosterCount: d.rosterCount, priced: d.priced, subtotalCents: d.subtotalCents,
      priceKind: "recorded", continuityId: "synthetic-change-segment", pricedSetId: `synthetic-priced-${d.priced}`, standalone: false } satisfies TeamHistoryPoint;
  });
  const last = changesDetail("2026-10-20", mode);
  h.currentQuote = { at: last.valuationAt, subtotalCents: last.players.slice(0, 4).reduce((sum, p) => sum + p.priceCents!, 0), priced: 4, rosterCount: 4 };
  return h;
}
