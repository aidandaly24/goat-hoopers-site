import { afterEach, beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => {
  const execute = vi.fn<(statement: unknown) => Promise<{ rows: Record<string, unknown>[] }>>(async () => ({ rows: [] }));
  const transaction = vi.fn<(work: (tx: { execute: typeof execute }) => Promise<unknown>, config?: unknown) => Promise<unknown>>(async work => work({ execute }));
  return { execute, transaction, getDb: vi.fn(() => ({ execute, transaction })),
    verify: vi.fn<(headers: Headers) => Promise<{ subject: string; sessionId: string; name: string } | null>>(),
    throttle: vi.fn<(key: string, max: number) => Promise<boolean>>(async () => true) };
});
vi.mock("../../friends-auth/db", () => ({ getFriendsDb: mocks.getDb }));
vi.mock("../../friends-auth/runtime", () => ({ getVerifiedAccount: mocks.verify, consumeAuthAttempt: mocks.throttle }));
import { ArcadeCompetitionStore } from "../../arcade-competition/store";
import { createRankedRuntime, loadRankedAvailability } from "../runtime";
import { POST as start } from "@/app/api/arcade/free-throw/runs/route";
import { POST as submit } from "@/app/api/arcade/free-throw/scores/route";
import { GET as leaderboard } from "@/app/api/arcade/free-throw/leaderboard/route";
import { GET as result } from "@/app/api/arcade/free-throw/results/route";
import { account, configuration, nowMs, policy, replayContext, run, submission, sampleScore } from "./fixtures";

beforeEach(() => {
  vi.restoreAllMocks(); vi.clearAllMocks();
  mocks.execute.mockReset().mockResolvedValue({ rows: [] });
  mocks.verify.mockReset().mockResolvedValue({ ...account, name: "hooper" });
  mocks.throttle.mockReset().mockResolvedValue(true);
  vi.stubEnv("GOAT_ARCADE_CALENDAR", ""); vi.stubEnv("GOAT_RANKED_FREE_THROW_ENABLED", ""); vi.stubEnv("GOAT_RANKED_FREE_THROW_RULES", "");
  vi.stubEnv("FRIENDS_AUTH_ENABLED", ""); vi.stubEnv("FRIENDS_AUTH_ENROLLMENT", "");
  vi.stubEnv("BETTER_AUTH_SECRET", ""); vi.stubEnv("BETTER_AUTH_URL", "");
});
afterEach(() => vi.unstubAllEnvs());
const enableSynthetic = () => {
  vi.stubEnv("GOAT_ARCADE_CALENDAR", JSON.stringify([{ id: "synthetic-period", gameId: "free-throw", week: "2026-W42", label: "Test only", order: 1, opensAtMs: nowMs - 100000, predecessorId: null, calendarSource: "https://example.test/calendar", calendarVersion: "test", fixtures: [{ id: "123456789", date: "20261014", startsAtMs: nowMs - 100000 }] }]));
  vi.stubEnv("GOAT_RANKED_FREE_THROW_ENABLED", "1"); vi.stubEnv("GOAT_RANKED_FREE_THROW_RULES", JSON.stringify(policy));
  vi.stubEnv("FRIENDS_AUTH_ENROLLMENT", "1");
  vi.stubEnv("BETTER_AUTH_SECRET", "synthetic-only-".repeat(4)); vi.stubEnv("BETTER_AUTH_URL", "https://goat.test");
};
const post = (value: unknown = {}) => new Request("https://goat.test/api/arcade/free-throw/runs", { method: "POST",
  headers: { origin: "https://goat.test", "content-type": "application/json", cookie: "gh_session=legacy-must-not-authorize" }, body: JSON.stringify(value) });

it.each([undefined, "", "0", "true"])("keeps actual routes closed for flag %s before provider/config/DB work", async flag => {
  vi.stubEnv("GOAT_RANKED_FREE_THROW_ENABLED", flag);
  for (const route of [start, submit, leaderboard, result]) expect((await route(post())).status).toBe(503);
  expect(mocks.getDb).not.toHaveBeenCalled(); expect(mocks.verify).not.toHaveBeenCalled(); expect(mocks.throttle).not.toHaveBeenCalled();
});

it("gates the ranked page before request headers/provider/database work, then requires verified personal identity", async () => {
  const headers = vi.fn(async () => new Headers());
  expect(await loadRankedAvailability(headers)).toEqual({ status: "disabled" });
  expect(headers).not.toHaveBeenCalled(); expect(mocks.getDb).not.toHaveBeenCalled(); expect(mocks.verify).not.toHaveBeenCalled();
  enableSynthetic();
  vi.spyOn(ArcadeCompetitionStore.prototype, "board").mockResolvedValue({ phase: "open" } as never);
  expect(await loadRankedAvailability(headers)).toEqual({ status: "available", ruleSetId: policy.ruleSetId, rules: policy });
  mocks.verify.mockResolvedValue(null);
  expect(await loadRankedAvailability(headers)).toEqual({ status: "sign_in" });
  mocks.verify.mockRejectedValue(new Error("private"));
  expect(await loadRankedAvailability(headers)).toEqual({ status: "unavailable" });
});

it("refuses absent/invalid rules or inactive personal auth despite the activation flag", async () => {
  vi.stubEnv("GOAT_RANKED_FREE_THROW_ENABLED", "1");
  expect((await start(post())).status).toBe(503);
  vi.stubEnv("GOAT_RANKED_FREE_THROW_RULES", JSON.stringify(policy));
  expect((await start(post())).status).toBe(503);
  expect(mocks.getDb).not.toHaveBeenCalled(); expect(mocks.verify).not.toHaveBeenCalled();
});

it.each(["FRIENDS_AUTH_ENROLLMENT", "FRIENDS_AUTH_ENABLED"])("uses the verified personal subject with %s, without requiring a team", async flag => {
  enableSynthetic(); vi.stubEnv("FRIENDS_AUTH_ENROLLMENT", ""); vi.stubEnv(flag, "1");
  const runtime = createRankedRuntime(); const headers = new Headers({ cookie: "synthetic-private-cookie" });
  expect(runtime.configuration).toEqual(configuration);
  expect(await runtime.account(headers)).toEqual(account);
  expect(mocks.verify).toHaveBeenCalledWith(headers);
  expect(mocks.getDb).not.toHaveBeenCalled();
});

it("has no legacy fallback after a provider miss/failure and does not create a store", async () => {
  enableSynthetic(); mocks.verify.mockResolvedValueOnce(null);
  expect((await start(post())).status).toBe(401);
  mocks.verify.mockRejectedValueOnce(new Error("synthetic provider failure"));
  expect((await start(post())).status).toBe(503);
  expect(mocks.getDb).not.toHaveBeenCalled(); expect(mocks.throttle).not.toHaveBeenCalled();
});

it("constructs one store lazily and explicitly requires READ COMMITTED rather than a server default", async () => {
  enableSynthetic(); const runtime = createRankedRuntime();
  expect(mocks.getDb).not.toHaveBeenCalled();
  expect(runtime.store()).toBe(runtime.store()); expect(mocks.getDb).toHaveBeenCalledTimes(1);
  mocks.execute.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [{ now_ms: nowMs }] });
  expect(await runtime.store().start(account, configuration)).toEqual({ status: "week_closing" });
  expect(mocks.transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: "read committed" });
});

it("uses bounded fixed throttle keys and stops actual route work when admission is exhausted", async () => {
  enableSynthetic(); const runtime = createRankedRuntime();
  await runtime.admitRequest("start"); await runtime.admitRequest("submit");
  expect(mocks.throttle.mock.calls).toEqual([["ranked-free-throw:start", 120], ["ranked-free-throw:submit", 120]]);
  mocks.throttle.mockResolvedValueOnce(false);
  expect((await start(post())).status).toBe(429);
  expect(mocks.getDb).not.toHaveBeenCalled();
});

it("wires a real submission route through provider verification, deterministic replay and atomic persistence", async () => {
  enableSynthetic();
  vi.spyOn(ArcadeCompetitionStore.prototype, "readRun").mockResolvedValue({ run, policy, replayContext, nowMs });
  const consume = vi.spyOn(ArcadeCompetitionStore.prototype, "consume").mockResolvedValue(sampleScore);
  const result = await submit(post(submission));
  expect(result.status).toBe(201); expect(await result.json()).toMatchObject({ status: "saved", score: { score: 2 } });
  expect(mocks.verify).toHaveBeenCalledOnce(); expect(mocks.throttle).toHaveBeenCalledWith("ranked-free-throw:submit", 120);
  expect(consume).toHaveBeenCalledOnce();
});
