/**
 * standings.test.ts — the hasResults rank gate (issue #224 P1).
 *
 * Before any completed result exists, every team is 0–0 while
 * points-for already ticks up live during week 1. Ranking that drip
 * assigned No. 1 to whichever tied team happened to lead it. Ranks are
 * null until a real win, loss or tie is recorded; display order stays
 * deterministic (wins desc, then points-for desc) either way.
 */
import { describe, expect, it } from "vitest";
import { toStandings } from "../transform";
import { teamA, teamB } from "./fixtures";

describe("toStandings", () => {
  it("assigns no ranks before any result exists, even with live points-for separation", () => {
    const standings = toStandings([
      teamA({ pointsFor: 5000 }),
      teamB({ pointsFor: 9000 }),
    ]);
    expect(standings.map((s) => s.rank)).toEqual([null, null]);
    // Display order is unchanged: the points-for leader lists first,
    // it just isn't "No. 1" yet.
    expect(standings.map((s) => s.team.id)).toEqual(["2", "1"]);
  });

  it("ranks normally once a result is on the books", () => {
    const standings = toStandings([
      teamA({ wins: 1, pointsFor: 5000 }),
      teamB({ losses: 1, pointsFor: 9000 }),
    ]);
    expect(standings.map((s) => s.team.id)).toEqual(["1", "2"]);
    expect(standings.map((s) => s.rank)).toEqual([1, 2]);
  });

  it("a recorded tie is a result: ranks appear", () => {
    const standings = toStandings([
      teamA({ ties: 1, pointsFor: 9000 }),
      teamB({ ties: 1, pointsFor: 5000 }),
    ]);
    expect(standings.map((s) => s.rank)).toEqual([1, 2]);
  });
});
