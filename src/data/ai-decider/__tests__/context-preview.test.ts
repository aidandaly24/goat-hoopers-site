import { afterEach, describe, expect, it, vi } from "vitest";
import { AI_PROMPT_MAX_CHARS, AI_VISIBLE_LEAGUE_PROMPT_VERSION, type AiDecideRequest, type AiLeagueRosterInput } from "@/domain/ai-decider";
import { buildAiContextPreview, visibleRosterDecision } from "../context-preview";
import { handleAiContextPost, loadAiContextPreview } from "../context-http";
import { inputTokenReservation } from "../provider";
import { runAiDecision } from "../service";
import { AI_LIMITS, parseAiContextRequest, parseAiRequest } from "../validation";
import { harness, NOW, TOKEN, USER } from "./fixtures";

afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });
function input(size = 30, phase: AiLeagueRosterInput["phase"] = "pre"): AiLeagueRosterInput {
  return { source: "sleeper", leagueId: "1387473752807190528", capturedAt: new Date(NOW).toISOString(), season: "2026", phase, priorStatsSeason: "2025", scoringMode: "unknown", sourceUpdatedAt: null,
    cacheRevalidateSeconds: { league: 300, rosters: 300, players: 300, stats: 86400 }, availability: { players: "available", priorStats: "available", currentStats: phase === "pre" ? "preseason_not_started" : "available" }, scoring: { pts: 1, reb: 1.2 },
    teams: ["1", "2"].map((teamId, n) => ({ teamId, name: `Synthetic team ${teamId}`, starters: Array.from({ length: 10 }, (_, i) => String(1000 + n * 100 + i)), reserve: [String(1000 + n * 100 + 18)], taxi: [String(1000 + n * 100 + 19)],
      players: Array.from({ length: size }, (_, i) => ({ id: String(1000 + n * 100 + i), name: `Player ${1000 + n * 100 + i}`, age: 20 + i % 20, position: "PG", prior: { fppg: 20 + i / 10, games: 70 }, current: phase === "pre" ? null : { fppg: 25, games: 5 } })) })) };
}
function visible(value = input(), question = "  Which roster?  "): Extract<AiDecideRequest, { kind: "league" }> {
  const preview = buildAiContextPreview(value, ["1", "2"], NOW);
  return { kind: "league", prompt: `${question}\n\n${preview.text}`, choices: preview.choices, teamIds: preview.teamIds, contextDigest: preview.digest };
}
const http = (body: unknown, headers: Record<string, string> = {}, query = "") => new Request(`https://goathoopers.com/api/ai-decides/context${query}`, { method: "POST", headers: { origin: "https://goathoopers.com", "content-type": "application/json", ...headers }, body: JSON.stringify(body) });

describe("complete editable canonical roster preview", () => {
  it.each(["pre", "regular", "post"] as const)("includes all 60 players, membership and exact observed values in %s", phase => {
    const value = input(30, phase), preview = buildAiContextPreview(value, ["1", "2"], NOW);
    expect(preview.text).toBe(preview.text.trim()); expect(preview.digest).toMatch(/^[a-f0-9]{64}$/);
    expect(preview.promptVersion).toBe(AI_VISIBLE_LEAGUE_PROMPT_VERSION);
    for (const team of value.teams) for (const player of team.players) expect(preview.text).toContain(`${player.name} | ${player.id}`);
    expect(preview.text).toContain("Player 1029 | 1029"); expect(preview.text).toContain("Player 1129 | 1129");
    expect(preview.text).toContain("Starter IDs: 1000, 1001"); expect(preview.text).toContain("Reserve IDs: 1018"); expect(preview.text).toContain("Taxi IDs: 1019");
    expect(preview.text).toContain("reb=1.2"); expect(preview.text).toContain("22.9,70");
    expect(preview.text).toContain(phase === "pre" ? "preseason_not_started" : "25,5");
    expect(preview.text).toContain("Failed refreshes may serve older data");
    expect(preview.context.teams.map(t => t.rosterSize)).toEqual([30, 30]);
    const decision = visibleRosterDecision(visible(value), value, NOW, "synthetic-safety");
    expect(inputTokenReservation(decision.payload)).toBeLessThanOrEqual(AI_LIMITS.inputTokens);
  });
  it("keeps missing names/ages/positions/stats and unknown memberships explicit", () => {
    const value = input(); Object.assign(value.teams[0].players[0], { name: null, age: null, position: null, prior: null }); value.teams[0].starters = null;
    const preview = buildAiContextPreview(value, ["1", "2"], NOW);
    expect(preview.text).toContain("unknown | 1000 | unknown | unknown | unknown");
    expect(preview.text).toContain("Starter IDs: unknown"); expect(preview.context.teams[0].namedPlayers).toBe(29);
  });
  it("compares facts deterministically across retrieval timestamps, but changes digest for changed facts", () => {
    const value = input(), old = buildAiContextPreview(value, ["1", "2"], NOW); value.capturedAt = new Date(NOW - 1000).toISOString();
    const fresh = buildAiContextPreview(value, ["1", "2"], NOW);
    expect(fresh.text).toBe(old.text); expect(fresh.digest).toBe(old.digest); expect(fresh.context.hash).not.toBe(old.context.hash);
    value.teams[0].players[0].prior!.fppg = 99;
    expect(buildAiContextPreview(value, ["1", "2"], NOW).digest).not.toBe(old.digest);
  });
  it("preserves full visible prompt and original choice labels, without any hidden roster block", () => {
    const value = input(), request = visible(value); request.choices = [" SYNTHETIC TEAM 1 ", "Ｓｙｎｔｈｅｔｉｃ ｔｅａｍ ２"];
    expect(parseAiRequest(request)).toEqual(request);
    const decision = visibleRosterDecision(request, value, NOW, "synthetic-safety"), supplied = JSON.parse(decision.payload.input);
    expect(supplied).toEqual({ userRequest: request.prompt }); expect(Object.keys(supplied)).toEqual(["userRequest"]);
    expect(supplied.userRequest.split("[GOAT roster context]")).toHaveLength(2);
    expect(decision.specs[0].labels).toEqual(request.choices); expect(decision.specs[0].promptVersion).toBe(AI_VISIBLE_LEAGUE_PROMPT_VERSION);
    expect(decision.specs[0].leagueContext?.teams[0].name).toBe("Synthetic team 1");
    expect(visibleRosterDecision({ ...request, prompt: request.prompt.replace("Which roster?", "Who wins?") }, value, NOW, "x").payload.input).toContain("Who wins?");
  });
  it.each(["edited", "missing", "whitespace", "digest", "changed_source", "no_question"])("refuses invalid canonical proof: %s", change => {
    const value = input(), request = visible(value);
    if (change === "edited") request.prompt = request.prompt.replace("Player 1000", "Edited Player");
    if (change === "missing") request.prompt = "Which roster?";
    if (change === "whitespace") request.prompt += "\n";
    if (change === "digest") request.contextDigest = "0".repeat(64);
    if (change === "changed_source") value.teams[0].players[0].age = 40;
    if (change === "no_question") request.prompt = `\n\n${buildAiContextPreview(value, ["1", "2"], NOW).text}`;
    expect(() => visibleRosterDecision(request, value, NOW, "x")).toThrow("context_changed");
  });
  it("rejects oversized complete context without truncating or manufacturing facts", () => {
    const value = input(); value.teams.forEach(team => team.players.forEach(player => { player.name = "Very long canonical player identity ".repeat(2).trim(); }));
    expect(() => buildAiContextPreview(value, ["1", "2"], NOW)).toThrow("input_limit");
  });
});

describe("free preview and unchanged paid-call admission", () => {
  it("loads free without a configured provider or enabled spending gate, preserving all counters", async () => {
    const h = harness(), before = structuredClone(h.persistence.control); h.runtime.enabled = false; h.runtime.client = null;
    h.runtime.getLeagueContext = vi.fn(async () => input());
    const response = await handleAiContextPost(http({ teamIds: ["1", "2"] }), TOKEN, h.runtime);
    expect(response.status).toBe(200); expect(response.headers.get("cache-control")).toBe("no-store");
    expect((await response.json()).status).toBe("ready"); expect(h.create).not.toHaveBeenCalled(); expect(h.persistence.control).toEqual(before);
  });
  it.each([null, {}, { teamIds: ["1", "1"] }, { teamIds: ["1", "11"] }, { teamIds: ["1", "2"], prompt: "spoof" }, { teamIds: ["1", "2"], model: "other" }, { teamIds: ["1", "2"], userId: USER }, { teamIds: ["1", "2"], headers: {} }])("strictly rejects client evidence, identity and transport %#", async raw => {
    const h = harness(); h.runtime.getLeagueContext = vi.fn(async () => input());
    expect(parseAiContextRequest(raw)).toBeNull(); expect((await loadAiContextPreview(raw, TOKEN, h.runtime)).status).toBe("invalid");
    expect(h.getSessionUser).not.toHaveBeenCalled(); expect(h.runtime.getLeagueContext).not.toHaveBeenCalled();
  });
  it("blocks cross-origin/query/oversized preview requests before auth or source reads", async () => {
    const h = harness(); h.runtime.getLeagueContext = vi.fn(async () => input());
    for (const req of [http({ teamIds: ["1", "2"] }, { origin: "https://other.invalid" }), http({ teamIds: ["1", "2"] }, {}, "?url=other"), http({ teamIds: ["1", "2"], extra: "x".repeat(1024) })]) expect((await handleAiContextPost(req, TOKEN, h.runtime)).status).toBe(400);
    expect(h.getSessionUser).not.toHaveBeenCalled(); expect(h.runtime.getLeagueContext).not.toHaveBeenCalled();
  });
  it("never falls back to a legacy session when selected provider identity fails", async () => {
    const h = harness(); h.runtime.providerSession = async () => null; h.runtime.getLeagueContext = vi.fn(async () => input());
    expect((await loadAiContextPreview({ teamIds: ["1", "2"] }, TOKEN, h.runtime)).status).toBe("unauthenticated");
    expect(h.getSessionUser).not.toHaveBeenCalled(); expect(h.runtime.getLeagueContext).not.toHaveBeenCalled();
  });
  it("returns bounded unavailable on source timeout, without paid work or private error details", async () => {
    vi.useFakeTimers(); const h = harness(); h.runtime.getLeagueContext = () => new Promise(() => {});
    const pending = loadAiContextPreview({ teamIds: ["1", "2"] }, TOKEN, h.runtime);
    await vi.advanceTimersByTimeAsync(6001); expect(await pending).toMatchObject({ status: "unavailable", code: "league_context_unavailable" });
    expect(h.create).not.toHaveBeenCalled(); expect(h.persistence.control!.state.requests).toBe(0);
  });
  it("revalidates source before spend and returns verified proof for one visible model input", async () => {
    const h = harness(), value = input(), request = visible(value); h.runtime.getLeagueContext = async () => value;
    const response = await runAiDecision(request, TOKEN, h.runtime);
    expect(response.status).toBe("ready"); if (response.status !== "ready") throw new Error(response.code);
    expect(response.result.snapshot).toBeNull(); expect(response.result.promptVersion).toBe(AI_VISIBLE_LEAGUE_PROMPT_VERSION); expect(response.result.leagueContext).toBeDefined();
    expect(JSON.parse(h.create.mock.calls[0][0].input)).toEqual({ userRequest: request.prompt }); expect(h.persistence.control!.state.requests).toBe(1);
    value.teams[0].players[0].age = 40;
    expect(await runAiDecision(request, TOKEN, h.runtime)).toMatchObject({ status: "unavailable", code: "context_changed" });
    expect(h.create).toHaveBeenCalledTimes(1); expect(h.persistence.control!.state.requests).toBe(1);
  });
  it("runs edited roster text only as visible custom evidence, never loading or labelling canonical facts", async () => {
    const h = harness(), request = visible(); h.runtime.getLeagueContext = vi.fn(async () => input());
    const prompt = request.prompt.replace("Player 1000", "Edited Player"), raw = { kind: "custom", prompt, choices: request.choices };
    const response = await runAiDecision(raw, TOKEN, h.runtime);
    expect(response.status).toBe("ready"); if (response.status !== "ready") throw new Error(response.code);
    expect(response.result.leagueContext).toBeUndefined(); expect(h.runtime.getLeagueContext).not.toHaveBeenCalled();
    expect(JSON.parse(h.create.mock.calls[0][0].input)).toEqual({ userRequest: prompt });
    expect(parseAiRequest({ ...raw, contextDigest: request.contextDigest })).toBeNull();
  });
  it("keeps provider-input and global-spend controls despite larger editable text transport", async () => {
    expect(AI_LIMITS.promptChars).toBe(AI_PROMPT_MAX_CHARS); expect(AI_LIMITS.bodyBytes).toBe(32768); expect(AI_LIMITS.inputTokens).toBe(6144);
    const h = harness();
    expect(await runAiDecision({ kind: "custom", prompt: "漢".repeat(12000), choices: ["A", "B"] }, TOKEN, h.runtime)).toMatchObject({ status: "invalid", code: "input_limit" });
    expect(h.create).not.toHaveBeenCalled(); expect(h.persistence.control!.state.requests).toBe(0);
    h.runtime.getLeagueContext = async () => input(); h.persistence.control!.state.tokens = 100000;
    expect(await runAiDecision(visible(), TOKEN, h.runtime)).toMatchObject({ status: "rate_limited", code: "global_token_budget" }); expect(h.create).not.toHaveBeenCalled();
  });
});
