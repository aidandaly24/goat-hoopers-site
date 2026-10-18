import { describe, expect, it } from "vitest";
import { getWeekTwoDemo } from "@/data/week-two-demo";
import { EMPTY_DRAFT, shuffleDemoTeams, transitionDraft, type DraftAction, type DraftState } from "./roster-draft";

const demo = getWeekTwoDemo();
const order = demo.teams.map(team => team.id);
const step = (state: DraftState, action: DraftAction) => transitionDraft(state, action, demo);
const reveal = (state: DraftState) => step(step(state, { type: "reveal" }), { type: "finish-reveal" });
const started = () => step(EMPTY_DRAFT, { type: "start", order });

describe("unranked roster draft concept", () => {
  it("draws a permutation without repeating or modifying the supplied teams", () => {
    const snapshot = structuredClone(demo);
    const forward = shuffleDemoTeams(demo.teams, () => .999);
    const other = shuffleDemoTeams(demo.teams, () => 0);
    expect([...forward].sort()).toEqual([...order].sort());
    expect([...other].sort()).toEqual([...order].sort());
    expect(other).not.toEqual(forward);
    expect(new Set(other).size).toBe(demo.teams.length);
    expect(demo).toEqual(snapshot);
  });

  it.each([NaN, Infinity, -1, 1, 5])("retains a bounded permutation for an invalid random sample %s", sample => {
    expect(shuffleDemoTeams(demo.teams, () => sample).sort()).toEqual([...order].sort());
  });

  it.each([[], [order[0]], [order[0], order[0], ...order.slice(2)], ["unknown", ...order.slice(1)]].map(order => ({ order })))(
    "rejects incomplete, repeated or unknown draw orders: $order", ({ order: invalid }) => {
      expect(step(EMPTY_DRAFT, { type: "start", order: invalid })).toBe(EMPTY_DRAFT);
    });

  it("requires a reveal and a player belonging to the revealed team before a lock", () => {
    let state = started();
    expect(step(state, { type: "next" })).toBe(state);
    expect(step(state, { type: "lock" })).toBe(state);
    expect(step(state, { type: "select", playerId: demo.teams[0].players[0].id })).toBe(state);
    state = reveal(state);
    expect(step(state, { type: "lock" })).toBe(state);
    expect(step(state, { type: "select", playerId: demo.teams[1].players[0].id })).toBe(state);
    expect(state.picks).toEqual([]);
  });

  it("cannot select or lock while the team draw is animating", () => {
    const drawing = step(started(), { type: "reveal" });
    expect(drawing.phase).toBe("drawing");
    expect(step(drawing, { type: "select", playerId: demo.teams[0].players[0].id })).toBe(drawing);
    expect(step(drawing, { type: "lock" })).toBe(drawing);
    expect(step(drawing, { type: "reveal" })).toBe(drawing);
    expect(step(drawing, { type: "finish-reveal" }).phase).toBe("revealed");
  });

  it("rejects a roster that has not arrived without consuming the drawn team", () => {
    const state = reveal(started());
    const unloaded = { ...demo, teams: demo.teams.map(team => ({ ...team, players: [] })) };
    expect(transitionDraft(state, { type: "select", playerId: demo.teams[0].players[0].id }, unloaded)).toBe(state);
    expect(transitionDraft(state, { type: "lock" }, unloaded)).toBe(state);
    expect(state.order).toEqual(order);
  });

  it("locks a pick once; stale select/reveal/lock events cannot alter it", () => {
    let state = reveal(started());
    state = step(state, { type: "select", playerId: demo.teams[0].players[0].id });
    state = step(state, { type: "lock" });
    expect(state.phase).toBe("locked");
    const locked = state;
    for (const action of [{ type: "lock" }, { type: "reveal" }, { type: "select", playerId: demo.teams[0].players[1].id }] as const) {
      state = step(state, action);
      expect(state).toBe(locked);
    }
    state = step(state, { type: "next" });
    expect(state.phase).toBe("sealed");
    expect(state.selectedId).toBeNull();
  });

  it("cannot draft the same athlete again if source rosters overlap during a transaction", () => {
    let state = reveal(started());
    const playerId = demo.teams[0].players[0].id;
    state = step(step(state, { type: "select", playerId }), { type: "lock" });
    state = reveal(step(state, { type: "next" }));
    const overlap = { ...demo, teams: demo.teams.map((team, index) => index === 1 ? { ...team, players: [demo.teams[0].players[0], ...team.players] } : team) };
    expect(transitionDraft(state, { type: "select", playerId }, overlap)).toBe(state);
    const forgedSelection = { ...state, selectedId: playerId };
    expect(transitionDraft(forgedSelection, { type: "lock" }, overlap)).toBe(forgedSelection);
    expect(state.picks).toHaveLength(1);
  });

  it("completes five distinct demo picks without any generated score or forecast", () => {
    let state = started();
    for (const [index, team] of demo.teams.entries()) {
      state = reveal(state);
      state = step(state, { type: "select", playerId: team.players[0].id });
      state = step(state, { type: "lock" });
      if (index < demo.pickCount - 1) state = step(state, { type: "next" });
    }
    expect(state.phase).toBe("complete");
    expect(state.picks).toEqual(demo.teams.map(team => ({ teamId: team.id, playerId: team.players[0].id })));
    expect(step(state, { type: "lock" })).toBe(state);
    expect(step(state, { type: "next" })).toBe(state);
    expect(state).not.toHaveProperty("score");
    const fresh = step(state, { type: "start", order: [...order].reverse() });
    expect(fresh).toMatchObject({ phase: "sealed", picks: [], selectedId: null });
    expect(step(fresh, { type: "teaser" })).toBe(EMPTY_DRAFT);
  });
});
