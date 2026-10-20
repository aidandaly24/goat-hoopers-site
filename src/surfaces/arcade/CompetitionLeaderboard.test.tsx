import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { CompetitionLeaderboard } from "./CompetitionLeaderboard";
import { GameCard } from "./GameCard";
import { getPlayableGames } from "@/domain/arcade/games";

it("does not advertise ranked boards for practice-only games or previews", () => {
  for (const game of getPlayableGames()) {
    const html = renderToStaticMarkup(createElement(GameCard, { game }));
    expect(html.includes("All-time ranked leaderboard")).toBe(game.id === "free-throw");
    if (game.id === "free-throw") {
      expect(html).toContain('href="/arcade/ranked-free-throw"');
      expect(html).toContain("Play ranked free throws");
      expect(html).toContain("Local practice court");
    }
    if (game.id !== "free-throw") expect(html).toContain("Unranked · no weekly or all-time leaderboard");
  }
});

it("explains unsupported game routes before trying a ranking read", () => {
  for (const gameId of ["priced-in", "week-2-preview"]) {
    const html = renderToStaticMarkup(createElement(CompetitionLeaderboard, { gameId, kind: "all-time" }));
    expect(html).toContain("has no ranked leaderboard");
    expect(html).not.toContain("Loading rankings");
    expect(html).not.toContain('aria-label="Rankings scope"');
    expect(html).toContain("Free Throw weekly leaderboard");
  }
});

it("keeps loading distinct from an empty board and identifies weekly versus compatible all-time scores", () => {
  const weekly = renderToStaticMarkup(createElement(CompetitionLeaderboard));
  const allTime = renderToStaticMarkup(createElement(CompetitionLeaderboard, { kind: "all-time" }));
  expect(weekly).toContain("This competition week only");
  expect(allTime).toContain("across weeks using this same scoring format");
  for (const html of [weekly, allTime]) {
    expect(html).toContain("Loading rankings");
    expect(html).not.toContain("No validated scores");
    expect(html).toMatch(/local practice does not/i);
    expect(html).toContain("eligible verified personal accounts");
  }
});
