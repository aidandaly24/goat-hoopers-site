import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveAiIdentity, runAiDecision } from "../service";
import { NOW, TOKEN, USER, harness } from "./fixtures";

const draft = { kind: "custom", prompt: "Synthetic option?", choices: ["One", "Two"] };
const session = () => ({ user: { id: USER, teamId: "1", displayName: "Synthetic manager", createdAt: new Date(NOW) },
  sessionId: "provider-session-1", subject: "provider-subject-1", expiresAt: new Date(NOW + 86400000) });
afterEach(() => vi.useRealTimers());

describe("provider identity at the AI boundary", () => {
  it("uses only verified IDs, ignoring a legacy cookie and keeping session metadata out of paid payload/state", async () => {
    const h = harness(), verified = vi.fn(async () => session()); h.runtime.providerSession = verified;
    expect(await resolveAiIdentity(TOKEN, h.runtime)).toEqual({ kind: "friends", userId: USER,
      sessionId: "provider-session-1", subject: "provider-subject-1" });
    expect((await runAiDecision(draft, TOKEN, h.runtime)).status).toBe("ready");
    expect(h.getSessionUser).not.toHaveBeenCalled();
    const recorded = JSON.stringify({ payload: h.create.mock.calls[0][0], state: h.persistence.control!.state });
    expect(recorded).not.toMatch(/provider-session-1|provider-subject-1/);
    expect(recorded).not.toContain(TOKEN);
    expect(Object.keys(h.persistence.control!.state.users)).toEqual([USER]);
  });

  it.each(["anonymous", "expired", "bad_date", "bad_user", "bad_team", "empty_session", "long_subject"])("fails closed on %s without using legacy auth", async change => {
    const h = harness(), record = session();
    if (change === "expired") record.expiresAt = new Date(NOW);
    if (change === "bad_date") record.expiresAt = new Date(NaN);
    if (change === "bad_user") record.user.id = "spoof";
    if (change === "bad_team") record.user.teamId = "11";
    if (change === "empty_session") record.sessionId = "";
    if (change === "long_subject") record.subject = "x".repeat(257);
    h.runtime.providerSession = async () => change === "anonymous" ? null : record;
    expect((await runAiDecision(draft, TOKEN, h.runtime)).status).toBe("unauthenticated");
    expect(h.getSessionUser).not.toHaveBeenCalled(); expect(h.create).not.toHaveBeenCalled();
    expect(h.persistence.control!.state.requests).toBe(0);
  });

  it("contains verifier errors and times out without falling back or admitting a paid call", async () => {
    const h = harness(); h.runtime.providerSession = async () => { throw new Error("private auth detail"); };
    const failure = await runAiDecision(draft, TOKEN, h.runtime);
    expect(failure).toMatchObject({ status: "unavailable", code: "session_unavailable" });
    expect(JSON.stringify(failure)).not.toContain("private auth detail");
    vi.useFakeTimers(); h.runtime.providerSession = async () => new Promise(() => {});
    const pending = runAiDecision(draft, TOKEN, h.runtime);
    await vi.advanceTimersByTimeAsync(1001);
    expect(await pending).toMatchObject({ status: "unavailable", code: "session_unavailable" });
    expect(h.getSessionUser).not.toHaveBeenCalled(); expect(h.create).not.toHaveBeenCalled();
  });

  it("keeps the same diagnostic counters across the legacy-to-provider switch without an account quota", async () => {
    const h = harness();
    for (let n = 0; n < 4; n++) expect((await runAiDecision({ ...draft, prompt: `Before ${n}` }, TOKEN, h.runtime)).status).toBe("ready");
    h.runtime.providerSession = async () => session();
    expect((await runAiDecision({ ...draft, prompt: "After" }, undefined, h.runtime)).status).toBe("ready");
    expect((await runAiDecision({ ...draft, prompt: "Another ordinary request" }, undefined, h.runtime)).status).toBe("ready");
    expect(h.create).toHaveBeenCalledTimes(6);
    expect(h.persistence.control!.state.users[USER].hourly).toBe(6);
    expect(Object.keys(h.persistence.control!.state.users)).toEqual([USER]);
    expect(h.persistence.control!.state.requests).toBe(6);
  });
});

