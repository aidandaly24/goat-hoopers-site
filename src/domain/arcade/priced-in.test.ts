import { describe, expect, it } from "vitest";
import {
  PRICED_IN_MAX_SCORE,
  PRICED_IN_MIN_PRICE,
  PRICED_IN_ROUND_COUNT,
  pricedInCallIsCorrect,
  pricedInLine,
  samplePricedInRounds,
  scorePricedInCall,
  type PricedInCandidate,
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

  it("a correct call scores 100 plus a closeness bonus that decays with distance", () => {
    expect(scorePricedInCall(round(45, 40), "over")).toBe(145);
    expect(scorePricedInCall(round(90, 40), "over")).toBe(100);
    expect(scorePricedInCall(round(30, 40), "under")).toBe(140);
  });

  it("a wrong call scores zero, and a perfect game tops out at the max", () => {
    expect(scorePricedInCall(round(30, 40), "over")).toBe(0);
    expect(scorePricedInCall(round(41, 40), "over")).toBe(149);
    expect(PRICED_IN_MAX_SCORE).toBe(750);
  });
});
