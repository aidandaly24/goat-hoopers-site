import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import type { WeeklyLeaderboardBoard } from "@/domain/arcade/weekly-leaderboard";
import { WeeklyLeaderboard } from "./WeeklyLeaderboard";

// Synthetic display evidence only; these names/scores never enter a runtime loader.
const board: WeeklyLeaderboardBoard = {
  scope: "everyone", calendar: { timeZone: "America/New_York" },
  period: { week: "2026-W42", startsAtMs: Date.parse("2026-10-12T04:00:00Z"), endsAtMs: Date.parse("2026-10-19T04:00:00Z") },
  entries: Array.from({ length: 4 }, (_, index) => ({ rank: index + 1, username: index === 1 ? '<script>alert("name")</script>' : `Fixture player ${index + 1}`,
    score: 4 - index, makes: 4 - index, attempts: 5, accuracy: (4 - index) / 5, longestStreak: 4 - index, isCurrentUser: index === 1 })),
};

it("renders existing server ranks, validated metrics and current-user identity without exposing private metadata", () => {
  const fromServer = { ...board, rulesVersion: "a".repeat(64), ruleSetId: "test-only" };
  const html = renderToStaticMarkup(createElement(WeeklyLeaderboard, { state: { status: "ready", board: fromServer }, onScopeChange: vi.fn(), limit: 50 }));
  expect(html).toContain('aria-label="Weekly rankings"');
  expect(html).toContain('data-leader-count="3"');
  expect(html.match(/data-leading="true"/g)).toHaveLength(3);
  expect(html.match(/data-current="true"/g)).toHaveLength(1);
  expect(html).toContain("&lt;script&gt;alert(&quot;name&quot;)&lt;/script&gt;");
  expect(html).toContain("80%"); expect(html).toContain("4/5"); expect(html).toContain("Best streak");
  expect(html).toContain("2026-W42"); expect(html).toContain("Oct 12 – Oct 18");
  expect(html).toContain('dateTime="2026-10-19T04:00:00.000Z"');
  expect(html).toContain("earliest server acceptance"); expect(html).toContain("Showing up to 50 players");
  expect(html).not.toContain(fromServer.rulesVersion); expect(html).not.toContain(fromServer.ruleSetId);
  expect(html).not.toContain("All time"); expect(html).not.toContain("FAAB");
});

it("keeps a public closed board factual, disabled and free of synthetic dates or rows", () => {
  const onScopeChange = vi.fn(), onRetry = vi.fn();
  const html = renderToStaticMarkup(createElement(WeeklyLeaderboard, { state: { status: "closed" }, onScopeChange, onRetry, headingLevel: 1 }));
  expect(html).toContain("Competition closed"); expect(html).toContain("Practice is available");
  expect(html.match(/disabled=""/g)).toHaveLength(2);
  expect(html).not.toContain("Weekly rankings"); expect(html).not.toContain("2026-"); expect(html).not.toContain("Weekly cutoff");
  expect(html).not.toContain("Reload rankings"); expect(html).toContain("<h1");
  expect(onScopeChange).not.toHaveBeenCalled(); expect(onRetry).not.toHaveBeenCalled();
});

it("shows loading, recoverable failure and empty league states without substituting scores", () => {
  const loading = renderToStaticMarkup(createElement(WeeklyLeaderboard, { state: { status: "loading" }, onScopeChange: vi.fn() }));
  const failed = renderToStaticMarkup(createElement(WeeklyLeaderboard, { state: { status: "error" }, onRetry: vi.fn() }));
  const empty = renderToStaticMarkup(createElement(WeeklyLeaderboard, { state: { status: "ready", board: { ...board, scope: "league", entries: [] } }, onScopeChange: vi.fn() }));
  expect(loading).toContain("Loading rankings"); expect(loading).not.toContain("Weekly rankings");
  expect(failed).toContain("Reload rankings"); expect(failed).not.toContain("Weekly rankings");
  expect(empty).toContain("No validated scores in this scope yet"); expect(empty).toContain("currently linked to a GOAT Hoopers team");
  expect(empty).toContain('aria-pressed="true">League'); expect(empty).not.toContain("Weekly rankings");
});
