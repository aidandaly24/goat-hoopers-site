/**
 * streaks.test.ts — baseline regression coverage for the signed
 * completed-game streak rule (currentStreak).
 *
 * Trailing-pending-week preservation lands with issue #29; this file
 * locks the current completed-game behavior first.
 */
import { describe, expect, it } from "vitest";
import { currentStreak } from "@/data/transform";
import { pendingMatchup, tiedMatchup, winForA, winForB } from "./fixtures";

describe("currentStreak baseline", () => {
  it("counts consecutive completed wins", () => {
    expect(currentStreak("1", [[winForA(1)], [winForA(2)]])).toBe(2);
  });

  it("counts consecutive completed losses as negative", () => {
    expect(currentStreak("1", [[winForB(1)], [winForB(2)]])).toBe(-2);
  });

  it("ends the streak on a finalized tie", () => {
    expect(
      currentStreak("1", [[winForA(1)], [winForA(2)], [tiedMatchup(3)]])
    ).toBe(0);
  });

  it("ends the streak on an opposite result", () => {
    expect(currentStreak("1", [[winForA(1)], [winForB(2)]])).toBe(-1);
  });

  it("returns zero with no games", () => {
    expect(currentStreak("1", [])).toBe(0);
  });

  it("treats finalized zero scores as a real result, not missing", () => {
    // 0-10 is a loss, not a pending game.
    expect(currentStreak("1", [[winForA(1, 0, 10)]])).toBe(-1);
  });

  it("ignores weeks where the team has no matchup", () => {
    expect(currentStreak("1", [[pendingMatchup(1)]])).toBe(0);
  });
});
