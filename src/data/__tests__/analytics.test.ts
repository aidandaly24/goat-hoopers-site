/**
 * analytics.test.ts — the completed-weeks boundary for the intel
 * analytics (issue #224 P1).
 *
 * Sleeper serves the current week's points live. Before the fix, the
 * consumers of the analytics assembly treated any scored matchup as
 * final: power rankings rebuilt records from partials, playoff odds
 * updated Elo on partials, the record book enshrined a live blowout,
 * and matchup previews named a "pick" in week 1 off 0.0–0.0
 * projections. Every scenario below pairs a genuinely completed week
 * with an in-progress week carrying live scores.
 */
import { describe, expect, it } from "vitest";
import {
  computeMatchupPreviews,
  computePlayoffOdds,
  computePowerRankings,
  computeRecordBook,
} from "../analytics";
import type { Matchup } from "@/domain/matchup";
import { teamA, teamB, winForA, winForB } from "./fixtures";

/** A scored matchup in a week that is still being played: live partials. */
const livePartial = (
  week: number,
  homePoints: number,
  awayPoints: number,
): Matchup => ({ week, home: teamA(), away: teamB(), homePoints, awayPoints });

describe("computePowerRankings", () => {
  it("returns null when the only scored week is still in progress", () => {
    expect(
      computePowerRankings({
        teams: [teamA(), teamB()],
        matchupsByWeek: [[livePartial(1, 80, 40)]],
        currentWeek: 1,
      }),
    ).toBeNull();
  });

  it("rebuilds records from completed weeks only, never from live partials", () => {
    const rankings = computePowerRankings({
      teams: [teamA(), teamB()],
      matchupsByWeek: [
        [winForA(1)], // week 1, completed: A beat B
        [livePartial(2, 10, 200)], // week 2, live: B is routing A — not a result
      ],
      currentWeek: 2,
    });
    expect(rankings).not.toBeNull();
    // Week 1's result stands: A first, B second. Had the live rout
    // leaked in as a result, B would own the top spot.
    expect(rankings!.map((r) => r.team.id)).toEqual(["1", "2"]);
    expect(rankings!.map((r) => r.rank)).toEqual([1, 2]);
  });

  it("still counts every week once those weeks are genuinely complete", () => {
    const rankings = computePowerRankings({
      teams: [teamA(), teamB()],
      matchupsByWeek: [[winForA(1)], [winForB(2)], [winForB(3)]],
      currentWeek: 4,
    });
    expect(rankings).not.toBeNull();
    expect(rankings![0].team.id).toBe("2");
  });
});

describe("computePlayoffOdds", () => {
  it("returns null when nothing has completed, however live the scores look", () => {
    expect(
      computePlayoffOdds({
        teams: [teamA(), teamB()],
        matchupsByWeek: [[livePartial(1, 120, 30)]],
        playoffSpots: 1,
        playoffWeekStart: 3,
        week: 1,
      }),
    ).toBeNull();
  });

  it("produces odds from completed weeks while the current week is live", () => {
    const odds = computePlayoffOdds({
      teams: [teamA(), teamB()],
      matchupsByWeek: [[winForA(1)], [livePartial(2, 5, 190)]],
      playoffSpots: 1,
      playoffWeekStart: 3,
      week: 2,
    });
    expect(odds).not.toBeNull();
    expect(odds).toHaveLength(2);
  });
});

describe("computeRecordBook", () => {
  it("returns null when the only blowout is a live partial", () => {
    expect(
      computeRecordBook({
        matchupsByWeek: [[livePartial(1, 300, 10)]],
        currentWeek: 1,
      }),
    ).toBeNull();
  });

  it("keeps live partials out of every list", () => {
    const book = computeRecordBook({
      matchupsByWeek: [
        [winForA(1, 100, 90)], // completed: margin 10, top score 100
        [livePartial(2, 300, 10)], // live: would dwarf both lists if counted
      ],
      currentWeek: 2,
    });
    expect(book).not.toBeNull();
    expect(book!.biggestBlowouts[0].margin).toBe(10);
    expect(book!.highestScores[0]).toMatchObject({ week: 1, points: 100 });
    expect(book!.highestScores.every((s) => s.week === 1)).toBe(true);
  });
});

describe("computeMatchupPreviews", () => {
  it("returns null on zero evidence — week 1 pre-tip is not previewable", () => {
    // Pre-fix this returned a full slate: 0.0–0.0 projections, 50%
    // win probability, and the home team named as the pick.
    expect(
      computeMatchupPreviews({
        teams: [teamA(), teamB()],
        matchupsByWeek: [[livePartial(1, 0, 0)]],
        currentWeek: 1,
      }),
    ).toBeNull();
  });

  it("names no pick on an exact projection tie", () => {
    // Matchups embed the same full Team objects the loader passes in
    // `teams` — projections read their aggregates.
    const a = teamA({ pointsFor: 10000, ties: 1 });
    const b = teamB({ pointsFor: 10000, ties: 1 });
    const previews = computeMatchupPreviews({
      teams: [a, b],
      matchupsByWeek: [
        [{ week: 1, home: a, away: b, homePoints: 100, awayPoints: 100 }],
        [{ week: 2, home: a, away: b, homePoints: null, awayPoints: null }],
      ],
      currentWeek: 2,
    });
    expect(previews).not.toBeNull();
    expect(previews).toHaveLength(1);
    expect(previews![0].matchup.week).toBe(2);
    expect(previews![0].homeWinPct).toBeCloseTo(0.5, 3);
    expect(previews![0].pick).toBeNull();
  });

  it("still picks the favorite once completed evidence separates the teams", () => {
    const a = teamA({ pointsFor: 20000, wins: 2 });
    const b = teamB({ pointsFor: 10000, losses: 2 });
    const previews = computeMatchupPreviews({
      teams: [a, b],
      matchupsByWeek: [
        [{ week: 1, home: a, away: b, homePoints: 100, awayPoints: 90 }],
        [{ week: 2, home: a, away: b, homePoints: 100, awayPoints: 90 }],
        [{ week: 3, home: a, away: b, homePoints: null, awayPoints: null }],
      ],
      currentWeek: 3,
    });
    expect(previews).not.toBeNull();
    expect(previews![0].matchup.week).toBe(3);
    expect(previews![0].pick?.id).toBe("1");
    expect(previews![0].projectedHome).toBeGreaterThan(previews![0].projectedAway);
  });
});
