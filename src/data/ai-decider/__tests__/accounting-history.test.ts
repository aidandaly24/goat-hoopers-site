import { afterEach, describe, expect, it, vi } from "vitest";
import { generateWeeklyPicks, runAiDecision } from "../service";
import { loadAiDecidesData } from "../runtime";
import { AI_WEEKLY_MANIFEST, cachedWeek, currentGenerationManifest, prepareWeeklySlate, recordWeeklyOutcome, validGenerationManifest, weekHash, weekKey, weeklyDecision } from "../weekly";
import { harness, NOW, providerAnswer, providerUsage, TOKEN, weeklyInput } from "./fixtures";

afterEach(() => vi.useRealTimers());
const draft = { kind: "custom", prompt: "Which snack?", choices: ["Apple", "Pear"] };

describe("usage settlement independent of prediction validation", () => {
  it.each(["probabilities", "extra_answer", "extra_response", "model"])("charges oversized usage and kills admission even with invalid %s", async change => {
    const h = harness();
    h.create.mockImplementationOnce(async p => {
      const raw = providerAnswer(p, 40000);
      if (change === "probabilities") raw.answers[0].probabilities.pop();
      if (change === "extra_answer") Object.assign(raw.answers[0], { explanation: "invalid" });
      if (change === "extra_response") Object.assign(raw, { tools: [] });
      if (change === "model") raw.model = "invalid";
      return raw;
    });
    expect(await runAiDecision(draft, TOKEN, h.runtime)).toMatchObject({ status: "unavailable", code: "usage_overrun" });
    expect(h.persistence.control!.state.tokens).toBe(40000); expect(h.persistence.control!.enabled).toBe(false);
    expect(h.persistence.control!.state.leases).toHaveLength(0);
    expect(await runAiDecision({ ...draft, prompt: "Another" }, TOKEN, h.runtime)).toMatchObject({ status: "unavailable", code: "disabled" });
    expect(h.create).toHaveBeenCalledTimes(1);
  });
  it.each([
    undefined, null, {},
    { ...providerUsage(), input_tokens: -1, total_tokens: -1 },
    { ...providerUsage(), input_tokens: 1.5, total_tokens: 1.5 },
    { ...providerUsage(), input_tokens: Number.MAX_SAFE_INTEGER + 1, total_tokens: Number.MAX_SAFE_INTEGER + 1 },
    { ...providerUsage(), output_tokens: 1, total_tokens: 101 },
    { ...providerUsage(), total_tokens: 99 },
    { ...providerUsage(), unknown: true },
    { input_tokens: 100, output_tokens: 0, total_tokens: 100 },
    { ...providerUsage(), input_tokens_details: undefined },
    { ...providerUsage(), input_tokens_details: null },
    { ...providerUsage(), input_tokens_details: {} },
    { ...providerUsage(), input_tokens_details: { cached_tokens: -1, cache_write_tokens: 0 } },
    { ...providerUsage(), input_tokens_details: { cached_tokens: 0, cache_write_tokens: 0.5 } },
    { ...providerUsage(), input_tokens_details: { cached_tokens: 101, cache_write_tokens: 0 } },
    { ...providerUsage(), input_tokens_details: { cached_tokens: 0, cache_write_tokens: 101 } },
    { ...providerUsage(), input_tokens_details: { cached_tokens: 0, cache_write_tokens: 0, unknown: true } },
    { ...providerUsage(), output_tokens_details: undefined },
    { ...providerUsage(), output_tokens_details: null },
    { ...providerUsage(), output_tokens_details: {} },
    { ...providerUsage(), output_tokens_details: { reasoning_tokens: 1 } },
    { ...providerUsage(), output_tokens_details: { reasoning_tokens: 0, unknown: true } },
  ])("fails closed with missing/invalid usage %#, retaining its full reservation and lease", async usage => {
    const h = harness();
    h.create.mockImplementationOnce(async p => ({ ...providerAnswer(p), usage }));
    expect(await runAiDecision(draft, TOKEN, h.runtime)).toMatchObject({ status: "unavailable", code: "usage_unknown" });
    const state = h.persistence.control!.state;
    expect(state.requests).toBe(1); expect(state.tokens).toBe(state.leases[0].reserved);
    expect(state.leases[0].completed).toBe(true); expect(state.users[Object.keys(state.users)[0]].signals).toBe(1);
    expect((await runAiDecision({ ...draft, prompt: "Another" }, TOKEN, h.runtime)).status).toBe("busy");
    expect(h.create).toHaveBeenCalledTimes(1);
  });
  it("retains unknown spend after timeout, ignores late output and settles only once", async () => {
    const h = harness(); vi.useFakeTimers(); h.runtime.timeoutMs = 10;
    let resolveLate: (raw: unknown) => void = () => {};
    h.create.mockImplementationOnce(async () => new Promise(resolve => { resolveLate = resolve; }));
    const run = runAiDecision(draft, TOKEN, h.runtime);
    await vi.advanceTimersByTimeAsync(11);
    expect(await run).toMatchObject({ status: "timeout", code: "provider_timeout" });
    const settled = structuredClone(h.persistence.control);
    resolveLate(providerAnswer(h.create.mock.calls[0][0], 40000));
    await Promise.resolve();
    const lease = settled!.state.leases[0];
    await h.runtime.store!.finish(lease.id, null, true, true, NOW);
    expect(h.persistence.control).toEqual(settled);
    expect(settled!.state.tokens).toBe(lease.reserved); expect(lease.completed).toBe(true);
    expect((await runAiDecision({ ...draft, prompt: "Another" }, TOKEN, h.runtime)).status).toBe("busy");
    expect(h.create).toHaveBeenCalledTimes(1);
  });
  it("withholds a decoded result if completion CAS cannot be committed", async () => {
    const h = harness(), compare = h.persistence.compareControl.bind(h.persistence);
    vi.spyOn(h.persistence, "compareControl").mockImplementation(async (...args) => args[2] ? compare(...args) : false);
    expect(await runAiDecision(draft, TOKEN, h.runtime)).toMatchObject({ status: "unavailable", code: "state_unavailable" });
    expect(h.create).toHaveBeenCalledTimes(1); expect(h.persistence.control!.state.leases).toHaveLength(1);
    expect((await runAiDecision({ ...draft, prompt: "Another" }, TOKEN, h.runtime)).status).toBe("busy");
  });
});

describe("immutable weekly history and publication readiness", () => {
  it.each(["preseason", "unknown", "game_pick", "no_eligible"])("does not seal unsupported/empty %s input; later supported input generates once", async change => {
    const h = harness(), input = weeklyInput(), unsupported = structuredClone(input);
    if (change === "preseason") unsupported.phase = "pre";
    else if (change === "no_eligible") unsupported.teams.forEach(t => { t.players[0].priorFantasyPpg = null; });
    else unsupported.scoringMode = change as "unknown" | "game_pick";
    expect(await generateWeeklyPicks(unsupported, TOKEN, h.runtime)).toMatchObject({ status: "unavailable", code: "weekly_not_ready" });
    expect(h.persistence.weeks.size).toBe(0); expect(h.persistence.control!.state.requests).toBe(0);
    expect(h.create).not.toHaveBeenCalled();
    expect((await generateWeeklyPicks(input, TOKEN, h.runtime)).status).toBe("ready");
    expect((await generateWeeklyPicks(input, TOKEN, h.runtime)).status).toBe("ready");
    expect(h.persistence.weeks.size).toBe(1); expect(h.create).toHaveBeenCalledTimes(1);
  });
  it("keeps an intentionally partial eligible slate immutable", async () => {
    const h = harness(), input = weeklyInput(); input.teams[1].starters[0] = "0";
    const partial = await generateWeeklyPicks(input, TOKEN, h.runtime);
    if (!("matchups" in partial)) throw new Error("fixture");
    expect(partial.matchups.filter(m => m.status === "ready")).toHaveLength(4);
    const frozen = structuredClone(h.persistence.weeks.get(weekKey(input)));
    expect(await generateWeeklyPicks(weeklyInput(), TOKEN, h.runtime)).toMatchObject({ code: "snapshot_conflict" });
    expect(h.persistence.weeks.get(weekKey(input))).toEqual(frozen); expect(h.create).toHaveBeenCalledTimes(1);
  });
  it("survives an actual current model/prompt policy change without mutating prior history", async () => {
    const h = harness(), input = weeklyInput(); await generateWeeklyPicks(input, TOKEN, h.runtime);
    const record = (await h.persistence.getWeek(weekKey(input)))!, before = structuredClone(record);
    vi.resetModules();
    vi.doMock("@/domain/ai-decider", async importOriginal => ({
      ...await importOriginal<typeof import("@/domain/ai-decider")>(),
      AI_DECISION_MODEL: "hypothetical-future-policy-test",
      AI_WEEKLY_PROMPT_VERSION: "goat-weekly-lock-in-future-test",
    }));
    try {
      const changedPolicy = await import("../weekly");
      expect(changedPolicy.currentGenerationManifest(record.manifest)).toBe(false);
      expect(changedPolicy.weekHash(input)).not.toBe(record.hash);
      expect(changedPolicy.cachedWeek(record, NOW)).toEqual(record.result);
      const outcome = { matchupId: "1", recordedAt: "2026-10-27T01:00:00Z", final: true as const, teamPoints: [{ teamId: "6", points: 123 }, { teamId: "10", points: 122 }] };
      const later = Date.parse(outcome.recordedAt);
      expect(await changedPolicy.recordWeeklyOutcome(h.persistence, record.key, outcome, later)).toBe(true);
      expect(await changedPolicy.recordWeeklyOutcome(h.persistence, record.key, outcome, later)).toBe(false);
      expect(await h.persistence.getWeek(record.key)).toEqual(before);
      expect(h.create).toHaveBeenCalledTimes(1);
    } finally { vi.doUnmock("@/domain/ai-decider"); vi.resetModules(); }
  });
  it("reads prior model/prompt history and records idempotent final outcomes after policy changes", async () => {
    const h = harness(), input = weeklyInput(); await generateWeeklyPicks(input, TOKEN, h.runtime);
    const record = (await h.persistence.getWeek(weekKey(input)))!;
    // A genuine older generation has its own manifest, hash and result metadata.
    record.manifest = { ...AI_WEEKLY_MANIFEST, model: "gpt-6-luna-prior-beta", promptVersion: "goat-weekly-lock-in-prior", instructions: "Earlier frozen Lock-In comparison instructions." };
    record.hash = weekHash(input, record.manifest);
    record.slate = prepareWeeklySlate(input, NOW, record.manifest);
    record.result!.snapshot = structuredClone(record.slate.snapshot);
    for (const pair of record.result!.matchups) {
      pair.result!.model = record.manifest.model; pair.result!.promptVersion = record.manifest.promptVersion;
      pair.result!.snapshot = structuredClone(record.slate.snapshot);
    }
    expect(currentGenerationManifest(record.manifest)).toBe(false);
    expect(record.hash).not.toBe(weekHash(input));
    h.persistence.weeks.set(record.key, structuredClone(record)); // Test-only historical fixture.
    const before = structuredClone(record), context = async () => ({ leagueId: input.leagueId, season: input.season, week: input.week, matchups: input.matchups, phase: input.phase });
    const read = await loadAiDecidesData(h.runtime, context);
    expect(read.weekly.status).toBe("ready"); expect(read.weekly.snapshot?.model).toBe(record.manifest.model);
    expect(read.weekly.matchups[0].result?.promptVersion).toBe(record.manifest.promptVersion);
    expect(await runAiDecision({ kind: "matchup", teamIds: ["6", "10"] }, TOKEN, h.runtime)).toMatchObject({ status: "unavailable", code: "weekly_policy" });
    expect(await generateWeeklyPicks(input, TOKEN, h.runtime)).toMatchObject({ code: "snapshot_conflict" });
    const outcome = { matchupId: "1", recordedAt: "2026-10-27T01:00:00Z", final: true as const, teamPoints: [{ teamId: "6", points: 123.456 }, { teamId: "10", points: 122.789 }] };
    const later = Date.parse(outcome.recordedAt);
    expect(cachedWeek(record, later).status).toBe("stale");
    expect(await recordWeeklyOutcome(h.persistence, record.key, outcome, later)).toBe(true);
    expect(await recordWeeklyOutcome(h.persistence, record.key, outcome, later)).toBe(false);
    const changedOutcome = { ...outcome, teamPoints: [{ teamId: "6", points: 9999 }, { teamId: "10", points: 8888 }] };
    expect(await recordWeeklyOutcome(h.persistence, record.key, changedOutcome, later)).toBe(false);
    expect(h.persistence.outcomes.get(`${record.key}:1`)).toEqual(outcome);
    expect(await h.persistence.getWeek(record.key)).toEqual(before);
    expect(weeklyDecision(input, prepareWeeklySlate(input, NOW), "f".repeat(64)).payload.input).not.toMatch(/outcome|123\.456|122\.789|9999/);
    expect(h.create).toHaveBeenCalledTimes(1);
    for (const change of ["manifest", "input", "result"]) {
      const corrupt = structuredClone(record);
      if (change === "manifest") corrupt.manifest.instructions += "Altered without a new hash";
      if (change === "input") corrupt.input.teams[0].players[0].priorFantasyPpg = 99;
      if (change === "result") corrupt.result!.matchups[0].result!.promptVersion = AI_WEEKLY_MANIFEST.promptVersion;
      expect(() => cachedWeek(corrupt, later)).toThrow("weekly_cache");
    }
    expect(validGenerationManifest({ ...record.manifest, outcomes: [outcome] })).toBe(false);
  });
});
