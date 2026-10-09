import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import type { NewsArticle } from "@/domain/news";
import { resolveStory, storyHref, storyRevision, uniqueStory } from "./storyLinks";

const article = (overrides: Partial<NewsArticle> = {}): NewsArticle => ({
  id: "take-trade-1", publication: "bayless", kind: "take", section: "takes",
  headline: "Synthetic first deal", body: ["Synthetic reaction"], publishedAt: 1000,
  players: [{ playerId: "p1", name: "Synthetic One" }],
  teams: [{ teamId: "1", name: "Synthetic Team" }], ...overrides,
});

const legacyRevision = (a: NewsArticle) => `v1-${createHash("sha256").update(JSON.stringify([
  a.id, a.publication, a.kind, a.section, a.headline, a.body, a.publishedAt,
  a.players.map(p => [p.playerId, p.name]), a.teams.map(t => [t.teamId, t.name]),
])).digest("hex")}`;

describe("Newsroom meaningful content links", () => {
  it("keeps identical content addressable after an 11-minute refresh or a date rollover", () => {
    for (const kind of ["rookie", "rumor", "take"] as const) {
      const first = article({ kind });
      for (const publishedAt of [1001, first.publishedAt + 11 * 60000, first.publishedAt + 86400000]) {
        const refreshed = { ...first, publishedAt };
        expect(storyRevision(refreshed)).toBe(storyRevision(first));
        expect(resolveStory([refreshed], first.id, storyRevision(first))).toBe(refreshed);
        expect(storyHref("takes", refreshed)).toBe(storyHref("takes", first));
      }
    }
  });

  it("retains transaction-derived time to reject repeated trade/waiver events with identical prose", () => {
    for (const kind of ["trade", "waiver"] as const) {
      const first = article({ kind });
      const differentEvent = { ...first, publishedAt: 2000 };
      expect(storyRevision(first)).toBe(legacyRevision(first).replace("v1-", "v2-"));
      expect(storyRevision(differentEvent)).not.toBe(storyRevision(first));
      expect(resolveStory([differentEvent], first.id, storyRevision(first))).toBeUndefined();
    }
  });

  it("accepts v1 only for its exact original snapshot and never guesses an expired timestamp", () => {
    const first = article();
    const legacy = legacyRevision(first);
    expect(resolveStory([first], first.id, legacy)).toBe(first);
    expect(resolveStory([article({ publishedAt: 1001 })], first.id, legacy)).toBeUndefined();
    expect(resolveStory([article({ body: ["Different event"] })], first.id, legacy)).toBeUndefined();
    expect(resolveStory([first, article()], first.id, legacy)).toBeUndefined();
  });
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
    for (const invalid of ["v1-invalid", "v2-invalid", "v3-" + "0".repeat(64), "0".repeat(64)])
      expect(resolveStory([first], first.id, invalid)).toBeUndefined();
    expect(resolveStory([first, article()], first.id, revision)).toBeUndefined();
    expect(resolveStory([JSON.parse(JSON.stringify(first))], first.id, revision)).toEqual(first);
    expect(uniqueStory([first], first.id)).toBe(first);
    expect(uniqueStory([first, article()], first.id)).toBeUndefined();
    expect(uniqueStory([first], "missing")).toBeUndefined();
  });

  it("guards meaningful content and identities even when generated time is unchanged", () => {
    const first = article();
    for (const override of [
      { id: "another-slot" }, { publication: "espn" }, { kind: "rumor" }, { section: "rumors" },
      { headline: "Changed headline" }, { body: ["Changed prose"] },
      { players: [{ playerId: "p2", name: "Synthetic One" }] },
      { players: [{ playerId: "p1", name: "Changed name" }] },
      { teams: [{ teamId: "2", name: "Synthetic Team" }] },
      { teams: [{ teamId: "1", name: "Changed team" }] },
    ] satisfies Partial<NewsArticle>[]) {
      expect(storyRevision(article(override))).not.toBe(storyRevision(first));
      expect(resolveStory([article(override)], first.id, storyRevision(first))).toBeUndefined();
    }
  });

  it("retains paragraph and actor order rather than normalizing distinct coverage", () => {
    const first = article({ body: ["First", "Second"], players: [{ playerId: "1", name: "One" }, { playerId: "2", name: "Two" }] });
    for (const next of [{ ...first, body: [...first.body].reverse() }, { ...first, players: [...first.players].reverse() }]) {
      expect(resolveStory([next], first.id, storyRevision(first))).toBeUndefined();
    }
  });

  it("matches native SHA-256 across UTF-8 and padding boundaries", () => {
    for (const length of [0, 1, 55, 56, 63, 64, 65, 127, 128, 1024]) {
      const a = article({ headline: "🏀 É — ".repeat(length), body: ["", "界".repeat(length)] });
      const canonical = JSON.stringify([a.id, a.publication, a.kind, a.section, a.headline, a.body,
        a.players.map(p => [p.playerId, p.name]), a.teams.map(t => [t.teamId, t.name])]);
      expect(storyRevision(a)).toBe(`v2-${createHash("sha256").update(canonical).digest("hex")}`);
      expect(storyRevision(a)).toMatch(/^v2-[a-f0-9]{64}$/);
    }
  });
});
