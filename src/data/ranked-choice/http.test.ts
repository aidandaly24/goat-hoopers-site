import { afterEach, expect, it, vi } from "vitest";
import { choiceRequest } from "./http";
import type { ChoiceRuntime } from "./runtime";
import { GET, POST } from "@/app/api/arcade/ranked/runs/route";
import { POST as choose } from "@/app/api/arcade/ranked/choices/route";
import { createChoiceRuntime } from "./runtime";
const runtime = () => ({ enabled: true, adapters: [{ gameId: "priced-in", issue: vi.fn() }], origin: () => "https://test.invalid", account: vi.fn(async () => ({ subject: "test", sessionId: "test-session" })), admitRequest: vi.fn(async () => true), store: vi.fn() } as unknown as ChoiceRuntime);
const request = (query = "?gameId=priced-in", value = "{}", headers: Record<string, string> = {}) => new Request(`https://test.invalid/api/arcade/ranked/runs${query}`, { method: "POST", headers: { origin: "https://test.invalid", "content-type": "application/json", ...headers }, body: value });
afterEach(() => vi.unstubAllEnvs());
it("mounted production routes stay disabled before any session, source, rate budget or DB access", async () => {
  vi.stubEnv("GOAT_RANKED_CHOICE_GAMES_ENABLED", "");
  expect(createChoiceRuntime().enabled).toBe(false);
  for (const route of [GET, POST, choose]) expect((await route(request())).status).toBe(503);
  const r = runtime(); r.enabled = false;
  expect((await choiceRequest(request(), "start", r)).status).toBe(503);
  expect(r.account).not.toHaveBeenCalled(); expect(r.store).not.toHaveBeenCalled();
});
it.each(["?gameId=free-throw", "?gameId=priced-in&gameId=priced-in", "?gameId=priced-in&account=other", "?gameId=priced-in&runId=bad"])("rejects invalid query %s before session/source access", async query => {
  const r = runtime(); expect((await choiceRequest(request(query), "start", r)).status).toBe(400); expect(r.account).not.toHaveBeenCalled();
});
it("requires a registered adapter, same-origin JSON, a personal session and a request budget", async () => {
  const r = runtime();
  expect((await choiceRequest(request(undefined, "{}", { origin: "https://evil.invalid" }), "start", r)).status).toBe(403);
  expect((await choiceRequest(request(undefined, "{}", { "content-type": "text/plain" }), "start", r)).status).toBe(415);
  r.adapters = []; expect((await choiceRequest(request(), "start", r)).status).toBe(503);
  expect(r.store).not.toHaveBeenCalled();
});
it.each(["{", '{"score":750}', " ".repeat(2049), '{"__proto__":{"score":750}}'])("bounds and validates command body", async value => {
  const r = runtime(), response = await choiceRequest(request(undefined, value), "start", r);
  expect([400, 413]).toContain(response.status); expect(r.store).not.toHaveBeenCalled();
});
it("does not use a route-supplied grader, account or source and gates unauthenticated/rate-limited calls", async () => {
  const r = runtime(); vi.mocked(r.account).mockResolvedValue(null);
  expect((await choiceRequest(request(), "start", r)).status).toBe(401);
  vi.mocked(r.account).mockResolvedValue({ subject: "test", sessionId: "test-session" }); vi.mocked(r.admitRequest).mockResolvedValue(false);
  expect((await choiceRequest(request(), "start", r)).status).toBe(429); expect(r.store).not.toHaveBeenCalled();
});
