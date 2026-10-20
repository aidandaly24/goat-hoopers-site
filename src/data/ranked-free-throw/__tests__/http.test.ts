import { expect, it, vi } from "vitest";
import { handleRankedRequest } from "../http";
import { fixture, run, submission } from "./fixtures";

const request = (body: unknown = {}, origin = "https://goat.test", type = "application/json") =>
  new Request("https://goat.test/api/arcade/free-throw/runs", { method: "POST", headers: { origin, "content-type": type }, body: JSON.stringify(body) });

it("keeps all endpoints disabled without reading bodies, provider config or persistence", async () => {
  const { runtime } = fixture(); runtime.configuration = { status: "disabled" };
  for (const action of ["start", "submit", "leaderboard", "result"] as const) {
    const result = await handleRankedRequest(request(), action, runtime);
    expect(result.status).toBe(503);
    expect(result.headers.get("cache-control")).toBe("no-store");
  }
  expect(runtime.origin).not.toHaveBeenCalled(); expect(runtime.account).not.toHaveBeenCalled(); expect(runtime.store).not.toHaveBeenCalled();
});

it("recovers a saved receipt read-only, requires identity, and rejects arbitrary result queries", async () => {
  const { runtime, store } = fixture();
  const get = (query: string) => handleRankedRequest(new Request(`https://goat.test/api/arcade/free-throw/results${query}`), "result", runtime);
  expect((await get(`?runId=${run.id}`)).status).toBe(404);
  await handleRankedRequest(request(submission), "submit", runtime);
  const result = await get(`?runId=${run.id}`);
  expect(result.status).toBe(200);
  expect(await result.json()).toMatchObject({ status: "saved", score: { score: 2, outcomes: [1, 1], longestStreak: 2, endingStreak: 2, accuracy: 1 } });
  expect(store.consume).toHaveBeenCalledTimes(1);
  for (const query of ["", "?runId=invalid", `?runId=${run.id}&runId=${run.id}`, `?runId=${run.id}&userId=other`]) expect((await get(query)).status).toBe(400);
  runtime.account = vi.fn(async () => null);
  expect((await get(`?runId=${run.id}`)).status).toBe(401);
});

it("rejects cross-origin, wrong methods, non-JSON and caller-owned run metadata before admission", async () => {
  const { runtime } = fixture();
  expect((await handleRankedRequest(request({}, "https://other.test"), "start", runtime)).status).toBe(403);
  expect((await handleRankedRequest(request({}, undefined, "text/plain"), "start", runtime)).status).toBe(415);
  expect((await handleRankedRequest(new Request("https://goat.test"), "start", runtime)).status).toBe(405);
  for (const payload of [{ userId: "forged" }, { week: "2026-W43" }, { ruleSetId: "custom" }, [], null]) {
    expect((await handleRankedRequest(request(payload), "start", runtime)).status).toBe(400);
  }
  expect(runtime.account).not.toHaveBeenCalled(); expect(runtime.admitRequest).not.toHaveBeenCalled(); expect(runtime.store).not.toHaveBeenCalled();
});

it("bounds bytes, rejects malformed JSON and requires a verified account and durable throttle", async () => {
  const { runtime } = fixture();
  expect((await handleRankedRequest(request("😀".repeat(5000)), "submit", runtime)).status).toBe(413);
  const malformed = new Request("https://goat.test", { method: "POST", headers: { origin: "https://goat.test", "content-type": "application/json" }, body: "{" });
  expect((await handleRankedRequest(malformed, "submit", runtime)).status).toBe(400);
  runtime.account = vi.fn(async () => null);
  expect((await handleRankedRequest(request(), "start", runtime)).status).toBe(401);
  expect(runtime.admitRequest).not.toHaveBeenCalled();
  runtime.account = fixture().runtime.account; runtime.admitRequest = vi.fn(async () => false);
  expect((await handleRankedRequest(request(), "start", runtime)).status).toBe(429);
  expect(runtime.store).not.toHaveBeenCalled();
});

it("serves a verified start and server-derived score without accepting browser identity or totals", async () => {
  const { runtime, store } = fixture();
  const started = await handleRankedRequest(request(), "start", runtime);
  expect(started.status).toBe(201);
  expect(JSON.stringify(await started.json())).not.toContain("personal-account-without-a-team");
  expect((await handleRankedRequest(request({ ...submission, score: 999 }), "submit", runtime)).status).toBe(400);
  expect(store.readRun).not.toHaveBeenCalled();
  const saved = await handleRankedRequest(request(submission), "submit", runtime);
  expect(saved.status).toBe(201);
  expect(await saved.json()).toMatchObject({ status: "saved", score: { score: 2 } });
  expect((await handleRankedRequest(request(submission), "submit", runtime)).status).toBe(409);
});

it("bounds current-week leaderboard reads and passes League/Everyone scope without exposing account IDs", async () => {
  const { runtime, store } = fixture(); runtime.account = vi.fn(async () => null);
  const get = (query: string) => handleRankedRequest(new Request(`https://goat.test/api/arcade/free-throw/leaderboard${query}`), "leaderboard", runtime);
  const result = await get("?scope=league&limit=10");
  expect(result.status).toBe(200);
  expect(await result.json()).toMatchObject({ status: "ready", scope: "league", calendar: { timeZone: "America/New_York" }, entries: [] });
  expect(store.leaderboard).toHaveBeenCalledWith(runtime.configuration, "league", null, 10);
  for (const query of ["?scope=global", "?limit=101", "?limit=0", "?limit=2&limit=3", "?week=2026-W42", "?userId=other"]) {
    expect((await get(query)).status).toBe(400);
  }
  expect(store.leaderboard).toHaveBeenCalledTimes(1);
});

it("reports infrastructure failure as unavailable without details or success", async () => {
  const { runtime, store } = fixture();
  store.start = vi.fn(async () => { throw new Error("missing private database/schema details"); });
  const result = await handleRankedRequest(request(), "start", runtime);
  expect(result.status).toBe(503); expect(await result.json()).toEqual({ status: "unavailable" });
});
