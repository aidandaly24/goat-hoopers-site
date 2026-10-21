/**
 * Miniature two-season chain world for the wired history producer
 * tests (issues #224/#217). Four slots (1, 2, 3, 7) — small enough
 * to verify by hand, shaped like the real chain:
 *
 * - 2025: a 3-round × 4-slot startup draft (anchor 2025-10-20T18:00Z)
 *   assigns three players per slot; the season feed then runs the
 *   three sourced events the producer fixtures use (a free-agent add
 *   for slot 1, a two-sided trade between slots 3 and 7, a paid
 *   waiver for slot 3). Finals below are the replay's output.
 * - 2026: a 1-round rookie draft completes 2026-10-05T20:00Z. Slot
 *   1's three Oct 5 drops are PRE-draft; the four rookie drops land
 *   Oct 6 and roster 2's audited cut of 2711 lands Oct 9 — all
 *   post-draft. The derived boundary therefore differs from the 2025
 *   finals on every slot, so the reconciliation is non-empty and
 *   the generation's reconciliation binding is exercised.
 *
 * Everything runs through the REAL `loadChainRosterReplay` with
 * these Sleeper-level fakes, so the loader's own verification
 * (finals == observed, both segments) guards the fixture's honesty.
 */
import type { RawDraft, RawDraftPick, RawRoster, RawTransaction } from "../sleeper";
import { LEAGUE_ID } from "../sleeper";
import { SEASON_ONE_LEAGUE_ID, toHistoryMoves } from "../team-value-history";
import { loadChainRosterReplay, type RosterReplayDeps } from "../roster-replay";

export const CHAIN_NOW = new Date("2026-10-20T12:00:00Z");

const ROSTER_SETTINGS = {
  wins: 0, losses: 0, ties: 0, fpts: 0, fpts_decimal: 0, fpts_against: 0, fpts_against_decimal: 0,
};

const tx = (partial: Partial<RawTransaction>): RawTransaction => ({
  transaction_id: "0", type: "free_agent", status: "complete", roster_ids: [], leg: 1,
  created: 0, adds: null, drops: null, draft_picks: [], ...partial,
});

/** The 2025 feed: the same three sourced events as the producer fixtures. */
export const CHAIN_TX_2025: RawTransaction[] = [
  tx({
    transaction_id: "1425000000000000003", type: "free_agent", leg: 2, roster_ids: [1],
    created: Date.parse("2025-10-28T12:00:00Z"), status_updated: Date.parse("2025-10-28T12:00:00Z"),
    adds: { "104": 1 },
  }),
  tx({
    transaction_id: "1425000000000000001", type: "trade", leg: 5, roster_ids: [3, 7],
    created: Date.parse("2025-11-15T18:30:00Z"), status_updated: Date.parse("2025-11-15T18:30:00Z"),
    adds: { "701": 3, "302": 7 }, drops: { "302": 3, "701": 7 },
    draft_picks: [{ season: "2026", round: 1, roster_id: 3, previous_owner_id: 3, owner_id: 7 }],
  }),
  tx({
    transaction_id: "1425000000000000002", type: "waiver", leg: 7, roster_ids: [3],
    created: Date.parse("2025-12-02T15:00:00Z"), status_updated: Date.parse("2025-12-02T15:00:00Z"),
    adds: { "303": 3 }, drops: { "304": 3 }, settings: { waiver_bid: 12 },
  }),
];

/** The 2026 feed as the CHAIN sees it (the history feed adds a slot-5 record and a failed row). */
export const CHAIN_TX_2026: RawTransaction[] = [
  tx({ transaction_id: "1412890269203922944", created: 1791221799712, status_updated: 1791221799712, drops: { "2467": 1 } }),
  tx({ transaction_id: "1412890322886774784", created: 1791221812510, status_updated: 1791221812510, drops: { "2475": 1 } }),
  tx({ transaction_id: "1412890397490876416", created: 1791221830298, status_updated: 1791221830298, drops: { "2482": 1 } }),
  tx({
    transaction_id: "rookie-drop-1", created: Date.parse("2026-10-06T15:00:00Z"),
    status_updated: Date.parse("2026-10-06T15:00:00Z"), drops: { "9001": 1 },
  }),
  tx({
    transaction_id: "rookie-drop-2", created: Date.parse("2026-10-06T15:00:00Z"),
    status_updated: Date.parse("2026-10-06T15:00:00Z"), drops: { "9002": 2 },
  }),
  tx({
    transaction_id: "rookie-drop-3", created: Date.parse("2026-10-06T15:00:00Z"),
    status_updated: Date.parse("2026-10-06T15:00:00Z"), drops: { "9003": 3 },
  }),
  tx({
    transaction_id: "rookie-drop-7", created: Date.parse("2026-10-06T15:00:00Z"),
    status_updated: Date.parse("2026-10-06T15:00:00Z"), drops: { "9007": 7 },
  }),
  tx({ transaction_id: "1414110209072234496", created: 1791512656042, status_updated: 1791512656042, drops: { "2711": 2 } }),
];

export type ChainWorld = {
  drafts: Record<string, RawDraft>;
  picks: Record<string, RawDraftPick[]>;
  rosters: Record<string, RawRoster[]>;
  tx: Record<string, RawTransaction[]>;
};

const pick = (pick_no: number, round: number, draft_slot: number, roster_id: number, player_id: string): RawDraftPick => ({
  pick_no, round, draft_slot, player_id, picked_by: "", roster_id, metadata: {},
});
const roster = (roster_id: number, players: string[]): RawRoster => ({
  roster_id, owner_id: `user-${roster_id}`, players, settings: ROSTER_SETTINGS,
} as RawRoster);
const DRAFT_ORDER = { "user-1": 1, "user-2": 2, "user-3": 3, "user-7": 7 };

/** A fresh, mutable copy of the miniature world (mutation tests clone and twist it). */
export function chainWorld(): ChainWorld {
  const draft2025: RawDraft = {
    draft_id: "draft-2025-fixture", league_id: SEASON_ONE_LEAGUE_ID, season: "2025",
    status: "complete", type: "snake", last_picked: Date.parse("2025-10-20T18:00:00Z"),
    settings: { rounds: 3, teams: 4 }, draft_order: { ...DRAFT_ORDER },
  };
  const draft2026: RawDraft = {
    draft_id: "draft-2026-fixture", league_id: LEAGUE_ID, season: "2026",
    status: "complete", type: "snake", last_picked: Date.parse("2026-10-05T20:00:00Z"),
    settings: { rounds: 1, teams: 4 }, draft_order: { ...DRAFT_ORDER },
  };
  // Round-robin by round: each slot's three assignments.
  const assignments2025: Record<number, string[]> = {
    1: ["101", "102", "103"], 2: ["201", "202", "209"], 3: ["301", "302", "304"], 7: ["701", "702", "703"],
  };
  const picks2025: RawDraftPick[] = [];
  for (let round = 1; round <= 3; round++) {
    for (const slot of [1, 2, 3, 7]) {
      picks2025.push(pick(picks2025.length + 1, round, slot, slot, assignments2025[slot][round - 1]));
    }
  }
  const picks2026: RawDraftPick[] = [
    pick(1, 1, 1, 1, "9001"), pick(2, 1, 2, 2, "9002"), pick(3, 1, 3, 3, "9003"), pick(4, 1, 7, 7, "9007"),
  ];
  return {
    drafts: { [SEASON_ONE_LEAGUE_ID]: draft2025, [LEAGUE_ID]: draft2026 },
    picks: { [draft2025.draft_id]: picks2025, [draft2026.draft_id]: picks2026 },
    rosters: {
      // Observed finals the 2025 replay must reproduce.
      [SEASON_ONE_LEAGUE_ID]: [
        roster(1, ["101", "102", "103", "104"]), roster(2, ["201", "202", "209"]),
        roster(3, ["301", "303", "701"]), roster(7, ["302", "702", "703"]),
      ],
      // Observed current rosters the 2026 replay must reproduce.
      [LEAGUE_ID]: [
        roster(1, ["101", "102", "103"]), roster(2, ["201", "202"]),
        roster(3, ["301", "303"]), roster(7, ["701", "702"]),
      ],
    },
    tx: { [SEASON_ONE_LEAGUE_ID]: CHAIN_TX_2025, [LEAGUE_ID]: CHAIN_TX_2026 },
  };
}

/** RosterReplayDeps over a world, clocked at CHAIN_NOW unless overridden. */
export function replayDepsFrom(world: ChainWorld, overrides: Partial<RosterReplayDeps> = {}): RosterReplayDeps {
  return {
    fetchDrafts: async leagueId => [world.drafts[leagueId]],
    fetchDraftPicks: async draftId => world.picks[draftId],
    fetchRosters: async leagueId => world.rosters[leagueId],
    fetchMoves: async leagueId => toHistoryMoves(world.tx[leagueId], leagueId),
    seasonTwoWeeks: async () => [1, 2, 3],
    now: () => CHAIN_NOW,
    ...overrides,
  };
}

/** A `TeamHistoryDeps.fetchChain` over a fresh miniature world. */
export const fetchFixtureChain = (world: ChainWorld = chainWorld()) =>
  async () => loadChainRosterReplay(replayDepsFrom(world));
