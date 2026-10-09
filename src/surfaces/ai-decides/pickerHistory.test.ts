import { describe, expect, it } from "vitest";
import { createPickerHistory, PICKER_HISTORY_KEY, type PickerNavigation } from "./pickerHistory";

const nextTree = ["", { children: ["ai-decides", {}] }];
const nextState = () => ({ __NA: true, __PRIVATE_NEXTJS_INTERNALS_TREE: nextTree, otherOwner: { untouched: true } });
type Entry = { mode: "wins" | "edge"; opener: string; ids: [string, string] };
const wins: Entry = { mode: "wins", opener: "who-wins-button", ids: ["1", "2"] };
const edge: Entry = { mode: "edge", opener: "who-edge-button", ids: ["6", "10"] };
function fixture(initialState: Record<string, unknown> = nextState(), initialUrl = "/ai-decides?source=home#weekly") {
  const stack = [{ state: initialState, url: initialUrl }]; let index = 0, backCalls = 0;
  const listeners = new Set<() => void>(); const changes: (Entry | null)[] = []; let id = 0;
  const navigation: PickerNavigation = {
    state: () => stack[index].state,
    path: () => new URL(stack[index].url, "https://fixture.invalid").pathname,
    url: () => stack[index].url,
    push: (state, url) => { stack.splice(index + 1); stack.push({ state, url }); index++; },
    replace: (state, url) => { stack[index] = { state, url }; },
    back: () => { backCalls++; }, // Browser traversal is asynchronous.
    subscribe: sync => { listeners.add(sync); return () => { listeners.delete(sync); }; },
  };
  const travel = (delta: number) => { index += delta; if (index < 0 || index >= stack.length) throw Error("Invalid traversal"); listeners.forEach(sync => sync()); };
  const controller = createPickerHistory<Entry>(navigation, value => changes.push(value), () => String(++id));
  return { controller, navigation, travel, stack, changes, last: () => changes.at(-1), backCalls: () => backCalls, listeners: () => listeners.size };
}

describe("picker Back/Forward policy", () => {
  it.each(["Save", "Cancel", "Escape"])("%s closes exactly once; Forward restores that picker and its original trigger", () => {
    const f = fixture(); f.controller.open(wins);
    f.controller.update({ ...wins, ids: ["1", "10"] });
    f.controller.close(); f.controller.close(); expect(f.backCalls()).toBe(1);
    f.travel(-1); expect(f.last()).toBeNull(); expect(f.navigation.url()).toBe("/ai-decides?source=home#weekly");
    f.travel(1); expect(f.last()).toEqual({ ...wins, ids: ["1", "10"] });
    f.controller.close(); f.travel(-1); expect(f.last()).toBeNull();
  });
  it("survives Open → Back → Forward → reopen without requiring two Back presses", () => {
    const f = fixture(); f.controller.open(wins); f.travel(-1); expect(f.last()).toBeNull();
    f.travel(1); expect(f.last()?.opener).toBe(wins.opener);
    f.controller.open(edge); expect(f.stack).toHaveLength(2); expect(f.last()?.opener).toBe(edge.opener);
    f.controller.close(); f.travel(-1); expect(f.last()).toBeNull();
  });
  it("supports repeated open/cancel with no stacked picker markers", () => {
    const f = fixture();
    for (let i = 0; i < 5; i++) { f.controller.open(i % 2 ? edge : wins); f.controller.close(); f.travel(-1); expect(f.last()).toBeNull(); expect(f.stack).toHaveLength(2); }
    f.travel(1); expect(f.last()?.opener).toBe(wins.opener);
  });
  it.each([true, { version: 1, id: "old-mount", path: "/ai-decides", returnUrl: "/ai-decides#weekly" }])("clears stale/reloaded marker %j before another open", marker => {
    const f = fixture({ ...nextState(), [PICKER_HISTORY_KEY]: marker }, "/ai-decides#ai-team-picker");
    expect(f.navigation.state()).not.toHaveProperty(PICKER_HISTORY_KEY); expect(f.last()).toBeNull();
    f.controller.open(wins); f.controller.close(); f.travel(-1); expect(f.last()).toBeNull();
  });
  it("preserves actual Next history keys/reference while pushing and replacing its own marker", () => {
    const f = fixture(); f.controller.open(wins); f.controller.open(edge);
    const state = f.navigation.state(); expect(state).toMatchObject(nextState());
    expect((state as ReturnType<typeof nextState>).__PRIVATE_NEXTJS_INTERNALS_TREE).toBe(nextTree);
    f.controller.dispose(); expect(f.navigation.state()).toEqual(nextState()); expect(f.listeners()).toBe(0);
  });
  it("does not rewrite a Next route change to the old page URL", () => {
    const f = fixture(); f.controller.open(wins);
    f.navigation.push({ ...(f.navigation.state() as Record<string, unknown>), __PRIVATE_NEXTJS_INTERNALS_TREE: ["news"] }, "/news?view=latest");
    f.controller.dispose(); expect(f.navigation.url()).toBe("/news?view=latest");
    expect(f.navigation.state()).not.toHaveProperty(PICKER_HISTORY_KEY);
    expect(f.navigation.state()).toMatchObject({ __NA: true, __PRIVATE_NEXTJS_INTERNALS_TREE: ["news"] });
  });
  it("reconciles stale entries after route-away/back and never revives another mount's opener", () => {
    const f = fixture(); f.controller.open(wins); f.navigation.push(nextState(), "/news"); f.controller.dispose();
    f.travel(-1); const changes: (Entry | null)[] = [];
    const second = createPickerHistory<Entry>(f.navigation, entry => changes.push(entry), () => "new-mount");
    expect(changes.at(-1)).toBeNull(); expect(f.navigation.state()).not.toHaveProperty(PICKER_HISTORY_KEY);
    second.open(edge); second.close(); f.travel(-1); expect(changes.at(-1)).toBeNull(); second.dispose();
  });
  it("rejects foreign/malformed return URLs without leaving the AI route", () => {
    for (const returnUrl of ["https://outside.invalid", "//[", "/news"]) {
      const f = fixture({ ...nextState(), [PICKER_HISTORY_KEY]: { version: 1, id: "stale", path: "/ai-decides", returnUrl } }, "/ai-decides#ai-team-picker");
      expect(f.navigation.url()).toBe("/ai-decides"); expect(f.navigation.state()).toEqual(nextState());
    }
  });
});
