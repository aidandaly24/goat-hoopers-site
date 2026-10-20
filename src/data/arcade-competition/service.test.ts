import { afterEach, beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ factory: vi.fn(), finality: vi.fn() }));
vi.mock("../ranked-free-throw/runtime", () => ({ createRankedRuntime: mocks.factory }));
vi.mock("./finality", () => ({ readFinality: mocks.finality }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
import { ArcadeCompetitionStore } from "./store";
import { DEFAULT_COMPETITION_POLICY } from "./config";
import { freeThrowRulesVersion } from "../ranked-free-throw/config";
import { GET } from "@/app/api/arcade/competition/route";
import { POST } from "@/app/api/arcade/competition/reconcile/route";
const config = { status: "ready" as const, policy: DEFAULT_COMPETITION_POLICY, rulesVersion: freeThrowRulesVersion(DEFAULT_COMPETITION_POLICY) };
const period = { id: "test-period", gameId: "free-throw", week: "2026-W01", label: "Test only", order: 1,
  opensAtMs: 1000, predecessorId: null, calendarSource: "https://example.test/calendar", calendarVersion: "test-only",
  fixtures: [{ id: "123456789", date: "20261020", startsAtMs: 1000 }] };
const board = { kind: "weekly", gameId: "free-throw", periodId: period.id, label: "Test only", phase: "open", entries: [], asOfMs: 1000, scoreVersion: "a".repeat(64) };
let store: ArcadeCompetitionStore;
const request = (headers: Record<string, string> = {}, body?: string) => new Request("https://goat.test/api/arcade/competition/reconcile", { method: "POST", headers, body });
beforeEach(() => {
  vi.restoreAllMocks(); vi.clearAllMocks();
  vi.stubEnv("GOAT_ARCADE_RECONCILE_ENABLED", ""); vi.stubEnv("COMMISSIONER_KEY", ""); vi.stubEnv("GOAT_ARCADE_CALENDAR", "");
  store = new ArcadeCompetitionStore({ execute: async () => { throw new Error("unexpected database access"); }, transaction: async () => { throw new Error("unexpected write"); } });
  mocks.factory.mockReturnValue({ configuration: { status: "disabled" }, store: vi.fn(() => store), account: vi.fn(async () => null) });
});
afterEach(() => vi.unstubAllEnvs());
it("keeps mounted public reads held and reconciler disabled before any storage/provider call", async () => {
  const response = await GET(new Request("https://goat.test/api/arcade/competition"));
  expect(await response.json()).toEqual({ status: "held" });
  expect(response.headers.get("cache-control")).toContain("no-store");
  expect(mocks.factory.mock.results[0].value.store).not.toHaveBeenCalled();
  expect((await POST(request())).status).toBe(503); expect(mocks.finality).not.toHaveBeenCalled();
});
it.each(["?kind=archive", "?scope=private", "?kind=weekly&kind=archive", "?subject=other", "?periodId=../escape"])("rejects invalid public query %s", async query => {
  expect((await GET(new Request(`https://goat.test/api/arcade/competition${query}`))).status).toBe(400);
  expect(mocks.factory).not.toHaveBeenCalled();
});
it("forwards only supported scope and treats provider failure as a public signed-out board", async () => {
  const read = vi.spyOn(store, "board").mockResolvedValue(board as never);
  mocks.factory.mockReturnValue({ configuration: config, store: () => store, account: async () => { throw new Error("session unavailable"); } });
  expect((await GET(new Request("https://goat.test/api/arcade/competition?scope=league"))).status).toBe(200);
  expect(read).toHaveBeenCalledWith("weekly", null, config, null, "league");
});
it("requires separate worker activation, exact secret and an empty body before fetching finality", async () => {
  vi.stubEnv("GOAT_ARCADE_RECONCILE_ENABLED", "1"); vi.stubEnv("COMMISSIONER_KEY", "synthetic-worker-secret");
  expect((await POST(request())).status).toBe(401);
  expect((await POST(request({ authorization: "Bearer incorrect" }))).status).toBe(401);
  expect((await POST(request({ authorization: "Bearer synthetic-worker-secret" }, JSON.stringify({ final: true })))).status).toBe(400);
  expect(mocks.factory).not.toHaveBeenCalled(); expect(mocks.finality).not.toHaveBeenCalled();
});
it("uses configured fixtures only, skips sealed periods and passes source receipts to the atomic store", async () => {
  vi.stubEnv("GOAT_ARCADE_RECONCILE_ENABLED", "1"); vi.stubEnv("COMMISSIONER_KEY", "synthetic-worker-secret");
  vi.stubEnv("GOAT_ARCADE_CALENDAR", JSON.stringify([period]));
  const receipt = { checkedAtMs: 2000, source: "test-only", states: { "123456789": "final" } };
  vi.spyOn(store, "archives").mockResolvedValue([]);
  const reconcile = vi.spyOn(store, "reconcile").mockResolvedValue([period.id]);
  mocks.factory.mockReturnValue({ configuration: config, store: () => store }); mocks.finality.mockResolvedValue(receipt);
  const response = await POST(request({ authorization: "Bearer synthetic-worker-secret" }));
  expect(await response.json()).toEqual({ status: "ready", finalized: [period.id] });
  expect(mocks.finality.mock.calls[0][0]).toEqual(period);
  expect(reconcile).toHaveBeenCalledWith([period], config, new Map([[period.id, receipt]]));
  vi.spyOn(store, "archives").mockResolvedValue([{ id: period.id } as never]);
  mocks.finality.mockClear();
  await POST(request({ authorization: "Bearer synthetic-worker-secret" }));
  expect(mocks.finality).not.toHaveBeenCalled();
});
