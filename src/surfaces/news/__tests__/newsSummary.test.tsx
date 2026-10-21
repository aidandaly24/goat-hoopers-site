import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { normalizeNewsSummary, type LeagueNewsEdition } from "@/domain/news";
import { buildRealNewsFeed, OUTLETS, parseRssItems } from "@/data/real-news";
import { NewsFeed } from "../NewsFeed";

const identity = { players: [], rosteredPlayerIds: new Set<string>(), rookiePlayerIds: new Set<string>(), rostersKnown: true, draftKnown: true };
const rss = (description: string) => `<rss><channel><item><title>Lead headline</title><link>https://www.espn.com/nba/story/_/id/1</link>${description}</item></channel></rss>`;
it.each(["", "<description>null</description>", "<description><![CDATA[<p> NULL </p>]]></description>", "<description>undefined</description>"])("normalizes missing RSS descriptions without dropping the article: %s", description => {
  const articles = buildRealNewsFeed(parseRssItems(rss(description)).map(item => ({ item, outlet: OUTLETS.espn })), identity);
  expect(articles).toHaveLength(1);
  expect(articles[0].headline).toBe("Lead headline");
  expect(articles[0].summary).toBe("");
});
it("preserves legitimate prose, including the word null, and normal summary cleanup", () => {
  const articles = buildRealNewsFeed(parseRssItems(rss("<description><![CDATA[<p>The deal was declared null and void.</p>]]></description>")).map(item => ({ item, outlet: OUTLETS.espn })), identity);
  expect(articles[0].summary).toBe("The deal was declared null and void.");
  expect(normalizeNewsSummary("  A legitimate update.  ")).toBe("A legitimate update.");
  expect(normalizeNewsSummary("0")).toBe("0");
});
it.each([null, undefined, "null", " NULL ", "undefined", ""])("omits missing lead and cached-row summary values: %s", summary => {
  const article = { id: "lead", headline: "Lead headline", outlet: OUTLETS.espn, url: "https://www.espn.com/nba/story/_/id/1", publishedAt: 0, summary: summary as unknown as string, players: [], sections: ["latest" as const] };
  const edition: LeagueNewsEdition = { articles: [article, { ...article, id: "row", headline: "Row headline" }], coverage: { rosters: "ok", directory: "ok", draft: "ok" }, builtAt: 0 };
  const html = renderToStaticMarkup(createElement(NewsFeed, { edition }));
  expect(html).toContain("Lead headline"); expect(html).toContain("Row headline");
  expect(html).not.toMatch(/>\s*(?:null|undefined)\s*<|class="[^"]*(?:excerpt|rowSummary)/);
});
