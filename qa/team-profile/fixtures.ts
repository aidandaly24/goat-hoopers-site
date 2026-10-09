import type { FranchiseHistory, ManagerArchetype, Team, TeamProfile } from "@/domain";

/** Synthetic edge cases for offline tests only; never a production data source. */
export const teams: Team[] = [
  { id: "8", name: "A Long Franchise Name With Every Word Visible", managerName: "Manager With A Complete Display Name", avatar: null, wins: 3, losses: 2, ties: 1, pointsFor: 581230, pointsAgainst: 572080 },
  { id: "2", name: "Another Long Opponent Name That Must Wrap", managerName: "Opponent Manager", avatar: "fixture-avatar", wins: 2, losses: 3, ties: 0, pointsFor: 560020, pointsAgainst: 590010 },
];

export const profile: TeamProfile = {
  team: teams[0],
  players: [
    { id: "long-player", fullName: "A Complete Long Player Name With Every Word Visible", position: "PG", nbaTeam: "LAL", espnId: null },
    { id: "accent-player", fullName: "Alperen Şengün", position: "C", nbaTeam: "HOU", espnId: "123" },
    { id: "unknown-player", fullName: "Unknown Metadata Player", position: null, nbaTeam: null, espnId: null },
  ],
  // Deliberately newest-first, including two pending weeks, a partial score,
  // a zero-point loss and a finalized zero-point tie.
  matchups: [
    { week: 6, home: teams[0], away: teams[1], homePoints: null, awayPoints: null },
    { week: 5, home: teams[1], away: teams[0], homePoints: 22.5, awayPoints: null },
    { week: 4, home: teams[0], away: teams[1], homePoints: 0, awayPoints: 10 },
    { week: 3, home: teams[1], away: teams[0], homePoints: 0, awayPoints: 0 },
  ],
  streak: -1,
  draftPicks: [
    { pickNo: 3, round: 1, draftSlot: 3, playerId: "pick-player", playerName: "Complete Rookie Pick Name", position: "SF", nbaTeam: "DAL", espnId: null, teamId: "8" },
    { pickNo: 13, round: 2, draftSlot: 3, playerId: "unknown-pick", playerName: "Pick Without Position", position: null, nbaTeam: null, espnId: null, teamId: "8" },
  ],
  transactions: [
    { id: "move-add-drop", type: "waiver", week: 4, createdAt: 1, summary: "Structured add and drop", teamIds: ["8"], adds: [{ playerId: "wire-add", name: "Wire Addition" }], drops: [{ playerId: "wire-drop", name: "Wire Departure" }] },
    { id: "move-trade", type: "trade", week: 3, createdAt: 0, summary: "Trade", teamIds: ["8", "2"], adds: [], drops: [] },
  ],
};

export const franchise: FranchiseHistory = {
  teamId: "8", teamName: teams[0].name, founded: "2025",
  championships: 1, finalsAppearances: 1, allTime: { wins: 12, losses: 8 }, titleSeasons: ["2025"],
  discontinuity: "Historical ownership differs from the current manager.",
  timeline: [{ year: "2025", title: "Original season", description: "The complete historical account remains available." }],
};

export const archetype: ManagerArchetype = {
  rosterId: "8",
  seasons: [{ season: "2025", managerName: "Historical Manager", priorManagerNote: "2025 · managed then by Historical Manager — not the current manager.",
    archetype: "chaotic-neutral", metrics: { draftCapital: 11, tradeFrequency: 22, wireAggression: 33, youthPreference: 44, patience: null } }],
};
