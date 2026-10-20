/**
 * Recorded-only team-value-history producer (issue #217).
 *
 * The fixture mirrors the audited 2026 Sleeper feed exactly where the
 * audit pinned facts: roster 2's only post-Oct-8 move is the completed
 * drop of player 2711 in transaction 1414110209072234496 at
 * 2026-10-09T02:24:16.042Z, and roster 1's latest completed moves are
 * its 2026-10-05 drops. The reconciliation assertions are the audit's
 * known endpoints: at Oct 8, roster 1 is unchanged and roster 2 still
 * holds 2711; after the cut instant, roster 2 no longer does.
 */
import { describe, expect, it } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";
import {
  historyDetailMatchesPoint, historySegments, isTeamValueHistoryDetail, isTeamValueHistoryEnvelope,
} from "@/domain/team-value-history";
import type { RawPlayerEntry, RawTransaction } from "../sleeper";
import type { Db } from "../db";
import { getRecordedQuoteStore, recordedQuoteQuery, type RecordedQuote } from "../recorded-quotes";
import {
  getTeamValueHistory, loadTeamHistoryState, teamHistoryDetailResponse, teamHistorySummaryResponse,
  toHistoryMoves, type TeamHistoryDeps,
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

/** The audited feed facts, plus a failed move and an unrelated move. */
const RAW_TX: RawTransaction[] = [
  tx({ transaction_id: "1412890269203922944", created: 1791221799712, status_updated: 1791221799712, drops: { "2467": 1 } }),
  tx({ transaction_id: "1412890322886774784", created: 1791221812510, status_updated: 1791221812510, drops: { "2475": 1 } }),
  tx({ transaction_id: "1412890397490876416", created: 1791221830298, status_updated: 1791221830298, drops: { "2482": 1 } }),
  tx({ transaction_id: "1414110209072234496", created: 1791512656042, status_updated: 1791512656042, drops: { "2711": 2 } }),
  tx({ transaction_id: "9999999999999999999", status: "failed", created: 1791600000000, status_updated: 1791600000000, drops: { "201": 2 } }),
  tx({ transaction_id: "1393428077987532800", created: 1786581651735, status_updated: 1786581651735, drops: { "1434": 5 } }),
];

const T1 = "2026-10-08T04:00:00.000000";
const T2 = "2026-10-09T04:00:00.000000";
const T3 = "2026-10-11T04:00:00.000000";
const quote = (quoteId: string, playerId: string, priceCents: number, nativeTimestamp: string): RecordedQuote =>
  ({ quoteId, playerId, priceCents, nativeTimestamp });

const QUOTES: RecordedQuote[] = [
  quote("q-t1-101", "101", 10000, T1), quote("q-t1-102", "102", 20000, T1), quote("q-t1-103", "103", 30000, T1),
  quote("q-t2-101", "101", 11000, T2), quote("q-t2-102", "102", 21000, T2), quote("q-t2-103", "103", 31000, T2),
  quote("q-t3-101", "101", 12000, T3), quote("q-t3-103", "103", 32000, T3),
  quote("q-t1-201", "201", 5000, T1), quote("q-t1-202", "202", 7000, T1), quote("q-t1-2711", "2711", 9000, T1),
  quote("q-t2-201", "201", 5500, T2), quote("q-t2-202", "202", 7500, T2),
];

const NAMES: Record<string, RawPlayerEntry> = {
  "101": { full_name: "Fixture One" }, "102": { full_name: "Fixture Two" }, "103": { full_name: "Fixture Three" },
  "201": { full_name: "Fixture Four" }, "202": { full_name: "Fixture Five" }, "2711": { full_name: "Fixture Cut" },
};

function deps(overrides: Partial<TeamHistoryDeps> = {}, quotes: RecordedQuote[] = QUOTES): TeamHistoryDeps {
  return {
    quotes: {
      readWindow: async request => ({
        quotes: quotes.filter(entry => request.playerIds.includes(entry.playerId)),
        truncated: false,
      }),
    },
    fetchAnchor: async () => ANCHOR,
    fetchMoves: async () => toHistoryMoves(RAW_TX),
    fetchNames: async () => NAMES,
    now: () => NOW,
    ...overrides,
  };
}

const url = (path: string, params: Record<string, string>) =>
  new URL(`https://history.invalid${path}?${new URLSearchParams(params)}`);

describe("toHistoryMoves — frozen replay order", () => {
  it("keeps complete moves only, ordered by status_updated then transaction_id", () => {
    const moves = toHistoryMoves([
      tx({ transaction_id: "200", created: 500, status_updated: 500 }),
      tx({ transaction_id: "100", created: 900, status_updated: 500 }),
      tx({ transaction_id: "300", status: "failed", created: 100, status_updated: 100 }),
      tx({ transaction_id: "400", created: 700, status_updated: undefined }),
    ]);
    expect(moves.map(move => move.id)).toEqual(["100", "200", "400"]);
    expect(moves.at(-1)?.effectiveMs).toBe(700); // created fallback
  });
});

describe("producer envelope", () => {
  it("builds a contract-valid envelope over the full league window", async () => {
    const envelope = await getTeamValueHistory("1", deps());
    expect(envelope).not.toBeNull();
    expect(isTeamValueHistoryEnvelope(envelope)).toBe(true);
    expect(envelope!.leagueRange).toEqual({ from: "2025-10-20", toExclusive: "2026-10-21" });
    expect(envelope!.requestedRange).toEqual(envelope!.leagueRange);
    expect(envelope!.sourceNotes[0]).toContain("Retained-source limitation");
    expect(envelope!.currentQuote).toEqual({ at: `${T3}Z`, subtotalCents: 44000, priced: 2, rosterCount: 3 });
  });

  it("emits one point per retained snapshot day with explicit gaps", async () => {
    const state = await loadTeamHistoryState("1", deps());
    expect(state.points.map(point => point.day)).toEqual(["2026-10-08", "2026-10-09", "2026-10-11"]);
    expect(state.points.map(point => point.subtotalCents)).toEqual([60000, 63000, 44000]);
    expect(state.points.every(point => point.priceKind === "recorded" && point.rosterStatus === "replayed")).toBe(true);
    const partial = state.points.at(-1)!;
    expect(partial.priced).toBe(2);
    expect(partial.rosterCount).toBe(3);
    expect(partial.pricedSetId).not.toBeNull();
    // Oct 8–9 share a priced set and connect; the Oct 11 partial is its
    // own segment, and the missing Oct 10 draws no line.
    expect(historySegments(state.points).map(segment => segment.map(point => point.day)))
      .toEqual([["2026-10-08", "2026-10-09"], ["2026-10-11"]]);
    const valuation = state.coverage.valuation.find(entry => entry.status === "partial");
    expect(valuation?.reason).toContain("3 of 4 days");
  });

  it("handles the Oct 9 roster-2 cut instead of stretching the roster", async () => {
    const state = await loadTeamHistoryState("2", deps());
    expect(state.points.map(point => [point.day, point.rosterCount, point.subtotalCents])).toEqual([
      ["2026-10-08", 3, 21000],
      ["2026-10-09", 2, 13000],
    ]);
    // The priced set changed at the cut, so the line breaks there.
    expect(state.points[0].continuityId).not.toBe(state.points[1].continuityId);
  });
});

describe("point → roster → move receipt (reconciliation)", () => {
  it("reproduces the audited endpoints for Oct 8", async () => {
    const state2 = await loadTeamHistoryState("2", deps());
    const receipt2 = state2.receipt();
    const oct8 = receipt2.points.find(point => point.day === "2026-10-08")!;
    // Known endpoint: the reverse-check at Oct 8 adds 2711 back to roster 2.
    expect(oct8.roster).toEqual(["201", "202", "2711"]);
    expect(oct8.generationMoves).toEqual([
      { id: "1414110209072234496", type: "free_agent", effectiveAt: "2026-10-09T02:24:16.042Z" },
    ]);
    const oct9 = receipt2.points.find(point => point.day === "2026-10-09")!;
    expect(oct9.roster).toEqual(["201", "202"]);
    expect(oct9.generationMoves).toEqual([]);

    const state1 = await loadTeamHistoryState("1", deps());
    const receipt1 = state1.receipt();
    // Known endpoint: roster 1 is unchanged at Oct 8 (latest move Oct 5).
    expect(receipt1.points.find(point => point.day === "2026-10-08")!.roster).toEqual(["101", "102", "103"]);
    expect(receipt1.points.find(point => point.day === "2026-10-08")!.generationMoves).toEqual([]);
    // The failed move never appears anywhere in either receipt.
    expect(JSON.stringify([receipt1, receipt2])).not.toContain("9999999999999999999");
  });

  it("is deterministic: identical sources give identical receipts and generation", async () => {
    const a = await loadTeamHistoryState("2", deps());
    const b = await loadTeamHistoryState("2", deps());
    expect(a.receipt()).toEqual(b.receipt());
    expect(a.generation).toBe(b.generation);
  });
});

describe("detail", () => {
  it("matches its summary point exactly, with recorded proof per player", async () => {
    const state = await loadTeamHistoryState("2", deps());
    const point = state.points.find(entry => entry.day === "2026-10-08")!;
    const detail = state.detail("2026-10-08", NAMES);
    expect(isTeamValueHistoryDetail(detail)).toBe(true);
    expect(historyDetailMatchesPoint(detail, point)).toBe(true);
    const cut = detail.players.find(player => player.id === "2711")!;
    expect(cut.priceCents).toBe(9000);
    expect(cut.price).toEqual({
      kind: "recorded", quoteId: "q-t1-2711", recordedAt: `${T1}Z`,
      nativeTimestamp: T1, availableFrom: `${T1}Z`, validUntil: null,
    });
  });

  it("shows the cut in the Oct 9 detail moves and drops 2711 from the roster", async () => {
    const state = await loadTeamHistoryState("2", deps());
    const detail = state.detail("2026-10-09", NAMES);
    expect(detail.players.map(player => player.id)).toEqual(["201", "202"]);
    expect(detail.moves).toHaveLength(1);
    expect(detail.moves[0]).toMatchObject({
      sourceId: "1414110209072234496", origin: "transaction", status: "complete",
      effectiveAt: "2026-10-09T02:24:16.042Z", drops: [{ id: "2711", name: "Fixture Cut" }],
    });
  });

  it("keeps a gap day inspectable: replayed roster, no invented price", async () => {
    const state = await loadTeamHistoryState("1", deps());
    const detail = state.detail("2026-10-10", NAMES);
    expect(isTeamValueHistoryDetail(detail)).toBe(true);
    expect(detail.pointId).toBeNull();
    expect(detail.rosterStatus).toBe("replayed");
    expect(detail.priced).toBe(0);
    expect(detail.subtotalCents).toBeNull();
    expect(detail.players).toHaveLength(3);
    expect(detail.players.every(player => player.priceCents === null && player.missingReason !== null)).toBe(true);
  });

  it("prices a partial day honestly: unpriced player carries a reason", async () => {
    const state = await loadTeamHistoryState("1", deps());
    const point = state.points.find(entry => entry.day === "2026-10-11")!;
    const detail = state.detail("2026-10-11", NAMES);
    expect(historyDetailMatchesPoint(detail, point)).toBe(true);
    const missing = detail.players.find(player => player.id === "102")!;
    expect(missing.priceCents).toBeNull();
    expect(missing.missingReason).toContain("No recorded quote");
    expect(detail.subtotalCents).toBe(44000);
  });

  it("returns ambiguous evidence, never a roster, for unproven days", async () => {
    const state = await loadTeamHistoryState("1", deps());
    for (const day of ["2025-11-03", "2026-09-01"]) {
      const detail = state.detail(day, NAMES);
      expect(isTeamValueHistoryDetail(detail)).toBe(true);
      expect(detail.rosterStatus).toBe("ambiguous");
      expect(detail.rosterCount).toBeNull();
      expect(detail.players).toEqual([]);
      expect(detail.subtotalCents).toBeNull();
    }
  });
});

describe("generation fingerprint invariant", () => {
  it("changes when an admitted quote is revised, pruned or added — roster unchanged", async () => {
    const base = await loadTeamHistoryState("1", deps());
    const revised = QUOTES.map(entry => entry.quoteId === "q-t1-101" ? { ...entry, priceCents: 10001 } : entry);
    expect((await loadTeamHistoryState("1", deps({}, revised))).generation).not.toBe(base.generation);
    const pruned = QUOTES.filter(entry => entry.quoteId !== "q-t2-102");
    expect((await loadTeamHistoryState("1", deps({}, pruned))).generation).not.toBe(base.generation);
    const added = [...QUOTES, quote("q-t4-101", "101", 13000, "2026-10-12T04:00:00.000000")];
    expect((await loadTeamHistoryState("1", deps({}, added))).generation).not.toBe(base.generation);
    // And the revised quote would have changed a returned day — proof the
    // fingerprint, not luck, is what stands between the two generations.
    const revisedState = await loadTeamHistoryState("1", deps({}, revised));
    expect(revisedState.points[0].subtotalCents).toBe(60001);
    expect(base.points[0].subtotalCents).toBe(60000);
  });

  it("serves 409, never a silently different day, for an obsolete generation", async () => {
    const base = await loadTeamHistoryState("1", deps());
    const revised = QUOTES.map(entry => entry.quoteId === "q-t1-101" ? { ...entry, priceCents: 10001 } : entry);
    const detailRes = await teamHistoryDetailResponse(
      url("/api/team-value-history/detail", { teamId: "1", generation: base.generation, day: "2026-10-08" }),
      deps({}, revised));
    expect(detailRes.status).toBe(409);
    const summaryRes = await teamHistorySummaryResponse(
      url("/api/team-value-history/summary", { teamId: "1", generation: base.generation, from: "2026-10-01", toExclusive: "2026-10-21" }),
      deps({}, revised));
    expect(summaryRes.status).toBe(409);
  });
});

describe("routes", () => {
  it("summary echoes the exact requested range with filtered points", async () => {
    const state = await loadTeamHistoryState("1", deps());
    const res = await teamHistorySummaryResponse(
      url("/api/team-value-history/summary", { teamId: "1", generation: state.generation, from: "2026-10-09", toExclusive: "2026-10-12" }), deps());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(isTeamValueHistoryEnvelope(body)).toBe(true);
    expect(body.requestedRange).toEqual({ from: "2026-10-09", toExclusive: "2026-10-12" });
    expect(body.points.map((point: { day: string }) => point.day)).toEqual(["2026-10-09", "2026-10-11"]);
    expect(body.page.nextCursor).toBeNull();
  });

  it("rejects cursors, oversized ranges, bad days and unknown teams", async () => {
    const state = await loadTeamHistoryState("1", deps());
    const withCursor = await teamHistorySummaryResponse(
      url("/api/team-value-history/summary", { teamId: "1", generation: state.generation, from: "2026-10-01", toExclusive: "2026-10-21", cursor: "x" }), deps());
    expect(withCursor.status).toBe(400);
    const oversized = await teamHistorySummaryResponse(
      url("/api/team-value-history/summary", { teamId: "1", generation: state.generation, from: "2023-01-01", toExclusive: "2026-10-21" }), deps());
    expect(oversized.status).toBe(400);
    const badDay = await teamHistoryDetailResponse(
      url("/api/team-value-history/detail", { teamId: "1", generation: state.generation, day: "2026-13-01" }), deps());
    expect(badDay.status).toBe(400);
    const unknown = await teamHistoryDetailResponse(
      url("/api/team-value-history/detail", { teamId: "9", generation: state.generation, day: "2026-10-08" }), deps());
    expect(unknown.status).toBe(404);
    const noStore = await teamHistorySummaryResponse(
      url("/api/team-value-history/summary", { teamId: "1", generation: state.generation, from: "2026-10-01", toExclusive: "2026-10-21" }),
      deps({ quotes: null }));
    expect(noStore.status).toBe(503);
  });

  it("detail route returns contract-valid detail for a point day", async () => {
    const state = await loadTeamHistoryState("2", deps());
    const res = await teamHistoryDetailResponse(
      url("/api/team-value-history/detail", { teamId: "2", generation: state.generation, day: "2026-10-08" }), deps());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(isTeamValueHistoryDetail(body)).toBe(true);
    expect(body.pointId).toBe("thp-2-2026-10-08");
  });
});

describe("recorded-quote adapter", () => {
  it("renders a parameterized native-timestamp window query", () => {
    const rendered = new PgDialect().sqlToQuery(recordedQuoteQuery(
      { playerIds: ["101", "102"], fromDay: "2025-10-20", toDay: "2026-10-21" }));
    expect(rendered.sql).toContain("stock_snapshots");
    expect(rendered.sql).toContain('to_char(snapshot_at, \'YYYY-MM-DD"T"HH24:MI:SS.US\')');
    expect(rendered.params).toContain("2025-10-20");
    expect(rendered.params).toContain("2026-10-21");
    expect(rendered.params).toContain(5001); // cap + one lookahead row
  });

  it("maps rows verbatim and flags truncation; empty scope reads nothing", async () => {
    const rows = [quote("q1", "101", 123, T1), quote("q2", "101", 124, T2)];
    const store = getRecordedQuoteStore({ execute: async () => ({ rows: [{ records: rows }] }) } as unknown as Db);
    expect(store).not.toBeNull();
    await expect(store!.readWindow({ playerIds: ["101"], fromDay: "2025-10-20", toDay: "2026-10-21" }))
      .resolves.toEqual({ quotes: rows, truncated: false });

    const many = Array.from({ length: 5001 }, (_, i) => quote(`q${i}`, "101", 1, T1));
    const capped = getRecordedQuoteStore({ execute: async () => ({ rows: [{ records: many }] }) } as unknown as Db);
    const cappedResult = await capped!.readWindow({ playerIds: ["101"], fromDay: "2025-10-20", toDay: "2026-10-21" });
    expect(cappedResult.truncated).toBe(true);
    expect(cappedResult.quotes).toHaveLength(5000);

    const noDb = getRecordedQuoteStore({ execute: async () => { throw new Error("must not be called"); } } as unknown as Db);
    await expect(noDb!.readWindow({ playerIds: [], fromDay: "2025-10-20", toDay: "2026-10-21" }))
      .resolves.toEqual({ quotes: [], truncated: false });
    expect(getRecordedQuoteStore(null)).toBeNull();
  });

  it("fails the load closed when the admitted set is truncated", async () => {
    const outcome = await getTeamValueHistory("1", deps({
      quotes: { readWindow: async () => ({ quotes: QUOTES, truncated: true }) },
    }));
    expect(outcome).toBeNull();
  });
});
