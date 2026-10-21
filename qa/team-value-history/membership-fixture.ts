/** Synthetic agreed membership/th2 DTOs. No live producer or token-parser implementation. */
import { teamValueHistoryFixture } from "@/test/team-value-history-fixture";
import { moveTermsDetail } from "./move-terms-fixture";
import { shiftHistoryDay, type TeamValueHistoryEnvelope } from "@/domain/team-value-history";

export type SyntheticView = "a" | "b" | "c";
const cutoffs = { a: "2026-10-20T12:00:00.000Z", b: "2026-10-20T13:45:00.456Z", c: "2026-10-20T14:15:00.789Z" };
export const syntheticGeneration = (view: SyntheticView) => `th2:${cutoffs[view]}:${view.repeat(24)}`;

export function membershipEnvelope(view: SyntheticView): TeamValueHistoryEnvelope {
  const h = teamValueHistoryFixture();
  h.team = { id: "1", name: "Fixture Club 1" };
  h.generation = syntheticGeneration(view); h.asOf = cutoffs[view];
  h.leagueRange.from = "2025-10-20"; h.requestedRange = { ...h.leagueRange }; h.loadedRange = { ...h.leagueRange };
  h.seasons[0].range.from = h.leagueRange.from;
  h.coverage.valuation[0].from = h.leagueRange.from;
  h.points = h.points.filter(p => p.day >= h.leagueRange.from);
  h.coverage.roster = [{ from: h.leagueRange.from, toExclusive: "2026-04-02", status: "replayed", reason: "Synthetic draft-anchored membership; intermediate dates are replay assertions." },
    { from: "2026-04-02", toExclusive: "2026-08-13", status: "unavailable", reason: "Synthetic gap: no membership asserted." },
    { from: "2026-08-13", toExclusive: h.leagueRange.toExclusive, status: "replayed", reason: "Synthetic boundary reconciliation, not a source transaction." }];
  return h;
}

export function membershipDetail(day: string, view: SyntheticView, mode = "") {
  const h = membershipEnvelope(view), d = moveTermsDetail(day);
  d.generation = h.generation;
  const known = day.startsWith("2025-11-") || day === "2026-10-20";
  if (known) {
    const empty = day === "2025-11-02", count = empty ? 0 : view === "a" ? 2 : view === "b" ? 3 : 4;
    Object.assign(d, { pointId: null, rosterRef: `synthetic-${view}-${day}`, rosterStatus: "replayed", rosterCount: count, priced: 0,
      subtotalCents: empty ? 0 : null, valuationAt: day === "2026-10-20" ? h.asOf : `${day}T23:59:59.999999Z`,
      players: Array.from({ length: count }, (_, i) => ({ id: `synthetic-member-${i}`, name: i ? `Synthetic member ${i} with a long readable identity` : `Synthetic ${view} roster member`,
        priceCents: null, price: null, missingReason: "No dated historical quote in this synthetic membership-only fixture." })),
      rosterEvidence: [day < "2026-08-13" ? "Synthetic draft-anchored replay; the intermediate roster is not independently observed."
        : "Synthetic boundary-reconciled replay; reconciliation is not a source transaction.",
        "Synthetic source league with a long receipt identity: " + "bounded-source-proof-".repeat(12),
        "Replay depth is league-wide; this prose is displayed as supplied, never parsed into counts."] });
  }
  if (day >= "2026-04-02" && day < "2026-08-13") Object.assign(d, { pointId: null, rosterRef: "synthetic-gap", valuationAt: `${day}T00:00:00.000000Z`,
    rosterStatus: "unavailable", rosterCount: null, priced: 0, subtotalCents: null, players: [], rosterEvidence: ["Synthetic gap: membership and value remain unknown."] });
  if (day === "2025-11-02" || day >= "2026-04-02" && day < "2026-08-13") d.moves = [];
  if (mode === "future" && day === "2026-10-20") d.valuationAt = h.asOf.slice(0, -1) + "001Z";
  // Preserve the ordinary bounded move window; membership does not create prices or draft events.
  d.movesRange = { from: day === h.leagueRange.from ? day : shiftHistoryDay(day, -1), toExclusive: shiftHistoryDay(day, 1) };
  return d;
}
