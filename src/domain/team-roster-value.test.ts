import { test } from "vitest";
import assert from "node:assert/strict";
import { buildTeamRosterValue } from "./team-roster-value";
import type { StockMarket, StockQuote } from "./stock";

function quote(
  playerId: string,
  price: number,
  ownership = 1,
): StockQuote {
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
    ownership,
    rookiePick: null,
  };
}

function market(
  quotes: StockQuote[],
  pricingBasis: StockMarket["pricingBasis"] = "preseason",
): StockMarket {
  return {
    stocks: quotes,
    trending: [],
    falling: [],
    panic: [],
    updatedAt: 0,
    hasHistory: false,
    pricingBasis,
  };
}

test("joins quotes to the roster by player id, keeping roster order", () => {
  const value = buildTeamRosterValue(
    ["p3", "p1", "p2"],
    market([quote("p1", 10), quote("p2", 20), quote("p3", 30)]),
  );
  assert.deepEqual(
    value.players.map((p) => p.price),
    [30, 10, 20],
  );
  assert.equal(value.total, 60);
  assert.equal(value.quotedCount, 3);
  assert.equal(value.playerCount, 3);
});

test("a rostered player with no quote is unknown — never $0", () => {
  const value = buildTeamRosterValue(
    ["p1", "p2"],
    market([quote("p1", 12.5)]),
  );
  assert.equal(value.players[0].price, 12.5);
  assert.equal(value.players[1].price, null);
  // The total sums quoted prices only; the unknown player contributes nothing.
  assert.equal(value.total, 12.5);
  assert.equal(value.quotedCount, 1);
  assert.equal(value.playerCount, 2);
});

test("membership comes from roster ids, never quote.ownership", () => {
  const value = buildTeamRosterValue(
    // p1 is rostered but owned by nobody else in the league (ownership 0);
    // p9 is 90%-owned league-wide but NOT on this roster.
    ["p1"],
    market([quote("p1", 7, 0), quote("p9", 99, 0.9)]),
  );
  assert.equal(value.players.length, 1);
  assert.equal(value.players[0].price, 7);
  assert.equal(value.total, 7);
});

test("total is null when nothing is quoted, and basis carries through", () => {
  const value = buildTeamRosterValue(["p1"], market([], "in-season"));
  assert.equal(value.players[0].price, null);
  assert.equal(value.total, null);
  assert.equal(value.quotedCount, 0);
  assert.equal(value.pricingBasis, "in-season");
});

test("a failed market degrades to all-unknown with no basis", () => {
  const value = buildTeamRosterValue(["p1", "p2"], null);
  assert.deepEqual(
    value.players.map((p) => p.price),
    [null, null],
  );
  assert.equal(value.total, null);
  assert.equal(value.quotedCount, 0);
  assert.equal(value.playerCount, 2);
  assert.equal(value.pricingBasis, null);
});

test("an empty roster yields an empty, honest value", () => {
  const value = buildTeamRosterValue([], market([quote("p1", 5)]));
  assert.deepEqual(value.players, []);
  assert.equal(value.total, null);
  assert.equal(value.quotedCount, 0);
  assert.equal(value.playerCount, 0);
});

// Issue #214, delta (a): the shared policy de-duplicates player ids.
// Sleeper never lists a player twice on a roster, so real rosters see
// parity; this test pins the dedup behavior for the impossible case.
test("duplicate roster ids are de-duplicated, first-seen order kept", () => {
  const value = buildTeamRosterValue(
    ["p1", "p1", "p2"],
    market([quote("p1", 10), quote("p2", 20)]),
  );
  assert.deepEqual(
    value.players.map((p) => [p.playerId, p.price]),
    [
      ["p1", 10],
      ["p2", 20],
    ],
  );
  assert.equal(value.playerCount, 2);
  assert.equal(value.quotedCount, 2);
  assert.equal(value.total, 30);
});

// Issue #214, delta (b): the shared filter drops negative and
// non-safe-integer-cent quotes — they render "—", never counted or summed.
test("negative or absurd quotes are unquoted — never $0, never summed", () => {
  const value = buildTeamRosterValue(
    ["p1", "p2", "p3"],
    market([quote("p1", -5), quote("p2", 1e16), quote("p3", 10)]),
  );
  assert.deepEqual(
    value.players.map((p) => p.price),
    [null, null, 10],
  );
  assert.equal(value.quotedCount, 1);
  assert.equal(value.playerCount, 3);
  assert.equal(value.total, 10);
});

// Issue #214, delta (c): totals are cent-exact via the integer path —
// 0.1 + 0.2 is 0.3, not 0.30000000000000004.
test("totals are cent-exact, not float sums", () => {
  const value = buildTeamRosterValue(
    ["p1", "p2"],
    market([quote("p1", 0.1), quote("p2", 0.2)]),
  );
  assert.equal(value.total, 0.3);
  assert.equal(value.total === 0.1 + 0.2, false);
});

// Fractional-cent quotes round to whole cents on the shared path.
test("fractional-cent quotes round to whole cents", () => {
  const value = buildTeamRosterValue(["p1"], market([quote("p1", 12.345)]));
  assert.equal(value.players[0].price, 12.35);
  assert.equal(value.total, 12.35);
});
