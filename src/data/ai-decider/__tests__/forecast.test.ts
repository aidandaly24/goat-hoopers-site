import { describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
import type { AiForecastRevision, AiForecastSlotState } from "@/domain/ai-decider";
import { AI_FORECAST_PROMPT_VERSION } from "@/domain/ai-decider";
import { buildForecastRevision, classifyForecastStarter, computeForecastTeamLine, validForecastInput, validForecastRevision, type AiForecastInput, type AiForecastStarterEvidence } from "../forecast";
import { handleAiForecastCron, handleAiForecastPost, loadAiForecastState, refreshForecast, type AiForecastSources } from "../forecast-service";
import { canonicalJson, GOAT_LEAGUE_ID } from "../weekly";
import { harness, identity, NOW, providerAnswer, TOKEN, USER } from "./fixtures";

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
  it("regression: evidence A → B → A returns the stored A revision with no third provider call — and the public read presents A again", async () => {
    const h = forecastHarness();
    const first = await refreshForecast(identity(), h.runtime, h.sources);
    if (first.status !== "ready") throw new Error("fixture");
    const aId = first.forecast.revision!.revisionId;
    const aHash = first.forecast.revision!.evidenceHash;
    const changed = forecastInput();
    changed.teams[0].starters[0] = starter("3000", { countedPoints: 41, playedGames: games(41), gamesRemaining: 0 });
    changed.teams[0].officialPoints = 41;
    h.sources.input = vi.fn(async () => structuredClone(changed));
    const second = await refreshForecast(identity(), h.runtime, h.sources);
    if (second.status !== "ready") throw new Error("fixture");
    expect(second.forecast.revision!.revisionId).not.toBe(aId);
    expect(second.forecast.revisionCount).toBe(2);
    // While B is current, insertion order and the pointer agree.
    expect((await loadAiForecastState(h.runtime, KEY)).revision!.revisionId).toBe(second.forecast.revision!.revisionId);
    // The evidence reverts to A: dedupe must find A across the series and
    // return it — not spend again, not no-op the append and return B.
    h.sources.input = vi.fn(async () => structuredClone(forecastInput()));
    const third = await refreshForecast(identity(), h.runtime, h.sources);
    expect(third.status).toBe("ready"); if (third.status !== "ready") throw new Error("fixture");
    expect(third.forecast.revision!.revisionId).toBe(aId);
    expect(third.forecast.revisionCount).toBe(2);
    expect(h.create).toHaveBeenCalledTimes(2);
    expect((await h.persistence.getForecasts(KEY)).length).toBe(2);
    // The dedupe hit appended nothing but re-observed A as current: the
    // public read must present A (id + evidence hash), not the
    // last-inserted B that getLatestForecast still reports.
    expect((await h.persistence.getLatestForecast(KEY))!.revisionId).not.toBe(aId);
    expect(await h.persistence.getForecastCurrent(KEY)).toMatchObject({ weekKey: KEY, revisionId: aId, evidenceHash: aHash });
    const pub = await loadAiForecastState(h.runtime, KEY);
    expect(pub.status).toBe("ready");
    expect(pub.revision!.revisionId).toBe(aId);
    expect(pub.revision!.evidenceHash).toBe(aHash);
    expect(pub.revisionCount).toBe(2);
    // Another unchanged-A refresh keeps presenting A publicly, still
    // with no further spend and no new revision.
    const fourth = await refreshForecast(identity(), h.runtime, h.sources);
    expect(fourth.status).toBe("ready"); if (fourth.status !== "ready") throw new Error("fixture");
    expect(fourth.forecast.revision!.revisionId).toBe(aId);
    expect(h.create).toHaveBeenCalledTimes(2);
    expect((await loadAiForecastState(h.runtime, KEY)).revision!.revisionId).toBe(aId);
    expect((await h.persistence.getForecasts(KEY)).length).toBe(2);
  });
  it("after A → B → A, a genuinely new evidence C appends on the chain head and the public read presents C", async () => {
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
    const bId = second.forecast.revision!.revisionId;
    h.sources.input = vi.fn(async () => structuredClone(forecastInput()));
    await refreshForecast(identity(), h.runtime, h.sources);
    expect((await loadAiForecastState(h.runtime, KEY)).revision!.revisionId).toBe(aId);
    // Evidence moves on to C: the append extends the chain head (B —
    // re-observation never appends), and the pointer moves to C.
    const third = forecastInput();
    third.teams[0].starters[0] = starter("3000", { countedPoints: 33, playedGames: games(33), gamesRemaining: 1 });
    third.teams[0].officialPoints = 33;
    h.sources.input = vi.fn(async () => structuredClone(third));
    const cRefresh = await refreshForecast(identity(), h.runtime, h.sources);
    expect(cRefresh.status).toBe("ready"); if (cRefresh.status !== "ready") throw new Error("fixture");
    const cId = cRefresh.forecast.revision!.revisionId;
    expect(cId).not.toBe(aId); expect(cId).not.toBe(bId);
    expect(cRefresh.forecast.revision!.supersedes).toBe(bId);
    expect(cRefresh.forecast.revisionCount).toBe(3);
    const pub = await loadAiForecastState(h.runtime, KEY);
    expect(pub.revision!.revisionId).toBe(cId);
    expect(pub.revision!.evidenceHash).toBe(cRefresh.forecast.revision!.evidenceHash);
    expect(await h.persistence.getForecastCurrent(KEY)).toMatchObject({ revisionId: cId });
    const series = await h.persistence.getForecasts(KEY);
    expect(series.map(r => r.revisionId)).toEqual([aId, bId, cId]);
    expect(series.map(r => r.supersedes)).toEqual([null, aId, bId]);
    expect(h.create).toHaveBeenCalledTimes(3);
  });
  it("concurrency: two competing different-evidence refreshes resolve into one linear chain, the pointer ends on the chain head, and the retry spends nothing", async () => {
    const h = forecastHarness();
    const inputB = forecastInput();
    inputB.teams[0].starters[0] = starter("3000", { countedPoints: 41, playedGames: games(41), gamesRemaining: 0 });
    inputB.teams[0].officialPoints = 41;
    const sourcesA: AiForecastSources = { context: vi.fn(async () => context(2)), input: vi.fn(async () => structuredClone(forecastInput())) };
    const sourcesB: AiForecastSources = { context: vi.fn(async () => context(2)), input: vi.fn(async () => structuredClone(inputB)) };
    // Force the publication race: both refreshes read the same (empty)
    // chain head and build genesis revisions. The first publish attempt
    // is gated until the competing stale attempt arrives; the competing
    // attempt then runs only after the first has fully landed, so its
    // chain-head CAS must lose and the service must rebuild on the new
    // head instead of forking the chain or losing the append.
    const realPublish = h.persistence.publishForecast.bind(h.persistence);
    let openGate!: () => void;
    const gate = new Promise<void>(resolve => { openGate = resolve; });
    let firstPublish: Promise<boolean> | null = null;
    h.persistence.publishForecast = (key, revision, observedAt) => {
      if (!firstPublish) {
        firstPublish = (async () => { await gate; return realPublish(key, revision, observedAt); })();
        return firstPublish;
      }
      if (revision.supersedes === null) {
        openGate();
        return firstPublish.then(() => realPublish(key, revision, observedAt));
      }
      return realPublish(key, revision, observedAt);
    };
    const [resA, resB] = await Promise.all([
      refreshForecast(identity(), h.runtime, sourcesA),
      refreshForecast(identity(2), h.runtime, sourcesB),
    ]);
    expect(resA.status).toBe("ready"); expect(resB.status).toBe("ready");
    if (resA.status !== "ready" || resB.status !== "ready") throw new Error("fixture");
    const series = await h.persistence.getForecasts(KEY);
    expect(series).toHaveLength(2);
    // One linear chain: genesis, then exactly one child on top of it —
    // no fork (two geneses / two children of one parent), no lost append.
    expect(series[0].supersedes).toBeNull();
    expect(series[1].supersedes).toBe(series[0].revisionId);
    expect(new Set(series.map(r => r.revisionId))).toEqual(new Set([resA.forecast.revision!.revisionId, resB.forecast.revision!.revisionId]));
    // The pointer ends on the chain head and the public read agrees.
    expect(await h.persistence.getForecastCurrent(KEY)).toMatchObject({ revisionId: series[1].revisionId, evidenceHash: series[1].evidenceHash });
    const pub = await loadAiForecastState(h.runtime, KEY);
    expect(pub.revision!.revisionId).toBe(series[1].revisionId);
    expect(pub.revisionCount).toBe(2);
    // The losing publication retried on the rebuilt revision only: the
    // provider ran once per refresh, never a third time.
    expect(h.create).toHaveBeenCalledTimes(2);
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

describe("monotonic current selection: delayed writers converge, never regress", () => {
  const changedInput = (counted: number, gamesRemaining: number) => {
    const input = forecastInput();
    input.teams[0].starters[0] = starter("3000", { countedPoints: counted, playedGames: games(counted), gamesRemaining });
    input.teams[0].officialPoints = counted;
    return input;
  };
  it("delayed evaluator: a refresh that observed A before B was published cannot regress the pointer — it appends nothing and returns B as its result", async () => {
    const h = forecastHarness();
    // T1 observes evidence A at t1; its provider call is gated, so the
    // refresh completes only after T2 has published fresher evidence.
    let release!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    let calls = 0;
    h.create.mockImplementation(async payload => { calls++; if (calls === 1) await gate; return providerAnswer(payload); });
    const sourcesB: AiForecastSources = { context: vi.fn(async () => context(2)), input: vi.fn(async () => structuredClone(changedInput(41, 0))) };
    const pendingA = refreshForecast(identity(), h.runtime, h.sources);
    await vi.waitFor(() => expect(calls).toBe(1));
    // T2 observes changed evidence B at t2 > t1, evaluates and publishes.
    h.setTime(NOW + 300000);
    const resB = await refreshForecast(identity(2), h.runtime, sourcesB);
    expect(resB.status).toBe("ready"); if (resB.status !== "ready") throw new Error("fixture");
    const bId = resB.forecast.revision!.revisionId;
    expect((await loadAiForecastState(h.runtime, KEY)).revision!.revisionId).toBe(bId);
    // T1's evaluator finally returns. Its evidence was observed at t1 —
    // strictly older than the current selection — so its publication is
    // refused by the monotonic rule (rebuilding on the new head cannot
    // make old evidence fresh) and the refresh converges on B.
    release();
    const resA = await pendingA;
    expect(resA.status).toBe("ready"); if (resA.status !== "ready") throw new Error("fixture");
    expect(resA.forecast.revision!.revisionId).toBe(bId);
    expect(resA.forecast.revisionCount).toBe(1);
    // The stale append never landed: the series holds only B.
    expect((await h.persistence.getForecasts(KEY)).map(r => r.revisionId)).toEqual([bId]);
    expect(await h.persistence.getForecastCurrent(KEY)).toMatchObject({ revisionId: bId, observedAt: new Date(NOW + 300000).toISOString() });
    expect((await loadAiForecastState(h.runtime, KEY)).revision!.revisionId).toBe(bId);
    expect(calls).toBe(2);
  });
  it("delayed dedupe: an older re-observation of A completing after B became current converges on B — public stays B, nothing appended, nothing spent", async () => {
    const h = forecastHarness();
    const first = await refreshForecast(identity(), h.runtime, h.sources);
    if (first.status !== "ready") throw new Error("fixture");
    const aId = first.forecast.revision!.revisionId;
    h.sources.input = vi.fn(async () => structuredClone(changedInput(41, 0)));
    h.setTime(NOW + 120000);
    const second = await refreshForecast(identity(), h.runtime, h.sources);
    if (second.status !== "ready") throw new Error("fixture");
    const bId = second.forecast.revision!.revisionId;
    expect(bId).not.toBe(aId);
    // A delayed writer now re-observes A, but its observation time is
    // older than B's: the dedupe hit resolves to A, yet the pointer
    // refuses the move and the refresh returns B as its result.
    h.sources.input = vi.fn(async () => structuredClone(forecastInput()));
    h.setTime(NOW + 60000);
    const delayed = await refreshForecast(identity(), h.runtime, h.sources);
    expect(delayed.status).toBe("ready"); if (delayed.status !== "ready") throw new Error("fixture");
    expect(delayed.forecast.revision!.revisionId).toBe(bId);
    expect(delayed.forecast.revisionCount).toBe(2);
    expect(h.create).toHaveBeenCalledTimes(2);
    expect((await h.persistence.getForecasts(KEY)).length).toBe(2);
    expect(await h.persistence.getForecastCurrent(KEY)).toMatchObject({ revisionId: bId, observedAt: new Date(NOW + 120000).toISOString() });
    expect((await loadAiForecastState(h.runtime, KEY)).revision!.revisionId).toBe(bId);
  });
  it("delayed B writer completing after a FRESH A → B → A re-observation converges on A: public stays A and the writer returns A as its result", async () => {
    const h = forecastHarness();
    const first = await refreshForecast(identity(), h.runtime, h.sources);
    if (first.status !== "ready") throw new Error("fixture");
    const aId = first.forecast.revision!.revisionId;
    h.sources.input = vi.fn(async () => structuredClone(changedInput(41, 0)));
    h.setTime(NOW + 120000);
    const second = await refreshForecast(identity(), h.runtime, h.sources);
    if (second.status !== "ready") throw new Error("fixture");
    const bId = second.forecast.revision!.revisionId;
    // Evidence recurs to A and is observed FRESH (t3): the pointer
    // legitimately moves back to A — revision age is not observation age.
    h.sources.input = vi.fn(async () => structuredClone(forecastInput()));
    h.setTime(NOW + 240000);
    const third = await refreshForecast(identity(), h.runtime, h.sources);
    if (third.status !== "ready") throw new Error("fixture");
    expect(third.forecast.revision!.revisionId).toBe(aId);
    expect(await h.persistence.getForecastCurrent(KEY)).toMatchObject({ revisionId: aId, observedAt: new Date(NOW + 240000).toISOString() });
    // Now a delayed writer carrying B-era evidence with an OLDER
    // observation time (t2 < its time < t3) completes. It must not move
    // the pointer off fresh-A, and it returns A as its refresh result.
    h.sources.input = vi.fn(async () => structuredClone(changedInput(41, 0)));
    h.setTime(NOW + 180000);
    const delayed = await refreshForecast(identity(), h.runtime, h.sources);
    expect(delayed.status).toBe("ready"); if (delayed.status !== "ready") throw new Error("fixture");
    expect(delayed.forecast.revision!.revisionId).toBe(aId);
    expect(delayed.forecast.revision!.revisionId).not.toBe(bId);
    expect(h.create).toHaveBeenCalledTimes(2);
    expect((await h.persistence.getForecasts(KEY)).length).toBe(2);
    expect(await h.persistence.getForecastCurrent(KEY)).toMatchObject({ revisionId: aId, observedAt: new Date(NOW + 240000).toISOString() });
    expect((await loadAiForecastState(h.runtime, KEY)).revision!.revisionId).toBe(aId);
  });
});

describe("public read consistency", () => {
  it("an untorn public read is a single consistent joined read", async () => {
    const h = forecastHarness();
    const response = await refreshForecast(identity(), h.runtime, h.sources);
    if (response.status !== "ready") throw new Error("fixture");
    const spy = vi.spyOn(h.persistence, "getForecastCurrentRevision");
    const state = await loadAiForecastState(h.runtime, KEY);
    expect(state.status).toBe("ready");
    expect(state.revision!.revisionId).toBe(response.forecast.revision!.revisionId);
    expect(spy).toHaveBeenCalledTimes(1);
  });
  it("a torn read (pointer visible before its revision, mid-publication) reconciles on the confirming re-read — no false corruption verdict", async () => {
    const h = forecastHarness();
    const response = await refreshForecast(identity(), h.runtime, h.sources);
    if (response.status !== "ready") throw new Error("fixture");
    const spy = vi.spyOn(h.persistence, "getForecastCurrentRevision");
    // The first snapshot tears: the pointer is visible but the revision
    // it names is not (as a split read could observe mid-publication).
    h.persistence.tornForecastReads = 1;
    const state = await loadAiForecastState(h.runtime, KEY);
    expect(state.status).toBe("ready");
    expect(state.revision!.revisionId).toBe(response.forecast.revision!.revisionId);
    expect(state.revisionCount).toBe(1);
    expect(spy).toHaveBeenCalledTimes(2);
  });
});

describe("publication contract: chain-head CAS and the current pointer", () => {
  const revisionFor = (input: AiForecastInput, supersedes: string | null) => buildForecastRevision(
    input, input.teams.map(t => computeForecastTeamLine(t, input.capturedAt)), input.matchups.map(() => null), OBS, supersedes);
  const inputB = () => {
    const input = forecastInput();
    input.teams[0].starters[0] = starter("3000", { countedPoints: 41, playedGames: games(41), gamesRemaining: 0 });
    input.teams[0].officialPoints = 41;
    return input;
  };
  it("publish lands only on the recorded predecessor, moves the pointer with the append, and refuses forks and replays", async () => {
    const h = harness();
    const p = h.persistence;
    const a = revisionFor(forecastInput(), null);
    const bStale = revisionFor(inputB(), null);
    const b = revisionFor(inputB(), a.revisionId);
    expect(await p.getForecastCurrent(KEY)).toBeNull();
    expect(await p.publishForecast(KEY, a, OBS)).toBe(true);
    expect(await p.getForecastCurrent(KEY)).toEqual({ weekKey: KEY, revisionId: a.revisionId, evidenceHash: a.evidenceHash, observedAt: OBS });
    // A stale genesis for different evidence loses the CAS: no fork, no
    // second genesis, pointer unmoved. A replay of A also loses: its
    // evidence state is already stored.
    expect(await p.publishForecast(KEY, bStale, OBS)).toBe(false);
    expect(await p.publishForecast(KEY, a, OBS)).toBe(false);
    expect((await p.getForecasts(KEY)).map(r => r.revisionId)).toEqual([a.revisionId]);
    expect((await p.getForecastCurrent(KEY))!.revisionId).toBe(a.revisionId);
    // Rebuilt on the actual head, the competing publication lands and
    // the pointer follows it to the new chain head.
    expect(await p.publishForecast(KEY, b, OBS)).toBe(true);
    expect((await p.getForecastCurrent(KEY))!.revisionId).toBe(b.revisionId);
    // Re-observation (the dedupe hit) moves the pointer back to A
    // without appending; an unknown revision can never become current.
    expect(await p.markForecastCurrent(KEY, a.revisionId, a.evidenceHash, OBS)).toBe("moved");
    expect((await p.getForecastCurrent(KEY))!.revisionId).toBe(a.revisionId);
    expect((await p.getForecasts(KEY)).length).toBe(2);
    expect(await p.markForecastCurrent(KEY, "f".repeat(64), a.evidenceHash, OBS)).toBe("missing");
    expect(await p.markForecastCurrent(KEY, a.revisionId, "f".repeat(64), OBS)).toBe("missing");
  });
  it("fails the public read closed when the pointer names no stored revision — only after the confirming re-read also dangles", async () => {
    const h = forecastHarness();
    const response = await refreshForecast(identity(), h.runtime, h.sources);
    if (response.status !== "ready") throw new Error("fixture");
    h.persistence.forecastCurrent.set(KEY, { weekKey: KEY, revisionId: "f".repeat(64), evidenceHash: "e".repeat(64), observedAt: OBS });
    const spy = vi.spyOn(h.persistence, "getForecastCurrentRevision");
    expect((await loadAiForecastState(h.runtime, KEY)).status).toBe("unavailable");
    // One consistent read plus exactly one confirming re-read before
    // the corruption verdict — never a verdict on a single torn read.
    expect(spy).toHaveBeenCalledTimes(2);
  });
  it("monotonic pointer: strictly-older moves are refused on BOTH pointer paths and the pointer never regresses", async () => {
    const h = harness();
    const p = h.persistence;
    const t = (s: number) => new Date(Date.parse(OBS) + s * 1000).toISOString();
    const a = revisionFor(forecastInput(), null);
    const b = revisionFor(inputB(), a.revisionId);
    expect(await p.publishForecast(KEY, a, t(10))).toBe(true);
    expect(await p.publishForecast(KEY, b, t(20))).toBe(true);
    expect(await p.getForecastCurrent(KEY)).toEqual({ weekKey: KEY, revisionId: b.revisionId, evidenceHash: b.evidenceHash, observedAt: t(20) });
    // Delayed dedupe re-observation of A carrying its older observation
    // time: refused as stale; the pointer stays on B, timestamp intact.
    expect(await p.markForecastCurrent(KEY, a.revisionId, a.evidenceHash, t(15))).toBe("stale");
    expect((await p.getForecastCurrent(KEY))!.revisionId).toBe(b.revisionId);
    expect((await p.getForecastCurrent(KEY))!.observedAt).toBe(t(20));
    // Delayed fresh publication of new evidence C on the chain head,
    // also carrying an older observation time: refused outright — the
    // append does not land and the pointer does not move.
    const cInput = forecastInput();
    cInput.teams[0].starters[0] = starter("3000", { countedPoints: 33, playedGames: games(33), gamesRemaining: 1 });
    cInput.teams[0].officialPoints = 33;
    const c = revisionFor(cInput, b.revisionId);
    expect(await p.publishForecast(KEY, c, t(18))).toBe(false);
    expect((await p.getForecasts(KEY)).map(r => r.revisionId)).toEqual([a.revisionId, b.revisionId]);
    expect((await p.getForecastCurrent(KEY))!.revisionId).toBe(b.revisionId);
    // The same C carrying a fresh observation lands and becomes current.
    expect(await p.publishForecast(KEY, c, t(30))).toBe(true);
    expect((await p.getForecastCurrent(KEY))!.revisionId).toBe(c.revisionId);
    // A FRESH re-observation of A (newer time) still moves the pointer
    // back: revision age is not observation age.
    expect(await p.markForecastCurrent(KEY, a.revisionId, a.evidenceHash, t(40))).toBe("moved");
    expect((await p.getForecastCurrent(KEY))!.revisionId).toBe(a.revisionId);
  });
  it("tie policy: at equal observedAt the later-completing move applies (store serialization order), and an older mark of the already-current revision reports current", async () => {
    const h = harness();
    const p = h.persistence;
    const a = revisionFor(forecastInput(), null);
    const b = revisionFor(inputB(), a.revisionId);
    expect(await p.publishForecast(KEY, a, OBS)).toBe(true);
    // Equal observation time: the chain-extending publish still lands.
    expect(await p.publishForecast(KEY, b, OBS)).toBe(true);
    expect((await p.getForecastCurrent(KEY))!.revisionId).toBe(b.revisionId);
    // Equal observation time: a re-observation still moves the pointer.
    expect(await p.markForecastCurrent(KEY, a.revisionId, a.evidenceHash, OBS)).toBe("moved");
    expect((await p.getForecastCurrent(KEY))!.revisionId).toBe(a.revisionId);
    // The pointer already names the target at a FRESHER observation:
    // an older mark writes nothing and reports "current" — selection is
    // already as asked, and the stored timestamp never moves backward.
    const later = new Date(Date.parse(OBS) + 60000).toISOString();
    expect(await p.markForecastCurrent(KEY, a.revisionId, a.evidenceHash, later)).toBe("moved");
    expect(await p.markForecastCurrent(KEY, a.revisionId, a.evidenceHash, OBS)).toBe("current");
    expect((await p.getForecastCurrent(KEY))!.observedAt).toBe(later);
  });
  it("consistent read contract: the joined read returns pointer, named revision and series count from one snapshot — and null before any pointer exists", async () => {
    const h = harness();
    const p = h.persistence;
    expect(await p.getForecastCurrentRevision(KEY)).toBeNull();
    const a = revisionFor(forecastInput(), null);
    const b = revisionFor(inputB(), a.revisionId);
    expect(await p.publishForecast(KEY, a, OBS)).toBe(true);
    expect(await p.publishForecast(KEY, b, OBS)).toBe(true);
    expect(await p.markForecastCurrent(KEY, a.revisionId, a.evidenceHash, OBS)).toBe("moved");
    const joined = await p.getForecastCurrentRevision(KEY);
    expect(joined!.pointer).toEqual({ weekKey: KEY, revisionId: a.revisionId, evidenceHash: a.evidenceHash, observedAt: OBS });
    expect(joined!.revision!.revisionId).toBe(a.revisionId);
    expect(joined!.revisionCount).toBe(2);
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
