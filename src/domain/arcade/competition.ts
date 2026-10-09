/** Server-issued run. All ownership, week, rules and times come from persistence. */
export type CompetitionRun = {
  id: string;
  userId: string;
  gameId: string;
  week: string;
  rulesVersion: string;
  startedAtMs: number;
  expiresAtMs: number;
  state: "open" | "consumed";
};

/** Inputs to a deterministic shooting replay; client-reported baskets are forbidden. */
export type ShotInput = { atMs: number; direction: number; power: number };

/** Reviewed game-specific rules, supplied by the server registry. Defaults stay disabled. */
export type CompetitionRules = {
  enabled: boolean;
  version: string;
  maxEvents: number;
  maxDurationMs: number;
  minShotIntervalMs: number;
  maxScore: number;
};

/** A candidate only. Durable consume-run + insert-score must be one atomic operation. */
export type ScoreCandidate = {
  runId: string;
  userId: string;
  gameId: string;
  week: string;
  rulesVersion: string;
  score: number;
};

export type ScoreValidation =
  | { ok: true; candidate: ScoreCandidate }
  | { ok: false; reason: "disabled" | "unauthenticated" | "invalid_run" | "invalid_submission" | "invalid_replay" };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const keysAre = (value: Record<string, unknown>, keys: readonly string[]) =>
  Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
const integer = (value: unknown): value is number => typeof value === "number" && Number.isSafeInteger(value);
const slug = (value: string) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) && value.length <= 64;
const weekValid = (value: string) => /^\d{4}-W(?:0[1-9]|[1-4]\d|5[0-3])$/.test(value);

/**
 * Dormant server validation foundation. Bounds replay work and derives score from
 * inputs using the injected versioned engine. Run consumption is the store's job;
 * this read-only check alone provides no cross-request replay protection.
 */
export function validateScoreSubmission(
  submission: unknown,
  userId: string | null,
  run: CompetitionRun,
  rules: CompetitionRules,
  nowMs: number,
  replay: (shots: readonly ShotInput[]) => number,
): ScoreValidation {
  if (!rules.enabled) return { ok: false, reason: "disabled" };
  if (!userId) return { ok: false, reason: "unauthenticated" };
  if (run.userId !== userId || !run.id || !slug(run.gameId) || !weekValid(run.week) ||
      run.state !== "open" || !run.rulesVersion || run.rulesVersion !== rules.version ||
      !integer(nowMs) || !integer(run.startedAtMs) || !integer(run.expiresAtMs) ||
      run.startedAtMs < 0 || nowMs < run.startedAtMs || nowMs >= run.expiresAtMs ||
      !integer(rules.maxEvents) || rules.maxEvents < 1 || rules.maxEvents > 100 ||
      !integer(rules.maxDurationMs) || rules.maxDurationMs < 1 || rules.maxDurationMs > 300_000 ||
      run.expiresAtMs - run.startedAtMs !== rules.maxDurationMs ||
      !integer(rules.minShotIntervalMs) || rules.minShotIntervalMs < 1 ||
      !integer(rules.maxScore) || rules.maxScore < 1 || rules.maxScore > 10_000) {
    return { ok: false, reason: "invalid_run" };
  }
  if (!isRecord(submission) || !keysAre(submission, ["runId", "shots"]) ||
      submission.runId !== run.id || !Array.isArray(submission.shots) ||
      submission.shots.length < 1 || submission.shots.length > rules.maxEvents) {
    return { ok: false, reason: "invalid_submission" };
  }
  const shots: ShotInput[] = [];
  for (const value of submission.shots) {
    if (!isRecord(value) || !keysAre(value, ["atMs", "direction", "power"]) ||
        !integer(value.atMs) || value.atMs < 0 || value.atMs > nowMs - run.startedAtMs ||
        value.atMs >= rules.maxDurationMs ||
        (shots.length > 0 && value.atMs - shots[shots.length - 1].atMs < rules.minShotIntervalMs) ||
        typeof value.direction !== "number" || !Number.isFinite(value.direction) || Math.abs(value.direction) > 14 ||
        typeof value.power !== "number" || !Number.isFinite(value.power) || value.power < 0 || value.power > 100) {
      return { ok: false, reason: "invalid_submission" };
    }
    shots.push({ atMs: value.atMs, direction: value.direction, power: value.power });
  }
  let score: number;
  try { score = replay(shots); } catch { return { ok: false, reason: "invalid_replay" }; }
  if (!integer(score) || score < 0 || score > rules.maxScore) return { ok: false, reason: "invalid_replay" };
  return { ok: true, candidate: {
    runId: run.id, userId, gameId: run.gameId, week: run.week, rulesVersion: run.rulesVersion, score,
  } };
}

/** Cosmetic-only future policy. No FAAB, money, settlement or balance changes. */
export type CosmeticPolicy = {
  enabled: boolean;
  cosmeticId: string;
  maxPerUserPerWeek: number;
  maxGlobalPerWeek: number;
};

/** Read under the same transaction/lock that ultimately inserts the award. */
export type AwardBudget = {
  userAwards: number;
  globalAwards: number;
  gameWeekAlreadyAwarded: boolean;
};

/**
 * Read-only candidate, not an entitlement. Caller selects the winner from final
 * verified scores, then atomically enforces counters + UNIQUE(game_id, week).
 * Changing policy/cosmetic/version must never grant a second weekly award.
 */
export function planCosmeticAward(
  winner: { userId: string; gameId: string; week: string; scoreId: string },
  policy: CosmeticPolicy,
  budget: AwardBudget,
): { userId: string; gameId: string; week: string; scoreId: string; cosmeticId: string; quantity: 1 } | null {
  if (!policy.enabled || !winner.userId || !winner.scoreId || !slug(winner.gameId) || !weekValid(winner.week) ||
      !slug(policy.cosmeticId) || !integer(policy.maxPerUserPerWeek) || policy.maxPerUserPerWeek < 1 ||
      policy.maxPerUserPerWeek > 10 || !integer(policy.maxGlobalPerWeek) || policy.maxGlobalPerWeek < 1 ||
      policy.maxGlobalPerWeek > 100 || !integer(budget.userAwards) || budget.userAwards < 0 ||
      !integer(budget.globalAwards) || budget.globalAwards < budget.userAwards || budget.gameWeekAlreadyAwarded !== false ||
      budget.userAwards >= policy.maxPerUserPerWeek || budget.globalAwards >= policy.maxGlobalPerWeek) return null;
  return {
    userId: winner.userId, gameId: winner.gameId, week: winner.week,
    scoreId: winner.scoreId, cosmeticId: policy.cosmeticId, quantity: 1,
  };
}
