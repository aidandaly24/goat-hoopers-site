import { expect, it } from "vitest";
import { compareRecord, parseRankedRecordFeedback } from "./ranked-record-feedback";
import { sampleScore } from "@/data/ranked-free-throw/__tests__/fixtures";

const feedback = { version: 1, scoreId: sampleScore.id, acceptedAtMs: sampleScore.achievedAtMs, periodId: "test-week-1",
  scoreVersion: "a".repeat(64), scope: "everyone", personalBest: compareRecord(2, 0), weeklyRecord: compareRecord(2, 2), allTimeRecord: compareRecord(2, 2) };

it.each([[0, null, "first"], [0, 0, "tied"], [1, 0, "beaten"], [2, 2, "tied"], [0, 2, "below"]] as const)
  ("compares score %s against %s as %s", (score, previous, outcome) => {
    expect(compareRecord(score, previous)).toEqual({ previousScore: previous, outcome });
  });

it("projects only a consistent acceptance-bound public contract", () => {
  expect(parseRankedRecordFeedback({ ...feedback, private: "discarded" }, sampleScore)).toEqual(feedback);
});

it.each([undefined, null, {}, { ...feedback, version: 2 }, { ...feedback, scope: "league" },
  { ...feedback, scoreId: sampleScore.runId }, { ...feedback, acceptedAtMs: sampleScore.achievedAtMs + 1 },
  { ...feedback, periodId: "bad period" }, { ...feedback, scoreVersion: "bad" },
  { ...feedback, personalBest: { previousScore: 0, outcome: "first" } },
  { ...feedback, weeklyRecord: { previousScore: 2, outcome: "beaten" } },
  { ...feedback, weeklyRecord: { previousScore: -1, outcome: "beaten" } },
  { ...feedback, weeklyRecord: { previousScore: 3, outcome: "below" } },
  { ...feedback, allTimeRecord: compareRecord(2, null) }, { ...feedback, allTimeRecord: compareRecord(2, 1) },
])("suppresses malformed, contradictory or misbound optional metadata: %j", value => {
  expect(parseRankedRecordFeedback(value, sampleScore)).toBeNull();
});
