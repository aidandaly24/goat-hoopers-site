import "server-only";
import { createHash } from "node:crypto";
import { parseFreeThrowPolicy, rankedReplayContext } from "@/domain/arcade/ranked-free-throw";
import { parseCompetitionCalendar } from "@/domain/arcade/competition-period";

export const DEFAULT_COMPETITION_POLICY = parseFreeThrowPolicy({ ruleSetId: "free-throw-nine-two-minute-v1", engine: "moving-court-makes-v2",
  shots: 9, durationMs: 120000, minShotIntervalMs: 1000, maxRunsPerWeek: null,
  calendar: { timeZone: "America/New_York", startsOn: 1, hour: 0, minute: 0 } })!;
export const scoreFormatVersion = (policy = DEFAULT_COMPETITION_POLICY) => createHash("sha256").update(JSON.stringify({
  engine: policy.engine, shots: policy.shots, durationMs: policy.durationMs, minShotIntervalMs: policy.minShotIntervalMs,
  context: rankedReplayContext(policy.engine),
})).digest("hex");

/** Empty/unverified schedule never turns the implementation defaults into a live competition. */
export function readCompetitionCalendar(env: Readonly<Record<string, string | undefined>>) {
  if (!env.GOAT_ARCADE_CALENDAR || env.GOAT_ARCADE_CALENDAR.length > 100000) return null;
  try { return parseCompetitionCalendar(JSON.parse(env.GOAT_ARCADE_CALENDAR)); } catch { return null; }
}
