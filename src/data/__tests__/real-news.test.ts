/**
 * real-news.test.ts — the real-article news pipeline (src/data/real-news.ts).
 *
 * Offline fixtures: sample RSS XML (CDATA, missing pubDate, HTML in the
 * description, HTML entities), player-name matching edge cases (Jr.
 * suffix, substring traps, case-insensitivity), section assignment,
 * URL dedupe, and feed-failure resilience. No network.
 */
import { describe, expect, it } from "vitest";
import {
  OUTLETS,
  buildRealNewsFeed,
  fetchRssFeed,
  hashUrl,
  matchPlayersToArticle,
  parseRssDate,
  parseRssItems,
  plainText,
  type NewsIdentityInput,
} from "@/data/real-news";
import { loadLeagueNews } from "@/data/league";
import type { DraftBoardData } from "@/data/league";

const ESPN_XML = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
<title><![CDATA[www.espn.com - NBA]]></title>
<description>Latest NBA news from www.espn.com</description>
<link>https://www.espn.com</link>
<item>
<title><![CDATA[Mikel Brown Jr. shines in Nets debut]]></title>
<description><![CDATA[<p>The rookie guard scored 24 points in Brooklyn's win.</p>]]></description>
<link><![CDATA[https://www.espn.com/nba/story/_/id/1/brown-debut]]></link>
<pubDate>Thu, 8 Oct 2026 17:01:26 EST</pubDate>
</item>
<item>
<title>LeBron James passes another milestone</title>
<description>James scored 30 in the Lakers&#039; win over the Suns.</description>
<link>https://www.espn.com/nba/story/_/id/2/lebron-milestone</link>
<pubDate>Thu, 08 Oct 2026 19:21:47 +0000</pubDate>
</item>
<item>
<title>Item without a date</title>
<link>https://www.espn.com/nba/story/_/id/3/no-date</link>
</item>
<item>
<title>Item without a link is skipped</title>
<description>No link here.</description>
<pubDate>Thu, 08 Oct 2026 19:21:47 +0000</pubDate>
</item>
</channel></rss>`;

const PLAYERS = [
  { playerId: "p-brown", name: "Mikel Brown Jr." },
  { playerId: "p-lebron", name: "LeBron James" },
  { playerId: "p-ament", name: "Nate Ament" },
];

function identity(overrides: Partial<NewsIdentityInput> = {}): NewsIdentityInput {
  return {
    players: PLAYERS,
    rosteredPlayerIds: new Set(["p-brown", "p-lebron"]),
    rookiePlayerIds: new Set(["p-brown", "p-ament"]),
    ...overrides,
  };
}

describe("parseRssItems", () => {
  it("parses CDATA titles, links, descriptions, and dates", () => {
    const items = parseRssItems(ESPN_XML);
    expect(items).toHaveLength(3); // the link-less item is skipped
    const [first] = items;
    expect(first.title).toBe("Mikel Brown Jr. shines in Nets debut");
    expect(first.link).toBe("https://www.espn.com/nba/story/_/id/1/brown-debut");
    expect(first.description).toContain("rookie guard");
    expect(first.pubDateMs).toBeGreaterThan(0);
  });

  it("decodes HTML entities in titles; descriptions stay raw until plainText", () => {
    const items = parseRssItems(ESPN_XML);
    expect(items[1].title).toBe("LeBron James passes another milestone");
    expect(items[1].description).toContain("Lakers&#039; win");
    expect(plainText(items[1].description)).toContain("Lakers' win");
  });

  it("keeps items with a missing pubDate, sorted last (pubDateMs 0)", () => {
    const items = parseRssItems(ESPN_XML);
    const dateless = items.find((i) => i.title === "Item without a date");
    expect(dateless).toBeDefined();
    expect(dateless!.pubDateMs).toBe(0);
  });

  it("never reads channel-level title/link/description as an item", () => {
    const items = parseRssItems(ESPN_XML);
    expect(items.some((i) => i.title.includes("www.espn.com - NBA"))).toBe(false);
    expect(items.some((i) => i.link === "https://www.espn.com")).toBe(false);
  });

  it("returns [] for garbage input", () => {
    expect(parseRssItems("not xml at all")).toEqual([]);
    expect(parseRssItems("")).toEqual([]);
  });
});

describe("parseRssDate", () => {
  it("parses numeric offsets and GMT", () => {
    expect(parseRssDate("Thu, 08 Oct 2026 19:21:47 +0000")).toBe(
      Date.parse("2026-10-08T19:21:47Z")
    );
  });

  it("parses ESPN's US timezone abbreviations", () => {
    // EST = UTC-5
    expect(parseRssDate("Thu, 8 Oct 2026 17:01:26 EST")).toBe(
      Date.parse("2026-10-08T22:01:26Z")
    );
  });

  it("returns 0 for unparseable dates", () => {
    expect(parseRssDate("yesterday-ish")).toBe(0);
  });
});

describe("plainText", () => {
  it("strips tags, decodes entities, collapses whitespace", () => {
    expect(
      plainText("<p>LeBron&#039;s <b>big</b> night</p>\n  <p>more</p>")
    ).toBe("LeBron's big night more");
  });
});

describe("matchPlayersToArticle", () => {
  it("matches full names case-insensitively, including the Jr. suffix", () => {
    const matched = matchPlayersToArticle(
      "MIKEL BROWN JR. had a great night for Brooklyn",
      PLAYERS
    );
    expect(matched).toEqual([{ playerId: "p-brown", name: "Mikel Brown Jr." }]);
  });

  it("never matches a bare surname", () => {
    const matched = matchPlayersToArticle("Brown had a great night", PLAYERS);
    expect(matched).toEqual([]);
  });

  it("does not let a shorter name match inside a longer one", () => {
    const players = [
      ...PLAYERS,
      { playerId: "p-brown-sr", name: "Mikel Brown" },
    ];
    const matched = matchPlayersToArticle(
      "Mikel Brown Jr. scored 24",
      players
    );
    expect(matched.map((m) => m.playerId)).toEqual(["p-brown"]);
  });

  it("requires whole-word boundaries", () => {
    const matched = matchPlayersToArticle("LeBron Jameson is not a player", PLAYERS);
    expect(matched).toEqual([]);
  });

  it("skips single-word candidate names", () => {
    const matched = matchPlayersToArticle(
      "Giannis dominated",
      [{ playerId: "p-g", name: "Giannis" }]
    );
    expect(matched).toEqual([]);
  });

  it("matches multiple players in one article", () => {
    const matched = matchPlayersToArticle(
      "LeBron James faced off against Mikel Brown Jr.",
      PLAYERS
    );
    expect(matched.map((m) => m.playerId).sort()).toEqual([
      "p-brown",
      "p-lebron",
    ]);
  });
});

describe("buildRealNewsFeed", () => {
  function sourced() {
    return parseRssItems(ESPN_XML).map((item) => ({
      outlet: OUTLETS.espn,
      item,
    }));
  }

  it("builds articles with stable ids, summaries, and newest-first order", () => {
    const articles = buildRealNewsFeed(sourced(), identity());
    expect(articles).toHaveLength(3);
    // 17:01 EST = 22:01 UTC beats the 19:21 UTC item.
    expect(articles[0].headline).toBe("Mikel Brown Jr. shines in Nets debut");
    expect(articles[1].headline).toBe("LeBron James passes another milestone");
    expect(articles[2].headline).toBe("Item without a date"); // undated sorts last
    expect(articles[0].id).toBe(hashUrl(articles[0].url));
    expect(articles[0].summary.length).toBeLessThanOrEqual(201);
    expect(articles[0].summary).not.toContain("<p>");
  });

  it("assigns sections: league for rostered, rookies for drafted rookies, free-agency for the rest", () => {
    const articles = buildRealNewsFeed(sourced(), identity());
    const brown = articles.find((a) =>
      a.headline.includes("Mikel Brown Jr.")
    )!;
    // rostered AND a 2026 drafted rookie
    expect(brown.sections).toContain("latest");
    expect(brown.sections).toContain("league");
    expect(brown.sections).toContain("rookies");
    expect(brown.sections).not.toContain("free-agency");
    expect(brown.players).toEqual([
      { playerId: "p-brown", name: "Mikel Brown Jr." },
    ]);

    const lebron = articles.find((a) => a.headline.includes("LeBron"))!;
    expect(lebron.sections).toEqual(["latest", "league"]);

    const dateless = articles.find((a) =>
      a.headline.includes("without a date")
    )!;
    expect(dateless.sections).toEqual(["latest"]);
    expect(dateless.players).toEqual([]);
  });

  it("marks mentions of unrostered players as free-agency", () => {
    const articles = buildRealNewsFeed(sourced(), identity({
      rosteredPlayerIds: new Set(),
      rookiePlayerIds: new Set(),
    }));
    const lebron = articles.find((a) => a.headline.includes("LeBron"))!;
    expect(lebron.sections).toEqual(["latest", "free-agency"]);
  });

  it("dedupes by URL", () => {
    const sources = [...sourced(), ...sourced()];
    const articles = buildRealNewsFeed(sources, identity());
    expect(articles).toHaveLength(3);
  });
});

describe("hashUrl", () => {
  it("is stable and collision-resistant for distinct URLs", () => {
    expect(hashUrl("https://a.example/1")).toBe(hashUrl("https://a.example/1"));
    expect(hashUrl("https://a.example/1")).not.toBe(
      hashUrl("https://a.example/2")
    );
  });
});

describe("loadLeagueNews", () => {
  const rosters = [{ players: ["p-brown", "p-lebron"] }] as never[];
  const directory = {
    "p-brown": { full_name: "Mikel Brown Jr." },
    "p-lebron": { full_name: "LeBron James" },
  };
  const board: DraftBoardData = {
    picks: [
      {
        pickNo: 6,
        round: 1,
        draftSlot: 6,
        playerId: "p-brown",
        playerName: "Mikel Brown Jr.",
        teamId: "1",
        position: "PG",
        nbaTeam: "BKN",
        espnId: null,
      },
    ],
    teams: [],
  };

  function deps(fetchImpl: typeof fetch, overrides = {}) {
    return {
      fetchFn: fetchImpl,
      fetchRostersFn: async () => rosters,
      fetchDirectoryFn: async () => directory,
      fetchDraftBoardFn: async () => board,
      ...overrides,
    };
  }

  function okFetch(xml: string) {
    return (async () =>
      ({ ok: true, text: async () => xml }) as unknown as Response) as typeof fetch;
  }
  function failFetch() {
    return (async () => {
      throw new Error("network down");
    }) as typeof fetch;
  }

  it("throws when both feeds fail (cache preserves last-good)", async () => {
    await expect(loadLeagueNews(deps(failFetch()))).rejects.toThrow(
      "All news RSS feeds failed"
    );
  });

  it("one feed failing still yields the other's articles", async () => {
    const articles = await loadLeagueNews(
      deps((async (url: unknown) =>
        String(url).includes("espn")
          ? { ok: true, text: async () => ESPN_XML }
          : Promise.reject(new Error("cbs down"))) as typeof fetch)
    );
    expect(articles.length).toBeGreaterThan(0);
    expect(articles.every((a) => a.outlet.id === "espn")).toBe(true);
  });

  it("failed identity inputs degrade to articles without player matches", async () => {
    const articles = await loadLeagueNews(
      deps(okFetch(ESPN_XML), {
        fetchRostersFn: async () => {
          throw new Error("rosters down");
        },
        fetchDirectoryFn: async () => null,
        fetchDraftBoardFn: async () => {
          throw new Error("draft down");
        },
      })
    );
    expect(articles.length).toBeGreaterThan(0);
    expect(articles.every((a) => a.players.length === 0)).toBe(true);
    expect(articles.every((a) => a.sections.includes("latest"))).toBe(true);
  });

  it("ignores Sleeper team-defense entries (position DEF) in mention matching", async () => {
    const xml = `<?xml version="1.0"?><rss version="2.0"><channel>
<item><title>Dallas Mavericks win big</title><link>https://example.com/dal</link>
<description>The Dallas Mavericks beat everyone.</description>
<pubDate>Thu, 08 Oct 2026 19:21:47 +0000</pubDate></item>
</channel></rss>`;
    const articles = await loadLeagueNews(
      deps(okFetch(xml), {
        fetchDirectoryFn: async () => ({
          DAL: { first_name: "Dallas", last_name: "Mavericks", position: "DEF" },
        }),
      })
    );
    expect(articles).toHaveLength(1);
    expect(articles[0].players).toEqual([]);
    expect(articles[0].sections).toEqual(["latest"]);
  });

  it("classifies a rostered rookie into league + rookies sections", async () => {
    const articles = await loadLeagueNews(deps(okFetch(ESPN_XML)));
    const brown = articles.find((a) => a.headline.includes("Mikel Brown Jr."))!;
    expect(brown.players).toEqual([
      { playerId: "p-brown", name: "Mikel Brown Jr." },
    ]);
    expect(brown.sections).toContain("league");
    expect(brown.sections).toContain("rookies");
  });
});

describe("fetchRssFeed", () => {
  function fakeFetch(xml: string, ok = true) {
    return (async () =>
      ({
        ok,
        status: ok ? 200 : 500,
        text: async () => xml,
      }) as unknown as Response) as typeof fetch;
  }

  it("fetches and parses a feed", async () => {
    const items = await fetchRssFeed(
      fakeFetch(ESPN_XML),
      "https://example.com/rss"
    );
    expect(items).toHaveLength(3);
  });

  it("throws on HTTP failure so the caller can fail the feed over", async () => {
    await expect(
      fetchRssFeed(fakeFetch("", false), "https://example.com/rss")
    ).rejects.toThrow("RSS 500");
  });

  it("throws on an empty body", async () => {
    await expect(
      fetchRssFeed(fakeFetch("   "), "https://example.com/rss")
    ).rejects.toThrow("empty body");
  });
});
