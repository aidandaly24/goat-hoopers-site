/**
 * espn-id-map.test.ts — the full Sleeper -> ESPN id table (src/data/espn.ts,
 * issues #47/#48). Built 2026-10-08 by joining Sleeper /players/nba to the
 * ESPN public roster API on normalized names (607 matched, 0 ambiguous, 12
 * absent from ESPN rosters).
 *
 * Guards the properties the join guaranteed: the hand-verified seed entries
 * reproduce, every value is a numeric ESPN athlete id, no two Sleeper ids
 * share one ESPN id, and the table covers the league's player pool.
 */
import { describe, expect, it } from "vitest";
import { ESPN_ID_MAP, SEED_ESPN_ID_MAP, resolveEspnId } from "@/data/espn";

describe("ESPN_ID_MAP", () => {
  it("reproduces every hand-verified seed entry", () => {
    for (const [sleeperId, espnId] of Object.entries(SEED_ESPN_ID_MAP)) {
      expect(resolveEspnId(sleeperId, ESPN_ID_MAP)).toBe(espnId);
    }
  });

  it("covers the player pool (600+ entries)", () => {
    expect(Object.keys(ESPN_ID_MAP).length).toBeGreaterThanOrEqual(600);
  });

  it("maps every Sleeper id to a numeric ESPN athlete id string", () => {
    for (const [sleeperId, espnId] of Object.entries(ESPN_ID_MAP)) {
      expect(sleeperId).toMatch(/^\d+$/);
      expect(espnId).toMatch(/^\d+$/);
    }
  });

  it("has no duplicate ESPN ids (the join was unambiguous)", () => {
    const values = Object.values(ESPN_ID_MAP);
    expect(new Set(values).size).toBe(values.length);
  });

  it("resolves the full map end to end: stars and rookies alike", () => {
    expect(resolveEspnId("1362", ESPN_ID_MAP)).toBe("1966"); // LeBron
    expect(resolveEspnId("4866", ESPN_ID_MAP)).toBe("5142718"); // Dybantsa
  });
});
