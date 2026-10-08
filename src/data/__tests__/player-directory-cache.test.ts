/**
 * player-directory-cache.test.ts — the compact player-directory
 * projection and its 24h cache (src/data/sleeper.ts).
 *
 * - Projection keeps exactly the fields the membrane reads and drops the
 *   rest (measured: 2.52MB raw -> ~330KB projected on the live payload).
 * - Cache: cold loads once, warm reuses, expiry refetches, refresh
 *   failure serves last-good, cold failure throws for safePlayerDirectory
 *   to degrade.
 */
import { describe, expect, it } from "vitest";
import {
  createPlayerDirectoryCache,
  projectPlayerDirectory,
  PLAYER_DIRECTORY_TTL_MS,
} from "@/data/sleeper";

const RAW_ENTRY = {
  player_id: "9999",
  full_name: "Test Hooper",
  first_name: "Test",
  last_name: "Hooper",
  position: "PG",
  team: "BKN",
  age: 20,
  injury_status: null,
  years_exp: 0,
  // Upstream fields we never read — the projection must drop these.
  // (Mirrors the real /players/nba shape: ~53 fields per entry.)
  ...Object.fromEntries(
    [
      "birth_city",
      "birth_country",
      "birth_date",
      "birth_state",
      "college",
      "depth_chart_position",
      "espn_id",
      "fantasy_data_id",
      "gsis_id",
      "hashtag",
      "high_school",
      "injury_body_part",
      "injury_notes",
      "injury_start_date",
      "kalshi_id",
      "number",
      "oddsjam_id",
      "opta_id",
      "pandascore_id",
      "player_shard",
      "practice_description",
      "practice_participation",
      "rotowire_id",
      "rotoworld_id",
      "search_first_name",
      "search_full_name",
      "search_last_name",
      "sport",
      "sportradar_id",
      "stats_id",
      "status",
      "swish_id",
      "team_abbr",
      "team_changed_at",
      "yahoo_id",
    ].map((k) => [k, `junk-value-for-${k}-with-padding`]),
  ),
  height: "6-3",
  weight: 190,
  college: "Nowhere State University",
  search_rank: 42,
  fantasy_positions: ["PG", "SG"],
  depth_chart_order: 1,
  active: true,
  news_updated: 1728280000000,
  competitions: ["nba"],
  metadata: { source: "junk" },
};

function rawDirectory() {
  return { "9999": { ...RAW_ENTRY } };
}

function fakeClock(start = 0) {
  let t = start;
  return {
    now: () => t,
    advance: (ms: number) => {
      t += ms;
    },
  };
}

describe("projectPlayerDirectory", () => {
  it("keeps exactly the fields the membrane reads", () => {
    const out = projectPlayerDirectory(rawDirectory());
    expect(out["9999"]).toEqual({
      full_name: "Test Hooper",
      first_name: "Test",
      last_name: "Hooper",
      position: "PG",
      team: "BKN",
      age: 20,
      injury_status: null,
      years_exp: 0,
    });
  });

  it("tolerates missing/odd entries without throwing", () => {
    const out = projectPlayerDirectory({
      a: null,
      b: "not-an-object",
      c: {},
      d: { full_name: 42, team: undefined, age: "old" },
    });
    expect(out.a).toBeUndefined();
    expect(out.b).toBeUndefined();
    expect(out.c).toEqual({});
    // Wrong-typed fields are dropped, never coerced.
    expect(out.d).toEqual({});
  });

  it("shrinks a realistic payload (size bound, not a snapshot)", () => {
    // 2000 synthetic entries with the full upstream shape.
    const raw: Record<string, unknown> = {};
    for (let i = 0; i < 2000; i++) {
      raw[String(i)] = { ...RAW_ENTRY, player_id: String(i) };
    }
    const before = JSON.stringify(raw).length;
    const after = JSON.stringify(projectPlayerDirectory(raw)).length;
    // The live payload measured 2.52MB -> 329KB (13%); hold the line at 25%.
    expect(after).toBeLessThan(before * 0.25);
  });
});

describe("createPlayerDirectoryCache", () => {
  it("cold loads once; warm reuses without refetching", async () => {
    const clock = fakeClock();
    let fetches = 0;
    const cache = createPlayerDirectoryCache({
      now: clock.now,
      fetchRaw: async () => {
        fetches++;
        return rawDirectory();
      },
    });

    const first = await cache.get();
    expect(first["9999"]?.full_name).toBe("Test Hooper");
    expect(fetches).toBe(1);

    clock.advance(PLAYER_DIRECTORY_TTL_MS - 1);
    const second = await cache.get();
    expect(second).toBe(first); // same reference: true reuse
    expect(fetches).toBe(1);
  });

  it("expiry refetches and picks up new data", async () => {
    const clock = fakeClock();
    let team = "BKN";
    const cache = createPlayerDirectoryCache({
      now: clock.now,
      fetchRaw: async () => ({ "9999": { ...RAW_ENTRY, team } }),
    });

    expect((await cache.get())["9999"]?.team).toBe("BKN");
    clock.advance(PLAYER_DIRECTORY_TTL_MS);
    team = "NYK";
    expect((await cache.get())["9999"]?.team).toBe("NYK");
  });

  it("refresh failure serves last-good; cold failure throws", async () => {
    const clock = fakeClock();
    let fail = false;
    const cache = createPlayerDirectoryCache({
      now: clock.now,
      fetchRaw: async () => {
        if (fail) throw new Error("Sleeper down");
        return rawDirectory();
      },
    });

    await cache.get();
    clock.advance(PLAYER_DIRECTORY_TTL_MS + 1);
    fail = true;
    // Last-good: name resolution keeps working on stale data.
    expect((await cache.get())["9999"]?.full_name).toBe("Test Hooper");

    const cold = createPlayerDirectoryCache({
      now: clock.now,
      fetchRaw: async () => {
        throw new Error("Sleeper down");
      },
    });
    // Cold failure throws so safePlayerDirectory can degrade to null.
    await expect(cold.get()).rejects.toThrow("Sleeper down");
  });
});
