import { describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
import type { AiForecastRevision, AiForecastSlotState } from "@/domain/ai-decider";
import { AI_FORECAST_PROMPT_VERSION } from "@/domain/ai-decider";
import { buildForecastRevision, classifyForecastStarter, computeForecastTeamLine, validForecastInput, validForecastRevision, type AiForecastInput, type AiForecastStarterEvidence } from "../forecast";
import { handleAiForecastCron, handleAiForecastPost, loadAiForecastState, refreshForecast, type AiForecastSources } from "../forecast-service";
import { canonicalJson, GOAT_LEAGUE_ID } from "../weekly";
import { harness, identity, NOW, TOKEN, USER } from "./fixtures";

const OBS = "2026-10-28T14:55:00.000Z";
const games = (...points: number[]) => points.map((p, i) => ({ gameId: String(9001 + i), points: p }));
const starter = (playerId: string, over: Partial<AiForecastStarterEvidence> = {}): AiForecastStarterEvidence => ({
  playerId, countedPoints: 0, playedGames: [], rejectedAppearance: false,
  liveGameInProgress: false, gamesRemaining: 2, projectionPpg: 20, projectionBasis: "current", ...over,
});
const slot = (playerId: string, state: AiForecastSlotState["state"], over: Partial<AiForecastSlotState> = {}): AiForecastSlotState => ({
  playerId, state, gameId: null, countedPoints: null, basis: state === "unknown" ? "unavailable" : "exact",
  source: "sleeper-matchups+espn-box-scores+sleeper-scores", observedAt: OBS, ...over,
});

function forecastInput(week = 2): AiForecastInput {
  const teams = Array.from({ length: 10 }, (_, n) => ({
    rosterId: String(n + 1), officialPoints: 0,
    starters: [0, 1, 2].map(i => starter(String(3000 + n * 10 + i))),
  }));
  // Team 1 has a completed appearance, so the week is underway.
  teams[0].starters[0] = starter("3000", { countedPoints: 25, playedGames: games(25) });
  teams[0].officialPoints = 25;
  return {
    leagueId: GOAT_LEAGUE_ID, season: "2026", week, capturedAt: OBS,
    scoring: { pts: 0.5 },
    matchups: [["1", "2"], ["3", "4"], ["5", "6"], ["7", "8"], ["9", "10"]].map((p, i) => ({ matchupId: String(i + 1), teamIds: p as [string, string] })),
    teams,
    freshness: [
      { source: "sleeper-matchups", observedAt: OBS },
      { source: "espn-box-scores", observedAt: "2026-10-28T14:56:00.000Z" },
    ],
  };
}
const context = (week = 2) => ({ leagueId: GOAT_LEAGUE_ID, season: "2026", phase: "regular" as const, leg: week, week, statsSeason: "2025" });
function forecastHarness(input: AiForecastInput = forecastInput()) {
  const h = harness();
  const sources: AiForecastSources = { context: vi.fn(async () => context(input.week)), input: vi.fn(async () => structuredClone(input)) };
  return { ...h, sources };
}
const KEY = `${GOAT_LEAGUE_ID}:2026:2`;
const KEY3 = `${GOAT_LEAGUE_ID}:2026:3`;

describe("starter lock classification", () => {
  it("directed: an already-locked player with future games remaining is locked, with the counted game identified", () => {
    expect(classifyForecastStarter(starter("1", { countedPoints: 30, playedGames: games(30, 10), gamesRemaining: 2 })))
      .toEqual({ state: "locked", banked: 30, gameId: "9001", basis: "exact" });
  });
  it("distinguishes final (no lock, no games remaining) from a lock that happens to end the week", () => {
    // Counted game IS his latest played game and nothing remains: determinate final, not a lock.
    expect(classifyForecastStarter(starter("1", { countedPoints: 10, playedGames: games(30, 10), gamesRemaining: 0 })))
      .toEqual({ state: "final", banked: 10, gameId: "9002", basis: "exact" });
    // Counted game is an EARLIER game despite a later played one: explicit lock evidence, even at week end.
    expect(classifyForecastStarter(starter("1", { countedPoints: 30, playedGames: games(30, 10), gamesRemaining: 0 })))
      .toEqual({ state: "locked", banked: 30, gameId: "9001", basis: "exact" });
  });
  it("marks band identifications estimated, never exact: the un-itemised tf/ff gap is 0, 2 or 4 only", () => {
    expect(classifyForecastStarter(starter("1", { countedPoints: 30, playedGames: games(34), gamesRemaining: 0 })))
      .toEqual({ state: "final", banked: 30, gameId: "9001", basis: "estimated" });
    expect(classifyForecastStarter(starter("1", { countedPoints: 30, playedGames: games(34, 10), gamesRemaining: 1 })))
      .toEqual({ state: "locked", banked: 30, gameId: "9001", basis: "estimated" });
    expect(classifyForecastStarter(starter("1", { countedPoints: 30, playedGames: games(31), gamesRemaining: 0 })).state).toBe("unknown");
  });
  it("keeps a starter with no played game provably open, and final once no games remain", () => {
    expect(classifyForecastStarter(starter("1", { countedPoints: 0, playedGames: [], gamesRemaining: 3 }))).toEqual({ state: "open" });
    expect(classifyForecastStarter(starter("1", { countedPoints: 0, playedGames: [], gamesRemaining: 0 })))
      .toEqual({ state: "final", banked: 0, gameId: null, basis: "exact" });
  });
  it("fails closed to unknown when the counted game is the latest played game and games remain: a lock on it is indistinguishable from an unlocked display", () => {
    expect(classifyForecastStarter(starter("1", { countedPoints: 10, playedGames: games(30, 10), gamesRemaining: 1 })).state).toBe("unknown");
    expect(classifyForecastStarter(starter("1", { countedPoints: 25, playedGames: games(25), gamesRemaining: 2 })).state).toBe("unknown");
    // At week end the same evidence is determinate either way: final.
    expect(classifyForecastStarter(starter("1", { countedPoints: 10, playedGames: games(30, 10), gamesRemaining: 0 })))
      .toEqual({ state: "final", banked: 10, gameId: "9002", basis: "exact" });
  });
  it("directed straddle: counted explainable by an earlier gap-0 game AND by the latest game inside the foul band is unknown, never a banked lock", () => {
    expect(classifyForecastStarter(starter("1", { countedPoints: 30, playedGames: games(30, 32), gamesRemaining: 2 })).state).toBe("unknown");
    expect(classifyForecastStarter(starter("1", { countedPoints: 30, playedGames: games(30, 32), gamesRemaining: 0 })).state).toBe("unknown");
    expect(classifyForecastStarter(starter("1", { countedPoints: 30, playedGames: games(30, 34), gamesRemaining: 1 })).state).toBe("unknown");
  });
  it("directed straddle, mirrored: counted explainable by the latest gap-0 game AND by an earlier game inside the foul band is unknown", () => {
    expect(classifyForecastStarter(starter("1", { countedPoints: 30, playedGames: games(32, 30), gamesRemaining: 2 })).state).toBe("unknown");
    expect(classifyForecastStarter(starter("1", { countedPoints: 30, playedGames: games(34, 30), gamesRemaining: 0 })).state).toBe("unknown");
  });
  it("fails closed when several earlier games can each explain the counted value: the counted game's identity and basis are unproven", () => {
    expect(classifyForecastStarter(starter("1", { countedPoints: 30, playedGames: games(30, 32, 10), gamesRemaining: 1 })).state).toBe("unknown");
  });
  it.each([
    ["rejected box score", { rejectedAppearance: true }],
    ["live game in progress", { liveGameInProgress: true, countedPoints: 10, playedGames: games(10) }],
    ["missing schedule evidence", { gamesRemaining: null, countedPoints: 10, playedGames: games(10) }],
    ["missing counted points", { countedPoints: null, playedGames: games(10) }],
    ["counted points matching no played game", { countedPoints: 17, playedGames: games(10), gamesRemaining: 0 }],
    ["counted points without a played game", { countedPoints: 12, playedGames: [] }],
  ])("fails closed to unknown on %s", (_label, over) => {
    expect(classifyForecastStarter(starter("1", over as Partial<AiForecastStarterEvidence>)).state).toBe("unknown");
  });
});

describe("locked/final/projected separation", () => {
  const teamWith = (starters: AiForecastStarterEvidence[], officialPoints: number) => ({ rosterId: "1", officialPoints, starters });
  it("never double-counts: locked, final and projected slot sets are disjoint, and a locked slot projects zero", () => {
    const line = computeForecastTeamLine(teamWith([
      starter("1", { countedPoints: 30, playedGames: games(30, 10), gamesRemaining: 1, projectionPpg: 99 }), // locked; his PPG must NOT be projected
      starter("2", { countedPoints: 12, playedGames: games(12), gamesRemaining: 0, projectionPpg: 99 }),     // final
      starter("3", { countedPoints: 0, playedGames: [], gamesRemaining: 2, projectionPpg: 20 }),             // open
    ], 42), OBS);
    expect(line.lockedPoints).toEqual({ value: 30, basis: "exact" });
    expect(line.finalPoints).toEqual({ value: 12, basis: "exact" });
    expect(line.projectedRemainingPoints).toBe(20);
    expect(line.totalPoints).toBe(62);
    expect(line.slots.map(s => s.state)).toEqual(["locked", "final", "open"]);
    expect(line.slots[0]).toEqual(slot("1", "locked", { gameId: "9001", countedPoints: 30 }));
  });
  it("directed: no remaining games resolves the week — a verified zero lock set is 0, not null, and totals are determinate", () => {
    const line = computeForecastTeamLine(teamWith([
      starter("1", { countedPoints: 30, playedGames: games(30), gamesRemaining: 0 }),
      starter("2", { countedPoints: 12, playedGames: games(12), gamesRemaining: 0 }),
    ], 42), OBS);
    expect(line.lockedPoints).toEqual({ value: 0, basis: "exact" }); // lock coverage proven, no locks: known zero
    expect(line.finalPoints).toEqual({ value: 42, basis: "exact" });
    expect(line.projectedRemainingPoints).toBe(0);
    expect(line.totalPoints).toBe(42);
  });
  it("propagates the weakest basis: a band-identified lock makes locked points estimated", () => {
    const line = computeForecastTeamLine(teamWith([
      starter("1", { countedPoints: 30, playedGames: games(34, 10), gamesRemaining: 1 }),
    ], 30), OBS);
    expect(line.lockedPoints).toEqual({ value: 30, basis: "estimated" });
  });
  it("directed: partial lock evidence nulls the aggregates but keeps the proven slots' provenance", () => {
    const line = computeForecastTeamLine(teamWith([
      starter("1", { countedPoints: 30, playedGames: games(30, 10), gamesRemaining: 1 }),              // proven lock
      starter("2", { countedPoints: 10, playedGames: games(10), gamesRemaining: 1, rejectedAppearance: true }), // unproven
    ], 40), OBS);
    expect(line.lockedPoints).toBeNull(); expect(line.finalPoints).toBeNull();
    expect(line.projectedRemainingPoints).toBeNull(); expect(line.totalPoints).toBeNull();
    expect(line.slots[0]).toEqual(slot("1", "locked", { gameId: "9001", countedPoints: 30 }));
    expect(line.slots[1]).toEqual(slot("2", "unknown"));
  });
  it("keeps counted buckets known while a missing projection nulls only projected and total", () => {
    const line = computeForecastTeamLine(teamWith([
      starter("1", { countedPoints: 30, playedGames: games(30), gamesRemaining: 0 }),
      starter("2", { countedPoints: 0, playedGames: [], gamesRemaining: 1, projectionPpg: null, projectionBasis: null }),
    ], 30), OBS);
    expect(line.lockedPoints).toEqual({ value: 0, basis: "exact" });
    expect(line.finalPoints).toEqual({ value: 30, basis: "exact" });
    expect(line.projectedRemainingPoints).toBeNull();
    expect(line.totalPoints).toBeNull();
  });
  it("nulls the line and every slot when the leg's official total disagrees with the starters' counted points", () => {
    const line = computeForecastTeamLine(teamWith([
      starter("1", { countedPoints: 30, playedGames: games(30), gamesRemaining: 0 }),
    ], 31), OBS);
    expect(line.lockedPoints).toBeNull(); expect(line.totalPoints).toBeNull();
    expect(line.slots[0].state).toBe("unknown");
  });
});

describe("forecast refresh service", () => {
  it("appends an immutable revision with as-of, freshness and the computed split; the pregame store is untouched", async () => {
    const h = forecastHarness();
    const response = await refreshForecast(identity(), h.runtime, h.sources);
    expect(response.status).toBe("ready"); if (response.status !== "ready") throw new Error("fixture");
    const revision = response.forecast.revision!;
    expect(revision.mode).toBe("in-season-live");
    expect(revision.generatedAt).toBe(new Date(NOW).toISOString());
    expect(revision.supersedes).toBeNull();
    expect(revision.promptVersion).toBe(AI_FORECAST_PROMPT_VERSION);
    expect(revision.inputFreshness).toEqual(forecastInput().freshness);
    const team1 = revision.teams.find(t => t.rosterId === "1")!;
    // Starter 3000's counted game is his latest played game with games
    // remaining: his lock state is unproven, so every aggregate is null
    // (unknown lock coverage) — never an exact zero lock set.
    expect(team1.lockedPoints).toBeNull();
    expect(team1.finalPoints).toBeNull();
    expect(team1.projectedRemainingPoints).toBeNull();
    expect(team1.totalPoints).toBeNull();
    expect(team1.slots).toHaveLength(3);
    expect(team1.slots.map(s => s.state)).toEqual(["unknown", "open", "open"]);
    expect(revision.matchups).toHaveLength(5);
    expect(revision.matchups.every(m => m.result?.probabilities.length === 2)).toBe(true);
    expect(response.forecast.revisionCount).toBe(1);
    expect(validForecastRevision(revision)).toBe(true);
    expect(h.create).toHaveBeenCalledTimes(1);
    expect(h.persistence.weeks.size).toBe(0);
  });
  it("dedupes identical evidence: no second provider call and no second revision", async () => {
    const h = forecastHarness();
    const first = await refreshForecast(identity(), h.runtime, h.sources);
    const second = await refreshForecast(identity(2), h.runtime, h.sources);
    expect(first.status).toBe("ready"); expect(second.status).toBe("ready");
    if (first.status !== "ready" || second.status !== "ready") throw new Error("fixture");
    expect(second.forecast.revision!.revisionId).toBe(first.forecast.revision!.revisionId);
    expect(second.forecast.revisionCount).toBe(1);
    expect(h.create).toHaveBeenCalledTimes(1);
    expect((await h.persistence.getForecasts(KEY)).length).toBe(1);
  });
  it("appends a superseding revision on changed evidence and never mutates the prior revision", async () => {
    const h = forecastHarness();
    const first = await refreshForecast(identity(), h.runtime, h.sources);
    if (first.status !== "ready") throw new Error("fixture");
    const frozen = structuredClone(first.forecast.revision);
    const changed = forecastInput();
    changed.teams[0].starters[0] = starter("3000", { countedPoints: 41, playedGames: games(41), gamesRemaining: 0 });
    changed.teams[0].officialPoints = 41;
    h.sources.input = vi.fn(async () => structuredClone(changed));
    const second = await refreshForecast(identity(), h.runtime, h.sources);
    expect(second.status).toBe("ready"); if (second.status !== "ready") throw new Error("fixture");
    expect(second.forecast.revisionCount).toBe(2);
    expect(second.forecast.revision!.supersedes).toBe(frozen!.revisionId);
    const team1 = second.forecast.revision!.teams.find(t => t.rosterId === "1")!;
    expect(team1.finalPoints).toEqual({ value: 41, basis: "exact" });
    expect(team1.projectedRemainingPoints).toBe(40);
    expect(team1.totalPoints).toBe(81);
    const series = await h.persistence.getForecasts(KEY);
    expect(series[0]).toEqual(frozen);
    expect(series[1].revisionId).toBe(second.forecast.revision!.revisionId);
    expect(h.create).toHaveBeenCalledTimes(2);
  });
  it("directed: a displayed score that may still be replaced is never banked — a latest-counted slot stays unknown while games remain, across two revisions", async () => {
    const h = forecastHarness();
    const first = await refreshForecast(identity(), h.runtime, h.sources);
    if (first.status !== "ready") throw new Error("fixture");
    // Starter 3000 displays 25 (official team total 25); whether that latest
    // game was locked is unprovable in public data, so lock coverage is
    // unknown (null) — not an exact zero, and never banked as locked.
    expect(first.forecast.revision!.teams[0].lockedPoints).toBeNull();
    expect(first.forecast.revision!.teams[0].finalPoints).toBeNull();
    expect(first.forecast.revision!.teams[0].slots[0].state).toBe("unknown");
    // He plays again and the leg now displays 12 instead of 25: still
    // latest-counted with a game remaining, still unknown, still not banked.
    const replaced = forecastInput();
    replaced.teams[0].starters[0] = starter("3000", { countedPoints: 12, playedGames: games(25, 12), gamesRemaining: 1 });
    replaced.teams[0].officialPoints = 12;
    h.sources.input = vi.fn(async () => structuredClone(replaced));
    const second = await refreshForecast(identity(), h.runtime, h.sources);
    expect(second.status).toBe("ready"); if (second.status !== "ready") throw new Error("fixture");
    expect(second.forecast.revisionCount).toBe(2);
    expect(second.forecast.revision!.teams[0].lockedPoints).toBeNull();
    expect(second.forecast.revision!.teams[0].finalPoints).toBeNull();
    expect(second.forecast.revision!.teams[0].slots[0].state).toBe("unknown");
  });
  it("regression: evidence A → B → A returns the stored A revision with no third provider call", async () => {
    const h = forecastHarness();
    const first = await refreshForecast(identity(), h.runtime, h.sources);
    if (first.status !== "ready") throw new Error("fixture");
    const aId = first.forecast.revision!.revisionId;
    const changed = forecastInput();
    changed.teams[0].starters[0] = starter("3000", { countedPoints: 41, playedGames: games(41), gamesRemaining: 0 });
    changed.teams[0].officialPoints = 41;
    h.sources.input = vi.fn(async () => structuredClone(changed));
    const second = await refreshForecast(identity(), h.runtime, h.sources);
    if (second.status !== "ready") throw new Error("fixture");
    expect(second.forecast.revision!.revisionId).not.toBe(aId);
    expect(second.forecast.revisionCount).toBe(2);
    // The evidence reverts to A: dedupe must find A across the series and
    // return it — not spend again, not no-op the append and return B.
    h.sources.input = vi.fn(async () => structuredClone(forecastInput()));
    const third = await refreshForecast(identity(), h.runtime, h.sources);
    expect(third.status).toBe("ready"); if (third.status !== "ready") throw new Error("fixture");
    expect(third.forecast.revision!.revisionId).toBe(aId);
    expect(third.forecast.revisionCount).toBe(2);
    expect(h.create).toHaveBeenCalledTimes(2);
    expect((await h.persistence.getForecasts(KEY)).length).toBe(2);
  });
  it("directed: at week end the totals resolve — projected is exactly 0 and the total is locked + final", async () => {
    const input = forecastInput();
    input.teams[0].starters = [
      starter("3000", { countedPoints: 25, playedGames: games(25), gamesRemaining: 0 }),                    // final
      starter("3001", { countedPoints: 30, playedGames: games(30, 10), gamesRemaining: 0 }),                // locked
      starter("3002", { countedPoints: 0, playedGames: [], gamesRemaining: 0 }),                            // final, never played
    ];
    input.teams[0].officialPoints = 55;
    const h = forecastHarness(input);
    const response = await refreshForecast(identity(), h.runtime, h.sources);
    expect(response.status).toBe("ready"); if (response.status !== "ready") throw new Error("fixture");
    const team1 = response.forecast.revision!.teams.find(t => t.rosterId === "1")!;
    expect(team1.lockedPoints).toEqual({ value: 30, basis: "exact" });
    expect(team1.finalPoints).toEqual({ value: 25, basis: "exact" });
    expect(team1.projectedRemainingPoints).toBe(0);
    expect(team1.totalPoints).toBe(55);
  });
  it("directed: week rollover starts a fresh series for the new week and leaves the old week's series untouched", async () => {
    const h = forecastHarness();
    const first = await refreshForecast(identity(), h.runtime, h.sources);
    expect(first.status).toBe("ready");
    const week3 = forecastInput(3);
    h.sources.context = vi.fn(async () => context(3));
    h.sources.input = vi.fn(async () => structuredClone(week3));
    const rolled = await refreshForecast(identity(), h.runtime, h.sources);
    expect(rolled.status).toBe("ready"); if (rolled.status !== "ready") throw new Error("fixture");
    expect(rolled.forecast.revision!.week).toBe(3);
    expect(rolled.forecast.revision!.supersedes).toBeNull();
    expect(rolled.forecast.revisionCount).toBe(1);
    expect((await h.persistence.getForecasts(KEY)).length).toBe(1);
    expect((await h.persistence.getForecasts(KEY3)).length).toBe(1);
    expect((await loadAiForecastState(h.runtime, KEY)).status).toBe("ready");
  });
  it("refuses to forecast before the week is underway and spends nothing", async () => {
    const input = forecastInput();
    input.teams[0].starters[0] = starter("3000");
    input.teams[0].officialPoints = 0;
    const h = forecastHarness(input);
    expect(await refreshForecast(identity(), h.runtime, h.sources)).toMatchObject({ status: "unavailable", code: "forecast_not_started" });
    expect(h.create).not.toHaveBeenCalled();
    expect((await h.persistence.getForecasts(KEY)).length).toBe(0);
  });
  it("overlapping refreshes share one provider batch and one stored revision", async () => {
    const h = forecastHarness();
    const results = await Promise.all([refreshForecast(identity(), h.runtime, h.sources), refreshForecast(identity(2), h.runtime, h.sources)]);
    expect(results.filter(r => r.status === "ready")).toHaveLength(1);
    expect(h.create).toHaveBeenCalledTimes(1);
    expect((await h.persistence.getForecasts(KEY)).length).toBe(1);
  });
  it("read state propagates as-of and freshness, and rejects a tampered stored revision", async () => {
    const h = forecastHarness();
    await refreshForecast(identity(), h.runtime, h.sources);
    const state = await loadAiForecastState(h.runtime, KEY);
    expect(state.status).toBe("ready");
    expect(state.revision!.generatedAt).toBe(new Date(NOW).toISOString());
    expect(state.revision!.inputFreshness.map(f => f.source)).toEqual(["sleeper-matchups", "espn-box-scores"]);
    const tampered = structuredClone(state.revision) as AiForecastRevision;
    tampered.teams[0].lockedPoints = { value: 999, basis: "exact" };
    h.persistence.forecasts.set(KEY, [tampered]);
    expect((await loadAiForecastState(h.runtime, KEY)).status).toBe("unavailable");
    expect(validForecastRevision(tampered)).toBe(false);
  });
  it("rejects structurally invalid evidence before any spend", async () => {
    const input = forecastInput();
    (input as { freshness: unknown }).freshness = [];
    const h = forecastHarness(input);
    expect(validForecastInput(input)).toBe(false);
    expect((await refreshForecast(identity(), h.runtime, h.sources)).status).toBe("unavailable");
    expect(h.create).not.toHaveBeenCalled();
  });
});

describe("read-back validation: recomputed-hash tamper resistance", () => {
  const revisionFrom = (input: AiForecastInput) => buildForecastRevision(
    input, input.teams.map(t => computeForecastTeamLine(t, input.capturedAt)), input.matchups.map(() => null), OBS, null);
  /** Recompute the content-addressed id after a mutation, so the hash alone cannot save the tampered body. */
  const rehash = (revision: AiForecastRevision): AiForecastRevision => {
    const { revisionId, ...body } = structuredClone(revision);
    return { ...body, revisionId: createHash("sha256").update(canonicalJson(body)).digest("hex") };
  };
  it("rejects an aggregate basis upgraded from estimated to exact, even with a recomputed revision id", () => {
    const input = forecastInput();
    input.teams[0].starters[0] = starter("3000", { countedPoints: 30, playedGames: games(34, 10), gamesRemaining: 1 }); // band-identified lock → estimated
    input.teams[0].officialPoints = 30;
    const revision = revisionFrom(input);
    expect(revision.teams[0].lockedPoints).toEqual({ value: 30, basis: "estimated" });
    expect(validForecastRevision(revision)).toBe(true);
    const tampered = structuredClone(revision);
    tampered.teams[0].lockedPoints = { value: 30, basis: "exact" };
    expect(validForecastRevision(rehash(tampered))).toBe(false);
  });
  it("rejects a non-null projection surviving an unknown slot, even with a recomputed revision id", () => {
    const input = forecastInput();
    input.teams[0].starters[1] = starter("3001", { countedPoints: 10, playedGames: games(10), gamesRemaining: 1, rejectedAppearance: true });
    input.teams[0].officialPoints = 35;
    const revision = revisionFrom(input);
    expect(revision.teams[0].projectedRemainingPoints).toBeNull();
    expect(validForecastRevision(revision)).toBe(true);
    const tampered = structuredClone(revision);
    tampered.teams[0].projectedRemainingPoints = 20;
    expect(validForecastRevision(rehash(tampered))).toBe(false);
  });
  it("rejects a counted locked slot carrying no gameId, even with a recomputed revision id", () => {
    const input = forecastInput();
    input.teams[0].starters[0] = starter("3000", { countedPoints: 30, playedGames: games(30, 10), gamesRemaining: 1 });
    input.teams[0].officialPoints = 30;
    const revision = revisionFrom(input);
    expect(revision.teams[0].slots[0]).toMatchObject({ state: "locked", gameId: "9001", countedPoints: 30 });
    expect(validForecastRevision(revision)).toBe(true);
    const tampered = structuredClone(revision);
    tampered.teams[0].slots[0].gameId = null;
    expect(validForecastRevision(rehash(tampered))).toBe(false);
  });
});

describe("forecast HTTP boundaries", () => {
  const post = (body: unknown = {}, headers = {}) => new Request("https://synthetic.invalid/api/ai-decides/forecast", { method: "POST", headers: { origin: "https://synthetic.invalid", "Content-Type": "application/json", ...headers }, body: JSON.stringify(body) });
  const SECRET = "synthetic-scheduler-secret-not-a-credential";
  const cron = (secret = SECRET, query = "") => new Request(`https://synthetic.invalid/api/ai-decides/forecast${query}`, { headers: { Authorization: `Bearer ${secret}` } });
  it("rejects client-supplied facts and unauthenticated manual calls", async () => {
    const h = forecastHarness();
    expect((await handleAiForecastPost(post({ week: 2 }), TOKEN, h.runtime, h.sources)).status).toBe(400);
    expect((await handleAiForecastPost(post(), undefined, h.runtime, h.sources)).status).toBe(401);
    expect(h.sources.context).not.toHaveBeenCalled(); expect(h.create).not.toHaveBeenCalled();
  });
  it("runs a manual refresh for a validated manager session", async () => {
    const h = forecastHarness();
    const response = await handleAiForecastPost(post(), TOKEN, h.runtime, h.sources);
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.forecast.revision.mode).toBe("in-season-live");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
  it("rejects wrong scheduler secrets before any source read, and runs under the configured operator identity", async () => {
    const h = forecastHarness();
    expect((await handleAiForecastCron(cron(), "wrong-secret-with-at-least-thirty-two-characters", h.runtime, h.sources)).status).toBe(401);
    expect(h.sources.context).not.toHaveBeenCalled();
    h.runtime.weeklyOperator = { kind: "weekly_job", userId: USER, auth: "legacy" };
    expect((await handleAiForecastCron(cron(), SECRET, h.runtime, h.sources)).status).toBe(200);
    expect(h.persistence.control!.state.users[USER].requests).toBe(1);
  });
});
