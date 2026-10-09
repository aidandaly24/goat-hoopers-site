import type { RealNewsArticle } from "@/domain/news";

// Explicit synthetic articles exercising the real-article contract:
// outlet mastheads, external links, summaries, player chips, sections.
const player = { playerId: "fixture-alpha", name: "Synthetic Alpha" };
const at = Date.parse("2026-10-08T12:00:00Z");

function article(
  id: string,
  outletId: "espn" | "cbs",
  headline: string,
  publishedAt: number,
  sections: RealNewsArticle["sections"],
  players: RealNewsArticle["players"] = [player]
): RealNewsArticle {
  const outlet =
    outletId === "espn"
      ? { id: "espn", name: "ESPN" }
      : { id: "cbs", name: "CBS Sports" };
  return {
    id,
    outlet,
    headline,
    url: `https://example.com/synthetic/${id}`,
    publishedAt,
    summary:
      "Synthetic summary for a private interface test. No league result, quote or forecast is being reported.",
    players,
    sections,
  };
}

const base: RealNewsArticle[] = [
  article("espn-1", "espn", "Synthetic Alpha shines in a made-up debut", at, [
    "latest",
    "league",
    "rookies",
  ]),
  article("cbs-1", "cbs", "The synthetic wire: a small move worth watching", at - 3600000, [
    "latest",
    "league",
  ]),
  article("espn-2", "espn", "Synthetic Beta goes No. 1 in the fictional draft", at - 7200000, [
    "latest",
    "rookies",
  ], []),
  article("cbs-2", "cbs", "Free-agent frenzy: Synthetic Gamma hits the open market", at - 10800000, [
    "latest",
    "free-agency",
  ], [{ playerId: "fixture-gamma", name: "Synthetic Gamma" }]),
];

export function fixtureArticles(state: string | null = null): RealNewsArticle[] {
  let articles = [...base];
  if (state === "empty") articles = [];
  if (state === "sparse") articles = [base[0]];
  if (state === "long")
    articles = articles.map((a) => ({
      ...a,
      headline: `${a.headline} — ${"AnExtraordinarilyLongUnbrokenSyntheticHeadline".repeat(3)}`,
      summary: `${a.summary} ${a.summary} ${a.summary}`,
    }));
  if (state === "changed")
    articles = articles.map((a) => ({
      ...a,
      headline: "A different synthetic event in the same render slot",
      summary: "Replacement fixture prose.",
    }));
  if (state === "timestamp")
    articles = articles.map((a, i) => ({ ...a, publishedAt: a.publishedAt + i * 60000 }));
  if (state === "duplicate")
    articles = [base[0], { ...base[0], headline: "Another synthetic event sharing the same slot" }];
  return articles;
}
