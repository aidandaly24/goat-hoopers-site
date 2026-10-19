import { describe, expect, it } from "vitest";
import {
  PRICED_IN_MAX_SCORE,
  PRICED_IN_MIN_LINE_OFFSET,
  PRICED_IN_MIN_PRICE,
  PRICED_IN_ROUND_COUNT,
  advancePricedIn,
  callPricedIn,
  pricedInCallIsCorrect,
  pricedInDealIdentity,
  pricedInLine,
  receivePricedInDeal,
  requestPricedInRedeal,
  samplePricedInRounds,
  scorePricedInCall,
  startPricedInGame,
  type PricedInCandidate,
  type PricedInGameState,
  type PricedInRound,
} from "./priced-in";

const candidate = (overrides: Partial<PricedInCandidate> = {}): PricedInCandidate => ({
  playerId: "p1",
  playerName: "Fixture Player",
  position: "PG",
  nbaTeam: "LAL",
  espnId: "123",
  price: 40,
  changePct: 2.5,
  trend: "up",
  ...overrides,
});

const pool = (count: number, overrides: Partial<PricedInCandidate> = {}): PricedInCandidate[] =>
  Array.from({ length: count }, (_, i) =>
    candidate({ playerId: `p${i + 1}`, playerName: `Fixture Player ${i + 1}`, price: 20 + i * 10, ...overrides }),
  );

/** Deterministic source cycling through the given samples. */
const cycling = (samples: number[]) => {
  let i = 0;
  return () => samples[i++ % samples.length];
};

describe("pricedInLine", () => {
  it("never equals the price and stays within 4–15% (at least $2)", () => {
    for (const rng of [() => 0, () => 0.5, () => 0.999]) {
      for (const price of [5, 12, 40, 120, 200]) {
        const line = pricedInLine(price, rng);
        expect(line).not.toBe(price);
        const offset = Math.abs(line - price);
        expect(offset).toBeGreaterThanOrEqual(2);
        expect(offset).toBeLessThanOrEqual(Math.max(2, Math.round(price * 0.15)));
      }
    }
  });

  it("can land on either side of the price", () => {
    expect(pricedInLine(40, cycling([0, 0]))).toBeLessThan(40);
    expect(pricedInLine(40, cycling([0, 0.9]))).toBeGreaterThan(40);
  });

  it("never produces a line below $1 for the cheapest dealt player", () => {
    expect(pricedInLine(PRICED_IN_MIN_PRICE, cycling([0.999, 0]))).toBeGreaterThanOrEqual(1);
  });
});

describe("samplePricedInRounds", () => {
  it("deals a full game of distinct players from a healthy pool", () => {
    const rounds = samplePricedInRounds(pool(12), cycling([0.3, 0.7, 0.1, 0.9]));
    expect(rounds).toHaveLength(PRICED_IN_ROUND_COUNT);
    expect(new Set(rounds.map((round) => round.playerId)).size).toBe(PRICED_IN_ROUND_COUNT);
    for (const round of rounds) expect(round.line).not.toBe(round.price);
  });

  it("prefers players with headshots and fills from the rest only when short", () => {
    const faced = pool(3);
    const faceless = pool(4, { espnId: null }).map((c, i) => ({ ...c, playerId: `f${i}` }));
    const rounds = samplePricedInRounds([...faceless, ...faced], cycling([0.2, 0.8]));
    expect(rounds).toHaveLength(5);
    expect(rounds.filter((round) => round.espnId !== null)).toHaveLength(3);
  });

  it("drops players under the minimum price and duplicate ids", () => {
    const cheap = candidate({ playerId: "cheap", price: PRICED_IN_MIN_PRICE - 1 });
    const dupe = candidate({ playerId: "p1" });
    const rounds = samplePricedInRounds([cheap, dupe, ...pool(6)], cycling([0.4]));
    expect(rounds.map((round) => round.playerId)).not.toContain("cheap");
    expect(new Set(rounds.map((round) => round.playerId)).size).toBe(rounds.length);
  });

  it("returns a short game when the pool is short — the caller renders unavailable", () => {
    expect(samplePricedInRounds(pool(3), cycling([0.5]))).toHaveLength(3);
    expect(samplePricedInRounds([], cycling([0.5]))).toEqual([]);
  });

  it("does not mutate the supplied pool", () => {
    const input = pool(8);
    const snapshot = structuredClone(input);
    samplePricedInRounds(input, cycling([0.6, 0.2]));
    expect(input).toEqual(snapshot);
  });
});

describe("scoring", () => {
  const round = (price: number, line: number): PricedInRound => ({ ...candidate({ price }), line });

  it("over is correct only above the line, under only below it", () => {
    expect(pricedInCallIsCorrect(round(50, 40), "over")).toBe(true);
    expect(pricedInCallIsCorrect(round(50, 40), "under")).toBe(false);
    expect(pricedInCallIsCorrect(round(30, 40), "under")).toBe(true);
    expect(pricedInCallIsCorrect(round(30, 40), "over")).toBe(false);
  });

  it("a correct call scores 100 plus a closeness bonus anchored at the tightest dealt gap", () => {
    // Full bonus at the dealer's minimum offset, one point less per
    // dollar beyond it, gone once the line sits 50 past that anchor.
    expect(scorePricedInCall(round(42, 40), "over")).toBe(150);
    expect(scorePricedInCall(round(45, 40), "over")).toBe(147);
    expect(scorePricedInCall(round(30, 40), "under")).toBe(142);
    expect(scorePricedInCall(round(90, 40), "over")).toBe(102);
    expect(scorePricedInCall(round(92, 40), "over")).toBe(100);
  });

  it("a wrong call scores zero", () => {
    expect(scorePricedInCall(round(30, 40), "over")).toBe(0);
    expect(scorePricedInCall(round(41, 40), "under")).toBe(0);
  });
});

describe("reachable maximum", () => {
  it("a best-case actual deal reaches the advertised maximum", () => {
    // The review probe: five $5 candidates and an RNG pinned at 0
    // deal the tightest line the dealer can set on every round.
    const cheap = pool(5, { price: 5 });
    const rounds = samplePricedInRounds(cheap, () => 0);
    expect(rounds).toHaveLength(PRICED_IN_ROUND_COUNT);
    for (const round of rounds) {
      expect(Math.abs(round.price - round.line)).toBe(PRICED_IN_MIN_LINE_OFFSET);
    }
    const total = rounds.reduce(
      (sum, round) =>
        sum + scorePricedInCall(round, pricedInCallIsCorrect(round, "over") ? "over" : "under"),
      0,
    );
    expect(total).toBe(PRICED_IN_MAX_SCORE);
    expect(PRICED_IN_MAX_SCORE).toBe(750);
  });

  it("no dealt game can beat the advertised maximum", () => {
    const rounds = samplePricedInRounds(pool(12), cycling([0.3, 0.7, 0.1, 0.9]));
    const total = rounds.reduce(
      (sum, round) =>
        sum + scorePricedInCall(round, pricedInCallIsCorrect(round, "over") ? "over" : "under"),
      0,
    );
    expect(total).toBeLessThanOrEqual(PRICED_IN_MAX_SCORE);
  });
});

describe("deal identity", () => {
  const deal = (offset: number): PricedInRound[] =>
    pool(5).map((c) => ({ ...c, line: c.price - offset }));

  it("is stable for identical deal content", () => {
    expect(pricedInDealIdentity(deal(2))).toBe(pricedInDealIdentity(deal(2)));
  });

  it("changes when the same players are re-dealt at different lines or prices", () => {
    expect(pricedInDealIdentity(deal(2))).not.toBe(pricedInDealIdentity(deal(3)));
    const repriced = deal(2).map((round) => ({ ...round, price: round.price + 5 }));
    expect(pricedInDealIdentity(deal(2))).not.toBe(pricedInDealIdentity(repriced));
  });
});

describe("game state", () => {
  const deal = (price: number, line: number): PricedInRound[] =>
    Array.from({ length: PRICED_IN_ROUND_COUNT }, (_, i) => ({
      ...candidate({ playerId: `g${i + 1}`, price }),
      line,
    }));

  const playOut = (state: PricedInGameState): PricedInGameState => {
    let current = state;
    for (const round of state.rounds) {
      current = callPricedIn(current, pricedInCallIsCorrect(round, "over") ? "over" : "under");
      current = advancePricedIn(current);
    }
    return current;
  };

  const total = (state: PricedInGameState) =>
    state.results.reduce((sum, result) => sum + result.points, 0);

  it("plays a full game and finishes on the last advance", () => {
    const finished = playOut(startPricedInGame(deal(20, 18)));
    expect(finished.finished).toBe(true);
    expect(finished.results).toHaveLength(PRICED_IN_ROUND_COUNT);
    expect(total(finished)).toBe(PRICED_IN_MAX_SCORE);
  });

  it("ignores a second call on a revealed round and an advance before any call", () => {
    const start = startPricedInGame(deal(20, 18));
    expect(advancePricedIn(start)).toBe(start);
    const called = callPricedIn(start, "over");
    expect(callPricedIn(called, "under")).toBe(called);
  });

  it("re-deal locks the old deal, then a fresh deal replaces the game wholesale", () => {
    // The review reproduction, as state transitions: finish a game on
    // a $18 line over a $20 player, press Play again while the refresh
    // is pending, try to call the still-visible old line, then deliver
    // the same players with a fresh $22 line.
    const finished = playOut(startPricedInGame(deal(20, 18)));
    expect(total(finished)).toBe(PRICED_IN_MAX_SCORE);

    const redealing = requestPricedInRedeal(finished);
    expect(redealing.redealing).toBe(true);
    // Old-deal input during the re-deal is refused, not scored.
    expect(callPricedIn(redealing, "over")).toBe(redealing);
    expect(advancePricedIn(redealing)).toBe(redealing);

    const fresh = receivePricedInDeal(redealing, deal(20, 22));
    expect(fresh).not.toBe(redealing);
    expect(fresh.redealing).toBe(false);
    expect(fresh.finished).toBe(false);
    expect(fresh.roundIndex).toBe(0);
    expect(fresh.results).toEqual([]);
    expect(fresh.rounds[0]?.line).toBe(22);
    expect(total(fresh)).toBe(0);

    // The first call of the new game scores against the new deal only.
    const called = callPricedIn(fresh, "under");
    expect(called.results[0]?.round.line).toBe(22);
    expect(called.results[0]?.points).toBe(150);
  });

  it("delivering the same deal again leaves a running game untouched", () => {
    const start = startPricedInGame(deal(20, 18));
    const called = callPricedIn(start, "over");
    expect(receivePricedInDeal(called, deal(20, 18))).toBe(called);
  });

  it("an identical re-deal completes the request and replays the deal fresh", () => {
    // The re-review counterexample: the refresh legitimately redealt
    // the exact same content — five $20 players, $18 lines. Content
    // identity cannot tell a completed identical replay from a
    // pending one, so the delivery itself has to: the refreshed array
    // is a new delivery, and it answers the outstanding request.
    const rounds = deal(20, 18);
    const finished = playOut(startPricedInGame(rounds));
    expect(total(finished)).toBe(PRICED_IN_MAX_SCORE);

    const waiting = requestPricedInRedeal(finished);
    expect(waiting.redealing).toBe(true);

    const replayed = receivePricedInDeal(waiting, structuredClone(rounds));
    expect(replayed).not.toBe(waiting);
    expect(replayed.redealing).toBe(false);
    expect(replayed.finished).toBe(false);
    expect(replayed.roundIndex).toBe(0);
    expect(replayed.results).toEqual([]);
    expect(replayed.dealIdentity).toBe(waiting.dealIdentity);
    expect(replayed.rounds).toEqual(rounds);
    expect(total(replayed)).toBe(0);

    // The replayed game is live: its first call scores against the
    // deal, and playing it out finishes and re-arms Play again.
    const called = callPricedIn(replayed, "over");
    expect(called.results[0]?.points).toBe(150);
    const refinished = playOut(replayed);
    expect(refinished.finished).toBe(true);
    expect(total(refinished)).toBe(PRICED_IN_MAX_SCORE);
    expect(requestPricedInRedeal(refinished).redealing).toBe(true);
  });

  it("a render still holding the old props does not complete the re-deal", () => {
    // While the refresh is in flight the surface re-renders with the
    // very delivery the finished game already consumed. That is the
    // pending state, not an answer: the lock stands, the old results
    // are retained and stale input stays refused.
    const rounds = deal(20, 18);
    const finished = playOut(startPricedInGame(rounds));
    const waiting = requestPricedInRedeal(finished);

    expect(receivePricedInDeal(waiting, rounds)).toBe(waiting);
    expect(waiting.finished).toBe(true);
    expect(waiting.results).toHaveLength(PRICED_IN_ROUND_COUNT);
    expect(callPricedIn(waiting, "over")).toBe(waiting);
    expect(advancePricedIn(waiting)).toBe(waiting);
  });

  it("an unsolicited identical refresh during a running game does not reset it", () => {
    // A refresh nobody asked for delivers the same deal content in a
    // new array. With no re-deal outstanding there is nothing to
    // complete, so the running game — call and all — stands.
    const rounds = deal(20, 18);
    const called = callPricedIn(startPricedInGame(rounds), "over");
    expect(receivePricedInDeal(called, structuredClone(rounds))).toBe(called);
    expect(called.results).toHaveLength(1);
  });

  it("play again is only armed from the finished state", () => {
    const start = startPricedInGame(deal(20, 18));
    expect(requestPricedInRedeal(start)).toBe(start);
  });
});
