/**
 * Forward roster replay (issues #224/#217) — engine and boundary
 * derivation semantics on synthetic feeds. Ground truth against the
 * real Sleeper receipts lives in roster-replay-acceptance.test.ts.
 */
import { describe, expect, it } from "vitest";
import type { RawTransaction } from "../sleeper";
import { toHistoryMoves, type HistoryMove } from "../team-value-history";
import {
  buildRosterTimeline, deriveBoundaryReconciliation, RosterReplayError,
  type RosterDraftEvent,
} from "../roster-replay";

const LEAGUE = "league-x";
const tx = (partial: Partial<RawTransaction>): RawTransaction => ({
  transaction_id: "0", type: "free_agent", status: "complete", roster_ids: [], leg: 1,
  created: 0, adds: null, drops: null, draft_picks: [], ...partial,
});
const moves = (raw: RawTransaction[]): HistoryMove[] => toHistoryMoves(raw, LEAGUE);

const ANCHOR_AT = 1_000;
const anchor = () => new Map<number, readonly string[]>([[1, ["101", "102"]], [2, ["201"]]]);

describe("buildRosterTimeline — application order", () => {
  it("breaks effective-instant ties by transaction_id", () => {
    // Same instant, ids "100" (drop of 300) and "200" (add of 300):
    // the frozen order applies "100" first, and dropping a player
    // slot 1 does not own yet rejects the build. Under the reverse
    // order the pair would apply cleanly — so the rejection itself
    // proves the tie-break direction.
    expect(() => buildRosterTimeline({
      anchorAtMs: ANCHOR_AT, anchorRosters: anchor(),
      moves: moves([
        tx({ transaction_id: "200", status_updated: 2_000, adds: { "300": 1 } }),
        tx({ transaction_id: "100", status_updated: 2_000, drops: { "300": 1 } }),
      ]),
    })).toThrow(RosterReplayError);
    // Mirror image: the add carries the lower id, so add-then-drop
    // applies cleanly and 300 ends unrostered.
    const timeline = buildRosterTimeline({
      anchorAtMs: ANCHOR_AT, anchorRosters: anchor(),
      moves: moves([
        tx({ transaction_id: "100", status_updated: 2_000, adds: { "300": 1 } }),
        tx({ transaction_id: "200", status_updated: 2_000, drops: { "300": 1 } }),
      ]),
    });
    expect(timeline.finalRosters().get(1)).toEqual(["101", "102"]);
  });

  it("applies a swap trade atomically — drops land before adds validate", () => {
    const timeline = buildRosterTimeline({
      anchorAtMs: ANCHOR_AT, anchorRosters: anchor(),
      moves: moves([
        tx({
          transaction_id: "300", type: "trade", status_updated: 2_000, roster_ids: [1, 2],
          adds: { "101": 2, "201": 1 }, drops: { "101": 1, "201": 2 },
        }),
      ]),
    });
    expect(timeline.rosterAt(1, 2_000)).toEqual(["102", "201"]);
    expect(timeline.rosterAt(2, 2_000)).toEqual(["101"]);
    expect(timeline.rosterAt(1, 1_999)).toEqual(["101", "102"]);
  });

  it("counts pick-only records as applied no-ops", () => {
    const timeline = buildRosterTimeline({
      anchorAtMs: ANCHOR_AT, anchorRosters: anchor(),
      moves: moves([
        tx({ transaction_id: "400", type: "trade", status_updated: 2_000, roster_ids: [1, 2], draft_picks: [{ season: "2027", round: 1 }] }),
      ]),
    });
    expect(timeline.appliedMoves).toHaveLength(1);
    expect(timeline.finalRosters().get(1)).toEqual(["101", "102"]);
  });

  it("never applies moves effective at or before the anchor", () => {
    const timeline = buildRosterTimeline({
      anchorAtMs: ANCHOR_AT, anchorRosters: anchor(),
      moves: moves([
        tx({ transaction_id: "500", status_updated: ANCHOR_AT, drops: { "101": 1 } }),
        tx({ transaction_id: "501", status_updated: ANCHOR_AT + 1, drops: { "102": 1 } }),
      ]),
    });
    expect(timeline.preAnchorMoves.map(move => move.id)).toEqual(["500"]);
    expect(timeline.appliedMoves.map(move => move.id)).toEqual(["501"]);
    expect(timeline.finalRosters().get(1)).toEqual(["101"]);
  });
});

describe("buildRosterTimeline — fail-closed contradictions", () => {
  it("rejects a drop of a player the slot does not own, naming the move", () => {
    expect(() => buildRosterTimeline({
      anchorAtMs: ANCHOR_AT, anchorRosters: anchor(),
      moves: moves([tx({ transaction_id: "600", status_updated: 2_000, drops: { "999": 1 } })]),
    })).toThrowError(expect.objectContaining({ message: expect.stringContaining("600") }));
  });

  it("rejects an add of a player owned by another slot", () => {
    expect(() => buildRosterTimeline({
      anchorAtMs: ANCHOR_AT, anchorRosters: anchor(),
      moves: moves([tx({ transaction_id: "601", status_updated: 2_000, adds: { "201": 1 } })]),
    })).toThrow(RosterReplayError);
  });

  it("rejects an anchor that rosters one player on two slots", () => {
    expect(() => buildRosterTimeline({
      anchorAtMs: ANCHOR_AT,
      anchorRosters: new Map([[1, ["101"]], [2, ["101"]]]),
      moves: [],
    })).toThrow(RosterReplayError);
  });

  it("refuses instants before the anchor", () => {
    const timeline = buildRosterTimeline({ anchorAtMs: ANCHOR_AT, anchorRosters: anchor(), moves: [] });
    expect(timeline.rosterAt(1, ANCHOR_AT)).toEqual(["101", "102"]);
    expect(() => timeline.rosterAt(1, ANCHOR_AT - 1)).toThrow(RosterReplayError);
    expect(() => timeline.rosterAt(9, ANCHOR_AT)).toThrow(RosterReplayError);
  });
});

describe("buildRosterTimeline — draft events", () => {
  const draft: RosterDraftEvent = { draftId: "d1", effectiveMs: 3_000, adds: [{ playerId: "301", rosterId: 1 }] };

  it("applies a draft event at its instant", () => {
    const timeline = buildRosterTimeline({ anchorAtMs: ANCHOR_AT, anchorRosters: anchor(), moves: [], draftEvents: [draft] });
    expect(timeline.rosterAt(1, 2_999)).toEqual(["101", "102"]);
    expect(timeline.rosterAt(1, 3_000)).toEqual(["101", "102", "301"]);
    expect(timeline.movesAppliedAt(3_000)).toBe(0);
  });

  it("rejects a draft add of an already-owned player", () => {
    expect(() => buildRosterTimeline({
      anchorAtMs: ANCHOR_AT, anchorRosters: anchor(), moves: [],
      draftEvents: [{ draftId: "d2", effectiveMs: 3_000, adds: [{ playerId: "201", rosterId: 1 }] }],
    })).toThrow(RosterReplayError);
  });

  it("rejects a draft event at or before the anchor", () => {
    expect(() => buildRosterTimeline({
      anchorAtMs: ANCHOR_AT, anchorRosters: anchor(), moves: [],
      draftEvents: [{ draftId: "d3", effectiveMs: ANCHOR_AT, adds: [] }],
    })).toThrow(RosterReplayError);
  });
});

describe("deriveBoundaryReconciliation", () => {
  // Boundary (derived): slot 1 {a, b} — c silently cut; slot 2 {d, x}
  // — x silently added. Recorded on top of it: a pre-draft drop of d
  // from slot 2, the draft adding r1 to slot 1, a post-draft add of e
  // to slot 1. Observed current: slot 1 {a, b, e, r1}, slot 2 {x}.
  const draft: RosterDraftEvent = { draftId: "d9", effectiveMs: 5_000, adds: [{ playerId: "r1", rosterId: 1 }] };
  const feed = moves([
    tx({ transaction_id: "700", status_updated: 4_000, drops: { d: 2 } }),
    tx({ transaction_id: "701", status_updated: 6_000, adds: { e: 1 } }),
  ]);
  const prior = new Map<number, readonly string[]>([[1, ["a", "b", "c"]], [2, ["d"]]]);
  const current = new Map<number, readonly string[]>([[1, ["a", "b", "e", "r1"]], [2, ["x"]]]);

  it("derives the boundary and enumerates the silent deltas", () => {
    const derived = deriveBoundaryReconciliation({
      priorFinalRosters: prior, currentRosters: current, moves: feed, draft,
    });
    expect(derived.boundaryRosters.get(1)).toEqual(["a", "b"]);
    expect(derived.boundaryRosters.get(2)).toEqual(["d", "x"]);
    expect(derived.reconciliation).toEqual([
      { rosterId: 1, cuts: ["c"], additions: [] },
      { rosterId: 2, cuts: [], additions: ["x"] },
    ]);
    expect(derived.atDraftCompletion.get(1)).toEqual(["a", "b", "r1"]);
    expect(derived.atDraftCompletion.get(2)).toEqual(["x"]);
    expect(derived.preDraftMoves.map(move => move.id)).toEqual(["700"]);
    expect(derived.postDraftMoves.map(move => move.id)).toEqual(["701"]);
  });

  it("round-trips: the forward timeline from the boundary reproduces current", () => {
    const derived = deriveBoundaryReconciliation({
      priorFinalRosters: prior, currentRosters: current, moves: feed, draft,
    });
    const timeline = buildRosterTimeline({
      anchorAtMs: 3_000, anchorRosters: derived.boundaryRosters, moves: feed, draftEvents: [draft],
    });
    expect(timeline.finalRosters().get(1)).toEqual(["a", "b", "e", "r1"]);
    expect(timeline.finalRosters().get(2)).toEqual(["x"]);
  });

  it("rejects when the observed current roster contradicts the feed", () => {
    expect(() => deriveBoundaryReconciliation({
      priorFinalRosters: prior,
      currentRosters: new Map([[1, ["a", "b", "r1"]], [2, ["x"]]]), // post-draft add e missing
      moves: feed, draft,
    })).toThrow(RosterReplayError);
  });

  it("rejects when a drafted player already sits on a prior final roster", () => {
    expect(() => deriveBoundaryReconciliation({
      priorFinalRosters: new Map([[1, ["a", "b", "c", "r1"]], [2, ["d"]]]),
      currentRosters: current, moves: feed, draft,
    })).toThrow(RosterReplayError);
  });
});

describe("deriveBoundaryReconciliation — draft-instant tie rule", () => {
  // Forward replay applies the draft before a move at the same
  // instant, so an equal-instant move acted on the draft's outcome.
  // Inversion must undo it BEFORE stripping the draft. The dot's
  // repro on PR #243: with the trade partitioned as pre-draft, the
  // derivation threw "Drafted player rookie is absent from slot 1"
  // on a feed that round-trips cleanly forward.
  const tieDraft: RosterDraftEvent = {
    draftId: "dt", effectiveMs: 2_000, adds: [{ playerId: "rookie", rosterId: 1 }],
  };
  const tieFeed = moves([
    tx({
      transaction_id: "800", type: "trade", status_updated: 2_000, roster_ids: [1, 2],
      adds: { rookie: 2 }, drops: { rookie: 1 },
    }),
  ]);
  const tiePrior = new Map<number, readonly string[]>([[1, []], [2, []]]);
  const tieCurrent = new Map<number, readonly string[]>([[1, []], [2, ["rookie"]]]);

  it("treats an equal-instant move as post-draft and round-trips", () => {
    const derived = deriveBoundaryReconciliation({
      priorFinalRosters: tiePrior, currentRosters: tieCurrent, moves: tieFeed, draft: tieDraft,
    });
    expect(derived.preDraftMoves).toEqual([]);
    expect(derived.postDraftMoves.map(move => move.id)).toEqual(["800"]);
    // At the draft's completion the rookie sits on the drafting
    // slot: in the inversion's frame the equal-instant trade has
    // been undone and the draft not yet stripped. The boundary
    // itself is empty on both slots, with no silent deltas.
    expect(derived.atDraftCompletion.get(1)).toEqual(["rookie"]);
    expect(derived.atDraftCompletion.get(2)).toEqual([]);
    expect(derived.boundaryRosters.get(1)).toEqual([]);
    expect(derived.boundaryRosters.get(2)).toEqual([]);
    expect(derived.reconciliation).toEqual([
      { rosterId: 1, cuts: [], additions: [] },
      { rosterId: 2, cuts: [], additions: [] },
    ]);
    // The forward timeline from that boundary reproduces the
    // observed current rosters exactly.
    const timeline = buildRosterTimeline({
      anchorAtMs: 1_000, anchorRosters: derived.boundaryRosters,
      moves: tieFeed, draftEvents: [tieDraft],
    });
    expect(timeline.finalRosters().get(1)).toEqual([]);
    expect(timeline.finalRosters().get(2)).toEqual(["rookie"]);
  });
});
