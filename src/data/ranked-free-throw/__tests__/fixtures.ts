import { vi } from "vitest";
import { parseFreeThrowPolicy, rankedPeriod, rankedReplayContext, replayRankedRound, type RankedRun, type RankedScore } from "@/domain/arcade/ranked-free-throw";
import { freeThrowRulesVersion } from "../config";
import type { RankedPersistence } from "../store";
import type { RankedRuntime } from "../service";

export const nowMs = Date.parse("2026-10-14T12:00:00Z");
export const policy = parseFreeThrowPolicy({ ruleSetId: "synthetic-only", engine: "moving-court-makes-v2", shots: 2,
  durationMs: 30000, minShotIntervalMs: 1000, maxRunsPerWeek: 3 })! as import("@/domain/arcade/ranked-free-throw").FreeThrowPolicy & { maxRunsPerWeek: number };
export const configuration = { status: "ready" as const, policy, rulesVersion: freeThrowRulesVersion(policy) };
export const account = { subject: "personal-account-without-a-team", sessionId: "verified-provider-session" };
export const run: RankedRun & { period: import("@/domain/arcade/ranked-free-throw").RankedPeriod & { endsAtMs: number } } = { id: "00000000-0000-4000-8000-000000000001", userId: account.subject, gameId: "free-throw",
  rulesVersion: configuration.rulesVersion, week: "2026-W42", startedAtMs: nowMs - 15000,
  expiresAtMs: nowMs + 15000, state: "open", period: rankedPeriod(nowMs, policy.calendar) };
export const submission = { runId: run.id, shots: [{ atMs: 0, direction: 0, power: 50 }, { atMs: 7000, direction: 0, power: 79 }] };
export const replayContext = rankedReplayContext();
export const round = replayRankedRound(submission.shots, nowMs - run.startedAtMs, policy);
export const sampleScore: RankedScore = { ...round.statistics, id: "00000000-0000-4000-8000-000000000002", runId: run.id,
  gameId: "free-throw", week: run.week, rulesVersion: run.rulesVersion, startedAtMs: run.startedAtMs,
  achievedAtMs: nowMs, outcomes: round.outcomes, inputs: round.inputs, replayContext };

export function fixture() {
  let state = structuredClone(run);
  let saved: RankedScore | null = null;
  const store: RankedPersistence = {
    start: vi.fn(async () => ({ status: "created" as const, run: structuredClone(state) })),
    readRun: vi.fn(async () => ({ run: structuredClone(state), nowMs, policy, replayContext })),
    // Contract fake only: models atomic CAS; it is not PostgreSQL race proof.
    consume: vi.fn<RankedPersistence["consume"]>(async (_account, _run, evidence) => {
      if (state.state !== "open") return null;
      state = { ...state, state: "consumed" };
      saved = { ...sampleScore, ...evidence.statistics, outcomes: evidence.outcomes, inputs: evidence.inputs };
      return saved;
    }),
    result: vi.fn(async () => saved),
    leaderboard: vi.fn(async () => ({ period: run.period, entries: [] })),
  };
  const runtime: RankedRuntime = { configuration, origin: vi.fn(() => "https://goat.test"), account: vi.fn(async () => account),
    store: vi.fn(() => store), admitRequest: vi.fn(async () => true) };
  return { runtime, store };
}
