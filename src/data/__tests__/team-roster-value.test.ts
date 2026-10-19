/**
 * getTeamRosterValue — the /team roster-value loader (issue #189).
 *
 * All market/detail sources are faked (rule 11); no network, no database.
 * Verifies: null for an unknown team, the quote-by-roster-id join, and the
 * all-unknown degradation when the market fails.
 */
import { test } from "vitest";
import assert from "node:assert/strict";
import { getTeamRosterValue, type TeamDetail } from "../league";
import type { Player, StockMarket, StockQuote } from "@/domain";

function player(id: string): Player {
  return {
    id,
    fullName: `Player ${id}`,
    position: "PG",
    nbaTeam: "LAL",
    espnId: null,
  };
}

function detail(ids: string[]): TeamDetail {
  return {
    team: {
      id: "7",
      name: "Test Team",
      managerName: "tester",
      avatar: null,
      wins: 0,
      losses: 0,
      ties: 0,
      pointsFor: 0,
      pointsAgainst: 0,
    },
    players: ids.map(player),
  };
}

function quote(playerId: string, price: number): StockQuote {
  return {
    playerId,
    playerName: `Player ${playerId}`,
    position: "PG",
    nbaTeam: "LAL",
    price,
    prevPrice: null,
    change: null,
    changePct: null,
    trend: "flat",
    ownership: 1,
    rookiePick: null,
  };
}

function market(quotes: StockQuote[]): StockMarket {
  return {
    stocks: quotes,
    trending: [],
    falling: [],
    panic: [],
    updatedAt: 0,
    hasHistory: false,
    pricingBasis: "preseason",
  };
}

test("returns null when the team does not exist", async () => {
  const value = await getTeamRosterValue("99", {
    fetchDetail: async () => null,
    fetchMarket: async () => market([]),
  });
  assert.equal(value, null);
});

test("joins market quotes to the roster by player id", async () => {
  const value = await getTeamRosterValue("7", {
    fetchDetail: async () => detail(["p1", "p2", "p3"]),
    fetchMarket: async () => market([quote("p1", 100), quote("p3", 25)]),
  });
  assert.ok(value);
  assert.deepEqual(
    value.players.map((p) => p.price),
    [100, null, 25],
  );
  assert.equal(value.total, 125);
  assert.equal(value.quotedCount, 2);
  assert.equal(value.playerCount, 3);
  assert.equal(value.pricingBasis, "preseason");
});

test("a market outage degrades to unknown prices — never throws the page", async () => {
  const value = await getTeamRosterValue("7", {
    fetchDetail: async () => detail(["p1", "p2"]),
    fetchMarket: async () => {
      throw new Error("market down");
    },
  });
  assert.ok(value);
  assert.deepEqual(
    value.players.map((p) => p.price),
    [null, null],
  );
  assert.equal(value.total, null);
  assert.equal(value.quotedCount, 0);
  assert.equal(value.playerCount, 2);
  assert.equal(value.pricingBasis, null);
});
