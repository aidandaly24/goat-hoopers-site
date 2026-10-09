import { afterEach, beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ legacy: vi.fn(() => null), store: vi.fn(() => null),
  provider: vi.fn(async () => null), cookies: vi.fn(async () => ({ get: () => ({ value: "a".repeat(64) }) })) }));
vi.mock("../../arcade", () => ({ getGameStore: mocks.legacy }));
vi.mock("../../league", () => ({ loadAiWeekContext: vi.fn() }));
vi.mock("../store", () => ({ getAiDeciderStore: mocks.store, validAiIdentity: vi.fn() }));
vi.mock("../../friends-auth/runtime", () => ({ getProviderIdentity: mocks.provider }));
vi.mock("next/headers", () => ({ cookies: mocks.cookies }));
import { createAiRuntime } from "../runtime";
import { POST } from "@/app/api/ai-decides/route";

beforeEach(() => {
  vi.clearAllMocks(); vi.stubEnv("OPENAI_API_KEY", ""); vi.stubEnv("GOAT_AI_DECIDES_ENABLED", "");
});
afterEach(() => vi.unstubAllEnvs());

it.each([undefined, "", "0", "true"])("preserves legacy default for flag %s without invoking provider configuration", flag => {
  vi.stubEnv("FRIENDS_AUTH_ENABLED", flag);
  const runtime = createAiRuntime(new Headers());
  expect(runtime.providerSession).toBeUndefined();
  expect(mocks.legacy).toHaveBeenCalledTimes(1); expect(mocks.provider).not.toHaveBeenCalled();
});

it("uses the shared exact-1 flag and passes headers only to the lazy provider verifier", async () => {
  vi.stubEnv("FRIENDS_AUTH_ENABLED", "1");
  const headers = new Headers({ cookie: "synthetic-provider-cookie" }), runtime = createAiRuntime(headers);
  expect(runtime.sessions).toBeNull(); expect(mocks.legacy).not.toHaveBeenCalled();
  expect(mocks.provider).not.toHaveBeenCalled();
  expect(await runtime.providerSession!()).toBeNull();
  expect(mocks.provider).toHaveBeenCalledWith(headers);
});

it("keeps provider mode fail closed when a non-request caller has no headers", async () => {
  vi.stubEnv("FRIENDS_AUTH_ENABLED", "1");
  expect(await createAiRuntime().providerSession!()).toBeNull();
  expect(mocks.legacy).not.toHaveBeenCalled(); expect(mocks.provider).not.toHaveBeenCalled();
});

it.each(["0", "1"])("route reads the legacy cookie only while legacy mode is selected (%s)", async flag => {
  vi.stubEnv("FRIENDS_AUTH_ENABLED", flag);
  const response = await POST(new Request("https://synthetic.invalid/api/ai-decides", { method: "POST",
    headers: { origin: "https://synthetic.invalid", "Content-Type": "application/json" },
    body: JSON.stringify({ kind: "custom", prompt: "Synthetic?", choices: ["One", "Two"] }) }));
  expect(response.status).toBe(503); // Disabled: no paid work in this wiring check.
  expect(mocks.cookies).toHaveBeenCalledTimes(flag === "1" ? 0 : 1);
  expect(mocks.provider).not.toHaveBeenCalled();
});
