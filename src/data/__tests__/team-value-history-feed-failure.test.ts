/**
 * Fail-closed transaction feed at the real producer boundary (dot P1
 * regression on PR #225).
 *
 * These tests exercise the DEFAULT move loader — no `fetchMoves`
 * injection — with only the Sleeper client mocked out. The pre-fix
 * loader used the shared tolerant week fetcher, which converts a failed
 * week into an empty array; the replay then served priced `replayed`
 * history built from the bare anchor (in the dot's synthetic repro,
 * roster 2's Oct 8 value fell from 24,000 to 15,000 when its later drop
 * silently disappeared). The fixed loader must reject unless every
 * season week succeeds.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../sleeper", async importOriginal => {
  const original = await importOriginal<typeof import("../sleeper")>();
  return { ...original, fetchNbaState: vi.fn(), fetchTransactions: vi.fn(), fetchTransactionsForLeague: vi.fn() };
});

import { fetchNbaState, fetchTransactions, fetchTransactionsForLeague, type RawTransaction } from "../sleeper";
import { fetchTransactionsByWeekComplete } from "../league";
import type { RecordedQuote } from "../recorded-quotes";
import {
  getTeamValueHistory, loadTeamHistoryState, type TeamHistoryDeps,
} from "../team-value-history";

const NOW = new Date("2026-10-20T12:00:00Z");

const ANCHOR = {
  observedAt: "2026-10-20T11:59:00.000Z",
  teams: [
    { id: "1", name: "Fixture Club 1", players: ["101", "102", "103"] },
    { id: "2", name: "Fixture Club 2", players: ["201", "202"] },
  ],
};

const tx = (partial: Partial<RawTransaction>): RawTransaction => ({
  transaction_id: "0", type: "free_agent", status: "complete", roster_ids: [], leg: 1,
  created: 0, adds: null, drops: null, draft_picks: [], ...partial,
});

/** The audited move: roster 2's completed drop of 2711 on Oct 9. */
const CUT = tx({
  transaction_id: "1414110209072234496", created: 1791512656042, status_updated: 1791512656042,
  drops: { "2711": 2 },
});

const T1 = "2026-10-08T04:00:00.000000";
const QUOTES: RecordedQuote[] = [
  { quoteId: "q-t1-201", playerId: "201", priceCents: 5000, nativeTimestamp: T1 },
  { quoteId: "q-t1-202", playerId: "202", priceCents: 7000, nativeTimestamp: T1 },
  { quoteId: "q-t1-2711", playerId: "2711", priceCents: 9000, nativeTimestamp: T1 },
];

/** Anchor + quotes injected; moves deliberately NOT injected. */
function deps(): TeamHistoryDeps {
  return {
    quotes: {
      readWindow: async request => ({
        quotes: QUOTES.filter(entry => request.playerIds.includes(entry.playerId)),
        truncated: false,
      }),
    },
    fetchAnchor: async () => ANCHOR,
    fetchNames: async () => ({}),
    now: () => NOW,
  };
}

const stateOk = { week: 3, season_type: "regular", season: "2026" };

beforeEach(() => {
  vi.mocked(fetchNbaState).mockReset();
  vi.mocked(fetchTransactions).mockReset();
  vi.mocked(fetchTransactionsForLeague).mockReset();
  // The 2025 lane is healthy and empty unless a test says otherwise.
  vi.mocked(fetchTransactionsForLeague).mockResolvedValue([]);
});

describe("fetchTransactionsByWeekComplete", () => {
  it("rejects when any single week fails, even with healthy weeks around it", async () => {
    vi.mocked(fetchTransactions).mockImplementation(async week => {
      if (week === 2) throw new Error("Sleeper API 500");
      return week === 1 ? [CUT] : [];
    });
    await expect(fetchTransactionsByWeekComplete([1, 2, 3])).rejects.toThrow("Sleeper API 500");
  });

  it("rejects a malformed (non-array) week payload", async () => {
    vi.mocked(fetchTransactions).mockResolvedValue({} as unknown as RawTransaction[]);
    await expect(fetchTransactionsByWeekComplete([1])).rejects.toThrow("malformed payload");
  });

  it("resolves the full per-week payload when every week succeeds", async () => {
    vi.mocked(fetchTransactions).mockImplementation(async week => (week === 1 ? [CUT] : []));
    await expect(fetchTransactionsByWeekComplete([1, 2])).resolves.toEqual([[CUT], []]);
  });
});

describe("default move loader (no injection)", () => {
  it("one failed week with healthy season state fails the whole load closed", async () => {
    vi.mocked(fetchNbaState).mockResolvedValue(stateOk);
    vi.mocked(fetchTransactions).mockImplementation(async week => {
      if (week === 2) throw new Error("Sleeper API 500");
      return week === 1 ? [CUT] : [];
    });
    await expect(loadTeamHistoryState("2", deps())).rejects.toMatchObject({ status: 503 });
    expect(await getTeamValueHistory("2", deps())).toBeNull();
  });

  it("a complete Sleeper outage fails closed instead of replaying the bare anchor", async () => {
    vi.mocked(fetchNbaState).mockRejectedValue(new Error("Sleeper API 503"));
    await expect(loadTeamHistoryState("2", deps())).rejects.toMatchObject({ status: 503 });
    expect(await getTeamValueHistory("2", deps())).toBeNull();
  });

  it("a healthy complete feed reproduces the audited Oct 8 endpoint", async () => {
    vi.mocked(fetchNbaState).mockResolvedValue(stateOk);
    vi.mocked(fetchTransactions).mockImplementation(async week => (week === 1 ? [CUT] : []));
    const state = await loadTeamHistoryState("2", deps());
    const oct8 = state.receipt().points.find(point => point.day === "2026-10-08")!;
    expect(oct8.roster).toEqual(["201", "202", "2711"]);
    expect(oct8.subtotalCents).toBe(21000);
  });

  it("one failed 2025 week fails the whole load closed (#224 lane)", async () => {
    vi.mocked(fetchNbaState).mockResolvedValue(stateOk);
    vi.mocked(fetchTransactions).mockImplementation(async week => (week === 1 ? [CUT] : []));
    vi.mocked(fetchTransactionsForLeague).mockImplementation(async (_leagueId, week) => {
      if (week === 7) throw new Error("Sleeper API 500");
      return [];
    });
    await expect(loadTeamHistoryState("2", deps())).rejects.toMatchObject({ status: 503 });
    expect(await getTeamValueHistory("2", deps())).toBeNull();
  });

  it("reads exactly the 2025 league's fixed 24 weeks and surfaces its moves as events", async () => {
    const trade2025 = tx({
      transaction_id: "1425000000000000099", type: "trade", leg: 5, roster_ids: [2, 4],
      created: Date.parse("2025-11-15T10:00:00Z"), status_updated: Date.parse("2025-11-15T10:00:00Z"),
      adds: { "209": 2, "401": 4 }, drops: { "208": 2, "402": 4 }, draft_picks: [],
    });
    vi.mocked(fetchNbaState).mockResolvedValue(stateOk);
    vi.mocked(fetchTransactions).mockImplementation(async week => (week === 1 ? [CUT] : []));
    vi.mocked(fetchTransactionsForLeague).mockImplementation(async (_leagueId, week) => (week === 5 ? [trade2025] : []));
    const state = await loadTeamHistoryState("2", deps());
    const calls = vi.mocked(fetchTransactionsForLeague).mock.calls;
    expect(calls).toHaveLength(24);
    expect(calls.every(([leagueId]) => leagueId === "1282883196567977984")).toBe(true);
    // The recorded endpoint is untouched by the 2025 lane.
    const oct8 = state.receipt().points.find(point => point.day === "2026-10-08")!;
    expect(oct8.roster).toEqual(["201", "202", "2711"]);
    // And the 2025 trade is a sourced event in its day's detail.
    const detail = state.detail("2025-11-15", {});
    expect(detail.rosterStatus).toBe("ambiguous");
    expect(detail.players).toEqual([]);
    expect(detail.moves).toHaveLength(1);
    expect(detail.moves[0]).toMatchObject({ sourceId: "1425000000000000099", type: "trade", leg: 5, rosterIds: [2, 4] });
    expect(detail.moves[0].adds.filter(entry => entry.rosterId === 2).map(entry => entry.id)).toEqual(["209"]);
    expect(detail.moves[0].drops.filter(entry => entry.rosterId === 2).map(entry => entry.id)).toEqual(["208"]);
  });
});
