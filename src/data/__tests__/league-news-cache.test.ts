/**
 * league-news-cache.test.ts — read-only public news reuse
 * (createLeagueNewsCache in src/data/league.ts).
 *
 * The feed is public data (RSS + rosters/draft — no session state),
 * so one cached copy is shared across requests: cold loads once, warm
 * reuses, expiry reloads, refresh failure serves last-good. Cold failure
 * throws so getLeagueNews can degrade to the honest empty feed.
 */
import { describe, expect, it } from "vitest";
import { createLeagueNewsCache, LEAGUE_NEWS_TTL_MS } from "@/data/league";
import type { LeagueNewsEdition, RealNewsArticle } from "@/domain/news";

function article(id: string, headline: string): RealNewsArticle {
  return {
    id,
    outlet: { id: "espn", name: "ESPN" },
    headline,
    url: `https://www.espn.com/nba/story/_/id/${id}`,
    publishedAt: 0,
    summary: "Summary.",
    players: [],
    sections: ["latest"],
  };
}

function makeEdition(headline: string, id = "a"): LeagueNewsEdition {
  return {
    articles: [article(id, headline)],
    coverage: { rosters: "ok", directory: "ok", draft: "ok" },
    builtAt: 1,
  };
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

describe("createLeagueNewsCache", () => {
  it("cold loads once; independent warm gets reuse without reloading", async () => {
    const clock = fakeClock();
    let loads = 0;
    const cache = createLeagueNewsCache({
      now: clock.now,
      load: async () => {
        loads++;
        return makeEdition("Headline A");
      },
    });

    const first = await cache.get();
    expect(first.articles).toHaveLength(1);
    expect(loads).toBe(1);

    // Simulate independent requests hitting a warm instance.
    clock.advance(LEAGUE_NEWS_TTL_MS - 1);
    const second = await cache.get();
    const third = await cache.get();
    expect(second).toBe(first);
    expect(third).toBe(first);
    expect(loads).toBe(1);
  });

  it("expiry reloads and picks up new articles", async () => {
    const clock = fakeClock();
    let edition = 1;
    const cache = createLeagueNewsCache({
      now: clock.now,
      load: async () => makeEdition(`Edition ${edition}`, `e${edition}`),
    });

    expect((await cache.get()).articles[0]?.headline).toBe("Edition 1");
    clock.advance(LEAGUE_NEWS_TTL_MS);
    edition = 2;
    expect((await cache.get()).articles[0]?.headline).toBe("Edition 2");
  });

  it("refresh failure serves last-good; cold failure throws", async () => {
    const clock = fakeClock();
    let fail = false;
    const cache = createLeagueNewsCache({
      now: clock.now,
      load: async () => {
        if (fail) throw new Error("RSS feeds down");
        return makeEdition("Headline A");
      },
    });

    await cache.get();
    clock.advance(LEAGUE_NEWS_TTL_MS + 1);
    fail = true;
    expect((await cache.get()).articles[0]?.headline).toBe("Headline A");

    const cold = createLeagueNewsCache({
      now: clock.now,
      load: async () => {
        throw new Error("RSS feeds down");
      },
    });
    // getLeagueNews catches this and renders the honest empty feed.
    await expect(cold.get()).rejects.toThrow("RSS feeds down");
  });

  it("uses the documented 5-minute TTL", () => {
    expect(LEAGUE_NEWS_TTL_MS).toBe(5 * 60 * 1000);
  });
});
