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

  it.each(["preseason_lineup_preview", "weekly_lineup_preview"] as const)("identifies %s without changing the sidebar distribution or generation timestamp", comparison => {
    const data = weekly();
    data.snapshot = { hash: "fixture", model: "fixture-model", promptVersion: "goat-lineup-preview-v2", comparison, sourceLeg: 0, capturedAt: "2026-10-08T23:00:00Z", cutoffAt: "2026-10-08T23:00:00Z", startsAt: comparison === "preseason_lineup_preview" ? "2026-10-20T00:00:00Z" : null, endsAt: null, statsSeason: "2025", scoringMode: "unknown", baselineVersion: "prior-observed-starter-ppg-v2" };
    data.matchups[0].result!.snapshot = data.snapshot;
    const before = JSON.stringify(data), html = render(data);
    expect(html).toContain(comparison === "preseason_lineup_preview" ? "Preseason lineup preview" : "Weekly lineup preview");
    expect(html).toContain(comparison === "preseason_lineup_preview" ? "Publication closes 2026-10-20 00:00 UTC." : "Period dates unavailable.");
    expect(html).toContain('Saved <time dateTime="2026-10-09T00:00:00Z">2026-10-09 00:00 UTC</time>');
    expect(html).toContain("width:38%"); expect(html).toContain("width:62%");
    expect(html).not.toContain("lock_in"); expect(JSON.stringify(data)).toBe(before);
  });
  it("formats offset publication closure and generation instants in UTC", () => {
    const data = weekly();
    data.generatedAt = "2026-10-09T02:00:00+02:00";
    data.snapshot = { hash: "fixture", model: "fixture-model", promptVersion: "goat-lineup-preview-v2", comparison: "preseason_lineup_preview", sourceLeg: 0, capturedAt: "2026-10-08T23:00:00Z", cutoffAt: "2026-10-08T23:00:00Z", startsAt: "2026-10-20T02:00:00+02:00", endsAt: null, statsSeason: "2025", scoringMode: "unknown", baselineVersion: "prior-observed-starter-ppg-v2" };
    const html = render(data);
    expect(html).toContain("Publication closes 2026-10-20 00:00 UTC.");
    expect(html).toContain('>2026-10-09 00:00 UTC</time>');
    expect(html).not.toContain("02:00 UTC");
  });

  it.each([0, 1])("uses saved target-week-1 preseason roster pairs at source leg %s despite a week-2 homepage", sourceLeg => {
    const data = weekly();
    data.snapshot = { hash: "fixture", model: "fixture-model", promptVersion: "goat-lineup-preview-v2", comparison: "preseason_lineup_preview", sourceLeg, capturedAt: "2026-10-08T23:00:00Z", cutoffAt: "2026-10-08T23:00:00Z", startsAt: "2026-10-20T00:00:00Z", endsAt: null, statsSeason: "2025", scoringMode: "unknown", baselineVersion: "prior-observed-starter-ppg-v2" };
    const currentEntries = entries.map((entry, index) => ({ ...entry, currentMatchup: { week: 2, home: entry.identity, away: team(String(index + 1)), homePoints: null, awayPoints: null } }));
    const props = { edition: { ...edition, game: { ...edition.game, leagueWeek: 2 } }, entries: currentEntries, rosterCounts: {}, preseason: true, checkedAt: "2026-10-09T00:00:00Z", season: "2026", aiWeekly: data, sources: null };
    const before = JSON.stringify(props), html = renderToStaticMarkup(createElement(CourtsideFeature, props));
    expect(html).toContain("Preseason preview · target Week 1");
    expect(html).toContain("Current 10 versus Current 6, preseason lineup preview for target Week 1");
    expect(html).toContain('data-probability-for="6"'); expect(html).toContain('data-probability-for="10"');
    expect(html).not.toContain('data-probability-for="1"'); expect(html).not.toContain('data-probability-for="2"');
    expect(html).toContain("width:38%"); expect(html).toContain("width:62%");
    expect(html).not.toContain("This week · Week 2"); expect(JSON.stringify(props)).toBe(before);
    const regular = renderToStaticMarkup(createElement(CourtsideFeature, { ...props, aiWeekly: { ...data, snapshot: { ...data.snapshot!, comparison: "weekly_lineup_preview" } } }));
    expect(regular).not.toContain("data-probability-for");
    expect(regular).toContain("This week · Week 2");
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
