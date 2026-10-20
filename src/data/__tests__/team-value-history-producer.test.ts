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

describe("fail-closed move feed (dot P1 regression)", () => {
  it("a failed move feed yields no history at all, never an invented roster", async () => {
    // The pre-fix producer treated a failed week as an empty move set
    // and still served priced `replayed` days from the bare anchor.
    const failing = deps({ fetchMoves: async () => { throw new Error("week fetch failed"); } });
    await expect(loadTeamHistoryState("1", failing)).rejects.toMatchObject({ status: 503 });
    expect(await getTeamValueHistory("1", failing)).toBeNull();
    const healthy = await loadTeamHistoryState("1", deps());
    const res = await teamHistorySummaryResponse(
      url("/api/team-value-history/summary", { teamId: "1", generation: healthy.generation, from: "2026-10-01", toExclusive: "2026-10-21" }),
      failing);
    expect(res.status).toBe(503);
  });
});

describe("validated as-of cutoff (dot P2 regression)", () => {
  it("never admits a future quote and never advances asOf past now", async () => {
    const future = quote("q-future-101", "101", 99000, "2026-10-20T18:00:00.000000");
    const state = await loadTeamHistoryState("1", deps({}, [...QUOTES, future]));
    expect(state.asOf).toBe(NOW.toISOString());
    expect(state.points.map(point => point.day)).toEqual(["2026-10-08", "2026-10-09", "2026-10-11"]);
    expect(state.currentQuote?.at).toBe(`${T3}Z`);
    const healthy = await loadTeamHistoryState("1", deps());
    expect(state.generation).toBe(healthy.generation); // inadmissible evidence binds nothing
  });

  it("claims today's unpriced replay only through the cutoff, not end-of-day", async () => {
    const state = await loadTeamHistoryState("1", deps());
    const detail = state.detail("2026-10-20", NAMES);
    expect(isTeamValueHistoryDetail(detail)).toBe(true);
    expect(detail.rosterStatus).toBe("replayed");
    expect(detail.valuationAt).toBe("2026-10-20T12:00:00.000Z");
    expect(detail.rosterEvidence.join(" ")).toContain("as-of cutoff");
    expect(detail.rosterCount).toBe(3);
    expect(detail.subtotalCents).toBeNull();
  });

  it("excludes a quote one microsecond past the cutoff at admission (dot re-review regression)", async () => {
    // The dot's exact boundary: cutoff 2026-10-20T12:00:00.000Z, quote at
    // 12:00:00.000001. Date.parse reads both as 1792497600000, so the old
    // admission let the row in and envelope validation then rejected the
    // future point — the whole load failed. Native-precision admission
    // excludes the row; the healthy history stands untouched.
    const oneMicroLate = quote("q-plus-1us-101", "101", 99000, "2026-10-20T12:00:00.000001");
    const envelope = await getTeamValueHistory("1", deps({}, [...QUOTES, oneMicroLate]));
    expect(envelope).not.toBeNull();
    expect(isTeamValueHistoryEnvelope(envelope!)).toBe(true);
    expect(envelope!.points.map(point => point.day)).toEqual(["2026-10-08", "2026-10-09", "2026-10-11"]);
    const healthy = await loadTeamHistoryState("1", deps());
    expect(envelope!.generation).toBe(healthy.generation); // the inadmissible row binds nothing
    expect(envelope!.currentQuote).toEqual(healthy.currentQuote);
  });

  it("admits evidence exactly at the cutoff and one microsecond before it", async () => {
    const atCutoff = [
      quote("q-at-101", "101", 13000, "2026-10-20T12:00:00.000000"),
      quote("q-at-102", "102", 23000, "2026-10-20T12:00:00.000000"),
      quote("q-at-103", "103", 33000, "2026-10-20T12:00:00.000000"),
    ];
    const state = await loadTeamHistoryState("1", deps({}, [...QUOTES, ...atCutoff]));
    const point = state.points.find(entry => entry.day === "2026-10-20")!;
    expect(point.valuationAt).toBe("2026-10-20T12:00:00.000000Z");
    expect(point.subtotalCents).toBe(69000);
    expect(state.currentQuote?.at).toBe("2026-10-20T12:00:00.000000Z");
    expect(isTeamValueHistoryEnvelope(state.envelope(state.leagueRange))).toBe(true);

    const justBefore = quote("q-minus-1us-101", "101", 14000, "2026-10-20T11:59:59.999999");
    const before = await loadTeamHistoryState("1", deps({}, [...QUOTES, justBefore]));
    const beforePoint = before.points.find(entry => entry.day === "2026-10-20")!;
    expect(beforePoint.valuationAt).toBe("2026-10-20T11:59:59.999999Z");
    expect(beforePoint.subtotalCents).toBe(14000);
  });

  it("keeps a same-millisecond pair on opposite sides of the cutoff consistent", async () => {
    // Same millisecond, different microseconds: the at-cutoff row is the
    // day's observation; the +1µs row does not exist as far as points,
    // detail, current quote and generation are concerned.
    const atCutoff = [quote("q-at-101", "101", 13000, "2026-10-20T12:00:00.000000")];
    const oneMicroLate = quote("q-plus-1us-101", "101", 99000, "2026-10-20T12:00:00.000001");
    const pair = await loadTeamHistoryState("1", deps({}, [...QUOTES, ...atCutoff, oneMicroLate]));
    const solo = await loadTeamHistoryState("1", deps({}, [...QUOTES, ...atCutoff]));
    expect(pair.generation).toBe(solo.generation);
    expect(pair.points).toEqual(solo.points);
    expect(pair.currentQuote).toEqual(solo.currentQuote);
    const point = pair.points.find(entry => entry.day === "2026-10-20")!;
    expect(point.subtotalCents).toBe(13000); // never the 99,000 from past the cutoff
    const detail = pair.detail("2026-10-20", NAMES);
    expect(isTeamValueHistoryDetail(detail)).toBe(true);
    expect(historyDetailMatchesPoint(detail, point)).toBe(true);
    expect(detail.players.find(entry => entry.id === "101")!.priceCents).toBe(13000);
  });

  it("ignores a future-dated move instead of inverting it into history", async () => {
    const futureTx = tx({
      transaction_id: "future-drop-101", created: Date.parse("2026-10-20T18:00:00Z"),
      status_updated: Date.parse("2026-10-20T18:00:00Z"), drops: { "101": 1 },
    });
    const state = await loadTeamHistoryState("1", deps({
      fetchMoves: async () => toHistoryMoves([...RAW_TX, futureTx]),
    }));
    // Had the move been admitted, inverting it against the anchor would
    // have contradicted every roster and erased the Oct 8 point.
    expect(state.receipt().points.find(point => point.day === "2026-10-08")!.roster).toEqual(["101", "102", "103"]);
    expect(JSON.stringify(state.receipt())).not.toContain("future-drop-101");
    expect(state.detail("2026-10-20", NAMES).moves.map(move => move.sourceId)).not.toContain("future-drop-101");
  });
});

describe("current quote membership (dot P2 regression)", () => {
  it("values the anchor roster when a cut lands after the last quote instant", async () => {
    // Only T1 quotes for team 2: the replayed Oct 8 roster still holds
    // the since-cut 2711 (three players, 24,000 in the dot's synthetic
    // repro terms — 21,000 here). Today's anchor holds two players.
    const t1Only = QUOTES.filter(entry => entry.nativeTimestamp === T1 && ["201", "202", "2711"].includes(entry.playerId));
    const state = await loadTeamHistoryState("2", deps({}, t1Only));
    expect(state.points).toEqual([
      expect.objectContaining({ day: "2026-10-08", rosterCount: 3, subtotalCents: 21000 }),
    ]);
    const envelope = await getTeamValueHistory("2", deps({}, t1Only));
    expect(envelope).not.toBeNull();
    expect(envelope!.currentQuote).toEqual({ at: `${T1}Z`, subtotalCents: 12000, priced: 2, rosterCount: 2 });
  });

  it("is null when no admitted instant prices any current player", async () => {
    const cutOnly = [quote("q-t1-2711", "2711", 9000, T1)];
    const envelope = await getTeamValueHistory("2", deps({}, cutOnly));
    expect(envelope).not.toBeNull();
    expect(envelope!.currentQuote).toBeNull();
  });
});

describe("conflicting same-instant quotes (dot P2 regression)", () => {
  it("quarantines the player at that instant instead of selecting by quote id", async () => {
    const conflicting = [
      quote("q-aaa", "101", 10000, T1),
      quote("q-zzz", "101", 10500, T1), // larger id: the old code silently priced this one
      quote("q-t1-102", "102", 20000, T1), quote("q-t1-103", "103", 30000, T1),
    ];
    const state = await loadTeamHistoryState("1", deps({}, conflicting));
    const point = state.points.find(entry => entry.day === "2026-10-08")!;
    expect(point.priced).toBe(2);
    expect(point.subtotalCents).toBe(50000);
    const detail = state.detail("2026-10-08", NAMES);
    expect(isTeamValueHistoryDetail(detail)).toBe(true);
    const player = detail.players.find(entry => entry.id === "101")!;
    expect(player.priceCents).toBeNull();
    expect(player.price).toBeNull();
    expect(player.missingReason).not.toBeNull();
  });

  it("treats same-price duplicates as one observation with stable provenance", async () => {
    const duplicated = [
      quote("q-bbb", "101", 10000, T1), quote("q-aaa", "101", 10000, T1),
      quote("q-t1-102", "102", 20000, T1), quote("q-t1-103", "103", 30000, T1),
    ];
    const state = await loadTeamHistoryState("1", deps({}, duplicated));
    const detail = state.detail("2026-10-08", NAMES);
    expect(detail.subtotalCents).toBe(60000);
    expect(detail.players.find(entry => entry.id === "101")!.price)
      .toMatchObject({ kind: "recorded", quoteId: "q-aaa" });
  });

  it("a third row cannot resurrect a quarantined observation", async () => {
    const triple = [
      quote("q-1", "101", 10000, T1), quote("q-2", "101", 10500, T1), quote("q-3", "101", 10000, T1),
      quote("q-t1-102", "102", 20000, T1), quote("q-t1-103", "103", 30000, T1),
    ];
    const state = await loadTeamHistoryState("1", deps({}, triple));
    expect(state.points.find(entry => entry.day === "2026-10-08")!.priced).toBe(2);
  });

  it("a conflicting twin changes the generation and the returned day, via 409 rules", async () => {
    const base = await loadTeamHistoryState("1", deps());
    const withConflict = [...QUOTES, quote("q-conflict-101", "101", 10001, T1)];
    const changed = await loadTeamHistoryState("1", deps({}, withConflict));
    expect(changed.generation).not.toBe(base.generation);
    expect(changed.points.find(entry => entry.day === "2026-10-08")!.subtotalCents).toBe(50000);
  });
});
