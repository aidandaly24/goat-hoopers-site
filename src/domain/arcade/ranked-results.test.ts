import { describe, expect, it } from "vitest";
import { decodeOutcomes, parseRankedReplayContext, rankedReplayContext, replayRankedRound, summarizeOutcomes, type ShotOutcome } from "./ranked-free-throw";
import { policy, submission } from "@/data/ranked-free-throw/__tests__/fixtures";

describe("ordered replay outcomes and derived run aggregates", () => {
  it("resets on misses and distinguishes longest from ending streak", () => {
    expect(summarizeOutcomes([1, 1, 1, 0, 1, 1])).toEqual({ score: 5, makes: 5, attempts: 6, accuracy: 5 / 6, longestStreak: 3, endingStreak: 2 });
    expect(summarizeOutcomes([1, 1, 0])).toMatchObject({ score: 2, longestStreak: 2, endingStreak: 0 });
    expect(summarizeOutcomes([0, 0])).toEqual({ score: 0, makes: 0, attempts: 2, accuracy: 0, longestStreak: 0, endingStreak: 0 });
  });
  it("uses null accuracy for zero attempts and forbids empty completed rounds", () => {
    expect(summarizeOutcomes([])).toEqual({ score: 0, makes: 0, attempts: 0, accuracy: null, longestStreak: 0, endingStreak: 0 });
    expect(() => replayRankedRound([], 15000, policy)).toThrow("incomplete_round");
    expect(() => decodeOutcomes("")).toThrow("invalid_outcomes");
  });
  it("replays ordered mixed results from inputs, preserving evidence without mutating it", () => {
    const shots = [submission.shots[0], { ...submission.shots[1], direction: 14 }];
    const before = structuredClone(shots), result = replayRankedRound(shots, 15000, policy);
    expect(result.outcomes).toEqual([1, 0]);
    expect(result.statistics).toEqual({ score: 1, makes: 1, attempts: 2, accuracy: .5, longestStreak: 1, endingStreak: 0 });
    expect(shots).toEqual(before); expect(result.inputs).toEqual(before); expect(result.inputs).not.toBe(shots);
  });
  it("round-trips compact bits and rejects corrupt or unbounded sequences", () => {
    const outcomes = decodeOutcomes("011010");
    expect(outcomes).toEqual([0, 1, 1, 0, 1, 0]); expect(outcomes.join("")).toBe("011010");
    for (const invalid of [null, [], "10x", "1".repeat(101), "10\n"]) expect(() => decodeOutcomes(invalid)).toThrow();
    for (const invalid of [[2], [true], Array(2), Array(101).fill(1)]) expect(() => summarizeOutcomes(invalid as ShotOutcome[])).toThrow();
  });
  it("canonicalizes JSONB collider keys while retaining a frozen independent snapshot", () => {
    const snapshot = rankedReplayContext();
    const reordered = JSON.parse(JSON.stringify(snapshot, (_key, value) => value && typeof value === "object" && !Array.isArray(value) ? Object.fromEntries(Object.entries(value).reverse()) : value));
    expect(JSON.stringify(parseRankedReplayContext(reordered))).toBe(JSON.stringify(snapshot));
    snapshot.court.release.x = 1; expect(rankedReplayContext().court.release.x).toBe(0);
    expect(parseRankedReplayContext({ ...snapshot, engine: "unknown" })).toBeNull();
  });
});
