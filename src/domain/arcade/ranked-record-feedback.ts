import { rankedId, record, safeInteger, type RankedScore } from "./ranked-free-throw";

export type RecordComparison = { previousScore: number | null; outcome: "first" | "beaten" | "tied" | "below" };
/** Acceptance-time score comparisons, not current rank or a League award. */
export type RankedRecordFeedback = {
  version: 1;
  /** Stable event key: consumers dedupe celebrations by this accepted score ID. */
  scoreId: string;
  acceptedAtMs: number;
  periodId: string;
  scoreVersion: string;
  scope: "everyone";
  personalBest: RecordComparison;
  weeklyRecord: RecordComparison;
  allTimeRecord: RecordComparison;
};
/** Only the first accepted POST may include feedback. Recovery remains score-only. */
export type RankedAcceptedScore = RankedScore & { recordFeedback?: RankedRecordFeedback | null };

export function compareRecord(score: number, previousScore: number | null): RecordComparison {
  return { previousScore, outcome: previousScore === null ? "first" : score > previousScore ? "beaten" : score === previousScore ? "tied" : "below" };
}

/** Discard optional malformed/misbound feedback without losing a valid saved score. */
export function parseRankedRecordFeedback(value: unknown, score: RankedScore): RankedRecordFeedback | null {
  if (!record(value) || value.version !== 1 || value.scope !== "everyone" || !rankedId(value.scoreId) || value.scoreId !== score.id ||
    value.acceptedAtMs !== score.achievedAtMs || typeof value.periodId !== "string" || !/^[a-z0-9-]{3,80}$/.test(value.periodId) ||
    typeof value.scoreVersion !== "string" || !/^[a-f0-9]{64}$/.test(value.scoreVersion)) return null;
  const comparison = (candidate: unknown): RecordComparison | null => {
    if (!record(candidate) || !(candidate.previousScore === null || safeInteger(candidate.previousScore) && candidate.previousScore >= 0 && candidate.previousScore <= score.attempts)) return null;
    const expected = compareRecord(score.score, candidate.previousScore);
    return candidate.outcome === expected.outcome ? expected : null;
  };
  const personalBest = comparison(value.personalBest), weeklyRecord = comparison(value.weeklyRecord), allTimeRecord = comparison(value.allTimeRecord);
  if (!personalBest || !weeklyRecord || !allTimeRecord) return null;
  // Everyone all-time includes both this account's history and the exact week.
  if (allTimeRecord.previousScore === null ? personalBest.previousScore !== null || weeklyRecord.previousScore !== null :
    (personalBest.previousScore ?? -1) > allTimeRecord.previousScore || (weeklyRecord.previousScore ?? -1) > allTimeRecord.previousScore) return null;
  return { version: 1, scoreId: value.scoreId, acceptedAtMs: score.achievedAtMs, periodId: value.periodId,
    scoreVersion: value.scoreVersion, scope: "everyone", personalBest, weeklyRecord, allTimeRecord };
}
