import type { CompetitionRun, ShotInput } from "./competition";
import { PRACTICE_COURT, type PracticeCourt, type PracticeVector } from "./free-throw";
import { LEGACY_FREE_THROW_PHYSICS, MOVING_COURT_PHYSICS, launchBall, stepBall } from "./free-throw-physics";
import { rankedShootingPositions } from "./free-throw-positions";

/** Provisional calendar only; activation still requires an explicit reviewed rule set. */
export const PROVISIONAL_RANKED_CALENDAR = { timeZone: "America/New_York", startsOn: 1, hour: 0, minute: 0 } as const;
export type RankedCalendar = { timeZone: string; startsOn: number; hour: number; minute: number };
export const ACTIVE_FREE_THROW_ENGINE = "moving-court-makes-v2" as const;
export type RankedEngine = "fixed-line-makes-v1" | typeof ACTIVE_FREE_THROW_ENGINE;
export type FreeThrowPolicy = {
  ruleSetId: string;
  /** v1 remains readable for historical evidence; new admission requires v2. */
  engine: RankedEngine;
  shots: number;
  durationMs: number;
  minShotIntervalMs: number;
  maxRunsPerWeek: number | null;
  calendar: RankedCalendar;
};
export type RankedPeriod = { id?: string; week: string; startsAtMs: number; endsAtMs: number | null };
export type RankedAccount = { subject: string; sessionId: string };
export type RankedRun = Omit<CompetitionRun, "state"> & {
  state: "open" | "consumed" | "expired";
  period: RankedPeriod;
};
export type ShotOutcome = 0 | 1;
export type RunStatistics = { score: number; makes: number; attempts: number; accuracy: number | null; longestStreak: number; endingStreak: number };
export type RankedReplayContext = { engine: "fixed-line-makes-v1"; court: PracticeCourt }
  | { engine: typeof ACTIVE_FREE_THROW_ENGINE; court: PracticeCourt; positions: PracticeVector[]; physics: { powerPerPercent: 0.042 } };
export type ValidatedRound = { inputs: readonly ShotInput[]; outcomes: readonly ShotOutcome[]; statistics: RunStatistics; replayContext: RankedReplayContext };
export type RankedScore = RunStatistics & { id: string; runId: string; gameId: "free-throw"; week: string; rulesVersion: string;
  startedAtMs: number; achievedAtMs: number; outcomes: readonly ShotOutcome[]; inputs: readonly ShotInput[]; replayContext: RankedReplayContext };
export type RankedLeaderboardEntry = RunStatistics & {
  rank: number; username: string; teamId: string | null;
  achievedAtMs: number; isCurrentUser: boolean;
};
export type RankedAdmission = { run: Omit<RankedRun, "userId" | "state">; rules: FreeThrowPolicy; replayContext: RankedReplayContext };
export type RankedBoard = { gameId: "free-throw"; rulesVersion: string; ruleSetId: string; calendar: RankedCalendar; scope: RankedScope; period: RankedPeriod; entries: RankedLeaderboardEntry[] };
export type RankedAvailability = { status: "disabled" | "sign_in" | "unavailable" } | { status: "available"; ruleSetId: string; rules: FreeThrowPolicy };
export type RankedScope = "everyone" | "league";

export const record = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
export const safeInteger = (value: unknown): value is number => typeof value === "number" && Number.isSafeInteger(value);
export const rankedId = (value: unknown): value is string => typeof value === "string" && value.length === 36 && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const accountId = (value: unknown): value is string => typeof value === "string" && value.length > 0 && value.length <= 256 && !/[\s\u0000-\u001f\u007f]/.test(value);
export const validRankedAccount = (value: RankedAccount) => accountId(value.subject) && accountId(value.sessionId);
const only = (value: Record<string, unknown>, keys: readonly string[]) => Object.keys(value).every(key => keys.includes(key));
const bounded = (value: unknown, low: number, high: number): value is number => safeInteger(value) && value >= low && value <= high;

export function summarizeOutcomes(outcomes: readonly ShotOutcome[]): RunStatistics {
  if (outcomes.length > 100 || Array.from(outcomes).some(value => value !== 0 && value !== 1)) throw new Error("invalid_outcomes");
  let makes = 0, endingStreak = 0, longestStreak = 0;
  for (const made of outcomes) {
    if (made === 1) { makes++; endingStreak++; longestStreak = Math.max(longestStreak, endingStreak); }
    else endingStreak = 0;
  }
  return { score: makes, makes, attempts: outcomes.length, accuracy: outcomes.length ? makes / outcomes.length : null, longestStreak, endingStreak };
}
export function decodeOutcomes(bits: unknown): ShotOutcome[] {
  if (typeof bits !== "string" || bits.length < 1 || bits.length > 100 || /[^01]/.test(bits)) throw new Error("invalid_outcomes");
  return Array.from(bits, bit => bit === "1" ? 1 : 0);
}
export function rankedReplayContext(engine: RankedEngine = ACTIVE_FREE_THROW_ENGINE): RankedReplayContext {
  const court = structuredClone(PRACTICE_COURT);
  return engine === "fixed-line-makes-v1" ? { engine, court }
    : { engine, court, positions: rankedShootingPositions(court), physics: { ...MOVING_COURT_PHYSICS } };
}
export const rankedPositions = (context: RankedReplayContext): readonly PracticeVector[] => context.engine === "fixed-line-makes-v1" ? [context.court.release] : context.positions;
export const rankedPhysics = (context: RankedReplayContext) => context.engine === "fixed-line-makes-v1" ? LEGACY_FREE_THROW_PHYSICS : context.physics;
export function rankedShotPosition(context: RankedReplayContext, index: number): PracticeVector {
  if (!safeInteger(index) || index < 0 || index > 100) throw new Error("invalid_shot_index");
  const positions = rankedPositions(context);
  return { ...positions[index % positions.length] };
}

/** Canonicalize the frozen collider snapshot, independent of JSONB object-key order. */
export function parseRankedReplayContext(value: unknown): RankedReplayContext | null {
  const exact = (value: unknown, keys: readonly string[]): value is Record<string, unknown> => record(value) && Object.keys(value).length === keys.length && only(value, keys);
  const number = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && Math.abs(value) <= 100;
  const vector = (value: unknown) => exact(value, ["x", "y", "z"]) && number(value.x) && number(value.y) && number(value.z)
    ? { x: value.x, y: value.y, z: value.z } : null;
  if (!record(value) || (value.engine !== "fixed-line-makes-v1" && value.engine !== ACTIVE_FREE_THROW_ENGINE) ||
    !exact(value, value.engine === "fixed-line-makes-v1" ? ["engine", "court"] : ["engine", "court", "positions", "physics"]) ||
    !exact(value.court, ["release", "ballRadius", "rim", "backboard"])) return null;
  const court = value.court;
  if (!exact(court.rim, ["center", "radius", "tubeRadius", "scoringHeight"]) || !exact(court.backboard, ["center", "halfSize"])) return null;
  const release = vector(court.release), rimCenter = vector(court.rim.center), boardCenter = vector(court.backboard.center), halfSize = vector(court.backboard.halfSize);
  if (!release || !rimCenter || !boardCenter || !halfSize || !number(court.ballRadius) || court.ballRadius <= 0 ||
    !number(court.rim.radius) || court.rim.radius <= 0 || !number(court.rim.tubeRadius) || court.rim.tubeRadius <= 0 ||
    !number(court.rim.scoringHeight) || Object.values(halfSize).some(value => value <= 0)) return null;
  const normalizedCourt: PracticeCourt = { release, ballRadius: court.ballRadius,
    rim: { center: rimCenter, radius: court.rim.radius, tubeRadius: court.rim.tubeRadius, scoringHeight: court.rim.scoringHeight },
    backboard: { center: boardCenter, halfSize } };
  if (value.engine === "fixed-line-makes-v1") return { engine: value.engine, court: normalizedCourt };
  if (!Array.isArray(value.positions) || value.positions.length !== 9 || !exact(value.physics, ["powerPerPercent"]) || value.physics.powerPerPercent !== 0.042) return null;
  const positions = Array.from(value.positions, vector);
  if (positions.some(position => !position || position.y !== release.y || Math.abs(position.x - release.x) > 2.2 ||
    position.z < release.z - .8 || position.z > release.z + 1.8)) return null;
  return { engine: ACTIVE_FREE_THROW_ENGINE, court: normalizedCourt, positions: positions as PracticeVector[], physics: { powerPerPercent: 0.042 } };
}

/** Strict, normalized server configuration; missing gameplay fields never acquire defaults. */
export function parseFreeThrowPolicy(value: unknown): FreeThrowPolicy | null {
  if (!record(value) || !only(value, ["ruleSetId", "engine", "shots", "durationMs", "minShotIntervalMs", "maxRunsPerWeek", "calendar"]) ||
    typeof value.ruleSetId !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.ruleSetId) || value.ruleSetId.length > 64 ||
    (value.engine !== "fixed-line-makes-v1" && value.engine !== ACTIVE_FREE_THROW_ENGINE) || !bounded(value.shots, 1, 100) || !bounded(value.durationMs, 1, 300000) ||
    !bounded(value.minShotIntervalMs, 1, 60000) || (value.maxRunsPerWeek !== null && !bounded(value.maxRunsPerWeek, 1, 1000)) ||
    value.minShotIntervalMs * (value.shots - 1) >= value.durationMs) return null;
  const calendar = parseRankedCalendar(value.calendar === undefined ? PROVISIONAL_RANKED_CALENDAR : value.calendar);
  if (!calendar) return null;
  return { ruleSetId: value.ruleSetId, engine: value.engine, shots: value.shots, durationMs: value.durationMs,
    minShotIntervalMs: value.minShotIntervalMs, maxRunsPerWeek: value.maxRunsPerWeek, calendar };
}

export function parseRankedCalendar(calendar: unknown): RankedCalendar | null {
  if (!record(calendar) || !only(calendar, ["timeZone", "startsOn", "hour", "minute"]) || typeof calendar.timeZone !== "string" ||
    !/^[A-Za-z0-9_+\-/]{1,64}$/.test(calendar.timeZone) || !bounded(calendar.startsOn, 1, 7) ||
    !bounded(calendar.hour, 0, 23) || !bounded(calendar.minute, 0, 59)) return null;
  try { new Intl.DateTimeFormat("en", { timeZone: calendar.timeZone }).format(0); } catch { return null; }
  return { timeZone: calendar.timeZone, startsOn: calendar.startsOn, hour: calendar.hour, minute: calendar.minute };
}

const DAY = 86400000;
/** Resolve civil boundaries from IANA offsets. Ambiguous/nonexistent times fail closed. */
export function rankedPeriod(nowMs: number, calendar: RankedCalendar): RankedPeriod & { endsAtMs: number } {
  if (!safeInteger(nowMs) || nowMs < 0 || nowMs > 253402214400000) throw new Error("invalid_clock");
  const formatter = new Intl.DateTimeFormat("en-CA", { timeZone: calendar.timeZone, hourCycle: "h23",
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const civil = (instant: number) => {
    const parts = Object.fromEntries(formatter.formatToParts(instant).map(part => [part.type, part.value]));
    return Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute), Number(parts.second));
  };
  const resolve = (wall: number) => {
    const offsets = new Set([-2, -1, 0, 1, 2].map(days => civil(wall + days * DAY) - (wall + days * DAY)));
    const matches = [...offsets].map(offset => wall - offset).filter(instant => civil(instant) === wall);
    if (matches.length !== 1) throw new Error("unsupported_week_boundary");
    return matches[0];
  };
  const local = new Date(civil(Math.floor(nowMs / 1000) * 1000));
  const weekday = ((local.getUTCDay() + 6) % 7) + 1;
  let wall = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() - (weekday - calendar.startsOn + 7) % 7, calendar.hour, calendar.minute);
  if (resolve(wall) > nowMs) wall -= 7 * DAY;
  const startsAtMs = resolve(wall), endsAtMs = resolve(wall + 7 * DAY);
  const date = new Date(wall);
  date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 6) % 7 + 3);
  const year = date.getUTCFullYear();
  const week = 1 + Math.round((date.getTime() - Date.UTC(year, 0, 4, calendar.hour, calendar.minute)) / (7 * DAY));
  return { week: `${year}-W${String(week).padStart(2, "0")}`, startsAtMs, endsAtMs };
}

/** Replay fixed 240Hz physics. No reported baskets, totals, origins or elapsed clocks are trusted. */
export function simulateRankedShot(input: Pick<ShotInput, "direction" | "power">, context = rankedReplayContext(), index = 0) {
  const origin = rankedShotPosition(context, index);
  const ball = launchBall(context.court, input, origin, rankedPhysics(context));
  for (let step = 0; step < 1441 && !ball.finished; step++) stepBall(ball, context.court);
  if (!ball.finished) throw new Error("unbounded_replay");
  return { outcome: (ball.scored ? 1 : 0) as ShotOutcome, durationMs: Math.ceil(ball.time * 1000), origin };
}
export function replayRankedRound(shots: readonly ShotInput[], elapsedMs: number, policy: FreeThrowPolicy, context = rankedReplayContext(policy.engine)): ValidatedRound {
  if (context.engine !== policy.engine) throw new Error("inconsistent_replay_version");
  if (shots.length !== policy.shots) throw new Error("incomplete_round");
  let finishedAtMs = 0;
  const outcomes: ShotOutcome[] = [];
  for (const shot of shots) {
    if (shot.atMs < finishedAtMs) throw new Error("overlapping_shots");
    const simulated = simulateRankedShot(shot, context, outcomes.length);
    finishedAtMs = shot.atMs + simulated.durationMs;
    if (finishedAtMs > elapsedMs || finishedAtMs >= policy.durationMs) throw new Error("unfinished_round");
    outcomes.push(simulated.outcome);
  }
  return { inputs: shots.map(shot => ({ ...shot })), outcomes, statistics: summarizeOutcomes(outcomes), replayContext: structuredClone(context) };
}
export function replayRankedFreeThrows(shots: readonly ShotInput[], elapsedMs: number, policy: FreeThrowPolicy): number {
  return replayRankedRound(shots, elapsedMs, policy).statistics.score;
}
