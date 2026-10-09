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
<item><title>Fake Rookie shines</title><link>https://example.com/1</link>
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

  it("returns a feed when at least one feed succeeds", async () => {
    const feed = await loadLeagueNews(baseDeps(okFetch()));
    expect(feed.length).toBeGreaterThan(0);
    expect(feed[0].headline).toBe("Fake Rookie shines");
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
    expect(first.length).toBeGreaterThan(0);

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
