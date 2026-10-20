import { afterEach, beforeEach, expect, it, vi } from "vitest";
const calls = vi.hoisted(() => ({ store: vi.fn(), aiRuntime: vi.fn(() => ({})) }));
vi.mock("@/data/arcade", () => ({ MAX_CLAIM_ATTEMPTS: 5, getGameStore: calls.store }));
vi.mock("../ai-decider/runtime", () => ({ createAiRuntime: calls.aiRuntime }));
import { getInviteOverview, ensureInviteCodes, regenerateInviteCode } from "@/app/actions";
import { GET as weeklyCron } from "@/app/api/ai-decides/weekly/route";
const TOKEN = "a".repeat(64), COMMISSIONER = "b".repeat(64), CRON = "c".repeat(64);
beforeEach(() => {
  vi.clearAllMocks(); vi.stubEnv("COMMISSIONER_KEY", COMMISSIONER); vi.stubEnv("CRON_SECRET", CRON); vi.stubEnv("GOAT_ARCADE_RECONCILE_TOKEN", TOKEN);
  calls.store.mockImplementation(() => { throw Error("unexpected admin store access"); });
});
afterEach(() => vi.unstubAllEnvs());
it("the reconcile token grants no existing commissioner action", async () => {
  expect(await getInviteOverview(TOKEN)).toEqual({ ok: false, error: "Wrong commissioner key." });
  expect(await ensureInviteCodes(TOKEN, [{ id: "1" }])).toEqual({ ok: false, error: "Wrong commissioner key." });
  expect(await regenerateInviteCode(TOKEN, "1")).toEqual({ ok: false, error: "Wrong commissioner key." });
  expect(calls.store).not.toHaveBeenCalled();
});
it("the reconcile token grants no authority to the mounted AI cron endpoint", async () => {
  const response = await weeklyCron(new Request("https://test.invalid/api/ai-decides/weekly", { headers: { authorization: `Bearer ${TOKEN}` } }));
  expect(response.status).toBe(401); expect((await response.json()).code).toBe("operator_auth_required");
  // The distinct existing cron credential passes authentication, but this
  // synthetic runtime has no operator and cannot perform paid generation.
  const validCron = await weeklyCron(new Request("https://test.invalid/api/ai-decides/weekly", { headers: { authorization: `Bearer ${CRON}` } }));
  expect(validCron.status).toBe(503); expect((await validCron.json()).code).toBe("operator_unconfigured");
  expect(calls.store).not.toHaveBeenCalled();
});
