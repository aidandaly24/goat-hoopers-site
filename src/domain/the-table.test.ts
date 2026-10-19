import { describe, expect, it } from "vitest";
import { computeTeamValues, projectTableLeague } from "./the-table";
import type { Matchup } from "./matchup";
import type { Standing } from "./standing";
import type { StockQuote } from "./stock";
import type { Team } from "./team";

function team(id: string): Team {
  return {
    id,
    name: `Team ${id}`,
    managerName: `Manager ${id}`,
    avatar: null,
    wins: 0,
    losses: 0,
    ties: 0,
    pointsFor: 0,
    pointsAgainst: 0,
  };
}

function quote(playerId: string, price: number): StockQuote {
  return {
    playerId,
    playerName: `Player ${playerId}`,
    position: null,
    nbaTeam: null,
    price,
    prevPrice: null,
    change: null,
    changePct: null,
    trend: "flat",
    ownership: 0,
    rookiePick: null,
  };
}

function standing(
  t: Team,
  record: { wins?: number; losses?: number; ties?: number; pointsFor?: number } = {}
): Standing {
  return {
    team: t,
    rank: 1,
    wins: record.wins ?? t.wins,
    losses: record.losses ?? t.losses,
    ties: record.ties ?? t.ties,
    pointsFor: record.pointsFor ?? t.pointsFor,
    gamesBack: 0,
  };
}

function matchup(
  home: Team,
  away: Team,
  homePoints: number | null,
  awayPoints: number | null,
  week = 1
): Matchup {
  return { week, home, away, homePoints, awayPoints };
}

describe("computeTeamValues", () => {
  it("sums modeled prices across the roster and counts coverage", () => {
    const rows = computeTeamValues(
      [{ team: team("1"), playerIds: ["a", "b", "c"] }],
      [quote("a", 100.5), quote("b", 50.25)]
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].totalValue).toBe(150.75);
    expect(rows[0].pricedPlayers).toBe(2);
    expect(rows[0].rosterPlayers).toBe(3);
    // Coverage is partial (2 of 3), so no rank: the missing quote could
    // move this total past any complete one.
    expect(rows[0].rank).toBeNull();
  });

  it("ranks a fully priced roster in a fully priced league", () => {
    const rows = computeTeamValues(
      [{ team: team("1"), playerIds: ["a", "b"] }],
      [quote("a", 100.5), quote("b", 50.25)]
    );
    expect(rows[0].rank).toBe(1);
  });

  it("treats an unpriced roster as unknown (null), never $0", () => {
    const rows = computeTeamValues(
      [{ team: team("1"), playerIds: ["x", "y"] }],
      [quote("z", 10)]
    );
    expect(rows[0].totalValue).toBeNull();
    expect(rows[0].pricedPlayers).toBe(0);
    expect(rows[0].rosterPlayers).toBe(2);
    expect(rows[0].rank).toBeNull();
  });

  it("orders priced totals descending with null totals last", () => {
    const rows = computeTeamValues(
      [
        { team: team("1"), playerIds: ["a"] },
        { team: team("2"), playerIds: ["b"] },
        { team: team("3"), playerIds: ["c"] },
      ],
      [quote("a", 40), quote("b", 90)]
    );
    expect(rows.map((r) => r.team.id)).toEqual(["2", "1", "3"]);
    expect(rows[2].totalValue).toBeNull();
  });

  it("leaves every rank unknown when all quotes are missing", () => {
    const rows = computeTeamValues(
      [
        { team: team("2"), playerIds: ["a"] },
        { team: team("1"), playerIds: ["b"] },
      ],
      []
    );
    // No fabricated 1, 2, …: nobody is comparable, nobody is ranked.
    expect(rows.map((r) => r.rank)).toEqual([null, null]);
    expect(rows.map((r) => r.totalValue)).toEqual([null, null]);
    // Display order stays deterministic (roster id) even unranked.
    expect(rows.map((r) => r.team.id)).toEqual(["1", "2"]);
  });

  it("does not rank a partial subtotal below a complete total", () => {
    const rows = computeTeamValues(
      [
        { team: team("1"), playerIds: ["a", "b"] },
        { team: team("2"), playerIds: ["c"] },
      ],
      [quote("a", 40), quote("c", 90)]
    );
    // Display order still shows the larger priced figure first…
    expect(rows.map((r) => r.team.id)).toEqual(["2", "1"]);
    expect(rows[1].totalValue).toBe(40);
    expect(rows[1].pricedPlayers).toBe(1);
    expect(rows[1].rosterPlayers).toBe(2);
    // …but neither row is ranked: the unpriced player's quote could put
    // the 40 subtotal above 90, so the comparison itself is unknown.
    expect(rows.map((r) => r.rank)).toEqual([null, null]);
  });

  it("shares the rank between equal complete totals", () => {
    const rows = computeTeamValues(
      [
        { team: team("10"), playerIds: ["a"] },
        { team: team("2"), playerIds: ["b"] },
        { team: team("3"), playerIds: ["c"] },
      ],
      [quote("a", 75), quote("b", 75), quote("c", 50)]
    );
    // Equal totals tie at rank 1 — roster id must not split them — and
    // the next total takes the competition rank after the tie.
    expect(rows.map((r) => r.team.id)).toEqual(["2", "10", "3"]);
    expect(rows.map((r) => r.rank)).toEqual([1, 1, 3]);
  });

  it("ranks distinct complete totals in order", () => {
    const rows = computeTeamValues(
      [
        { team: team("1"), playerIds: ["a"] },
        { team: team("2"), playerIds: ["b"] },
        { team: team("3"), playerIds: ["c"] },
      ],
      [quote("a", 40), quote("b", 90), quote("c", 65)]
    );
    expect(rows.map((r) => r.team.id)).toEqual(["2", "3", "1"]);
    expect(rows.map((r) => r.rank)).toEqual([1, 2, 3]);
  });

  it("ignores quotes for players on no roster", () => {
    const rows = computeTeamValues(
      [{ team: team("1"), playerIds: ["a"] }],
      [quote("a", 10), quote("free-agent", 999)]
    );
    expect(rows[0].totalValue).toBe(10);
  });
});

describe("projectTableLeague", () => {
  it("ignores the in-progress week's live scores: no streaks, no results", () => {
    // The dot's probe: week 1 in progress, both teams 0–0, live scores
    // 20–10 on the board. Score presence is not completion provenance.
    const t1 = team("1");
    const t2 = team("2");
    const { rows, hasResults } = projectTableLeague(
      [standing(t1, { pointsFor: 2000 }), standing(t2, { pointsFor: 1000 })],
      [[matchup(t1, t2, 20, 10)]],
      1
    );
    expect(rows.map((r) => r.streak)).toEqual([null, null]);
    expect(hasResults).toBe(false);
  });

  it("does not treat live points-for as a result while records are 0–0", () => {
    const t1 = team("1");
    const t2 = team("2");
    const { hasResults } = projectTableLeague(
      [standing(t1, { pointsFor: 15234 }), standing(t2, { pointsFor: 14901 })],
      [[]],
      3
    );
    expect(hasResults).toBe(false);
  });

  it("counts streaks from completed weeks only, never the live week", () => {
    const t1 = team("1");
    const t2 = team("2");
    // Week 1 final: t1 won 20–10. Week 2 is live with t1 losing 10–30 —
    // the live week must not flip or extend the streak.
    const { rows, hasResults } = projectTableLeague(
      [standing(t1), standing(t2)],
      [
        [matchup(t1, t2, 20, 10, 1)],
        [matchup(t2, t1, 30, 10, 2)],
      ],
      2
    );
    expect(rows.map((r) => r.streak)).toEqual([1, -1]);
    expect(hasResults).toBe(true);
  });

  it("accepts recorded standings results as final evidence on their own", () => {
    const t1 = team("1");
    const t2 = team("2");
    const { rows, hasResults } = projectTableLeague(
      [standing(t1, { wins: 1 }), standing(t2, { losses: 1 })],
      [],
      2
    );
    expect(hasResults).toBe(true);
    // …but without final-matchup evidence there is still no streak.
    expect(rows.map((r) => r.streak)).toEqual([null, null]);
  });

  it("stays unranked and streakless before the season starts", () => {
    const t1 = team("1");
    const t2 = team("2");
    const { rows, hasResults } = projectTableLeague(
      [standing(t1), standing(t2)],
      [],
      0
    );
    expect(rows.map((r) => r.streak)).toEqual([null, null]);
    expect(hasResults).toBe(false);
  });
});
