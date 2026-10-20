import { expect, it } from "vitest";
import { decodeCompetitionBoard } from "./competition-board";
const entry = { rank: 1, username: "player_one", teamId: null, score: 1, makes: 1, attempts: 2, accuracy: .5,
  longestStreak: 1, endingStreak: 0, achievedAtMs: 1000, isCurrentUser: false };
const board = { gameId: "free-throw", kind: "weekly", label: "Test only", phase: "open", asOfMs: 1001, periodId: "test-week-1", scoreVersion: "a".repeat(64), entries: [entry] };
it("projects only public fields and refuses inconsistent scores or malformed board payloads", () => {
  expect(decodeCompetitionBoard({ ...board, secret: "private", entries: [{ ...entry, accountId: "private" }] })).toEqual(board);
  for (const change of [{ score: 2 }, { accuracy: 50 }, { username: "bad name" }, { teamId: "11" }, { endingStreak: 2 }])
    expect(decodeCompetitionBoard({ ...board, entries: [{ ...entry, ...change }] })).toBeNull();
  expect(decodeCompetitionBoard({ ...board, entries: Array(101).fill(entry) })).toBeNull();
  expect(decodeCompetitionBoard({ ...board, scoreVersion: "unversioned" })).toBeNull();
});
