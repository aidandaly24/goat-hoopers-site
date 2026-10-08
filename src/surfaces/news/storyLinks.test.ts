import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import type { NewsArticle } from "@/domain/news";
import { resolveStory, storyHref, storyRevision } from "./storyLinks";

const article = (overrides: Partial<NewsArticle> = {}): NewsArticle => ({
  id: "take-trade-1", publication: "bayless", kind: "take", section: "takes",
  headline: "Synthetic first deal", body: ["Synthetic reaction"], publishedAt: 1000,
  players: [{ playerId: "p1", name: "Synthetic One" }],
  teams: [{ teamId: "1", name: "Synthetic Team" }], ...overrides,
});

describe("Newsroom snapshot links", () => {
  it("does not reopen a new event when a later feed reuses the same render key", () => {
    for (const id of ["take-trade-1", "take-rookie-1", "rumor-busy-1", "rumor-block-0", "trade-0-123456-espn"]) {
      const first = article({ id });
      const next = article({ id, headline: "Synthetic second deal", body: ["A different synthetic reaction"], publishedAt: 2000,
        players: [{ playerId: "p2", name: "Synthetic Two" }] });
      const link = new URL(storyHref("takes", first), "https://fixture.invalid");
      const oldRevision = link.searchParams.get("revision");
      expect(resolveStory([first], id, oldRevision)).toBe(first);
      expect(resolveStory([next], id, oldRevision)).toBeUndefined();
      expect(resolveStory([next], id, storyRevision(next))).toBe(next);
      expect(link.searchParams.get("section")).toBe("takes");
    }
  });

  it("fails closed for unguarded, missing, malformed or duplicate IDs", () => {
    const first = article();
    const revision = storyRevision(first);
    expect(resolveStory([first], first.id, null)).toBeUndefined();
    expect(resolveStory([first], "missing", revision)).toBeUndefined();
    expect(resolveStory([first], first.id, "v1-invalid")).toBeUndefined();
    expect(resolveStory([first, article()], first.id, revision)).toBeUndefined();
    expect(resolveStory([JSON.parse(JSON.stringify(first))], first.id, revision)).toEqual(first);
  });

  it("guards every supplied field, including prose and generated time", () => {
    const first = article();
    for (const override of [
      { id: "another-slot" }, { publication: "espn" }, { kind: "rumor" }, { section: "rumors" },
      { headline: "Changed headline" }, { body: ["Changed prose"] }, { publishedAt: 1001 },
      { players: [{ playerId: "p2", name: "Synthetic One" }] },
      { players: [{ playerId: "p1", name: "Changed name" }] },
      { teams: [{ teamId: "2", name: "Synthetic Team" }] },
      { teams: [{ teamId: "1", name: "Changed team" }] },
    ] satisfies Partial<NewsArticle>[]) {
      expect(storyRevision(article(override))).not.toBe(storyRevision(first));
    }
  });

  it("matches native SHA-256 across UTF-8 and padding boundaries", () => {
    for (const length of [0, 1, 55, 56, 63, 64, 65, 127, 128, 1024]) {
      const a = article({ headline: "🏀 É — ".repeat(length), body: ["", "界".repeat(length)] });
      const canonical = JSON.stringify([a.id, a.publication, a.kind, a.section, a.headline, a.body, a.publishedAt,
        a.players.map(p => [p.playerId, p.name]), a.teams.map(t => [t.teamId, t.name])]);
      expect(storyRevision(a)).toBe(`v1-${createHash("sha256").update(canonical).digest("hex")}`);
      expect(storyRevision(a)).toMatch(/^v1-[a-f0-9]{64}$/);
    }
  });
});
