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
it("keeps modeled records and price points distinct and projects no private fields", () => {
  const base = { rank: 1, username: "player_one", teamId: null, achievedAtMs: 1000, isCurrentUser: false };
  const draft = { ...base, score: 50, metric: { kind: "modeled-record", wins: 50, losses: 32 } };
  expect(decodeCompetitionBoard({ ...board, gameId: "week-2-preview", entries: [{ ...draft, choices: ["private"], source: "private" }] })?.entries).toEqual([draft]);
  expect(decodeCompetitionBoard({ ...board, gameId: "priced-in", entries: [draft] })).toBeNull();
  const price = { ...base, score: 750, metric: { kind: "price-points", correct: 5, rounds: 5 } };
  expect(decodeCompetitionBoard({ ...board, gameId: "priced-in", entries: [price] })?.entries).toEqual([price]);
  for (const change of [{ score: 751 }, { metric: { kind: "price-points", correct: 1, rounds: 5 } }, { metric: { kind: "modeled-record", wins: 83, losses: -1 } }])
    expect(decodeCompetitionBoard({ ...board, gameId: "priced-in", entries: [{ ...price, ...change }] })).toBeNull();
});
