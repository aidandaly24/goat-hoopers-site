import { describe, expect, it, vi } from "vitest";
import type { AiWeeklyInput } from "@/domain/ai-decider";
import { generateWeeklyPicks } from "../service";
import { loadAiDecidesData } from "../runtime";
import { handleAiWeek1RefreshPost, refreshWeek1 } from "../week1-refresh";
import { refreshStorageKey, WEEK1_REFRESH_KEY } from "../refresh-policy";
import { harness, identity, NOW, providerAnswer, TOKEN, USER, weeklyInput } from "./fixtures";

function preview(capturedAt = NOW): AiWeeklyInput {
  return { ...weeklyInput(), phase: "pre", scoringMode: "unknown", capturedAt: new Date(capturedAt).toISOString(), cutoffAt: new Date(capturedAt).toISOString(), statsAvailableAt: new Date(capturedAt).toISOString(), startsAt: "2026-10-20T00:00:00.000Z", endsAt: null,
    preview: { kind: "lineup_strength", sourceLeg: 0, seasonStartDate: "2026-10-20", gameModeCode: 1 } };
}
const context = () => ({ leagueId: "1387473752807190528", season: "2026", phase: "pre" as const, leg: 0, week: 1, seasonStartDate: "2026-10-20", statsSeason: "2025", gameModeCode: 1 });
async function prepared() {
  const h = harness(); h.runtime.getSourceState = async () => ({ season: "2026", phase: "pre", leg: 0 });
  expect((await generateWeeklyPicks(preview(), TOKEN, h.runtime)).status).toBe("ready");
  const original = structuredClone(h.persistence.weeks.get(WEEK1_REFRESH_KEY)!);
  h.persistence.refreshPolicy = h.runtime.week1Refresh = { originalHash: original.hash };
  h.create.mockClear(); h.setTime(NOW + 1000);
  const sources = { context: vi.fn(async () => context()), input: vi.fn(async () => preview(NOW + 1000)) };
  return { ...h, original, sources };
}
const http = (body: unknown = {}, headers: Record<string, string> = {}, query = "") => new Request(`https://goathoopers.com/api/ai-decides/weekly/refresh${query}`, { method: "POST", headers: { origin: "https://goathoopers.com", "content-type": "application/json", ...headers }, body: JSON.stringify(body) });

describe("one reversible Week 1 replacement", () => {
  it("keeps every original byte and existing counter, publishes five complete replacements once, and rolls back without deletion", async () => {
    const h = await prepared(), before = structuredClone(h.persistence.control!);
    const response = await refreshWeek1(identity(), h.runtime, h.sources);
    expect(response.status).toBe("ready"); if (response.status !== "ready") throw Error("fixture");
    expect(response.weekly.matchups).toHaveLength(5); expect(response.weekly.matchups.every(m => m.status === "ready")).toBe(true);
    expect(response.weekly.snapshot?.hash).not.toBe(h.original.hash); expect(response.weekly.generatedAt).toBe(new Date(NOW + 1000).toISOString());
    expect(h.persistence.weeks.get(WEEK1_REFRESH_KEY)).toEqual(h.original);
    expect(h.persistence.weeks.size).toBe(2); expect(h.persistence.control!.state.requests).toBe(before.state.requests + 1);
    expect(h.persistence.control!.state.tokens).toBeGreaterThan(before.state.tokens); expect(h.create).toHaveBeenCalledTimes(1);
    expect(await refreshWeek1(identity(2), h.runtime, h.sources)).toEqual(response); expect(h.create).toHaveBeenCalledTimes(1); expect(h.sources.input).toHaveBeenCalledTimes(1);
    expect((await h.persistence.getWeek(WEEK1_REFRESH_KEY))?.hash).toBe(response.weekly.snapshot?.hash);
    const replacement = structuredClone(h.persistence.weeks.get(refreshStorageKey(WEEK1_REFRESH_KEY)));
    h.persistence.refreshPolicy = undefined; h.runtime.week1Refresh = undefined;
    expect(await h.persistence.getWeek(WEEK1_REFRESH_KEY)).toEqual(h.original);
    expect(h.persistence.weeks.get(refreshStorageKey(WEEK1_REFRESH_KEY))).toEqual(replacement);
  });
  it("allows only the durable INSERT winner across overlapping different captures and later repeats", async () => {
    const h = await prepared(), other = { ...h.sources, input: async () => preview(NOW + 500) };
    const results = await Promise.all([refreshWeek1(identity(), h.runtime, h.sources), refreshWeek1(identity(2), h.runtime, other)]);
    expect(results.some(r => r.status === "ready")).toBe(true); expect(h.create).toHaveBeenCalledTimes(1);
    h.setTime(NOW + 601000); await refreshWeek1(identity(3), h.runtime, h.sources);
    expect(h.create).toHaveBeenCalledTimes(1); expect(h.persistence.weeks.get(WEEK1_REFRESH_KEY)).toEqual(h.original);
  });
  it("keeps the old version public during an active provider request", async () => {
    const h = await prepared(); let release!: () => void;
    h.create.mockImplementationOnce(async payload => { await new Promise<void>(resolve => { release = resolve; }); return providerAnswer(payload); });
    const pending = refreshWeek1(identity(), h.runtime, h.sources);
    await vi.waitFor(() => expect(h.create).toHaveBeenCalledTimes(1));
    expect(await h.persistence.getWeek(WEEK1_REFRESH_KEY)).toEqual(h.original);
    release(); expect((await pending).status).toBe("ready");
  });
  it.each(["timeout", "refusal", "malformed", "usage", "source_closed", "completion_failed", "revoked"])("preserves original and seals failed %s work without another paid attempt", async change => {
    const h = await prepared();
    if (change === "timeout") { h.runtime.timeoutMs = 1; h.create.mockImplementationOnce(async () => new Promise(() => {})); }
    else h.create.mockImplementationOnce(async payload => {
      const answer = providerAnswer(payload);
      if (change === "refusal") Object.assign(answer.answers[0], { type: "refusal" });
      if (change === "malformed") answer.answers[0].probabilities[0].probability = 2;
      if (change === "usage") Object.assign(answer, { usage: null });
      if (change === "source_closed") h.runtime.getSourceState = async () => ({ season: "2026", phase: "regular", leg: 1 });
      if (change === "revoked") h.persistence.revoked.add(USER);
      return answer;
    });
    if (change === "completion_failed") vi.spyOn(h.persistence, "completeWeekRefresh").mockResolvedValue(false);
    expect((await refreshWeek1(identity(), h.runtime, h.sources)).status).not.toBe("ready");
    expect(await h.persistence.getWeek(WEEK1_REFRESH_KEY)).toEqual(h.original);
    h.setTime(NOW + 601000);
    expect(await refreshWeek1(identity(2), h.runtime, h.sources)).toMatchObject({ code: "refresh_sealed" });
    expect(h.create).toHaveBeenCalledTimes(1); expect(h.persistence.weeks.get(WEEK1_REFRESH_KEY)).toEqual(h.original);
  });
  it.each(["disabled", "original", "pairings", "coverage", "leg", "stale_capture", "revoked", "job"])("refuses unsupported %s before spend", async change => {
    const h = await prepared(); let auth = identity() as Parameters<typeof refreshWeek1>[0];
    if (change === "disabled") h.runtime.week1Refresh = undefined;
    if (change === "original") h.runtime.week1Refresh!.originalHash = "0".repeat(64);
    if (change === "pairings") h.sources.input.mockImplementation(async () => { const input = preview(NOW + 1000); input.matchups.reverse(); return input; });
    if (change === "coverage") h.sources.input.mockImplementation(async () => { const input = preview(NOW + 1000); input.teams[0].players.slice(0, 3).forEach(p => { p.priorFantasyPpg = null; p.priorGames = null; }); return input; });
    if (change === "leg") h.sources.context.mockImplementation(async () => ({ ...context(), leg: 1 }));
    if (change === "stale_capture") h.setTime(NOW + 61001);
    if (change === "revoked") h.persistence.revoked.add(USER);
    if (change === "job") auth = { kind: "weekly_job", userId: USER, auth: "legacy" };
    expect((await refreshWeek1(auth, h.runtime, h.sources)).status).not.toBe("ready");
    expect(h.create).not.toHaveBeenCalled(); expect(h.persistence.weeks.size).toBe(1);
  });
  it("uses unchanged global spending protection and retains a sealed denied attempt", async () => {
    const h = await prepared(); h.persistence.control!.state.tokens = 100000;
    expect(await refreshWeek1(identity(), h.runtime, h.sources)).toMatchObject({ status: "rate_limited", code: "global_token_budget" });
    expect(h.create).not.toHaveBeenCalled(); expect(h.persistence.weeks.size).toBe(2);
    h.persistence.control!.state.tokens = 0; // Test fixture only; service never resets counters.
    expect(await refreshWeek1(identity(), h.runtime, h.sources)).toMatchObject({ code: "refresh_sealed" });
    expect(h.create).not.toHaveBeenCalled();
  });
  it("exposes truthful free state and never generates on public reads", async () => {
    const h = await prepared(), load = () => loadAiDecidesData(h.runtime, async () => ({ ...context(), matchups: h.original.input.matchups }));
    expect((await load()).week1Refresh?.status).toBe("available");
    await refreshWeek1(identity(), h.runtime, h.sources);
    expect((await load()).week1Refresh?.status).toBe("published"); expect(h.create).toHaveBeenCalledTimes(1);
    h.runtime.week1Refresh = undefined; expect((await load()).week1Refresh).toBeUndefined();
  });
  it("rejects cross-site, query, oversize and client facts before identity; provider failure never falls back", async () => {
    const h = await prepared(); h.getSessionUser.mockClear();
    for (const request of [http({}, { origin: "https://other.invalid" }), http({}, {}, "?week=2"), http({ week: 1 }), http({ prompt: "spoof" }), http({ secret: "x".repeat(1024) })]) expect((await handleAiWeek1RefreshPost(request, TOKEN, h.runtime, h.sources)).status).toBe(400);
    expect(h.getSessionUser).not.toHaveBeenCalled();
    h.runtime.providerSession = async () => null;
    expect((await handleAiWeek1RefreshPost(http(), TOKEN, h.runtime, h.sources)).status).toBe(401);
    expect(h.getSessionUser).not.toHaveBeenCalled(); expect(h.create).not.toHaveBeenCalled();
  });
});
