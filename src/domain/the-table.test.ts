import { describe, expect, it } from "vitest";
import { computeTeamValues } from "./the-table";
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
  });

  it("ranks priced totals descending with null totals last", () => {
    const rows = computeTeamValues(
      [
        { team: team("1"), playerIds: ["a"] },
        { team: team("2"), playerIds: ["b"] },
        { team: team("3"), playerIds: ["c"] },
      ],
      [quote("a", 40), quote("b", 90)]
    );
    expect(rows.map((r) => r.team.id)).toEqual(["2", "1", "3"]);
    expect(rows.map((r) => r.rank)).toEqual([1, 2, 3]);
    expect(rows[2].totalValue).toBeNull();
  });

  it("breaks total ties by numeric roster id, deterministically", () => {
    const rows = computeTeamValues(
      [
        { team: team("10"), playerIds: ["a"] },
        { team: team("2"), playerIds: ["b"] },
      ],
      [quote("a", 75), quote("b", 75)]
    );
    // Numeric, not lexicographic: roster 2 outranks roster 10 on a tie.
    expect(rows.map((r) => r.team.id)).toEqual(["2", "10"]);
  });

  it("ignores quotes for players on no roster", () => {
    const rows = computeTeamValues(
      [{ team: team("1"), playerIds: ["a"] }],
      [quote("a", 10), quote("free-agent", 999)]
    );
    expect(rows[0].totalValue).toBe(10);
  });
});
