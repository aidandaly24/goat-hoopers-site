import { describe, it, expect } from "vitest";
import type { NewsArticle } from "@/domain/news";
import { readingStories, storyDate } from "./stories";

const article = (overrides: Partial<NewsArticle> = {}): NewsArticle => ({
  id: "rookie-1-espn", publication: "espn", kind: "rookie", section: "rookies",
  headline: "Synthetic pick", body: ["Synthetic reaction"], publishedAt: 1000,
  players: [{ playerId: "p1", name: "Synthetic Player" }], teams: [{ teamId: "1", name: "Synthetic Team" }], ...overrides,
});
describe("Newsroom presentation grouping", () => {
  it("retains every original reaction/body and uses a restrained primary voice", () => {
    const articles = [article({ id: "rookie-1-bleacher", publication: "bleacher", publishedAt: 3000 }), article(), article({ id: "rookie-1-athletic", publication: "athletic", publishedAt: 2000 })];
    const frozen = JSON.stringify(articles);
    const stories = readingStories(articles, "latest");
    expect(stories).toHaveLength(1);
    expect(stories[0].primary).toBe(articles[1]);
    expect(new Set(stories[0].reactions)).toEqual(new Set(articles));
    expect(JSON.stringify(articles)).toBe(frozen);
  });
  it("groups only exact known families and keeps sections and different picks distinct", () => {
    const articles = [article({ id: "trade-0-123456-espn", kind: "trade", section: "latest" }), article({ id: "trade-0-123456-athletic", kind: "trade", section: "latest", publication: "athletic" }), article({ id: "trade-0-123456-bayless", kind: "trade", section: "takes", publication: "bayless" }), article({ id: "rookie-2-espn" }), article({ id: "take-rookie-1", kind: "take", section: "takes", publication: "bayless" })];
    expect(readingStories(articles, "latest")).toHaveLength(4);
    const takes = readingStories(articles, "takes");
    expect(takes).toHaveLength(2);
    expect(takes.every(s => s.primary.section === "takes")).toBe(true);
    expect(readingStories(articles, "rumors")).toEqual([]);
  });
  it("rejects family collisions, unknown identifiers and duplicate publications", () => {
    const first = article();
    for (const second of [
      article({ id: "rookie-1-athletic", publication: "athletic", players: [{ playerId: "p2", name: "Other" }] }),
      article({ id: "rookie-1-athletic", publication: "athletic", teams: [{ teamId: "2", name: "Other" }] }),
      article({ id: "rookie-1-athletic", publication: "athletic", players: [{ playerId: "p1", name: "Changed name" }] }),
      article({ id: "rookie-1-athletic", publication: "espn" }),
      article({ id: "unknown-1-athletic", publication: "athletic" }),
    ]) expect(readingStories([first, second], "latest")).toHaveLength(2);
  });
  it("handles unordered references, a sparse story and empty input", () => {
    const players = [{ playerId: "p1", name: "One" }, { playerId: "p2", name: "Two" }];
    expect(readingStories([article({ players }), article({ id: "rookie-1-athletic", publication: "athletic", players: [...players].reverse() })], "rookies")).toHaveLength(1);
    expect(readingStories([article()], "latest")).toHaveLength(1);
    expect(readingStories([], "latest")).toEqual([]);
    expect(storyDate(Date.parse("2026-10-08T00:00:00Z"))).toBe("08 Oct 2026");
  });
});
