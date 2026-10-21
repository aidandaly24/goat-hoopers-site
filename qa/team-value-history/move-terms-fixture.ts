/** Synthetic consumer-only move terms; never a provider or production loader. */
import { teamValueHistoryDetailFixture } from "@/test/team-value-history-fixture";
import type { TeamHistoryMove } from "@/domain/team-value-history";

export function moveTermsDetail(day: string) {
  const d = teamValueHistoryDetailFixture(day); d.teamId = "1";
  const early = day < "2026-08-13";
  if (early) Object.assign(d, { rosterStatus: "ambiguous", rosterCount: null, priced: 0, subtotalCents: null, players: [], pointId: null });
  d.moves = d.moves.map(move => ({ ...move, leagueId: early ? "synthetic-2025" : "synthetic-2026" }));
  if (day !== "2025-11-01" && day !== "2026-10-19") return d;
  if (!early) d.players[2] = { ...d.players[2], id: "synthetic-new-player", name: "Synthetic incoming player with a long readable identity" };
  const base: TeamHistoryMove = { ...d.moves[0], leagueId: `synthetic-source-${early ? "2025" : "2026"}-league-with-a-long-explicit-identifier`, type: "trade", rosterIds: [1, 2, 3], waiverBid: null,
    adds: [{ id: "synthetic-new-player", name: "Synthetic incoming player with a long readable identity", rosterId: 1 }, { id: "other-player", name: "Other roster participant", rosterId: 2 }],
    drops: [{ id: "synthetic-player-2", name: "Synthetic big", rosterId: 1 }, { id: "foreign-exit", name: "Other roster outgoing player", rosterId: 3 }],
    draftPicks: [
      { season: "2027", round: 1, rosterId: 7, previousOwnerId: 2, ownerId: 1 },
      { season: "2028", round: 2, rosterId: 8, previousOwnerId: 1, ownerId: 3 },
      { season: "2029", round: 3, rosterId: 1, previousOwnerId: 2, ownerId: 3 },
      { season: null, round: null, rosterId: null, previousOwnerId: null, ownerId: null },
    ] };
  d.moves = [base,
    { ...base, id: "synthetic-missing-terms", type: "commissioner", adds: [], drops: [], draftPicks: null, rosterIds: [] },
    { ...base, id: "synthetic-waiver-12", type: "waiver", adds: [base.adds[0]], drops: [], draftPicks: [], rosterIds: [1], waiverBid: 12 },
    { ...base, id: "synthetic-waiver-zero", type: "waiver", adds: [], drops: [], draftPicks: [], rosterIds: [1], waiverBid: 0 },
  ];
  return d;
}
