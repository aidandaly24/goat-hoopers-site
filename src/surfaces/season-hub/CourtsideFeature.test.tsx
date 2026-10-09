import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { Matchup, Team } from "@/domain";
import { AI_PROBABILITY_LABEL, type AiWeeklySlate } from "@/domain/ai-decider";
import type { WeeklyEdition } from "@/domain/weekly-spotlight";
import { CourtsideFeature } from "./CourtsideFeature";
import { CourtsideHome } from "./CourtsideHome";

// Synthetic presentation inputs only: these percentages are never league content.
const team = (id: string): Team => ({ id, name: `Current ${id}`, managerName: "Synthetic manager",
  avatar: `fixture-avatar-${id}`, wins: 0, losses: 0, ties: 0, pointsFor: 0, pointsAgainst: 0 });
const pair: Matchup = { week: 1, home: team("6"), away: team("10"), homePoints: null, awayPoints: null };
const entries = [pair.home, pair.away].map(identity => ({ identity, currentRecord: null,
  previousSeason: null, currentMatchup: pair, players: [], featuredPlayerIds: [], opener: null, recentMove: null, latestMove: null }));
const edition: WeeklyEdition = { id: "fixture", season: "2026", title: "Synthetic edition", dateLabel: "Fixture",
  startsAt: "2026-10-09T00:00:00Z", endsAt: "2026-10-16T00:00:00Z", status: "draft", publishedAt: null,
  game: { title: "Synthetic featured game", note: "Fixture", leagueWeek: 1, teamIds: ["6", "10"], state: "upcoming",
    scores: null, context: "Synthetic context", selectionReason: "Synthetic selection" }, playerSpotlights: [], happenings: [], sources: [] };
const weekly = (): AiWeeklySlate => ({ leagueId: "fixture", season: "2026", week: 1, status: "ready",
  message: "Saved test pick", generatedAt: "2026-10-09T00:00:00Z", snapshot: null,
  matchups: [{ matchupId: "fixture", teamIds: ["10", "6"], status: "ready", message: "Saved", evidence: [], baseline: null,
    result: { model: "fixture-model", promptVersion: "fixture-v1", choice: "6", confidence: .21,
      probabilities: [{ choice: "10", probability: .62 }, { choice: "6", probability: .38 }],
      evidence: [], probabilityLabel: AI_PROBABILITY_LABEL, snapshot: null } }] });
const render = (aiWeekly: AiWeeklySlate, season: string | null = "2026") => renderToStaticMarkup(createElement(CourtsideFeature,
  { edition, entries, rosterCounts: {}, preseason: true, checkedAt: "2026-10-09T00:00:00Z", season, aiWeekly, sources: null }));

describe("integrated saved-pick matchup sidebar", () => {
  it("joins by roster ID, preserves the actual choice independently of probability/order, and never fetches", () => {
    const data = weekly(), before = JSON.stringify(data), fetch = vi.spyOn(globalThis, "fetch");
    try {
      const html = render(data);
      expect(html).toMatch(/data-probability-for="6"[^]*?width:38%/);
      expect(html).toMatch(/data-probability-for="10"[^]*?width:62%/);
      expect(html).toContain("Model choice: Current 6");
      expect(html).toContain("Roster 6 · 38%");
      expect(html).toContain("Current team names");
      expect(html).toContain("fixture-avatar-6");
      expect(html).toContain('aria-controls="game-title matchup-context"');
      expect(html).toContain('href="/ai-decides"');
      expect(html).toContain(AI_PROBABILITY_LABEL);
      expect(JSON.stringify(data)).toBe(before);
      expect(fetch).not.toHaveBeenCalled();
    } finally { fetch.mockRestore(); }
  });

  it.each(["missing", "week", "season", "identity", "unavailable", "unknown season"])("shows no invented bars for %s saved data", state => {
    const data = weekly();
    if (state === "missing") data.matchups = [];
    if (state === "week") data.week = 2;
    if (state === "season") data.season = "2025";
    if (state === "identity") data.matchups[0].teamIds = ["6", "2"];
    if (state === "unavailable") { data.matchups[0].status = "unavailable"; data.matchups[0].result = null; }
    const html = render(data, state === "unknown season" ? null : "2026");
    expect(html).toContain("Prediction unavailable");
    expect(html).not.toContain("data-probability-for");
    expect(html).not.toContain("50%");
    expect(html).toContain('href="/ai-decides"');
  });

  it("labels expired matching saved picks as past-week, while retaining their actual distribution", () => {
    const html = render({ ...weekly(), status: "stale" });
    expect(html).toContain("Past-week pick: Current 6");
    expect(html).toContain("width:38%");
    expect(html).toContain("saved model picks · past week");
  });

  it("renders one AI section in the court sidebar and retains the playground when the edition is missing", () => {
    const data = { hub: null, directory: entries, edition, checkedAt: "2026-10-09T00:00:00Z", rosterNamesAvailable: true };
    const html = renderToStaticMarkup(createElement(CourtsideHome, { data, archive: [], portraits: {}, aiWeekly: weekly() }));
    expect(html.match(/>AI Decides<\/h2>/g)).toHaveLength(1);
    expect(html).toMatch(/<aside[^]*?>AI Decides<\/h2>[^]*?Open AI playground ↗[^]*?<\/aside>/);
    expect(html.match(/href="\/ai-decides"/g)).toHaveLength(1);
    const empty = renderToStaticMarkup(createElement(CourtsideHome, { data: { ...data, edition: null }, archive: [], portraits: {}, aiWeekly: weekly() }));
    expect(empty).toContain('href="/ai-decides"');
    expect(empty).toContain('href="/teams/6"');
  });
});
