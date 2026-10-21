import { expect, it, vi } from "vitest";
import { issueRankedRun, loadRankedLeaderboard, loadRankedResult, submitRankedScore } from "../service";
import { account, configuration, fixture, nowMs, policy, replayContext, round, run, sampleScore, submission } from "./fixtures";
import { freeThrowRulesVersion, readRankedConfiguration } from "../config";
import { compareRecord } from "@/domain/arcade/ranked-record-feedback";

it.each([undefined, "", "0", "true"])("defaults closed for flag %s without auth/store work", async flag => {
  const { runtime } = fixture();
  runtime.configuration = readRankedConfiguration({ GOAT_RANKED_FREE_THROW_ENABLED: flag, GOAT_RANKED_FREE_THROW_RULES: JSON.stringify(policy) });
  expect(await issueRankedRun(runtime, account)).toEqual({ status: "disabled" });
  expect(await submitRankedScore(runtime, account, submission)).toEqual({ status: "disabled" });
  expect(await loadRankedLeaderboard(runtime, account, "everyone", 50)).toEqual({ status: "disabled" });
  expect(runtime.store).not.toHaveBeenCalled();
});

it("requires explicit valid gameplay rules even with an exact-1 activation flag", () => {
  for (const raw of [undefined, "{}", "null", "{bad", "x".repeat(4097)]) {
    expect(readRankedConfiguration({ GOAT_RANKED_FREE_THROW_ENABLED: "1", GOAT_RANKED_FREE_THROW_RULES: raw })).toEqual({ status: "invalid" });
  }
  const a = readRankedConfiguration({ GOAT_RANKED_FREE_THROW_ENABLED: "1", GOAT_RANKED_FREE_THROW_RULES: JSON.stringify(policy) });
  const b = readRankedConfiguration({ GOAT_RANKED_FREE_THROW_ENABLED: "1", GOAT_RANKED_FREE_THROW_RULES: JSON.stringify(Object.fromEntries(Object.entries(policy).reverse())) });
  expect(a).toEqual(configuration); expect(b).toEqual(a);
  expect(freeThrowRulesVersion({ ...policy, shots: 3 })).not.toBe(configuration.rulesVersion);
  expect(freeThrowRulesVersion({ ...policy, calendar: { ...policy.calendar, timeZone: "UTC" } })).not.toBe(configuration.rulesVersion);
  expect(readRankedConfiguration({ GOAT_RANKED_FREE_THROW_ENABLED: "1", GOAT_RANKED_FREE_THROW_RULES: JSON.stringify({ ...policy, engine: "fixed-line-makes-v1" }) })).toEqual({ status: "invalid" });
});

it("issues a personal-account run while excluding provider ownership fields from its public response", async () => {
  const { runtime, store } = fixture();
  const result = await issueRankedRun(runtime, account);
  expect(store.start).toHaveBeenCalledWith(account, configuration);
  expect(result).toMatchObject({ status: "created", run: { id: run.id, gameId: "free-throw" }, rules: { shots: 2 } });
  if (result.status !== "created") throw new Error("fixture");
  expect(result.run).not.toHaveProperty("userId");
  expect(result.run).not.toHaveProperty("sessionId");
});

it("derives and saves a real score, then rejects replay", async () => {
  const { runtime, store } = fixture();
  expect(await submitRankedScore(runtime, account, submission)).toMatchObject({ status: "saved", score: { score: 2 } });
  expect(store.consume).toHaveBeenCalledWith(account, run, round);
  expect(await submitRankedScore(runtime, account, submission)).toEqual({ status: "invalid_run" });
});

it("returns canonical acceptance feedback separately and never regenerates it on recovery or failed retry", async () => {
  const { runtime, store } = fixture();
  const feedback = { version: 1 as const, scoreId: sampleScore.id, acceptedAtMs: sampleScore.achievedAtMs, periodId: "test-week-1",
    scoreVersion: "a".repeat(64), scope: "everyone" as const, personalBest: compareRecord(2, 0), weeklyRecord: compareRecord(2, 1), allTimeRecord: compareRecord(2, 1) };
  store.consume = vi.fn<import("../store").RankedPersistence["consume"]>().mockResolvedValueOnce({ ...sampleScore, recordFeedback: feedback }).mockResolvedValue(null);
  store.result = vi.fn(async () => sampleScore);
  expect(await submitRankedScore(runtime, account, submission)).toEqual({ status: "saved", score: sampleScore, recordFeedback: feedback });
  expect(await loadRankedResult(runtime, account, run.id)).toEqual({ status: "saved", score: sampleScore, recordFeedback: null });
  expect(await submitRankedScore(runtime, account, submission)).toEqual({ status: "invalid_run" });
});

it("persists make/miss order and derives aggregates once, including after duplicate submissions", async () => {
  const { runtime, store } = fixture();
  const mixed = { ...submission, shots: [submission.shots[0], { ...submission.shots[1], direction: 14 }] };
  const result = await submitRankedScore(runtime, account, mixed);
  expect(result).toMatchObject({ status: "saved", score: { gameId: "free-throw", week: run.week, rulesVersion: run.rulesVersion,
    score: 1, makes: 1, attempts: 2, accuracy: .5, longestStreak: 1, endingStreak: 0, outcomes: [1, 0], inputs: mixed.shots, achievedAtMs: nowMs } });
  expect(await submitRankedScore(runtime, account, mixed)).toEqual({ status: "invalid_run" });
  expect(await loadRankedResult(runtime, account, run.id)).toEqual(result);
  expect(store.consume).toHaveBeenCalledTimes(1);
  // A changed active rule set cannot rewrite a historical private receipt.
  runtime.configuration = { ...configuration, policy: { ...policy, shots: 3 } };
  expect(await loadRankedResult(runtime, account, run.id)).toEqual(result);
});

it("accepts only one of twelve concurrent submissions under the persistence CAS contract", async () => {
  const { runtime, store } = fixture();
  const results = await Promise.all(Array.from({ length: 12 }, () => submitRankedScore(runtime, account, structuredClone(submission))));
  expect(results.filter(result => result.status === "saved")).toHaveLength(1);
  expect(results.filter(result => result.status === "invalid_run")).toHaveLength(11);
  expect(store.consume).toHaveBeenCalledTimes(12);
});

it.each([
  { ...submission, score: 999 }, { ...submission, week: "2026-W43" }, { ...submission, userId: "other" },
  { ...submission, rulesVersion: "other" }, { ...submission, runId: "not-a-run" },
  { ...submission, positions: [{ x: 0, y: 1.9, z: 4 }] }, { ...submission, seed: "easier" },
  { ...submission, shots: submission.shots.slice(0, 1) },
])("rejects client identity/totals/rules and incomplete evidence before the store: %j", async body => {
  const { runtime } = fixture();
  expect(await submitRankedScore(runtime, account, body)).toEqual({ status: "invalid_submission" });
  expect(runtime.store).not.toHaveBeenCalled();
});

it.each([
  { ...run, userId: "another-account" }, { ...run, rulesVersion: "old" }, { ...run, state: "expired" as const },
  { ...run, expiresAtMs: nowMs }, { ...run, startedAtMs: nowMs + 1 },
  { ...run, period: { ...run.period, endsAtMs: run.period.endsAtMs + 1 } },
])("rejects unowned, stale, expired or corrupt persisted runs: %j", async badRun => {
  const { runtime, store } = fixture();
  store.readRun = vi.fn(async () => ({ run: badRun, policy, replayContext, nowMs }));
  expect(await submitRankedScore(runtime, account, submission)).toEqual({ status: "invalid_run" });
  expect(store.consume).not.toHaveBeenCalled();
});

it("rejects a run across weekly rollover, changed rules, and reauthorization failure", async () => {
  const { runtime, store } = fixture();
  store.readRun = vi.fn(async () => ({ run, policy, replayContext, nowMs: run.period.endsAtMs }));
  expect(await submitRankedScore(runtime, account, submission)).toEqual({ status: "invalid_run" });
  store.readRun = vi.fn(async () => ({ run, policy: { ...policy, shots: 3 }, replayContext, nowMs }));
  expect(await submitRankedScore(runtime, account, submission)).toEqual({ status: "invalid_run" });
  store.readRun = vi.fn(async () => ({ run, policy, replayContext, nowMs }));
  store.consume = vi.fn(async () => null); // Session revoked/expired between verification and atomic persistence.
  expect(await submitRankedScore(runtime, account, submission)).toEqual({ status: "invalid_run" });
});

it.each([
  [{ atMs: 0, direction: 0, power: Infinity }, submission.shots[1]],
  [{ atMs: 0, direction: 0, power: 50, made: true }, submission.shots[1]],
  [submission.shots[0], { ...submission.shots[1], atMs: 1000 }],
  [submission.shots[0], { ...submission.shots[1], atMs: 14999 }],
].map(shots => ({ shots })))("does not consume malformed, overlapping or still-flying evidence $shots", async ({ shots }) => {
  const { runtime, store } = fixture();
  const result = await submitRankedScore(runtime, account, { ...submission, shots });
  expect(["invalid_submission", "invalid_replay"]).toContain(result.status);
  expect(store.consume).not.toHaveBeenCalled();
});

it("records a genuine zero and keeps personal ownership independent of team membership", async () => {
  const { runtime, store } = fixture();
  expect(await submitRankedScore(runtime, account, { ...submission, shots: submission.shots.map(shot => ({ ...shot, direction: 14 })) }))
    .toMatchObject({ status: "saved", score: { score: 0 } });
  await loadRankedLeaderboard(runtime, account, "league", 10);
  expect(store.leaderboard).toHaveBeenCalledWith(configuration, "league", account.subject, 10);
});
