import type { NewsArticle, PublicationId } from "@/domain/news";

// Explicit synthetic stories; all five existing personality controls are exercised.
const player = { playerId: "fixture-alpha", name: "Synthetic Alpha" };
const team = { teamId: "1", name: "Synthetic Northside" };
const at = Date.parse("2026-10-08T12:00:00Z");
const voices: PublicationId[] = ["espn", "athletic", "bleacher", "shams"];
const headlines = [
  "Synthetic Northside lands Synthetic Alpha: the league has opinions",
  "The Synthetic Alpha move, by the numbers: one deal, several ways to read it",
  "SYNTHETIC NORTHSIDE IS COOKING: SYNTHETIC ALPHA HAS A NEW HOME",
  "Sources (fictional): Synthetic Northside adds Synthetic Alpha",
];
const trade: NewsArticle[] = voices.map((publication, i) => ({
  id: `trade-0-123456-${publication}`, publication, kind: "trade", section: "latest",
  headline: headlines[i], body: [
    "Synthetic Northside has made a move for Synthetic Alpha. This is a made-up transaction for a private interface test.",
    `${publication} reaction: this paragraph tests complete reading, exact actor links and changing voices. No league result, quote or forecast is being reported.`,
    "The rest of the group chat can make up its own mind. This final paragraph remains available when opening, closing and returning to the story.",
  ], publishedAt: at + i * 60000, players: [player], teams: [team],
}));
const others: NewsArticle[] = [
  { ...trade[0], id: "rookie-1-espn", kind: "rookie", section: "rookies", headline: "Synthetic Beta goes No. 1: a fresh face for Synthetic Northside", publishedAt: at - 3600000 },
  { ...trade[1], id: "rookie-1-athletic", kind: "rookie", section: "rookies", headline: "The rookie curve: the spreadsheet gets a new name", publishedAt: at - 7200000 },
  { ...trade[2], id: "rookie-1-bleacher", kind: "rookie", section: "rookies", headline: "THE SYNTHETIC DRAFT JUST GOT LOUD", publishedAt: at - 10800000 },
  { ...trade[0], id: "rumor-busy-1", kind: "rumor", section: "rumors", headline: "Synthetic Northside is working the phones — what comes next?", publishedAt: at - 14400000 },
  { ...trade[0], id: "take-rookie-1", kind: "take", section: "takes", publication: "bayless", headline: "I have QUESTIONS about the synthetic No. 1 pick", publishedAt: at - 18000000 },
  { ...trade[0], id: "waiver-0-234567-espn", kind: "waiver", section: "latest", headline: "The synthetic wire: a small move worth watching", publishedAt: at - 21600000 },
];
export function fixtureArticles(state: string | null = null): NewsArticle[] {
  let articles = [...trade, ...others];
  if (state === "empty") articles = [];
  if (state === "sparse") articles = [trade[0]];
  if (state === "long") articles = articles.map(a => ({ ...a, headline: `${a.headline} — ${"AnExtraordinarilyLongUnbrokenSyntheticHeadline".repeat(3)}`, body: [...a.body, ...a.body, ...a.body] }));
  if (state === "changed") articles = articles.map(a => ({ ...a, headline: "A different synthetic event in the same render slot", body: ["Replacement fixture prose."] }));
  if (state === "timestamp") articles = articles.map(a => a.kind === "trade" || a.kind === "waiver" ? a : ({ ...a, publishedAt: a.publishedAt + 11 * 60000 }));
  if (state === "duplicate") articles = [trade[0], { ...trade[0], headline: "Another synthetic event sharing the same slot" }];
  return articles;
}
