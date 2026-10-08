/**
 * streaks.test.ts — regression coverage for the signed completed-game
 * streak rule (issue #29).
 *
 * The streak counts consecutive wins/losses from the latest COMPLETED
 * game, skipping trailing pending/future weeks. An unplayed game is not
 * a tie or a loss.
 */
import { describe, expect, it } from "vitest";
import { signedStreak } from "@/domain/matchup";
import { pendingMatchup, tiedMatchup, winForA, winForB } from "./fixtures";

describe("signedStreak", () => {
  it("counts consecutive completed wins", () => {
    expect(signedStreak("1", [[winForA(1)], [winForA(2)]])).toBe(2);
  });

  it("counts consecutive completed losses as negative", () => {
    expect(signedStreak("1", [[winForB(1)], [winForB(2)]])).toBe(-2);
  });

  it("ends the streak on a finalized tie", () => {
    expect(
      signedStreak("1", [[winForA(1)], [winForA(2)], [tiedMatchup(3)]])
    ).toBe(0);
  });

  it("ends the streak on an opposite result", () => {
    expect(signedStreak("1", [[winForA(1)], [winForB(2)]])).toBe(-1);
  });

  it("returns zero with no games", () => {
    expect(signedStreak("1", [])).toBe(0);
  });

  it("treats finalized zero scores as a real result, not missing", () => {
    // 0-10 is a loss, not a pending game.
    expect(signedStreak("1", [[winForA(1, 0, 10)]])).toBe(-1);
  });

  it("preserves completed wins across trailing pending weeks", () => {
    // The bug: scanning from the end hit the pending week 3 first
    // and returned 0. Expected: skip week 3, count weeks 1-2.
    expect(
      signedStreak("1", [[winForA(1)], [winForA(2)], [pendingMatchup(3)]])
    ).toBe(2);
  });

  it("preserves completed losses across trailing pending weeks", () => {
    expect(
      signedStreak("1", [[winForB(1)], [winForB(2)], [pendingMatchup(3)]])
    ).toBe(-2);
  });

  it("skips multiple trailing pending weeks", () => {
    expect(
      signedStreak("1", [
        [winForA(1)],
        [winForA(2)],
        [pendingMatchup(3)],
        [pendingMatchup(4)],
      ])
    ).toBe(2);
  });

  it("returns zero when all weeks are pending", () => {
    expect(signedStreak("1", [[pendingMatchup(1)]])).toBe(0);
  });

  it("does not join across a missing interior week", () => {
    // Week 2 has no matchup for team 1 (empty array). This is an
    // unknown historical gap, not a confirmed bye — stop, don't skip.
    expect(signedStreak("1", [[winForA(1)], [], [winForA(3)]])).toBe(1);
  });

  it("stops at a pending interior week after completed games", () => {
    // Week 2 is pending but week 3 is final. The pending week 2
    // breaks continuity — only week 3 counts.
    // (In practice this ordering is unusual, but the rule is
    // conservative: don't assume across a gap.)
    expect(
      signedStreak("1", [[winForA(1)], [pendingMatchup(2)], [winForA(3)]])
    ).toBe(1);
  });

  it("handles a one-sided null score as pending", () => {
    // Only one side has a score — still not final.
    const halfPending = {
      ...winForA(2),
      awayPoints: null,
    };
    expect(signedStreak("1", [[winForA(1)], [halfPending]])).toBe(1);
  });
});
