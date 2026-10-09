import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { AI_WEEKLY_PROMPT_VERSION } from "@/domain/ai-decider";
import { generateWeeklyPicks, resolveAiIdentity, runAiDecision } from "../service";
import { loadAiDecidesData } from "../runtime";
import { buildAiWeeklyInput } from "../inputs";
import { cachedWeek, prepareWeeklySlate, recordWeeklyOutcome, validWeeklyInput, weekHash, weekKey, weeklyDecision } from "../weekly";
import { harness, NOW, providerAnswer, TOKEN, weeklyInput } from "./fixtures";
import type { RawLeague, RawRoster } from "../../sleeper";

afterEach(() => vi.useRealTimers());
const draft = { kind: "custom", prompt: "Which snack?", choices: ["Apple", "Pear"] };

describe("authenticated paid entry point", () => {
  it("uses a hashed session lookup, and rejects client identity/expired/malformed/unknown sessions", async () => {
    const h = harness();
    expect((await resolveAiIdentity(TOKEN, h.runtime))?.userId).toBe("00000000-0000-4000-8000-000000000001");
    expect(h.getSessionUser.mock.calls[0][0]).not.toBe(TOKEN);
    for (const token of [undefined, "spoof", "b".repeat(65)]) expect(await resolveAiIdentity(token, h.runtime)).toBeNull();
    h.getSessionUser.mockResolvedValueOnce(null as never);
    expect((await runAiDecision(draft, TOKEN, h.runtime)).status).toBe("unauthenticated");
    h.getSessionUser.mockResolvedValueOnce({ user: { id: "spoof", teamId: "1", displayName: "x", createdAt: new Date(NOW) }, expiresAt: new Date(NOW + 1) });
    expect((await runAiDecision(draft, TOKEN, h.runtime)).status).toBe("unauthenticated");
    h.getSessionUser.mockResolvedValueOnce({ user: { id: "00000000-0000-4000-8000-000000000001", teamId: "1", displayName: "x", createdAt: new Date(NOW) }, expiresAt: new Date(NOW) });
    expect((await runAiDecision(draft, TOKEN, h.runtime)).status).toBe("unauthenticated");
    expect((await runAiDecision({ ...draft, userId: "spoof" }, TOKEN, h.runtime)).status).toBe("invalid");
    expect(h.create).not.toHaveBeenCalled();
  });
  it("does no paid work for anonymous, missing provider, switched-off or unavailable state", async () => {
    const h = harness();
    expect((await runAiDecision(draft, undefined, h.runtime)).status).toBe("unauthenticated");
    h.runtime.client = null; expect((await runAiDecision(draft, TOKEN, h.runtime)).status).toBe("unavailable");
    h.runtime.client = { create: h.create }; h.runtime.enabled = false; expect((await runAiDecision(draft, TOKEN, h.runtime)).status).toBe("unavailable");
    h.runtime.enabled = true; h.persistence.control = null; expect((await runAiDecision(draft, TOKEN, h.runtime)).status).toBe("unavailable");
    expect(h.create).not.toHaveBeenCalled();
  });
  it("fails closed if identity is revoked at the atomic spending boundary", async () => {
    const h = harness(); h.persistence.revoked.add("00000000-0000-4000-8000-000000000001");
    expect((await runAiDecision(draft, TOKEN, h.runtime)).status).toBe("unavailable");
    expect(h.create).not.toHaveBeenCalled();
  });
  it("counts refusal/error/timeouts and never exposes raw provider errors", async () => {
    const h = harness();
    h.create.mockImplementationOnce(async p => ({ ...providerAnswer(p), answers: [{ type: "refusal", name: "decision" }] }));
    expect((await runAiDecision(draft, TOKEN, h.runtime)).status).toBe("refused");
    h.create.mockRejectedValueOnce(new Error("synthetic-credential-marker full prompt"));
    const error = await runAiDecision({ ...draft, prompt: "Different" }, TOKEN, h.runtime);
    expect(error.status).toBe("unavailable"); expect(JSON.stringify(error)).not.toContain("synthetic-credential-marker");
    vi.useFakeTimers(); h.runtime.timeoutMs = 10;
    h.create.mockImplementationOnce(async () => new Promise(() => {}));
    const run = runAiDecision({ ...draft, prompt: "Third" }, TOKEN, h.runtime);
    await vi.advanceTimersByTimeAsync(11);
    expect((await run).status).toBe("timeout");
    expect(h.persistence.control!.state.requests).toBe(3); expect(h.persistence.control!.state.leases).toHaveLength(1);
  });
  it("does not return a paid result if finishing the budget state fails", async () => {
    const h = harness(); const finish = vi.spyOn(h.runtime.store!, "finish").mockRejectedValue(new Error("private database detail"));
    const result = await runAiDecision(draft, TOKEN, h.runtime);
    expect(result.status).toBe("unavailable"); expect(JSON.stringify(result)).not.toContain("private database detail");
    expect(finish).toHaveBeenCalled(); expect(h.create).toHaveBeenCalledTimes(1);
  });
});

describe("weekly facts, immutability and cached reads", () => {
  it("deduplicates overlapping generation globally across two validated users", async () => {
    const h = harness(), input = weeklyInput();
    const other = { ...h.runtime, sessions: { getSessionUser: async () => ({ user: { id: "00000000-0000-4000-8000-000000000002", teamId: "2", displayName: "Synthetic", createdAt: new Date(NOW) }, expiresAt: new Date(NOW + 86400000) }) } };
    const results = await Promise.all([generateWeeklyPicks(input, TOKEN, h.runtime), generateWeeklyPicks(input, TOKEN, other)]);
    expect(results.filter(r => r.status === "ready")).toHaveLength(1);
    expect(results.filter(r => r.status === "busy")).toHaveLength(1);
    expect(h.create).toHaveBeenCalledTimes(1);
  });
  it("generates all five choices once with a versioned prompt and full paired probabilities", async () => {
    const h = harness(), input = weeklyInput();
    const result = await generateWeeklyPicks(input, TOKEN, h.runtime);
    if (!("matchups" in result)) throw new Error(JSON.stringify(result));
    expect(result.status).toBe("ready"); expect(result.matchups).toHaveLength(5);
    expect(result.matchups[0].result?.probabilities).toEqual([{ choice: "6", probability: 0.35 }, { choice: "10", probability: 0.65 }]);
    expect(result.matchups.every(m => m.result?.promptVersion === AI_WEEKLY_PROMPT_VERSION)).toBe(true);
    expect(result.snapshot?.hash).toBe(weekHash(input)); expect(result.snapshot?.statsSeason).toBe("2025");
    expect(h.create.mock.calls[0][0].questions).toHaveLength(5);
    const before = JSON.stringify(h.persistence.weeks);
    const again = await generateWeeklyPicks(input, TOKEN, h.runtime);
    expect(again).toEqual(result); expect(h.create).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(h.persistence.weeks)).toBe(before);
    const frozen = await h.persistence.getWeek(weekKey(input));
    expect(frozen!.input).toEqual(input);
  });
  it("refuses snapshot replacement, preserves values, and records outcomes separately after finality", async () => {
    const h = harness(), input = weeklyInput(); await generateWeeklyPicks(input, TOKEN, h.runtime);
    const before = structuredClone(h.persistence.weeks.get(weekKey(input))!);
    input.teams[0].players[0].priorFantasyPpg = 99;
    const conflict = await generateWeeklyPicks(input, TOKEN, h.runtime);
    expect(conflict).toMatchObject({ status: "unavailable", code: "snapshot_conflict" });
    expect(h.persistence.weeks.get(weekKey(input))).toEqual(before);
    const outcome = { matchupId: "1", recordedAt: "2026-10-27T01:00:00Z", final: true as const, teamPoints: [{ teamId: "6", points: 123 }, { teamId: "10", points: 122 }] };
    await expect(recordWeeklyOutcome(h.persistence, weekKey(input), outcome, NOW)).rejects.toThrow("weekly_outcome");
    const later = Date.parse(outcome.recordedAt);
    expect(await recordWeeklyOutcome(h.persistence, weekKey(input), outcome, later)).toBe(true);
    expect(await recordWeeklyOutcome(h.persistence, weekKey(input), outcome, later)).toBe(false);
    expect(h.persistence.weeks.get(weekKey(input))).toEqual(before);
    expect(h.persistence.outcomes.size).toBe(1);
  });
  it.each(["preseason", "unknown_mode", "game_pick", "stats_current_season", "late_source", "late_capture", "bad_slots", "missing_scoring", "missing_starter", "reserve", "taxi", "missing_stats", "unknown_eligibility"])("labels unavailable inputs honestly: %s", change => {
    const input = weeklyInput();
    if (change === "preseason") input.phase = "pre";
    if (change === "unknown_mode") input.scoringMode = "unknown";
    if (change === "game_pick") input.scoringMode = "game_pick";
    if (change === "stats_current_season") input.statsSeason = "2026";
    if (change === "late_source") input.statsAvailableAt = input.startsAt;
    if (change === "late_capture") input.capturedAt = input.startsAt;
    if (change === "bad_slots") input.starterSlots = [];
    if (change === "missing_scoring") input.scoring = {};
    if (change === "missing_starter") input.teams[1].starters.splice(0, 5, "0", "0", "0", "0", "0");
    if (change === "reserve") input.teams[1].reserve = [input.teams[1].starters[0]];
    if (change === "taxi") input.teams[1].taxi = [input.teams[1].starters[0]];
    if (change === "missing_stats") input.teams[1].players[0].priorFantasyPpg = null;
    if (change === "unknown_eligibility") input.teams[1].eligibilityKnown = false;
    const slate = prepareWeeklySlate(input, NOW);
    expect(slate.status).toBe("unavailable");
    const decision = weeklyDecision(input, slate, "f".repeat(64));
    expect(decision.specs).toHaveLength(["missing_starter", "reserve", "taxi", "missing_stats", "unknown_eligibility"].includes(change) ? 4 : 0);
  });
  it("rejects outcome/transport fields and future leakage in the snapshot schema", () => {
    expect(validWeeklyInput({ ...weeklyInput(), outcomes: [{ winner: "1" }] })).toBe(false);
    const input = weeklyInput(); (input.teams[0].players[0] as unknown as Record<string, unknown>).futureScore = 100;
    expect(validWeeklyInput(input)).toBe(false);
  });
  it("keeps baseline values separate and does not multiply PPG by games", () => {
    const input = weeklyInput(), slate = prepareWeeklySlate(input, NOW);
    expect(slate.matchups[0].baseline?.teamValues).toEqual([{ teamId: "6", value: 250 }, { teamId: "10", value: 290 }]);
    expect(slate.matchups[0].baseline?.label).toContain("no game-count adjustment");
    expect(slate.matchups[0].result).toBeNull();
  });
  it("reads cached results without provider work and labels stale/invalid snapshots", async () => {
    const h = harness(), input = weeklyInput(); await generateWeeklyPicks(input, TOKEN, h.runtime);
    const calls = h.create.mock.calls.length;
    const context = async () => ({ leagueId: input.leagueId, season: input.season, week: input.week, matchups: input.matchups, phase: input.phase });
    expect((await loadAiDecidesData(h.runtime, context)).weekly.status).toBe("ready");
    expect(h.create).toHaveBeenCalledTimes(calls);
    h.setTime(Date.parse(input.endsAt)); expect((await loadAiDecidesData(h.runtime, context)).weekly.status).toBe("stale");
    const record = h.persistence.weeks.get(weekKey(input))!;
    record.hash = "0".repeat(64); expect(() => cachedWeek(record, NOW)).toThrow("weekly_cache");
  });
  it("refuses late generation and interactive stale/missing matchups", async () => {
    const h = harness(), input = weeklyInput();
    expect((await runAiDecision({ kind: "matchup", teamIds: ["6", "10"] }, TOKEN, h.runtime)).status).toBe("unavailable");
    await generateWeeklyPicks(input, TOKEN, h.runtime);
    const count = h.create.mock.calls.length;
    h.setTime(Date.parse(input.startsAt));
    expect(await runAiDecision({ kind: "matchup", teamIds: ["6", "10"] }, TOKEN, h.runtime)).toMatchObject({ status: "unavailable", code: "weekly_closed" });
    expect(await generateWeeklyPicks(input, TOKEN, h.runtime)).toMatchObject({ status: "unavailable", code: "weekly_closed" });
    expect(h.create).toHaveBeenCalledTimes(count);
  });
  it("compares any two selected teams using only those frozen lineups", async () => {
    const h = harness(), input = weeklyInput(); await generateWeeklyPicks(input, TOKEN, h.runtime);
    const result = await runAiDecision({ kind: "matchup", teamIds: ["1", "2"] }, TOKEN, h.runtime);
    expect(result.status).toBe("ready");
    if (result.status !== "ready") throw new Error("fixture");
    expect(result.result.probabilities.map(p => p.choice)).toEqual(["1", "2"]);
    expect(result.result.evidence.at(-1)).toContain("Hypothetical");
    const payload = h.create.mock.calls[1][0];
    expect(JSON.parse(payload.input).snapshot.teams.map((t: { teamId: string }) => t.teamId)).toEqual(["1", "2"]);
    expect(result.result.snapshot?.hash).toBe(weekHash(input));
  });
  it("rejects altered prompt versions, baseline facts or cached probabilities", async () => {
    const h = harness(), input = weeklyInput(); await generateWeeklyPicks(input, TOKEN, h.runtime);
    const record = (await h.persistence.getWeek(weekKey(input)))!;
    for (const change of ["prompt", "baseline", "probability"]) {
      const altered = structuredClone(record);
      if (change === "prompt") altered.result!.matchups[0].result!.promptVersion = "older-version";
      if (change === "baseline") altered.result!.matchups[0].baseline!.teamValues[0].value = 999;
      if (change === "probability") altered.result!.matchups[0].result!.probabilities[0].probability = -1;
      expect(() => cachedWeek(altered, NOW)).toThrow("weekly_cache");
    }
  });
  it("projects scoring from owned eligible starters and discards observed matchup points", () => {
    const input = weeklyInput();
    const league: RawLeague = { name: "Synthetic league", season: "2026", status: "in_season", total_rosters: 10, settings: { playoff_teams: 6, playoff_week_start: 20, divisions: 0 }, roster_positions: input.starterSlots, scoring_settings: { pts: 0.5 } };
    const rosters: RawRoster[] = input.teams.map(t => ({ roster_id: Number(t.teamId), owner_id: "synthetic", settings: { wins: 0, losses: 0, ties: 0, fpts: 0, fpts_decimal: 0, fpts_against: 0, fpts_against_decimal: 0 }, players: t.starters, reserve: [], taxi: [] }));
    const matchups = input.matchups.flatMap(m => m.teamIds.map(id => ({ roster_id: Number(id), matchup_id: Number(m.matchupId), points: 9999, starters: input.teams.find(t => t.teamId === id)!.starters })));
    const stats = Object.fromEntries(input.teams.flatMap(t => t.starters.map(id => [id, { pts: 2000, gp: 50 }])));
    const result = buildAiWeeklyInput(input, league, rosters, matchups, stats);
    expect(result.teams[0].players[0].priorFantasyPpg).toBe(20);
    expect(JSON.stringify(result)).not.toContain("9999");
    rosters[0].players = [];
    expect(buildAiWeeklyInput(input, league, rosters, matchups, stats).teams[0].players[0].priorFantasyPpg).toBeNull();
  });
});

describe("server-only credentials and reviewed migration boundaries", () => {
  it("keeps client contract independent and poisons concrete provider/store/runtime imports", () => {
    const root = resolve(process.cwd(), "src");
    const contract = readFileSync(resolve(root, "domain/ai-decider.ts"), "utf8");
    expect(contract).not.toMatch(/process\.env|OPENAI_API_KEY|Authorization|\/data\//);
    for (const name of ["provider", "store", "service", "runtime", "http", "weekly"]) expect(readFileSync(resolve(root, `data/ai-decider/${name}.ts`), "utf8")).toContain('import "server-only";');
    const walk = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(resolve(dir, e.name)) : /\.tsx?$/.test(e.name) ? [resolve(dir, e.name)] : []);
    for (const path of walk(root)) {
      const source = readFileSync(path, "utf8");
      if (/^[\s\S]*?["']use client["'];/m.test(source) && !path.includes(".test.")) expect(source).not.toMatch(/OPENAI_API_KEY|data\/ai-decider\/(?:runtime|provider|store|service)/);
    }
  });
  it("starts migration disabled, protects immutable records, and is never applied by runtime", () => {
    const migration = readFileSync(resolve(process.cwd(), "migrations/ai-decider.sql"), "utf8");
    expect(migration).toContain("DEFAULT false"); expect(migration).toContain("BEFORE UPDATE OR DELETE");
    expect(migration).not.toMatch(/stock_snapshots|price_history|player_stat_cache/);
    const runtime = readFileSync(resolve(process.cwd(), "src/data/ai-decider/runtime.ts"), "utf8");
    expect(runtime).not.toMatch(/CREATE TABLE|migrations\/|drizzle-kit/);
  });
});
