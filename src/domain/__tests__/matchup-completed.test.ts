/**
 * matchup-completed.test.ts — the shared completed-weeks boundary
 * (issue #224 P1).
 *
 * Sleeper serves the current week's points live (0 pre-tip, partials
 * mid-week), so score presence is not completion evidence: a week is
 * complete only once a later week is current. These tests pin
 * `completedMatchupsByWeek` and its composition with `signedStreak` —
 * the profile streak bug was a live partial in the in-progress week
 * counting as a result.
 */
import { describe, expect, it } from "vitest";
import { completedMatchupsByWeek, signedStreak } from "@/domain/matchup";
import type { Matchup } from "@/domain/matchup";
import type { Team } from "@/domain/team";

const team = (id: string): Team => ({
  id,
  name: `Team ${id}`,
  managerName: `mgr-${id}`,
  avatar: null,
  wins: 0,
  losses: 0,
  ties: 0,
  pointsFor: 0,
  pointsAgainst: 0,
});

/** Team 1 at home vs team 2; null points = unplayed. */
const game = (
  week: number,
  homePoints: number | null,
  awayPoints: number | null,
): Matchup => ({ week, home: team("1"), away: team("2"), homePoints, awayPoints });

describe("completedMatchupsByWeek", () => {
  it("completes nothing while week 1 is current, even with scores present", () => {
    // Pre-tip Sleeper serves 0–0 placeholders; mid-week it serves
    // partials. Neither is a completed week.
    expect(completedMatchupsByWeek([[game(1, 0, 0)]], 1)).toEqual([]);
    expect(completedMatchupsByWeek([[game(1, 80, 40)]], 1)).toEqual([]);
  });

  it("completes nothing in the preseason (current week 0)", () => {
    expect(completedMatchupsByWeek([[game(1, 100, 90)]], 0)).toEqual([]);
  });

  it("returns exactly the weeks before the current week", () => {
    const weeks = [
      [game(1, 100, 90)],
      [game(2, 100, 90)],
      [game(3, 55, 20)], // in progress: live partials
    ];
    expect(completedMatchupsByWeek(weeks, 3)).toEqual([weeks[0], weeks[1]]);
  });

  it("returns every supplied week once a later week is current", () => {
    const weeks = [[game(1, 100, 90)], [game(2, 90, 100)]];
    expect(completedMatchupsByWeek(weeks, 5)).toEqual(weeks);
  });
});

describe("streaks composed with the boundary", () => {
  it("a live partial loss in the current week does not break a win streak", () => {
    const weeks = [
      [game(1, 100, 90)], // win
      [game(2, 100, 90)], // win
      [game(3, 10, 200)], // current week: team 1 trailing big, still live
    ];
    // The pre-fix composition ran signedStreak over every week and
    // reported -1 (the partial counted as the latest final).
    expect(signedStreak("1", completedMatchupsByWeek(weeks, 3))).toBe(2);
  });

  it("a live 0–0 in the current week neither extends nor ends a streak", () => {
    const weeks = [[game(1, 100, 90)], [game(2, 0, 0)]];
    expect(signedStreak("1", completedMatchupsByWeek(weeks, 2))).toBe(1);
  });

  it("genuinely completed weeks still count in full", () => {
    const weeks = [[game(1, 100, 90)], [game(2, 90, 100)], [game(3, 90, 100)]];
    expect(signedStreak("1", completedMatchupsByWeek(weeks, 4))).toBe(-2);
  });
});
