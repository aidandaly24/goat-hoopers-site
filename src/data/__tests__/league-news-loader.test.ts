/**
 * league-news-loader.test.ts — last-good invariant for loadLeagueNews
 * (src/data/league.ts).
 *
 * The loader must throw when BOTH RSS feeds fail, so the TTL cache
 * preserves last-good instead of caching an outage as an empty feed.
 * One feed succeeding is enough for an edition. These tests drive the
 * REAL loadLeagueNews with fake clients (rule 11) — not just the cache
 * wrapper.
 */
import { describe, expect, it } from "vitest";
import {
  loadLeagueNews,
  getTransactionHistoryStrict,
  getDraftBoardStrict,
  createLeagueNewsCache,
  LEAGUE_NEWS_TTL_MS,
} from "@/data/league";
import { sectionCoverageStatus } from "@/domain/news";
import type { DraftBoardData } from "@/data/league";
import type { DraftPick } from "@/domain/draft";

function pick(): DraftPick {
  return {
    pickNo: 1,
    round: 1,
    draftSlot: 1,
    playerId: "9999",
    playerName: "Fake Rookie",
    teamId: "1",
    position: "PG",
    nbaTeam: "BKN",
    espnId: "5101761",
  };
}

const RSS_XML = `<?xml version="1.0"?><rss version="2.0"><channel>
<item><title>Fake Rookie shines</title><link>https://www.espn.com/nba/story/_/id/1/fake-rookie</link>
<description>A big night.</description><pubDate>Thu, 08 Oct 2026 19:21:47 +0000</pubDate></item>
</channel></rss>`;

function okFetch() {
  return (async () =>
    ({ ok: true, text: async () => RSS_XML }) as unknown as Response) as typeof fetch;
}
function failFetch() {
  return (async () => {
    throw new Error("network down");
  }) as typeof fetch;
}

function baseDeps(fetchFn: typeof fetch) {
  return {
    fetchFn,
    fetchRostersFn: async () => [] as never[],
    fetchDirectoryFn: async () => ({}),
    fetchDraftBoardFn: async () =>
      ({ picks: [pick()], teams: [] }) as DraftBoardData,
  };
}

describe("loadLeagueNews", () => {
  it("throws when both RSS feeds fail", async () => {
    await expect(loadLeagueNews(baseDeps(failFetch()))).rejects.toThrow(
      "All news RSS feeds failed"
    );
  });

  it("throws when one feed 500s and the other throws", async () => {
    const fetchFn = (async (url: unknown) =>
      String(url).includes("espn")
        ? { ok: false, status: 500, text: async () => "" }
        : Promise.reject(new Error("down"))) as typeof fetch;
    await expect(loadLeagueNews(baseDeps(fetchFn))).rejects.toThrow(
      "All news RSS feeds failed"
    );
  });

  it("returns an edition when at least one feed succeeds", async () => {
    const edition = await loadLeagueNews(baseDeps(okFetch()));
    expect(edition.articles.length).toBeGreaterThan(0);
    expect(edition.articles[0].headline).toBe("Fake Rookie shines");
    expect(edition.coverage).toEqual({
      rosters: "ok",
      directory: "ok",
      draft: "ok",
    });
    expect(edition.builtAt).toBeGreaterThan(0);
  });

  it("treats healthy-but-empty feeds as an outage (last-good preserved)", async () => {
    // Zero items from BOTH feeds is indistinguishable from a feed outage,
    // so it throws — the TTL cache preserves last-good instead of caching
    // an empty edition.
    const emptyFetch = (async () =>
      ({
        ok: true,
        text: async () => `<rss version="2.0"><channel></channel></rss>`,
      }) as unknown as Response) as typeof fetch;
    await expect(loadLeagueNews(baseDeps(emptyFetch))).rejects.toThrow(
      "All news RSS feeds failed"
    );
  });
});

/**
 * Input-failure matrix (issue #122): identity inputs fail independently
 * and must be recorded as unknown — never mistaken for empty real data.
 *
 * Fixture population: LeBron James (rostered), Fake Rookie (rostered +
 * 2026 draft pick), Unknown Veteran (neither). A roster outage must not
 * invent Free Agency labels; a draft outage must not silently remove
 * Rookie Wire.
 */
describe("loadLeagueNews identity-input failures", () => {
  const MATRIX_XML = `<?xml version="1.0"?><rss version="2.0"><channel>
<item><title>LeBron James drops 40</title><link>https://www.espn.com/nba/story/_/id/10/lebron-40</link><pubDate>Thu, 08 Oct 2026 19:21:47 +0000</pubDate></item>
<item><title>Fake Rookie shines in debut</title><link>https://www.cbssports.com/nba/news/fake-rookie-debut/</link><pubDate>Thu, 08 Oct 2026 18:00:00 +0000</pubDate></item>
<item><title>Unknown Veteran signs overseas</title><link>https://www.espn.com/nba/story/_/id/12/unknown-vet</link><pubDate>Thu, 08 Oct 2026 17:00:00 +0000</pubDate></item>
</channel></rss>`;

  const DIRECTORY = {
    "100": { full_name: "LeBron James", position: "SF" },
    "9999": { full_name: "Fake Rookie", position: "PG" },
    "200": { full_name: "Unknown Veteran", position: "C" },
  };

  function matrixDeps(overrides: {
    rostersFail?: boolean;
    directoryFail?: boolean;
    draftFail?: boolean;
  } = {}) {
    const fetchFn = (async () =>
      ({ ok: true, text: async () => MATRIX_XML }) as unknown as Response) as typeof fetch;
    return {
      fetchFn,
      fetchRostersFn: async () => {
        if (overrides.rostersFail) throw new Error("Sleeper 500 on /rosters");
        return [{ players: ["100", "9999"] }] as never[];
      },
      fetchDirectoryFn: async () => {
        if (overrides.directoryFail) throw new Error("directory down");
        return DIRECTORY as never;
      },
      fetchDraftBoardFn: async () => {
        if (overrides.draftFail) throw new Error("Sleeper 503 on /draft_picks");
        return { picks: [pick()], teams: [] } as DraftBoardData;
      },
    };
  }

  function sectionsOf(edition: { articles: { headline: string; sections: string[] }[] }) {
    const map = new Map<string, string[]>();
    for (const a of edition.articles) map.set(a.headline, [...a.sections]);
    return map;
  }

  it("all inputs ok: rostered -> league, pick -> rookies, neither -> free-agency", async () => {
    const edition = await loadLeagueNews(matrixDeps());
    expect(edition.coverage).toEqual({ rosters: "ok", directory: "ok", draft: "ok" });
    const sections = sectionsOf(edition);
    expect(sections.get("LeBron James drops 40")).toEqual(["latest", "league"]);
    expect(sections.get("Fake Rookie shines in debut")).toEqual([
      "latest",
      "league",
      "rookies",
    ]);
    expect(sections.get("Unknown Veteran signs overseas")).toEqual([
      "latest",
      "free-agency",
    ]);
  });

  it("roster failure: classification is UNKNOWN — no league/free-agency labels invented", async () => {
    const edition = await loadLeagueNews(matrixDeps({ rostersFail: true }));
    expect(edition.coverage.rosters).toBe("unknown");
    const sections = sectionsOf(edition);
    // LeBron is really rostered, but we must not claim it from a failed fetch.
    expect(sections.get("LeBron James drops 40")).toEqual(["latest"]);
    expect(sections.get("Unknown Veteran signs overseas")).toEqual(["latest"]);
    // Rookie Wire still works — the draft board succeeded independently.
    expect(sections.get("Fake Rookie shines in debut")).toEqual([
      "latest",
      "rookies",
    ]);
    // Player chips still resolve — name matching doesn't need rosters.
    const lebron = edition.articles.find((a) => a.headline === "LeBron James drops 40");
    expect(lebron?.players).toEqual([{ playerId: "100", name: "LeBron James" }]);
  });

  it("draft failure: Rookie Wire unavailable, never silently empty", async () => {
    const edition = await loadLeagueNews(matrixDeps({ draftFail: true }));
    expect(edition.coverage.draft).toBe("unknown");
    const sections = sectionsOf(edition);
    expect(sections.get("Fake Rookie shines in debut")).toEqual([
      "latest",
      "league",
    ]);
    expect(sections.get("LeBron James drops 40")).toEqual(["latest", "league"]);
  });

  it("directory failure: no matching at all, everything latest-only", async () => {
    const edition = await loadLeagueNews(matrixDeps({ directoryFail: true }));
    expect(edition.coverage.directory).toBe("unknown");
    for (const a of edition.articles) {
      expect(a.sections).toEqual(["latest"]);
      expect(a.players).toEqual([]);
    }
  });

  it("all identity inputs fail: honest unknown edition, feeds still served", async () => {
    const edition = await loadLeagueNews(
      matrixDeps({ rostersFail: true, directoryFail: true, draftFail: true })
    );
    expect(edition.coverage).toEqual({
      rosters: "unknown",
      directory: "unknown",
      draft: "unknown",
    });
    expect(edition.articles.length).toBe(3);
    expect(edition.articles.every((a) => a.sections.join() === "latest")).toBe(true);
  });

  it("recovery: failed inputs then succeeding restores ok coverage", async () => {
    let down = true;
    const deps = matrixDeps();
    const flaky = {
      ...deps,
      fetchRostersFn: async () => {
        if (down) throw new Error("Sleeper 500 on /rosters");
        return [{ players: ["100", "9999"] }] as never[];
      },
    };
    const bad = await loadLeagueNews(flaky);
    expect(bad.coverage.rosters).toBe("unknown");
    down = false;
    const good = await loadLeagueNews(flaky);
    expect(good.coverage.rosters).toBe("ok");
    const sections = sectionsOf(good);
    expect(sections.get("LeBron James drops 40")).toEqual(["latest", "league"]);
  });

  it("warm cache: identity outage after expiry preserves last-good edition", async () => {
    const clock = (() => {
      let t = 0;
      return { now: () => t, advance: (ms: number) => { t += ms; } };
    })();
    let down = false;
    const deps = matrixDeps();
    const cache = createLeagueNewsCache({
      now: clock.now,
      load: () =>
        loadLeagueNews({
          ...deps,
          fetchRostersFn: async () => {
            if (down) throw new Error("Sleeper 500 on /rosters");
            return [{ players: ["100", "9999"] }] as never[];
          },
        }),
    });
    const first = await cache.get();
    expect(first.coverage.rosters).toBe("ok");
    clock.advance(LEAGUE_NEWS_TTL_MS + 1);
    down = true;
    const second = await cache.get();
    // The refresh threw? No — identity failure doesn't throw; the new
    // edition has unknown coverage. Last-good is preserved only for
    // FEED failures; identity degradation is explicit per-edition.
    expect(second.coverage.rosters).toBe("unknown");
    expect(second).not.toBe(first);
  });
});

describe("getTransactionHistoryStrict", () => {
  const settings = {
    wins: 0,
    losses: 0,
    ties: 0,
    fpts: 0,
    fpts_decimal: 0,
    fpts_against: 0,
    fpts_against_decimal: 0,
  };
  const rosters = [{ roster_id: 1, owner_id: "u1", players: [], settings }];
  const users = [{ user_id: "u1", display_name: "amy" }];
  const state = { week: 1, season_type: "pre", season: "2026" };

  it("throws when a transaction week 503s", async () => {
    await expect(
      getTransactionHistoryStrict({
        fetchRosters: async () => rosters as never,
        fetchUsers: async () => users as never,
        fetchNbaState: async () => state as never,
        fetchTransactions: async () => {
          throw new Error("Sleeper API 503 on /transactions/1");
        },
      })
    ).rejects.toThrow("Sleeper API 503");
  });

  it("throws when rosters fail", async () => {
    await expect(
      getTransactionHistoryStrict({
        fetchRosters: async () => {
          throw new Error("Sleeper API 500 on /rosters");
        },
        fetchUsers: async () => users as never,
        fetchNbaState: async () => state as never,
        fetchTransactions: async () => [],
      })
    ).rejects.toThrow("Sleeper API 500");
  });

  it("returns empty (not throw) when weeks fetch fine but are quiet", async () => {
    const result = await getTransactionHistoryStrict({
      fetchRosters: async () => rosters as never,
      fetchUsers: async () => users as never,
      fetchNbaState: async () => state as never,
      fetchTransactions: async () => [],
      fetchDirectory: async () => null,
    });
    expect(result.transactions).toEqual([]);
    expect(result.teams.length).toBeGreaterThan(0);
  });
});

describe("getDraftBoardStrict", () => {
  const settings = {
    wins: 0,
    losses: 0,
    ties: 0,
    fpts: 0,
    fpts_decimal: 0,
    fpts_against: 0,
    fpts_against_decimal: 0,
  };
  const rosters = [{ roster_id: 1, owner_id: "u1", players: [], settings }];
  const users = [{ user_id: "u1", display_name: "amy" }];
  const drafts = [{ draft_id: "d1", season: "2026", status: "complete" }];

  it("throws when the picks fetch fails", async () => {
    await expect(
      getDraftBoardStrict({
        fetchDrafts: async () => drafts as never,
        fetchRosters: async () => rosters as never,
        fetchUsers: async () => users as never,
        fetchDraftPicks: async () => {
          throw new Error("Sleeper API 503 on /draft_picks");
        },
      })
    ).rejects.toThrow("Sleeper API 503");
  });

  it("returns empty picks (not throw) when no draft is on record", async () => {
    const result = await getDraftBoardStrict({
      fetchDrafts: async () => [],
      fetchRosters: async () => rosters as never,
      fetchUsers: async () => users as never,
      fetchDraftPicks: async () => {
        throw new Error("should not be called");
      },
    });
    expect(result.picks).toEqual([]);
    expect(result.teams.length).toBeGreaterThan(0);
  });
});

/**
 * Last-good end-to-end: the real loadLeagueNews wired into the real TTL
 * cache. Prime a nonempty feed, expire the cache, fail both RSS feeds —
 * last-good must survive, not be replaced by [].
 */
describe("news cache + real loader (last-good integration)", () => {
  function fakeClock(start = 0) {
    let t = start;
    return {
      now: () => t,
      advance: (ms: number) => {
        t += ms;
      },
    };
  }

  it("warm: failed refresh after expiry preserves last-good", async () => {
    const clock = fakeClock();
    let feedsDown = false;
    const cache = createLeagueNewsCache({
      now: clock.now,
      load: () =>
        loadLeagueNews(baseDeps(feedsDown ? failFetch() : okFetch())),
    });

    const first = await cache.get();
    expect(first.articles.length).toBeGreaterThan(0);

    clock.advance(LEAGUE_NEWS_TTL_MS + 1);
    feedsDown = true;
    const second = await cache.get();
    // Not an empty feed: the exact last-good value survives the outage.
    expect(second).toBe(first);
  });

  it("cold: failed load throws so getLeagueNews degrades honestly", async () => {
    const cache = createLeagueNewsCache({
      load: () => loadLeagueNews(baseDeps(failFetch())),
    });
    await expect(cache.get()).rejects.toThrow("All news RSS feeds failed");
  });
});

/**
 * Default draft path (issue #122 repair 1): loadLeagueNews must use the
 * strict draft board by DEFAULT — the resilient getDraftBoard swallows
 * upstream failures into empty picks, which marked a draft outage as
 * "ok" and silently dropped Rookie Wire.
 *
 * These tests drive the REAL default: no fetchDraftBoardFn override, so
 * the default getDraftBoardStrict runs with its real default fetchers.
 * Only the underlying Sleeper HTTP is stubbed (globalThis.fetch);
 * RSS, rosters, and the directory stay injected fakes so the draft
 * path is isolated. Injected rejecting-loader tests bypassed this —
 * these don't.
 */
describe("loadLeagueNews default draft path (real getDraftBoardStrict)", () => {
  const DRAFT_XML = `<?xml version="1.0"?><rss version="2.0"><channel>
<item><title>Fake Rookie shines in debut</title><link>https://www.espn.com/nba/story/_/id/20/fake-rookie</link>
<description>A big night for the rookie.</description><pubDate>Thu, 08 Oct 2026 19:21:47 +0000</pubDate></item>
</channel></rss>`;

  const DIRECTORY = {
    "9999": { full_name: "Fake Rookie", position: "PG" },
  };

  const RAW_PICK = {
    pick_no: 1,
    round: 1,
    draft_slot: 1,
    player_id: "9999",
    roster_id: 1,
    metadata: { full_name: "Fake Rookie", position: "PG" },
  };

  const SETTINGS = {
    wins: 0,
    losses: 0,
    ties: 0,
    fpts: 0,
    fpts_decimal: 0,
    fpts_against: 0,
    fpts_against_decimal: 0,
  };

  // Deps WITHOUT fetchDraftBoardFn — the real default applies.
  function defaultPathDeps() {
    const fetchFn = (async () =>
      ({ ok: true, text: async () => DRAFT_XML }) as unknown as Response) as typeof fetch;
    return {
      fetchFn,
      fetchRostersFn: async () => [{ players: ["9999"] }] as never[],
      fetchDirectoryFn: async () => DIRECTORY as never,
    };
  }

  // Stub the Sleeper HTTP layer used by getDraftBoardStrict's default
  // fetchers. Returns a restore function; callers must restore in
  // finally (the offline setup file replaces fetch globally, so this
  // reassignment is the sanctioned seam).
  function stubSleeperFetch(
    opts: {
      draftsFail?: boolean;
      picksFail?: boolean;
      emptyDrafts?: boolean;
      picks?: unknown[];
    } = {}
  ): () => void {
    const realFetch = globalThis.fetch;
    const rosters = [
      {
        roster_id: 1,
        owner_id: "u1",
        players: ["9999"],
        settings: SETTINGS,
      },
    ];
    const users = [{ user_id: "u1", display_name: "amy" }];
    globalThis.fetch = (async (url: unknown) => {
      const u = String(url);
      if (u.endsWith("/drafts")) {
        if (opts.draftsFail) throw new Error("Sleeper API 503 on /drafts");
        return {
          ok: true,
          json: async () =>
            opts.emptyDrafts
              ? []
              : [{ draft_id: "d1", season: "2026", status: "complete" }],
        };
      }
      if (/\/draft\/[^/]+\/picks$/.test(u)) {
        if (opts.picksFail) throw new Error("Sleeper API 503 on /draft_picks");
        return { ok: true, json: async () => opts.picks ?? [] };
      }
      if (u.endsWith("/rosters")) {
        return { ok: true, json: async () => rosters };
      }
      if (u.endsWith("/users")) {
        return { ok: true, json: async () => users };
      }
      throw new Error(`unexpected Sleeper URL in test: ${u}`);
    }) as typeof fetch;
    return () => {
      globalThis.fetch = realFetch;
    };
  }

  it("draft-list failure through the real default marks draft unknown (cold)", async () => {
    const restore = stubSleeperFetch({ draftsFail: true });
    try {
      const edition = await loadLeagueNews(defaultPathDeps());
      expect(edition.coverage.draft).toBe("unknown");
      // Feeds still served; Rookie Wire unavailable, never silently empty.
      expect(edition.articles.length).toBeGreaterThan(0);
      expect(sectionCoverageStatus("rookies", edition.coverage)).toBe(
        "unavailable"
      );
      for (const a of edition.articles) {
        expect(a.sections).not.toContain("rookies");
      }
    } finally {
      restore();
    }
  });

  it("draft-picks failure through the real default marks draft unknown (cold)", async () => {
    const restore = stubSleeperFetch({ picksFail: true });
    try {
      const edition = await loadLeagueNews(defaultPathDeps());
      expect(edition.coverage.draft).toBe("unknown");
      expect(sectionCoverageStatus("rookies", edition.coverage)).toBe(
        "unavailable"
      );
    } finally {
      restore();
    }
  });

  it("valid empty draft (no draft on record) stays ok — distinct from an outage", async () => {
    const restore = stubSleeperFetch({ emptyDrafts: true });
    try {
      const edition = await loadLeagueNews(defaultPathDeps());
      expect(edition.coverage.draft).toBe("ok");
      // Rookie Wire is AVAILABLE but empty — the honest empty state,
      // not the unavailable state an outage produces.
      expect(sectionCoverageStatus("rookies", edition.coverage)).toBe(
        "available"
      );
    } finally {
      restore();
    }
  });

  it("healthy default path classifies the rookie", async () => {
    const restore = stubSleeperFetch({ picks: [RAW_PICK] });
    try {
      const edition = await loadLeagueNews(defaultPathDeps());
      expect(edition.coverage.draft).toBe("ok");
      const rookie = edition.articles.find((a) =>
        a.headline.includes("Fake Rookie")
      );
      expect(rookie?.sections).toEqual(["latest", "league", "rookies"]);
    } finally {
      restore();
    }
  });

  it("warm: draft outage after cache expiry yields unknown draft, not last-good", async () => {
    const clock = (() => {
      let t = 0;
      return { now: () => t, advance: (ms: number) => { t += ms; } };
    })();
    let restore = stubSleeperFetch({ picks: [RAW_PICK] });
    const cache = createLeagueNewsCache({
      now: clock.now,
      // Real default draft path on every load.
      load: () => loadLeagueNews(defaultPathDeps()),
    });
    try {
      const first = await cache.get();
      expect(first.coverage.draft).toBe("ok");
      expect(
        first.articles.find((a) => a.headline.includes("Fake Rookie"))
          ?.sections
      ).toContain("rookies");

      clock.advance(LEAGUE_NEWS_TTL_MS + 1);
      restore();
      restore = stubSleeperFetch({ draftsFail: true });
      const second = await cache.get();
      // Identity degradation is per-edition (accepted): the outage is
      // explicit unknown coverage, not a preserved stale edition.
      expect(second.coverage.draft).toBe("unknown");
      expect(second).not.toBe(first);
      expect(sectionCoverageStatus("rookies", second.coverage)).toBe(
        "unavailable"
      );
    } finally {
      restore();
    }
  });

  it("recovery: draft outage then success restores ok coverage", async () => {
    let restore = stubSleeperFetch({ draftsFail: true });
    try {
      const bad = await loadLeagueNews(defaultPathDeps());
      expect(bad.coverage.draft).toBe("unknown");
      restore();
      restore = stubSleeperFetch({ picks: [RAW_PICK] });
      const good = await loadLeagueNews(defaultPathDeps());
      expect(good.coverage.draft).toBe("ok");
      const rookie = good.articles.find((a) =>
        a.headline.includes("Fake Rookie")
      );
      expect(rookie?.sections).toContain("rookies");
    } finally {
      restore();
    }
  });
});
