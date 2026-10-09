import { describe, expect, it, vi } from "vitest";
import { planCosmeticAward, validateScoreSubmission, type CompetitionRules, type CompetitionRun, type ShotInput } from "./competition";

const run: CompetitionRun = {
  id: "synthetic-run", userId: "stable-owner", gameId: "free-throw", week: "2026-W41",
  rulesVersion: "synthetic-v1", startedAtMs: 1000, expiresAtMs: 11000, state: "open",
};
const rules: CompetitionRules = {
  enabled: true, version: "synthetic-v1", maxEvents: 3, maxDurationMs: 10000, minShotIntervalMs: 1000, maxScore: 3,
};
const shots = [{ atMs: 0, direction: 0, power: 50 }, { atMs: 1000, direction: 10, power: 55 }];
const submission = { runId: run.id, shots };
const validate = (body: unknown = submission, currentRun = run, currentRules = rules, replay: (shots: readonly ShotInput[]) => number = vi.fn(() => 1)) =>
  validateScoreSubmission(body, run.userId, currentRun, currentRules, 4000, replay);

describe("dormant score validation; synthetic replay, not production physics proof", () => {
  it("derives score via replay and identity/game/week/version from server state", () => {
    const replay = vi.fn(() => 1);
    const snapshot = structuredClone(submission);
    expect(validate(submission, run, rules, replay)).toEqual({ ok: true, candidate: {
      runId: run.id, userId: run.userId, gameId: run.gameId, week: run.week, rulesVersion: run.rulesVersion, score: 1,
    } });
    expect(replay).toHaveBeenCalledWith(shots);
    expect(submission).toEqual(snapshot);
  });

  it("stays closed without a reviewed competition policy or server identity", () => {
    expect(validate(submission, run, { ...rules, enabled: false })).toEqual({ ok: false, reason: "disabled" });
    expect(validateScoreSubmission(submission, null, run, rules, 4000, () => 1)).toEqual({ ok: false, reason: "unauthenticated" });
  });

  it.each([
    { ...run, userId: "other" }, { ...run, state: "consumed" as const }, { ...run, rulesVersion: "old" },
    { ...run, startedAtMs: 5000 }, { ...run, expiresAtMs: 4000 }, { ...run, expiresAtMs: NaN },
    { ...run, week: "2026-W00" }, { ...run, gameId: "../free-throw" },
  ])("rejects reused, unowned, expired or invalid runs before replay: %j", badRun => {
    const replay = vi.fn(() => 1);
    expect(validate(submission, badRun, rules, replay)).toEqual({ ok: false, reason: "invalid_run" });
    expect(replay).not.toHaveBeenCalled();
  });

  it.each([
    { ...rules, maxEvents: 101 }, { ...rules, maxEvents: 0 }, { ...rules, maxDurationMs: 300001 },
    { ...rules, minShotIntervalMs: 0 }, { ...rules, maxScore: Infinity },
  ])("rejects invalid/unbounded rules: %j", badRules => expect(validate(submission, run, badRules).ok).toBe(false));

  it.each([
    null, [], { ...submission, score: 999 }, { ...submission, userId: "other" },
    { ...submission, week: "2026-W42" }, { ...submission, runId: "other" }, { ...submission, shots: [] },
    { ...submission, shots: Array(4).fill(shots[0]) },
    { ...submission, shots: [{ ...shots[0], made: true }] },
    ...[-1, 0.5, NaN, Infinity, 4000].map(atMs => ({ ...submission, shots: [{ ...shots[0], atMs }] })),
    { ...submission, shots: [shots[1], shots[0]] },
    { ...submission, shots: [shots[0], { ...shots[1], atMs: 999 }] },
    { ...submission, shots: [{ ...shots[0], direction: 31 }] },
    { ...submission, shots: [{ ...shots[0], direction: 14.01 }] },
    { ...submission, shots: [{ ...shots[0], power: -1 }] },
    { ...submission, shots: [{ ...shots[0], power: Infinity }] },
  ])("rejects forged totals/ownership and malformed/bounded evidence without replay: %j", body => {
    const replay = vi.fn(() => 1);
    expect(validate(body, run, rules, replay)).toEqual({ ok: false, reason: "invalid_submission" });
    expect(replay).not.toHaveBeenCalled();
  });

  it.each([-1, 4, 0.5, NaN, Infinity])("rejects invalid replay score %s", score =>
    expect(validate(submission, run, rules, () => score)).toEqual({ ok: false, reason: "invalid_replay" }));

  it("fails closed on engine exceptions, accepts a real zero and excludes expiry boundary", () => {
    expect(validate(submission, run, rules, () => { throw new Error("synthetic"); })).toEqual({ ok: false, reason: "invalid_replay" });
    expect(validate(submission, run, rules, () => 0).ok).toBe(true);
    expect(validateScoreSubmission(submission, run.userId, run, rules, run.expiresAtMs, () => 1).ok).toBe(false);
  });
});

describe("bounded cosmetic candidates; no issuance or FAAB", () => {
  const winner = { userId: run.userId, gameId: run.gameId, week: run.week, scoreId: "synthetic-verified-score" };
  const policy = { enabled: true, cosmeticId: "practice-badge", maxPerUserPerWeek: 1, maxGlobalPerWeek: 10 };
  const budget = { userAwards: 0, globalAwards: 0, gameWeekAlreadyAwarded: false };

  it("defaults closed and permits exactly one cosmetic unit when reviewed budgets allow it", () => {
    expect(planCosmeticAward(winner, { ...policy, enabled: false }, budget)).toBeNull();
    expect(planCosmeticAward(winner, policy, budget)).toEqual({ ...winner, cosmeticId: policy.cosmeticId, quantity: 1 });
  });

  it.each([
    { ...budget, userAwards: 1 }, { ...budget, globalAwards: 10 }, { ...budget, gameWeekAlreadyAwarded: true },
    { ...budget, userAwards: -1 }, { ...budget, globalAwards: NaN },
    { ...budget, userAwards: 1, globalAwards: 0 },
  ])("rejects replay, exhausted or corrupt budgets %j", badBudget => expect(planCosmeticAward(winner, policy, badBudget)).toBeNull());

  it("changing the cosmetic never bypasses the single game/week award guard", () => {
    expect(planCosmeticAward(winner, { ...policy, cosmeticId: "different-badge" }, { ...budget, gameWeekAlreadyAwarded: true })).toBeNull();
  });

  it("does not copy extra monetary or settlement fields from runtime values", () => {
    expect(planCosmeticAward({ ...winner, ...{ amountFaab: 10, settled: true } }, policy, budget))
      .toEqual({ ...winner, cosmeticId: policy.cosmeticId, quantity: 1 });
  });

  it.each([{ ...policy, maxGlobalPerWeek: 101 }, { ...policy, maxPerUserPerWeek: 0 }, { ...policy, cosmeticId: "../money" }])(
    "rejects unbounded or invalid policy %j", badPolicy => expect(planCosmeticAward(winner, badPolicy, budget)).toBeNull());
});
