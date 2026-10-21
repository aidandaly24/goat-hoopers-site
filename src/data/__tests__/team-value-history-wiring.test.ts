/**
 * Wiring contract tests (issue #224, §§1–4 settled on-thread: dot
 * contract 6311714485 + 6311832961, Muse semantics 6312076373, dot
 * §4 replies 6312158306 + 6312224861, Muse §4 confirmation
 * 6312327589).
 *
 * §4 token lifecycle: generations are `th2:<canonical-asOf>:<hash>`;
 * the child routes parse the token server-side, pin BOTH loaders to
 * the parsed cutoff, recompute bounded there, and compare the whole
 * generation — drift or genuine advance is a 409, malformed /
 * multiply-supplied / future-cutoff tokens are a 400 decided BEFORE
 * any load, legacy th1 tokens are a refresh-409, and outages stay
 * 503 in both modes.
 *
 * §§1–3 membership semantics: priced days evaluate at the exact
 * quote instant, unpriced completed days at UTC day end, today at
 * the fixed as-of cutoff; known membership yields replayed status
 * with actual ids/count and null prices; unknown membership (gap,
 * pre-anchor) yields a null count, never zero; a proven-empty roster
 * yields a real zero.
 *
 * The chain runs through the REAL `loadChainRosterReplay` over the
 * miniature world in history-chain-fixture.ts.
 */
import { describe, expect, it } from "vitest";
import {
  historyDetailMatchesPoint, isTeamValueHistoryDetail, isTeamValueHistoryEnvelope,
} from "@/domain/team-value-history";
import {
  LEAGUE_ID, type RawDraft, type RawDraftPick, type RawPlayerEntry, type RawRoster, type RawTransaction,
} from "../sleeper";
import type { RecordedQuote } from "../recorded-quotes";
import { loadChainRosterReplay, RosterReplayError, type RosterReplayDeps } from "../roster-replay";
import {
  getTeamValueHistory, loadTeamHistoryState, mergeHistoryMoveSets, SEASON_ONE_LEAGUE_ID,
  teamHistoryDetailResponse, teamHistorySummaryResponse, toHistoryMoves, type TeamHistoryDeps,
} from "../team-value-history";
import {
  CHAIN_NOW, chainWorld, fetchFixtureChain, replayDepsFrom, type ChainWorld,
} from "./history-chain-fixture";

const tx = (partial: Partial<RawTransaction>): RawTransaction => ({
  transaction_id: "0", type: "free_agent", status: "complete", roster_ids: [], leg: 1,
  created: 0, adds: null, drops: null, draft_picks: [], ...partial,
});

/** The producer fixtures' audited 2026 history feed (chain feed differs only by design of the seams). */
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
  "104": { full_name: "Fixture Prospect" }, "201": { full_name: "Fixture Four" }, "202": { full_name: "Fixture Five" },
  "2711": { full_name: "Fixture Cut" }, "301": { full_name: "Fixture Seven" }, "302": { full_name: "Fixture Eight" },
  "303": { full_name: "Fixture Nine" }, "304": { full_name: "Fixture Ten" }, "701": { full_name: "Fixture Eleven" },
  "702": { full_name: "Fixture Twelve" },
};

const ANCHOR = {
  observedAt: "2026-10-20T11:59:00.000Z",
  teams: [
    { id: "1", name: "Fixture Club 1", players: ["101", "102", "103"] },
    { id: "2", name: "Fixture Club 2", players: ["201", "202"] },
    { id: "3", name: "Fixture Club 3", players: ["301", "303"] },
    { id: "7", name: "Fixture Club 7", players: ["701", "702"] },
  ],
};

function deps(overrides: Partial<TeamHistoryDeps> = {}): TeamHistoryDeps {
  return {
    quotes: {
      readWindow: async request => ({
        quotes: QUOTES.filter(entry => request.playerIds.includes(entry.playerId)),
        truncated: false,
      }),
    },
    fetchAnchor: async () => ANCHOR,
    fetchMoves: async () => mergeHistoryMoveSets(
      toHistoryMoves(chainWorld().tx[SEASON_ONE_LEAGUE_ID], SEASON_ONE_LEAGUE_ID),
      toHistoryMoves(RAW_TX, LEAGUE_ID)),
    fetchChain: fetchFixtureChain(),
    fetchNames: async () => NAMES,
    now: () => CHAIN_NOW,
    ...overrides,
  };
}

const url = (path: string, params: Record<string, string>) =>
  new URL(`https://history.invalid${path}?${new URLSearchParams(params)}`);
const detailUrl = (generation: string, day = "2026-10-08", teamId = "1") =>
  url("/api/team-value-history/detail", { teamId, generation, day });
const summaryUrl = (generation: string, teamId = "1") =>
  url("/api/team-value-history/summary", { teamId, generation, from: "2026-10-01", toExclusive: "2026-10-21" });

const TH2 = /^th2:(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z):([0-9a-f]{24})$/;

describe("§4 — th2 token lifecycle", () => {
  it("mints a th2 token whose as-of segment is the load's fixed cutoff, and both children accept it", async () => {
    const envelope = await getTeamValueHistory("1", deps());
    expect(envelope).not.toBeNull();
    const match = TH2.exec(envelope!.generation);
    expect(match).not.toBeNull();
    expect(match![1]).toBe("2026-10-20T12:00:00.000Z");
    expect(envelope!.asOf).toBe("2026-10-20T12:00:00.000Z");

    const summaryRes = await teamHistorySummaryResponse(summaryUrl(envelope!.generation), deps());
    expect(summaryRes.status).toBe(200);
    const summaryBody = await summaryRes.json();
    expect(isTeamValueHistoryEnvelope(summaryBody)).toBe(true);
    expect(summaryBody.generation).toBe(envelope!.generation);
    expect(summaryBody.asOf).toBe("2026-10-20T12:00:00.000Z");

    const detailRes = await teamHistoryDetailResponse(detailUrl(envelope!.generation), deps());
    expect(detailRes.status).toBe(200);
    const detailBody = await detailRes.json();
    expect(isTeamValueHistoryDetail(detailBody)).toBe(true);
    expect(detailBody.generation).toBe(envelope!.generation);
  });

  it("derives the child envelope's as-of from the token, never a fresh clock (precision 1)", async () => {
    const envelope = await getTeamValueHistory("1", deps());
    const token = envelope!.generation;
    // Two days later the same sources would mint a different token…
    const later = new Date("2026-10-22T12:00:00Z");
    const laterChain = async () => loadChainRosterReplay(replayDepsFrom(chainWorld(), { now: () => later }));
    const fresh = await loadTeamHistoryState("1", deps({ now: () => later, fetchChain: laterChain }));
    expect(fresh.generation).not.toBe(token);
    // …but a child call carrying the token recomputes AT the token's
    // cutoff — the production default chain derives its clock from
    // the same pinned instant, mirrored here by the fixture chain —
    // and serves the token's own view.
    const res = await teamHistorySummaryResponse(
      summaryUrl(token), deps({ now: () => later, fetchChain: fetchFixtureChain() }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.generation).toBe(token);
    expect(body.asOf).toBe("2026-10-20T12:00:00.000Z");
  });

  it("answers 409 when the chain evidence drifts under a pinned token", async () => {
    const envelope = await getTeamValueHistory("1", deps());
    // A different but fully valid world: one extra admitted 2025 move
    // (player 105 joins slot 1, is silently cut at the boundary, and
    // is dropped post-draft in 2026 so the finals still verify).
    const world = chainWorld();
    world.tx[SEASON_ONE_LEAGUE_ID] = [
      ...world.tx[SEASON_ONE_LEAGUE_ID],
      tx({
        transaction_id: "1425000000000000010", type: "free_agent", leg: 3, roster_ids: [1],
        created: Date.parse("2025-11-01T12:00:00Z"), status_updated: Date.parse("2025-11-01T12:00:00Z"),
        adds: { "105": 1 },
      }),
    ];
    world.rosters[SEASON_ONE_LEAGUE_ID] = world.rosters[SEASON_ONE_LEAGUE_ID].map(entry =>
      entry.roster_id === 1 ? { ...entry, players: [...entry.players, "105"] } : entry);
    world.tx[LEAGUE_ID] = [
      ...world.tx[LEAGUE_ID],
      tx({
        transaction_id: "1415000000000000010", created: Date.parse("2026-10-07T15:00:00Z"),
        status_updated: Date.parse("2026-10-07T15:00:00Z"), drops: { "105": 1 },
      }),
    ];
    const drifted = deps({ fetchChain: fetchFixtureChain(world) });
    expect((await teamHistoryDetailResponse(detailUrl(envelope!.generation), drifted)).status).toBe(409);
    expect((await teamHistorySummaryResponse(summaryUrl(envelope!.generation), drifted)).status).toBe(409);
  });

  it("maps a genuine advance under a pinned token to 409, never 503 (precision 5)", async () => {
    const envelope = await getTeamValueHistory("1", deps());
    const token = envelope!.generation;
    // The world advances: a completed move lands AFTER the token's
    // cutoff (Oct 20 18:00) and the observed current roster follows.
    const world = chainWorld();
    world.tx[LEAGUE_ID] = [
      ...world.tx[LEAGUE_ID],
      tx({
        transaction_id: "1416000000000000010", created: Date.parse("2026-10-20T18:00:00Z"),
        status_updated: Date.parse("2026-10-20T18:00:00Z"), drops: { "103": 1 },
      }),
    ];
    world.rosters[LEAGUE_ID] = world.rosters[LEAGUE_ID].map(entry =>
      entry.roster_id === 1 ? { ...entry, players: ["101", "102"] } : entry);
    // Under the pinned clock the chain loader refuses to admit the
    // post-cutoff move — an advance, which the contract maps to 409.
    const pinnedChain = async () =>
      loadChainRosterReplay(replayDepsFrom(world, { now: () => CHAIN_NOW }));
    const res = await teamHistoryDetailResponse(detailUrl(token), deps({ fetchChain: pinnedChain }));
    expect(res.status).toBe(409);
    // Once time actually reaches the move, the same world loads fine
    // and mints a different generation — the 409 was an advance, not
    // corruption.
    const later = new Date("2026-10-21T12:00:00Z");
    const advanced = await loadTeamHistoryState("1", deps({
      now: () => later,
      fetchChain: async () => loadChainRosterReplay(replayDepsFrom(world, { now: () => later })),
    }));
    expect(advanced.generation).not.toBe(token);
  });

  it("keeps outages and malformed evidence at 503 under a pinned token", async () => {
    const envelope = await getTeamValueHistory("1", deps());
    const token = envelope!.generation;
    const down = deps({ fetchChain: async () => { throw new Error("Sleeper API 503"); } });
    expect((await teamHistoryDetailResponse(detailUrl(token), down)).status).toBe(503);
    const malformed = deps({ fetchChain: async () => { throw new RosterReplayError("final rosters diverge"); } });
    expect((await teamHistoryDetailResponse(detailUrl(token), malformed)).status).toBe(503);
    // And on a fresh load the same failures stay 503 / null.
    await expect(loadTeamHistoryState("1", down)).rejects.toMatchObject({ status: 503 });
    expect(await getTeamValueHistory("1", down)).toBeNull();
  });

  it("rejects malformed, duplicate and future-cutoff tokens with 400 BEFORE any load", async () => {
    // Every source is down: if the route loaded anything before
    // judging the token, these would surface as 503, not 400.
    const broken = deps({
      fetchAnchor: async () => { throw new Error("down"); },
      fetchMoves: async () => { throw new Error("down"); },
      fetchChain: async () => { throw new Error("down"); },
    });
    const cases: [string, URL][] = [
      ["missing", url("/api/team-value-history/detail", { teamId: "1", day: "2026-10-08" })],
      ["garbage", detailUrl("garbage")],
      ["non-canonical as-of (no millis)", detailUrl("th2:2026-10-20T12:00:00Z:0123456789abcdef01234567")],
      ["unreal date", detailUrl("th2:2026-13-20T12:00:00.000Z:0123456789abcdef01234567")],
      ["short hash", detailUrl("th2:2026-10-20T12:00:00.000Z:0123abcd")],
      ["non-hex hash", detailUrl("th2:2026-10-20T12:00:00.000Z:zzzzzzzzzzzzzzzzzzzzzzzz")],
      ["future cutoff", detailUrl(`th2:${new Date(CHAIN_NOW.getTime() + 3_600_000).toISOString()}:0123456789abcdef01234567`)],
    ];
    for (const [label, caseUrl] of cases) {
      expect((await teamHistoryDetailResponse(caseUrl, broken)).status, label).toBe(400);
    }
    const token = (await getTeamValueHistory("1", deps()))!.generation;
    const duplicate = new URL(
      `https://history.invalid/api/team-value-history/detail?teamId=1&day=2026-10-08&generation=${token}&generation=${token}`);
    expect((await teamHistoryDetailResponse(duplicate, broken)).status, "duplicate").toBe(400);
    const summaryMissing = await teamHistorySummaryResponse(
      url("/api/team-value-history/summary", { teamId: "1", from: "2026-10-01", toExclusive: "2026-10-21" }), broken);
    expect(summaryMissing.status, "summary missing").toBe(400);
  });

  it("maps a legacy th1 token to a refresh-409, never parsing it further", async () => {
    const legacy = "th1-2026-10-20T12:00:00.000Z-0123456789abcdef01234567";
    expect((await teamHistoryDetailResponse(detailUrl(legacy), deps())).status).toBe(409);
    expect((await teamHistorySummaryResponse(summaryUrl(legacy), deps())).status).toBe(409);
  });
});

describe("§4 — generation hash coverage (precision 2: whole chain evidence, not team-filtered)", () => {
  const generationIn = async (world: ChainWorld) =>
    (await loadTeamHistoryState("1", deps({ fetchChain: fetchFixtureChain(world) }))).generation;

  it("binds the draft witnesses, admitted moves, reconciliation, gap and cutoff — not observedAt", async () => {
    const base = await generationIn(chainWorld());

    // A different 2026 draft id (same picks, re-keyed) rebinds.
    const draftIdWorld = chainWorld();
    const draft2026 = { ...draftIdWorld.drafts[LEAGUE_ID], draft_id: "draft-2026-fixture-b" };
    draftIdWorld.drafts[LEAGUE_ID] = draft2026;
    draftIdWorld.picks[draft2026.draft_id] = draftIdWorld.picks["draft-2026-fixture"];
    expect(await generationIn(draftIdWorld)).not.toBe(base);

    // The 2025 grid witness changes (slot 7 declared as slot 4 in the
    // draft order, picks re-slotted to match) — assignments unchanged.
    const gridWorld = chainWorld();
    gridWorld.drafts[SEASON_ONE_LEAGUE_ID] = {
      ...gridWorld.drafts[SEASON_ONE_LEAGUE_ID],
      draft_order: { "user-1": 1, "user-2": 2, "user-3": 3, "user-7": 4 },
    };
    gridWorld.picks["draft-2025-fixture"] = gridWorld.picks["draft-2025-fixture"].map(entry =>
      entry.draft_slot === 7 ? { ...entry, draft_slot: 4 } : entry);
    expect(await generationIn(gridWorld)).not.toBe(base);

    // An admitted 2025 move disappears (finals adjusted to stay
    // valid): the move set AND slot 1's reconciliation both change.
    const moveWorld = chainWorld();
    moveWorld.tx[SEASON_ONE_LEAGUE_ID] = moveWorld.tx[SEASON_ONE_LEAGUE_ID]
      .filter(entry => entry.transaction_id !== "1425000000000000003");
    moveWorld.rosters[SEASON_ONE_LEAGUE_ID] = moveWorld.rosters[SEASON_ONE_LEAGUE_ID].map(entry =>
      entry.roster_id === 1 ? { ...entry, players: ["101", "102", "103"] } : entry);
    expect(await generationIn(moveWorld)).not.toBe(base);

    // The last 2025 move lands later: the chain's gap range moves.
    const gapWorld = chainWorld();
    gapWorld.tx[SEASON_ONE_LEAGUE_ID] = gapWorld.tx[SEASON_ONE_LEAGUE_ID].map(entry =>
      entry.transaction_id === "1425000000000000002"
        ? { ...entry, created: Date.parse("2025-12-05T15:00:00Z"), status_updated: Date.parse("2025-12-05T15:00:00Z") }
        : entry);
    expect(await generationIn(gapWorld)).not.toBe(base);

    // The shared cutoff itself is bound.
    const laterState = await loadTeamHistoryState("1", deps({ now: () => new Date(CHAIN_NOW.getTime() + 3_600_000) }));
    expect(laterState.generation).not.toBe(base);
    expect(laterState.generation.startsWith("th2:2026-10-20T13:00:00.000Z:")).toBe(true);

    // Precision 3: the anchor's observation instant is provenance
    // for display, not evidence — changing it changes nothing.
    const observed = await loadTeamHistoryState("1", deps({
      fetchAnchor: async () => ({ ...ANCHOR, observedAt: "2026-10-20T11:00:00.000Z" }),
    }));
    expect(observed.generation).toBe(base);
  });
});

describe("§§1–3 — membership semantics", () => {
  it("evaluates priced days at the exact quote instant, with replay provenance in the evidence", async () => {
    const state = await loadTeamHistoryState("2", deps());
    const point = state.points.find(entry => entry.day === "2026-10-08")!;
    expect(point.rosterCount).toBe(3);
    const detail = state.detail("2026-10-08", NAMES);
    expect(isTeamValueHistoryDetail(detail)).toBe(true);
    expect(historyDetailMatchesPoint(detail, point)).toBe(true);
    expect(detail.players.map(player => player.id)).toEqual(["201", "202", "2711"]);
    const evidence = detail.rosterEvidence.join("\n");
    // Basis (boundary reconciliation), league, anchor instant, depth,
    // and the reconciliation rendered as reconciliation — never as a
    // sourced transaction.
    expect(evidence).toContain("season-boundary reconciliation");
    expect(evidence).toContain(LEAGUE_ID);
    expect(evidence).toContain("2026-08-13T00:00:00.000Z");
    expect(evidence).toContain("league-wide");
    expect(evidence).toContain("silent");
    expect(evidence).toContain("not a sourced transaction");
    // The Oct 9 point drops the cut player at the T2 instant.
    const detail9 = state.detail("2026-10-09", NAMES);
    expect(detail9.players.map(player => player.id)).toEqual(["201", "202"]);
  });

  it("evaluates an unpriced completed day at UTC day end and today at the cutoff", async () => {
    const state = await loadTeamHistoryState("1", deps());
    const gapDay = state.detail("2026-10-10", NAMES);
    expect(isTeamValueHistoryDetail(gapDay)).toBe(true);
    expect(gapDay.rosterStatus).toBe("replayed");
    expect(gapDay.valuationAt).toBe("2026-10-10T23:59:59.999Z");
    expect(gapDay.rosterCount).toBe(3);
    expect(gapDay.subtotalCents).toBeNull();
    expect(gapDay.players.every(player => player.priceCents === null)).toBe(true);

    const today = state.detail("2026-10-20", NAMES);
    expect(today.valuationAt).toBe("2026-10-20T12:00:00.000Z");
    expect(today.rosterEvidence.join(" ")).toContain("as-of cutoff");
    expect(today.rosterCount).toBe(3);
  });

  it("proves 2025 membership forward from the draft, events riding alongside", async () => {
    const state = await loadTeamHistoryState("3", deps());
    const tradeDay = state.detail("2025-11-15", NAMES);
    expect(isTeamValueHistoryDetail(tradeDay)).toBe(true);
    expect(tradeDay.rosterStatus).toBe("replayed");
    expect(tradeDay.players.map(player => player.id)).toEqual(["301", "304", "701"]);
    expect(tradeDay.players.every(player => player.priceCents === null)).toBe(true);
    expect(tradeDay.moves.map(move => move.sourceId)).toContain("1425000000000000001");
    const evidence = tradeDay.rosterEvidence.join("\n");
    expect(evidence).toContain("startup draft");
    expect(evidence).toContain(SEASON_ONE_LEAGUE_ID);
    // No recorded quote exists for 2025 in any retained source: the
    // team has membership everywhere the replay reaches, yet no
    // priced point is ever minted from membership alone.
    expect(state.points).toEqual([]);
    const october = state.detail("2026-10-10", NAMES);
    expect(october.rosterStatus).toBe("replayed");
    expect(october.players.map(player => player.id)).toEqual(["301", "303"]);
  });

  it("keeps gap days unknown: null count, no roster, the chain's gap range in the evidence", async () => {
    const state = await loadTeamHistoryState("1", deps());
    const gap = state.detail("2026-06-01", NAMES);
    expect(isTeamValueHistoryDetail(gap)).toBe(true);
    expect(gap.rosterStatus).toBe("ambiguous");
    expect(gap.rosterCount).toBeNull();
    expect(gap.players).toEqual([]);
    expect(gap.subtotalCents).toBeNull();
    const evidence = gap.rosterEvidence.join("\n");
    expect(evidence).toContain("2025-12-03");
    expect(evidence).toContain("2026-08-13");
  });
});

/**
 * A second, smaller world whose slot 2 ends PROVABLY EMPTY: its only
 * boundary player is dropped after the 2026 draft, and Sleeper's
 * observed current roster for the slot is empty — verified by the
 * real chain loader at load.
 */
function emptyWorldDeps(): TeamHistoryDeps {
  const settings = {
    wins: 0, losses: 0, ties: 0, fpts: 0, fpts_decimal: 0, fpts_against: 0, fpts_against_decimal: 0,
  };
  const draft = (draft_id: string, league_id: string, season: string, last_picked: number): RawDraft => ({
    draft_id, league_id, season, status: "complete", type: "snake", last_picked,
    settings: { rounds: 1, teams: 2 }, draft_order: { "u-1": 1, "u-2": 2 },
  });
  const d25 = draft("d25-empty", SEASON_ONE_LEAGUE_ID, "2025", Date.parse("2025-10-20T18:00:00Z"));
  const d26 = draft("d26-empty", LEAGUE_ID, "2026", Date.parse("2026-10-05T20:00:00Z"));
  const pick = (pick_no: number, draft_slot: number, player_id: string): RawDraftPick => ({
    pick_no, round: 1, draft_slot, player_id, picked_by: "", roster_id: draft_slot, metadata: {},
  });
  const roster = (roster_id: number, players: string[]): RawRoster =>
    ({ roster_id, owner_id: `u-${roster_id}`, players, settings } as RawRoster);
  const replay: RosterReplayDeps = {
    fetchDrafts: async leagueId => [leagueId === SEASON_ONE_LEAGUE_ID ? d25 : d26],
    fetchDraftPicks: async draftId => draftId === d25.draft_id
      ? [pick(1, 1, "a1"), pick(2, 2, "b1")]
      : [pick(1, 1, "r1"), pick(2, 2, "r2")],
    fetchRosters: async leagueId => leagueId === SEASON_ONE_LEAGUE_ID
      ? [roster(1, ["a1"]), roster(2, ["b1"])]
      : [roster(1, ["a1"]), roster(2, [])],
    fetchMoves: async leagueId => leagueId === SEASON_ONE_LEAGUE_ID ? [] : toHistoryMoves([
      tx({ transaction_id: "e-drop-r1", created: Date.parse("2026-10-06T15:00:00Z"), status_updated: Date.parse("2026-10-06T15:00:00Z"), drops: { "r1": 1 } }),
      tx({ transaction_id: "e-drop-r2", created: Date.parse("2026-10-06T15:00:00Z"), status_updated: Date.parse("2026-10-06T15:00:00Z"), drops: { "r2": 2 } }),
      tx({ transaction_id: "e-drop-b1", created: Date.parse("2026-10-07T15:00:00Z"), status_updated: Date.parse("2026-10-07T15:00:00Z"), drops: { "b1": 2 } }),
    ], LEAGUE_ID),
    seasonTwoWeeks: async () => [1, 2, 3],
    now: () => CHAIN_NOW,
  };
  return {
    quotes: { readWindow: async () => ({ quotes: [], truncated: false }) },
    fetchAnchor: async () => ({
      observedAt: "2026-10-20T11:59:00.000Z",
      teams: [
        { id: "1", name: "Empty Fixture 1", players: ["a1"] },
        { id: "2", name: "Empty Fixture 2", players: [] },
      ],
    }),
    fetchMoves: async () => [],
    fetchChain: async () => loadChainRosterReplay(replay),
    fetchNames: async () => ({}),
    now: () => CHAIN_NOW,
  };
}

describe("§§1–3 — proven-empty vs unknown", () => {
  it("serves a real zero for a proven-empty roster and nulls for the gap", async () => {
    const emptyDeps = emptyWorldDeps();
    const envelope = await getTeamValueHistory("2", emptyDeps);
    expect(envelope).not.toBeNull();
    expect(isTeamValueHistoryEnvelope(envelope)).toBe(true);
    const state = await loadTeamHistoryState("2", emptyDeps);
    const day = state.detail("2026-10-08", {});
    expect(isTeamValueHistoryDetail(day)).toBe(true);
    expect(day.rosterStatus).toBe("replayed");
    expect(day.rosterCount).toBe(0);
    expect(day.players).toEqual([]);
    expect(day.subtotalCents).toBe(0);
    const gap = state.detail("2026-06-01", {});
    expect(gap.rosterStatus).toBe("ambiguous");
    expect(gap.rosterCount).toBeNull();
    expect(gap.subtotalCents).toBeNull();
  });
});
