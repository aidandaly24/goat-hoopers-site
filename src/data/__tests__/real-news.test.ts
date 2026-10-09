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
  OUTLET_HOSTS,
  buildRealNewsFeed,
  fetchRssFeed,
  hashUrl,
  isAllowedArticleUrl,
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
    rostersKnown: true,
    draftKnown: true,
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
    const edition = await loadLeagueNews(
      deps((async (url: unknown) =>
        String(url).includes("espn")
          ? { ok: true, text: async () => ESPN_XML }
          : Promise.reject(new Error("cbs down"))) as typeof fetch)
    );
    expect(edition.articles.length).toBeGreaterThan(0);
    expect(edition.articles.every((a) => a.outlet.id === "espn")).toBe(true);
  });

  it("failed identity inputs degrade to an explicit unknown-coverage edition", async () => {
    const edition = await loadLeagueNews(
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
    expect(edition.coverage).toEqual({
      rosters: "unknown",
      directory: "unknown",
      draft: "unknown",
    });
    expect(edition.articles.length).toBeGreaterThan(0);
    expect(edition.articles.every((a) => a.players.length === 0)).toBe(true);
    // No invented classifications — latest only.
    expect(edition.articles.every((a) => a.sections.join() === "latest")).toBe(true);
  });

  it("ignores Sleeper team-defense entries (position DEF) in mention matching", async () => {
    const xml = `<?xml version="1.0"?><rss version="2.0"><channel>
<item><title>Dallas Mavericks win big</title><link>https://www.espn.com/nba/story/_/id/99/dal</link>
<description>The Dallas Mavericks beat everyone.</description>
<pubDate>Thu, 08 Oct 2026 19:21:47 +0000</pubDate></item>
</channel></rss>`;
    const edition = await loadLeagueNews(
      deps(okFetch(xml), {
        fetchDirectoryFn: async () => ({
          DAL: { first_name: "Dallas", last_name: "Mavericks", position: "DEF" },
        }),
      })
    );
    expect(edition.articles).toHaveLength(1);
    expect(edition.articles[0].players).toEqual([]);
    expect(edition.articles[0].sections).toEqual(["latest"]);
  });

  it("classifies a rostered rookie into league + rookies sections", async () => {
    const edition = await loadLeagueNews(deps(okFetch(ESPN_XML)));
    const articles = edition.articles;
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

describe("isAllowedArticleUrl", () => {
  const espn = OUTLET_HOSTS.espn;
  it("accepts https apex and subdomains", () => {
    expect(isAllowedArticleUrl("https://www.espn.com/nba/story/_/id/1/x", espn)).toBe(true);
    expect(isAllowedArticleUrl("https://espn.com/nba", espn)).toBe(true);
    expect(isAllowedArticleUrl("http://www.espn.com/nba", espn)).toBe(true);
  });
  it("rejects non-http(s) schemes", () => {
    expect(isAllowedArticleUrl("javascript:alert(1)", espn)).toBe(false);
    expect(isAllowedArticleUrl("data:text/html,<h1>x</h1>", espn)).toBe(false);
    expect(isAllowedArticleUrl("ftp://www.espn.com/nba", espn)).toBe(false);
    expect(isAllowedArticleUrl("file:///etc/passwd", espn)).toBe(false);
  });
  it("rejects relative and malformed links", () => {
    expect(isAllowedArticleUrl("/nba/story/_/id/1/x", espn)).toBe(false);
    expect(isAllowedArticleUrl("www.espn.com/nba", espn)).toBe(false);
    expect(isAllowedArticleUrl("", espn)).toBe(false);
    expect(isAllowedArticleUrl("https://", espn)).toBe(false);
  });
  it("rejects off-host links when a host allowlist is given", () => {
    expect(isAllowedArticleUrl("https://www.cbssports.com/nba/", espn)).toBe(false);
    expect(isAllowedArticleUrl("https://espn.com.evil.com/nba", espn)).toBe(false);
  });
  it("is case-insensitive on the host", () => {
    expect(isAllowedArticleUrl("https://WWW.ESPN.COM/nba", espn)).toBe(true);
  });
  it("without an allowlist, any absolute http(s) URL passes the scheme check", () => {
    expect(isAllowedArticleUrl("https://example.com/1")).toBe(true);
    expect(isAllowedArticleUrl("javascript:alert(1)")).toBe(false);
  });
});

describe("parseRssItems link policy", () => {
  const xml = (link: string) => `<?xml version="1.0"?><rss version="2.0"><channel>
<item><title>Headline</title><link>${link}</link></item>
</channel></rss>`;
  it("skips javascript:, relative, and ftp destinations", () => {
    expect(parseRssItems(xml("javascript:alert(1)"))).toHaveLength(0);
    expect(parseRssItems(xml("/nba/relative"))).toHaveLength(0);
    expect(parseRssItems(xml("ftp://www.espn.com/nba"))).toHaveLength(0);
  });
  it("keeps absolute http(s) links when no host allowlist is given", () => {
    expect(parseRssItems(xml("https://example.com/1"))).toHaveLength(1);
  });
  it("enforces the outlet host allowlist when provided", () => {
    const cbs = "https://www.cbssports.com/nba/news/x/";
    expect(parseRssItems(xml(cbs), OUTLET_HOSTS.espn)).toHaveLength(0);
    expect(parseRssItems(xml(cbs), OUTLET_HOSTS.cbs)).toHaveLength(1);
  });
});

describe("entity decoding", () => {
  it("decodes astral-plane numeric entities", () => {
    expect(plainText("&#x1F600;")).toBe("😀");
    expect(plainText("&#128512;")).toBe("😀");
  });
  it("replaces out-of-range and lone-surrogate code points with U+FFFD", () => {
    expect(plainText("&#x110000;")).toBe("�");
    expect(plainText("&#0;")).toBe("�");
    expect(plainText("&#xD800;")).toBe("�");
  });
  it("strips encoded HTML tags instead of displaying them", () => {
    expect(plainText("&lt;script&gt;alert(1)&lt;/script&gt;")).toBe("alert(1)");
    expect(plainText("&lt;b&gt;bold&lt;/b&gt;")).toBe("bold");
  });
  it("keeps doubly-encoded text literal", () => {
    expect(plainText("&amp;lt;")).toBe("&lt;");
  });
  it("preserves bare comparisons", () => {
    expect(plainText("a &lt; b &gt; c")).toBe("a < b > c");
  });
});

describe("matchPlayersToArticle via shared playerSearchKey", () => {
  const JOKIC = [{ playerId: "p-jokic", name: "Nikola Jokić" }];
  it("matches an accented name at the very end of a headline", () => {
    // The exact #122 reproduction: ASCII \\b failed on the trailing diacritic.
    expect(
      matchPlayersToArticle("Nuggets win as Nikola Jokić", JOKIC)
    ).toEqual([{ playerId: "p-jokic", name: "Nikola Jokić" }]);
  });
  it("matches unaccented source spellings against accented directory names", () => {
    expect(matchPlayersToArticle("Nikola Jokic scores 30", JOKIC)).toEqual([
      { playerId: "p-jokic", name: "Nikola Jokić" },
    ]);
  });
  it("matches curly-apostrophe and apostrophe-less variants", () => {
    const sharpe = [{ playerId: "p-sharpe", name: "Day'Ron Sharpe" }];
    expect(matchPlayersToArticle("Day’Ron Sharpe returns", sharpe)).toEqual([
      { playerId: "p-sharpe", name: "Day'Ron Sharpe" },
    ]);
    expect(matchPlayersToArticle("Dayron Sharpe returns", sharpe)).toEqual([
      { playerId: "p-sharpe", name: "Day'Ron Sharpe" },
    ]);
  });
  it("matches possessive mentions", () => {
    const sharpe = [{ playerId: "p-sharpe", name: "Day'Ron Sharpe" }];
    expect(
      matchPlayersToArticle("Day'Ron Sharpe's big night", sharpe)
    ).toEqual([{ playerId: "p-sharpe", name: "Day'Ron Sharpe" }]);
  });
  it("distinguishes Day'Ron Sharpe from Shaedon Sharpe", () => {
    const players = [
      { playerId: "p-dayron", name: "Day'Ron Sharpe" },
      { playerId: "p-shaedon", name: "Shaedon Sharpe" },
    ];
    expect(
      matchPlayersToArticle("Shaedon Sharpe drops 25", players)
    ).toEqual([{ playerId: "p-shaedon", name: "Shaedon Sharpe" }]);
    expect(
      matchPlayersToArticle("Day'Ron Sharpe grabs 12 boards", players)
    ).toEqual([{ playerId: "p-dayron", name: "Day'Ron Sharpe" }]);
  });
  it("no alias policy: lone shorter directory name does NOT match a suffixed mention", () => {
    // "LeBron James Jr." in text with only "LeBron James" in the
    // directory must not become LeBron James — the suffixed span is
    // reserved, not attributed. Same for Sleeper's suffix-less
    // "Mikel Brown" vs the real-world "Mikel Brown Jr.": fail closed
    // until an approved alias policy exists.
    expect(
      matchPlayersToArticle("LeBron James Jr. signs a new deal", [
        { playerId: "p-lebron", name: "LeBron James" },
      ])
    ).toEqual([]);
    expect(
      matchPlayersToArticle("Mikel Brown Jr. scores 20", [
        { playerId: "p-brown", name: "Mikel Brown" },
      ])
    ).toEqual([]);
  });
  it("suffix is recognized before punctuation: 'LeBron James Jr.,' yields no chip", () => {
    // #122 follow-up: suffixSpanEnd read the post-span word until a
    // space, so "LeBron James Jr., ..." normalized to "... jr, ..."
    // was not recognized as suffixed and the lone shorter directory
    // name "LeBron James" incorrectly got the chip. The suffix word
    // must read until a space OR punctuation.
    expect(
      matchPlayersToArticle("LeBron James Jr., and not Sr., dropped 40", [
        { playerId: "p-lebron", name: "LeBron James" },
      ])
    ).toEqual([]);
  });
  it("reserves EVERY occurrence of a longer name, not just the first", () => {
    // Dot's repro: with "Mikel Brown Jr." twice in the text, the old
    // matcher blanked only the first occurrence, letting the shorter
    // "Mikel Brown" claim the second one.
    const players = [
      { playerId: "p-jr", name: "Mikel Brown Jr." },
      { playerId: "p-short", name: "Mikel Brown" },
    ];
    expect(
      matchPlayersToArticle(
        "Mikel Brown Jr. shines. Mikel Brown Jr. scores20.",
        players
      )
    ).toEqual([{ playerId: "p-jr", name: "Mikel Brown Jr." }]);
  });
  it("ambiguous longer spans still reserve: shorter name cannot steal them", () => {
    // Two different playerIds share "Mikel Brown Jr." (ambiguous — no
    // chip), plus a shorter unambiguous "Mikel Brown". The old matcher
    // dropped the ambiguous candidates, letting the shorter ID match.
    const players = [
      { playerId: "p-a", name: "Mikel Brown Jr." },
      { playerId: "p-b", name: "Mikel Brown Jr." },
      { playerId: "p-short", name: "Mikel Brown" },
    ];
    expect(
      matchPlayersToArticle("Mikel Brown Jr. scores 20", players)
    ).toEqual([]);
  });
  it("ambiguous longer spans reserve across repeated occurrences", () => {
    const players = [
      { playerId: "p-a", name: "Mikel Brown Jr." },
      { playerId: "p-b", name: "Mikel Brown Jr." },
      { playerId: "p-short", name: "Mikel Brown" },
    ];
    expect(
      matchPlayersToArticle(
        "Mikel Brown Jr. shines. Mikel Brown Jr. scores20.",
        players
      )
    ).toEqual([]);
  });
  it("ambiguous normalized names yield no chip, never a wrong chip", () => {
    const players = [
      { playerId: "p-a", name: "John Smith" },
      { playerId: "p-b", name: "John Smith" },
    ];
    expect(matchPlayersToArticle("John Smith traded", players)).toEqual([]);
  });
});

describe("buildRealNewsFeed identity states", () => {
  function sourced() {
    return parseRssItems(
      `<?xml version="1.0"?><rss version="2.0"><channel>
<item><title>LeBron James drops 40</title><link>https://www.espn.com/nba/story/_/id/10/x</link></item>
<item><title>Mikel Brown Jr. shines</title><link>https://www.espn.com/nba/story/_/id/11/y</link></item>
</channel></rss>`
    ).map((item) => ({ outlet: OUTLETS.espn, item }));
  }
  function sectionsOf(articles: { headline: string; sections: string[] }[]) {
    const map = new Map<string, string[]>();
    for (const a of articles) map.set(a.headline, [...a.sections]);
    return map;
  }
  it("rostersKnown=false invents no league/free-agency labels", () => {
    const articles = buildRealNewsFeed(
      sourced(),
      identity({ rostersKnown: false })
    );
    const sections = sectionsOf(articles);
    expect(sections.get("LeBron James drops 40")).toEqual(["latest"]);
    // Draft board is known: Rookie Wire still classifies.
    expect(sections.get("Mikel Brown Jr. shines")).toEqual([
      "latest",
      "rookies",
    ]);
  });
  it("draftKnown=false removes Rookie Wire instead of silently emptying it", () => {
    const articles = buildRealNewsFeed(
      sourced(),
      identity({ draftKnown: false })
    );
    const sections = sectionsOf(articles);
    expect(sections.get("Mikel Brown Jr. shines")).toEqual([
      "latest",
      "league",
    ]);
    expect(
      articles.some((a) => a.sections.includes("rookies"))
    ).toBe(false);
  });
});
