import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { Matchup, Team } from "@/domain";
import { AI_PROBABILITY_LABEL, type AiWeeklySlate } from "@/domain/ai-decider";
import type { WeeklyEdition } from "@/domain/weekly-spotlight";
import { CourtsideFeature } from "./CourtsideFeature";
import { CourtsideHome } from "./CourtsideHome";
import { AiDecidesSection } from "./AiDecidesSection";
import { deriveWeekPairs } from "./weekPairs";

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
const renderFeature = (aiWeekly: AiWeeklySlate, season: string | null = "2026") => renderToStaticMarkup(createElement(CourtsideFeature,
  { edition, entries, rosterCounts: {}, preseason: true, checkedAt: "2026-10-09T00:00:00Z", season, aiWeekly }));
const renderAiSection = (aiWeekly: AiWeeklySlate, season: string | null = "2026") => {
  const { pairs, preseasonPreview } = deriveWeekPairs(entries, aiWeekly, season);
  return renderToStaticMarkup(createElement(AiDecidesSection,
    { pairs, aiWeekly, season, preseasonPreview, championTeamId: undefined, viewerTeamId: undefined }));
};

describe("court + league desk hero", () => {
  it("renders the edition headline, the court, and the league desk with the saved preview — and never fetches", () => {
    const data = weekly(), before = JSON.stringify(data), fetch = vi.spyOn(globalThis, "fetch");
    try {
      const html = renderFeature(data);
      expect(html).toContain('<h1 id="game-title">Synthetic featured game</h1>');
      expect(html).toContain("Featured matchup · Week 1 · Upcoming");
      expect(html).toContain('data-league-desk');
      expect(html).toContain("Game of the week · Week 1");
      // The desk split joins by roster ID: home 6 gets its own 38%, away 10 its 62%.
      expect(html).toMatch(/<strong class="gh-num">38%<\/strong> Current 6/);
      expect(html).toMatch(/Current 10 <strong class="gh-num">62%<\/strong>/);
      expect(html).toContain(AI_PROBABILITY_LABEL);
      expect(html).toContain("fixture-model");
      expect(html).toContain("fixture-avatar-6");
      expect(html).toContain('href="#ai-decides"');
      expect(html).toContain("Week 1 matchups");
      expect(html).not.toContain("data-probability-for");
      expect(html).not.toContain("Pause motion");
      expect(html).not.toContain("data-inspecting");
      expect(JSON.stringify(data)).toBe(before);
      expect(fetch).not.toHaveBeenCalled();
    } finally { fetch.mockRestore(); }
  });

  it("shows the honest no-preview state in the desk when no pick joins the featured pairing", () => {
    const data = weekly();
    data.matchups = [];
    const html = renderFeature(data);
    expect(html).toContain("No saved AI preview for this pairing yet.");
    expect(html).not.toContain("50%");
  });
});

describe("archive gate", () => {
  it("shows the live opening clock on the current edition", () => {
    expect(renderFeature(weekly())).toContain('data-court-clock="countdown"');
  });

  it("shows NO current countdown or started UI on an archived edition, even pre-tip", () => {
    // The Sep 28–Oct 4 sample edition rendered with archived=true: its
    // league check predates the Oct 20 tip, so the ungated clock happily
    // counted down to a current opener on a historical page.
    const html = renderToStaticMarkup(createElement(CourtsideFeature,
      { edition, entries, rosterCounts: {}, preseason: true, checkedAt: "2026-10-09T00:00:00Z", season: "2026", aiWeekly: weekly(), archived: true }));
    expect(html).not.toContain("data-court-clock");
    expect(html).not.toContain("Week 1 tip-off");
    expect(html).not.toContain("Week 1 is underway");
    // The rest of the feature — headline, court, desk — still renders.
    expect(html).toContain('<h1 id="game-title">Synthetic featured game</h1>');
    expect(html).toContain("data-league-desk");
  });
});

describe("AI Decides section: saved picks with provenance", () => {
  it("joins by roster ID, preserves the actual choice independently of probability/order, and never fetches", () => {
    const data = weekly(), before = JSON.stringify(data), fetch = vi.spyOn(globalThis, "fetch");
    try {
      const html = renderAiSection(data);
      expect(html).toMatch(/data-probability-for="6"[^]*?width:38%/);
      expect(html).toMatch(/data-probability-for="10"[^]*?width:62%/);
      expect(html).toContain("Model choice: Current 6");
      expect(html).toContain("Current 6 · <span class=\"gh-num\">38%</span>");
      expect(html).toContain("Current team names identify saved roster inputs");
      expect(html).toContain(AI_PROBABILITY_LABEL);
      expect(html).toContain("API confidence 21% is a separate signal");
      expect(html).toContain("fixture-model · fixture-v1");
      expect(html).toContain('href="/ai-decides"');
      expect(html).not.toContain("Roster 6");
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
    const html = renderAiSection(data, state === "unknown season" ? null : "2026");
    expect(html).toContain("Prediction unavailable");
    expect(html).not.toContain("data-probability-for");
    expect(html).not.toContain("50%");
    expect(html).toContain('href="/ai-decides"');
  });

  it("labels expired matching saved picks as past-week, while retaining their actual distribution", () => {
    const html = renderAiSection({ ...weekly(), status: "stale" });
    expect(html).toContain("Past-week saved picks");
    expect(html).toContain("past week");
    expect(html).toContain("width:38%");
  });

  it.each(["preseason_lineup_preview", "weekly_lineup_preview"] as const)("identifies %s with its preview period and saved timestamp", comparison => {
    const data = weekly();
    data.snapshot = { hash: "fixture", model: "fixture-model", promptVersion: "goat-lineup-preview-v2", comparison, sourceLeg: 0, capturedAt: "2026-10-08T23:00:00Z", cutoffAt: "2026-10-08T23:00:00Z", startsAt: comparison === "preseason_lineup_preview" ? "2026-10-20T00:00:00Z" : null, endsAt: null, statsSeason: "2025", scoringMode: "unknown", baselineVersion: "prior-observed-starter-ppg-v2" };
    data.matchups[0].result!.snapshot = data.snapshot;
    const before = JSON.stringify(data), html = renderAiSection(data);
    expect(html).toContain(comparison === "preseason_lineup_preview" ? "Preseason lineup preview" : "Weekly lineup preview");
    expect(html).toContain(comparison === "preseason_lineup_preview" ? "Publication closes 2026-10-20 00:00 UTC." : "Period dates unavailable.");
    expect(html).toContain('Saved <time dateTime="2026-10-09T00:00:00Z">2026-10-09 00:00 UTC</time>');
    expect(html).toContain("Inputs captured 2026-10-08T23:00:00Z");
    expect(html).toContain("width:38%"); expect(html).toContain("width:62%");
    expect(html).not.toContain("lock_in"); expect(JSON.stringify(data)).toBe(before);
  });

  it("formats offset publication closure and generation instants in UTC", () => {
    const data = weekly();
    data.generatedAt = "2026-10-09T02:00:00+02:00";
    data.snapshot = { hash: "fixture", model: "fixture-model", promptVersion: "goat-lineup-preview-v2", comparison: "preseason_lineup_preview", sourceLeg: 0, capturedAt: "2026-10-08T23:00:00Z", cutoffAt: "2026-10-08T23:00:00Z", startsAt: "2026-10-20T02:00:00+02:00", endsAt: null, statsSeason: "2025", scoringMode: "unknown", baselineVersion: "prior-observed-starter-ppg-v2" };
    const html = renderAiSection(data);
    expect(html).toContain("Publication closes 2026-10-20 00:00 UTC.");
    expect(html).toContain('>2026-10-09 00:00 UTC</time>');
    expect(html).not.toContain("02:00 UTC");
  });

  it.each([0, 1])("uses saved target-week-1 preseason roster pairs at source leg %s despite a week-2 homepage", sourceLeg => {
    const data = weekly();
    data.snapshot = { hash: "fixture", model: "fixture-model", promptVersion: "goat-lineup-preview-v2", comparison: "preseason_lineup_preview", sourceLeg, capturedAt: "2026-10-08T23:00:00Z", cutoffAt: "2026-10-08T23:00:00Z", startsAt: "2026-10-20T00:00:00Z", endsAt: null, statsSeason: "2025", scoringMode: "unknown", baselineVersion: "prior-observed-starter-ppg-v2" };
    const currentEntries = entries.map((entry, index) => ({ ...entry, currentMatchup: { week: 2, home: entry.identity, away: team(String(index + 1)), homePoints: null, awayPoints: null } }));
    const { pairs, preseasonPreview } = deriveWeekPairs(currentEntries, data, "2026");
    expect(preseasonPreview).toBe(true);
    expect(pairs.map(p => [p.home.id, p.away.id])).toEqual([["10", "6"]]);
    const html = renderToStaticMarkup(createElement(AiDecidesSection, { pairs, aiWeekly: data, season: "2026", preseasonPreview, championTeamId: undefined, viewerTeamId: undefined }));
    expect(html).toContain("Preseason lineup preview");
    expect(html).toContain('data-probability-for="6"'); expect(html).toContain('data-probability-for="10"');
    expect(html).not.toContain('data-probability-for="1"'); expect(html).not.toContain('data-probability-for="2"');
    expect(html).toContain("width:38%"); expect(html).toContain("width:62%");
    const regularPairs = deriveWeekPairs(currentEntries, { ...data, snapshot: { ...data.snapshot!, comparison: "weekly_lineup_preview" } }, "2026");
    expect(regularPairs.preseasonPreview).toBe(false);
    const regular = renderToStaticMarkup(createElement(AiDecidesSection, { pairs: regularPairs.pairs, aiWeekly: { ...data, snapshot: { ...data.snapshot!, comparison: "weekly_lineup_preview" } }, season: "2026", preseasonPreview: false, championTeamId: undefined, viewerTeamId: undefined }));
    expect(regular).not.toContain("data-probability-for");
    expect(regular).toContain("Week 2 · AI Decides");
  });

  it("renders exactly one AI Decides section on the homepage, with or without an edition", () => {
    const data = { hub: null, directory: entries, edition, checkedAt: "2026-10-09T00:00:00Z", rosterNamesAvailable: true };
    const html = renderToStaticMarkup(createElement(CourtsideHome, { data, archive: [], portraits: {}, aiWeekly: weekly() }));
    expect(html.match(/id="ai-decides"/g)).toHaveLength(1);
    expect(html).toContain('href="/ai-decides"');
    expect(html).not.toContain('href="#watch"');
    const empty = renderToStaticMarkup(createElement(CourtsideHome, { data: { ...data, edition: null }, archive: [], portraits: {}, aiWeekly: weekly() }));
    expect(empty).toContain('id="ai-decides"');
    expect(empty).toContain('href="/ai-decides"');
    expect(empty).toContain('href="/teams/6"');
  });
});
