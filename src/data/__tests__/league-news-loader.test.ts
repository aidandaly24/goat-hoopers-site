/**
 * league-news-loader.test.ts — P1 last-good invariant for loadLeagueNews
 * (src/data/league.ts).
 *
 * The loader must throw when any required news input fails to fetch, so
 * the TTL cache preserves last-good instead of caching a failure-degraded
 * feed. These tests drive the REAL loadLeagueNews with fake clients
 * (rule 11) — not just the cache wrapper.
 *
 * Failing case (from review): transactions endpoint 503s, rosters/users
 * stay healthy. The old resilient loader swallowed the 503 into [] and
 * the teams-nonempty guard passed — empty feed evicted last-good.
 */
import { describe, expect, it } from "vitest";
import {
  loadLeagueNews,
  getTransactionHistoryStrict,
  getDraftBoardStrict,
} from "@/data/league";
import type { TransactionHistoryData, DraftBoardData } from "@/data/league";
import type { Team } from "@/domain/team";
import type { Transaction } from "@/domain/transaction";
import type { DraftPick } from "@/domain/draft";

function team(id: string, name: string): Team {
  return {
    id,
    name,
    managerName: `mgr-${id}`,
    avatar: null,
    wins: 0,
    losses: 0,
    ties: 0,
    pointsFor: 0,
    pointsAgainst: 0,
  };
}

const TEAMS = [team("1", "Alpha"), team("2", "Beta")];

function tx(id: string): Transaction {
  return {
    id,
    type: "trade",
    week: 1,
    createdAt: 1_000,
    summary: "Alpha trades with Beta",
    teamIds: ["1", "2"],
    adds: [],
    drops: [],
  };
}

function pick(): DraftPick {
  return {
    pickNo: 1,
    round: 1,
    draftSlot: 1,
    playerId: "9999",
    playerName: "Fake Rookie",
    teamId: "1",
    position: "PG",
    nbaTeam: "BKN",
  };
}

const healthyTx: TransactionHistoryData = {
  transactions: [tx("t1")],
  teams: TEAMS,
};
const healthyDraft: DraftBoardData = { picks: [pick()], teams: TEAMS };
const emptyTx: TransactionHistoryData = { transactions: [], teams: TEAMS };
const emptyDraft: DraftBoardData = { picks: [], teams: TEAMS };

describe("loadLeagueNews", () => {
  it("throws when the transactions fetch fails, even with healthy teams", async () => {
    // The P1 case: /transactions/1 503s, rosters/users stay healthy.
    // A throwing fetchTxHistory must propagate — never become an empty feed.
    await expect(
      loadLeagueNews({
        fetchTxHistory: async () => {
          throw new Error("Sleeper API 503 on /transactions/1");
        },
        fetchDraft: async () => healthyDraft,
      })
    ).rejects.toThrow("Sleeper API 503");
  });

  it("throws when the draft fetch fails", async () => {
    await expect(
      loadLeagueNews({
        fetchTxHistory: async () => healthyTx,
        fetchDraft: async () => {
          throw new Error("Sleeper API 500 on /draft_picks");
        },
      })
    ).rejects.toThrow("Sleeper API 500");
  });

  it("returns a feed for healthy inputs", async () => {
    const feed = await loadLeagueNews({
      fetchTxHistory: async () => healthyTx,
      fetchDraft: async () => healthyDraft,
    });
    expect(feed.length).toBeGreaterThan(0);
  });

  it("does not throw for empty-but-successfully-fetched inputs", async () => {
    // "Failure throws" ≠ "empty throws": a quiet week with no transactions
    // and no draft on record is legitimate and must not trip last-good.
    const feed = await loadLeagueNews({
      fetchTxHistory: async () => emptyTx,
      fetchDraft: async () => emptyDraft,
    });
    expect(Array.isArray(feed)).toBe(true);
  });
});

describe("getTransactionHistoryStrict", () => {
  const settings = {
    wins: 0,
    losses: 0,
    ties: 0,
    fpts: 0,
    fpts_decimal: 0,
    fpts_against: 0,
    fpts_against_decimal: 0,
  };
  const rosters = [{ roster_id: 1, owner_id: "u1", players: [], settings }];
  const users = [{ user_id: "u1", display_name: "amy" }];
  const state = { week: 1, season_type: "pre", season: "2026" };

  it("throws when a transaction week 503s", async () => {
    await expect(
      getTransactionHistoryStrict({
        fetchRosters: async () => rosters as never,
        fetchUsers: async () => users as never,
        fetchNbaState: async () => state as never,
        fetchTransactions: async () => {
          throw new Error("Sleeper API 503 on /transactions/1");
        },
      })
    ).rejects.toThrow("Sleeper API 503");
  });

  it("throws when rosters fail", async () => {
    await expect(
      getTransactionHistoryStrict({
        fetchRosters: async () => {
          throw new Error("Sleeper API 500 on /rosters");
        },
        fetchUsers: async () => users as never,
        fetchNbaState: async () => state as never,
        fetchTransactions: async () => [],
      })
    ).rejects.toThrow("Sleeper API 500");
  });

  it("returns empty (not throw) when weeks fetch fine but are quiet", async () => {
    const result = await getTransactionHistoryStrict({
      fetchRosters: async () => rosters as never,
      fetchUsers: async () => users as never,
      fetchNbaState: async () => state as never,
      fetchTransactions: async () => [],
      fetchDirectory: async () => null,
    });
    expect(result.transactions).toEqual([]);
    expect(result.teams.length).toBeGreaterThan(0);
  });
});

describe("getDraftBoardStrict", () => {
  const settings = {
    wins: 0,
    losses: 0,
    ties: 0,
    fpts: 0,
    fpts_decimal: 0,
    fpts_against: 0,
    fpts_against_decimal: 0,
  };
  const rosters = [{ roster_id: 1, owner_id: "u1", players: [], settings }];
  const users = [{ user_id: "u1", display_name: "amy" }];
  const drafts = [{ draft_id: "d1", season: "2026", status: "complete" }];

  it("throws when the picks fetch fails", async () => {
    await expect(
      getDraftBoardStrict({
        fetchDrafts: async () => drafts as never,
        fetchRosters: async () => rosters as never,
        fetchUsers: async () => users as never,
        fetchDraftPicks: async () => {
          throw new Error("Sleeper API 503 on /draft_picks");
        },
      })
    ).rejects.toThrow("Sleeper API 503");
  });

  it("returns empty picks (not throw) when no draft is on record", async () => {
    const result = await getDraftBoardStrict({
      fetchDrafts: async () => [],
      fetchRosters: async () => rosters as never,
      fetchUsers: async () => users as never,
      fetchDraftPicks: async () => {
        throw new Error("should not be called");
      },
    });
    expect(result.picks).toEqual([]);
    expect(result.teams.length).toBeGreaterThan(0);
  });
});
