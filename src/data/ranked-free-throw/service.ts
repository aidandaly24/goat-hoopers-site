import "server-only";
import { validateScoreSubmission } from "@/domain/arcade/competition";
import { rankedId, rankedPeriod, rankedReplayContext, record, replayRankedRound, validRankedAccount,
  type RankedAccount, type RankedScope, type ValidatedRound } from "@/domain/arcade/ranked-free-throw";
import { freeThrowRulesVersion, type RankedConfiguration } from "./config";
import { parseFreeThrowPolicy } from "@/domain/arcade/ranked-free-throw";
import type { RankedPersistence } from "./store";
import { parseRankedRecordFeedback } from "@/domain/arcade/ranked-record-feedback";

export type RankedRuntime = {
  configuration: RankedConfiguration;
  origin(): string;
  account(headers: Headers): Promise<RankedAccount | null>;
  admitRequest(action: "start" | "submit"): Promise<boolean>;
  store(): RankedPersistence;
};

export async function issueRankedRun(runtime: RankedRuntime, account: RankedAccount) {
  const config = runtime.configuration;
  if (config.status !== "ready") return { status: config.status };
  if (!validRankedAccount(account)) return { status: "unauthenticated" as const };
  const result = await runtime.store().start(account, config);
  if (result.status !== "created") return result;
  // Private provider subject/session never enters the public run contract.
  const r = result.run;
  const run = { id: r.id, gameId: r.gameId, week: r.week, rulesVersion: r.rulesVersion,
    startedAtMs: r.startedAtMs, expiresAtMs: r.expiresAtMs, period: r.period };
  return { status: "created" as const, run, rules: config.policy, replayContext: rankedReplayContext(config.policy.engine) };
}

export async function submitRankedScore(runtime: RankedRuntime, account: RankedAccount, submission: unknown) {
  const config = runtime.configuration;
  if (config.status !== "ready") return { status: config.status };
  if (!validRankedAccount(account)) return { status: "unauthenticated" as const };
  if (!record(submission) || Object.keys(submission).length !== 2 || !Object.hasOwn(submission, "shots") ||
    !rankedId(submission.runId) || !Array.isArray(submission.shots) || submission.shots.length !== config.policy.shots) {
    return { status: "invalid_submission" as const };
  }
  const store = runtime.store();
  const stored = await store.readRun(account, submission.runId);
  if (!stored) return { status: "invalid_run" as const };
  const { run, nowMs, replayContext } = stored;
  const policy = parseFreeThrowPolicy(stored.policy);
  const period = run.period.id ? run.period : rankedPeriod(nowMs, config.policy.calendar);
  if (!policy || freeThrowRulesVersion(policy, replayContext) !== config.rulesVersion || run.rulesVersion !== config.rulesVersion ||
    run.gameId !== "free-throw" || run.week !== period.week || run.period.week !== period.week ||
    run.period.startsAtMs !== period.startsAtMs || run.period.endsAtMs !== period.endsAtMs ||
    run.startedAtMs < period.startsAtMs || (period.endsAtMs !== null && run.expiresAtMs > period.endsAtMs)) return { status: "invalid_run" as const };
  let round: ValidatedRound | null = null;
  const validation = validateScoreSubmission(submission, account.subject,
    { ...run, state: run.state === "open" ? "open" : "consumed" },
    { enabled: true, version: config.rulesVersion, maxEvents: policy.shots, maxDurationMs: policy.durationMs,
      minShotIntervalMs: policy.minShotIntervalMs, maxScore: policy.shots }, nowMs,
    shots => { round = replayRankedRound(shots, nowMs - run.startedAtMs, policy, replayContext); return round.statistics.score; });
  if (!validation.ok) return { status: validation.reason };
  if (!round) return { status: "invalid_replay" as const };
  const accepted = await store.consume(account, run, round);
  if (!accepted) return { status: "invalid_run" as const };
  const { recordFeedback, ...score } = accepted;
  return { status: "saved" as const, score, recordFeedback: parseRankedRecordFeedback(recordFeedback, score) };
}

export async function loadRankedResult(runtime: RankedRuntime, account: RankedAccount, runId: string) {
  if (runtime.configuration.status !== "ready") return { status: runtime.configuration.status };
  if (!validRankedAccount(account)) return { status: "unauthenticated" as const };
  if (!rankedId(runId)) return { status: "invalid_submission" as const };
  const score = await runtime.store().result(account, runId);
  return score ? { status: "saved" as const, score, recordFeedback: null } : { status: "not_found" as const };
}

export async function loadRankedLeaderboard(runtime: RankedRuntime, viewer: RankedAccount | null, scope: RankedScope, limit: number) {
  const config = runtime.configuration;
  if (config.status !== "ready") return { status: config.status };
  const result = await runtime.store().leaderboard(config, scope, viewer && validRankedAccount(viewer) ? viewer.subject : null, limit);
  return { status: "ready" as const, gameId: "free-throw" as const, rulesVersion: config.rulesVersion,
    ruleSetId: config.policy.ruleSetId, calendar: config.policy.calendar, scope, ...result };
}
