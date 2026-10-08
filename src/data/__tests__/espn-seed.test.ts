/**
 * espn-seed.test.ts — the Sleeper -> ESPN id seam (src/data/espn.ts, issue #48).
 *
 * Asserts observable domain results, never private structure: the seed map
 * resolves the verified rookies, unknown ids resolve to null (initials
 * fallback), and the mapping is injectable — a different map changes
 * coverage with zero component edits (acceptance criterion 4).
 */
import { describe, expect, it } from "vitest";
import { resolveEspnId, headshotUrl, SEED_ESPN_ID_MAP } from "@/data/espn";
import { toPlayer, toDraftPicks } from "@/data/transform";

describe("resolveEspnId", () => {
  it("resolves the verified 2026 rookies from the seed map", () => {
    expect(resolveEspnId("4866", SEED_ESPN_ID_MAP)).toBe("5142718"); // Dybantsa
    expect(resolveEspnId("4884", SEED_ESPN_ID_MAP)).toBe("5164559"); // Ament
    expect(resolveEspnId("4889", SEED_ESPN_ID_MAP)).toBe("5241364"); // Stirtz
    expect(resolveEspnId("4871", SEED_ESPN_ID_MAP)).toBe("5101761"); // Brown Jr.
  });

  it("returns null for unmapped ids (initials fallback)", () => {
    expect(resolveEspnId("999999", SEED_ESPN_ID_MAP)).toBeNull();
  });

  it("is injectable: a second map changes coverage without touching code", () => {
    const alt = { "4866": "0000000", "1234": "7654321" };
    expect(resolveEspnId("4866", alt)).toBe("0000000");
    expect(resolveEspnId("1234", alt)).toBe("7654321");
    expect(resolveEspnId("4884", alt)).toBeNull();
  });
});

describe("headshotUrl", () => {
  it("builds the ESPN CDN URL for an athlete id", () => {
    expect(headshotUrl("5142718")).toBe(
      "https://a.espncdn.com/i/headshots/nba/players/full/5142718.png",
    );
  });
});

describe("espnId wiring", () => {
  it("toPlayer carries the injected espnId onto the domain Player", () => {
    const p = toPlayer("4866", undefined, resolveEspnId("4866", SEED_ESPN_ID_MAP));
    expect(p.espnId).toBe("5142718");
    expect(toPlayer("999999", undefined, null).espnId).toBeNull();
  });

  it("toDraftPicks resolves espnId from the injected map", () => {
    const picks = toDraftPicks(
      [
        {
          pick_no: 1,
          round: 1,
          draft_slot: 1,
          player_id: "4866",
          picked_by: "user_1",
          roster_id: 1,
          metadata: { full_name: "AJ Dybantsa" },
        },
      ],
      SEED_ESPN_ID_MAP,
    );
    expect(picks[0].espnId).toBe("5142718");

    const unmapped = toDraftPicks(
      [
        {
          pick_no: 2,
          round: 1,
          draft_slot: 2,
          player_id: "999999",
          picked_by: "user_2",
          roster_id: 2,
          metadata: { full_name: "Somebody Else" },
        },
      ],
      SEED_ESPN_ID_MAP,
    );
    expect(unmapped[0].espnId).toBeNull();
  });
});
