/**
 * CourtsideFeature.archive.test.tsx — archived editions render their
 * own game, never the live week (issue #224 P1).
 *
 * The audit's repro: the frozen 2025-final edition (2026-W40, teams 5
 * and 7, final 326–251.5) rendered "Week 1 · Current score" with a live
 * 0–0 because the feature fell back to the first live Week 1 pair.
 * These tests render the real W40 edition over a live directory whose
 * Week 1 pair is exactly that trap, then advance the live inputs and
 * require the archived card to be byte-identical.
 */
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { getWeeklyEdition } from "@/data/weekly-spotlight";
import type { Matchup } from "@/domain/matchup";
import type { Team } from "@/domain/team";
import { CourtsideFeature } from "./CourtsideFeature";
import type { PairEntry } from "./weekPairs";

const team = (id: string, name: string): Team => ({
  id,
  name,
  managerName: `Manager ${id}`,
  avatar: null,
  wins: 0,
  losses: 0,
  ties: 0,
  pointsFor: 0,
  pointsAgainst: 0,
});

const FIVE = team("5", "Josh Diddy's Roster");
const SEVEN = team("7", "Fixture Seven");
const ONE = team("1", "Reaves Dropper");
const TWO = team("2", "Fixture Two");

const entry = (t: Team, currentMatchup: Matchup | null): PairEntry => ({
  identity: { id: t.id, name: t.name, managerName: t.managerName, avatar: null },
  previousSeason: null,
  currentRecord: { wins: 0, losses: 0, ties: 0 },
  currentMatchup,
});

/** Live Week 1: team 1 vs team 5 at 0–0 — the pair the bug borrowed. */
const liveEntries = (fivePoints: number, onePoints: number): PairEntry[] => [
  entry(ONE, { week: 1, home: ONE, away: FIVE, homePoints: onePoints, awayPoints: fivePoints }),
  entry(FIVE, { week: 1, home: ONE, away: FIVE, homePoints: onePoints, awayPoints: fivePoints }),
  entry(SEVEN, { week: 1, home: SEVEN, away: TWO, homePoints: 40, awayPoints: 30 }),
  entry(TWO, { week: 1, home: SEVEN, away: TWO, homePoints: 40, awayPoints: 30 }),
];

/** A later live state: different pairings entirely, different scores. */
const advancedEntries = (): PairEntry[] => [
  entry(ONE, { week: 1, home: SEVEN, away: ONE, homePoints: 10, awayPoints: 10 }),
  entry(FIVE, { week: 1, home: FIVE, away: TWO, homePoints: 120, awayPoints: 90 }),
  entry(SEVEN, { week: 1, home: SEVEN, away: ONE, homePoints: 10, awayPoints: 10 }),
  entry(TWO, { week: 1, home: FIVE, away: TWO, homePoints: 120, awayPoints: 90 }),
];

const renderArchived = (entries: PairEntry[]) => {
  const edition = getWeeklyEdition("2026-W40");
  if (!edition) throw new Error("2026-W40 edition missing");
  return renderToStaticMarkup(
    createElement(CourtsideFeature, {
      edition,
      entries,
      rosterCounts: {},
      preseason: false,
      checkedAt: "2026-10-21T12:00:00.000Z",
      season: "2026",
      archived: true,
    }),
  );
};

describe("archived CourtsideFeature (2026-W40, the 2025 final)", () => {
  it("renders the edition's own final, not the live Week 1 pair", () => {
    const html = renderArchived(liveEntries(0, 0));
    expect(html).toContain("Historical final · 2026");
    expect(html).toContain("The first crown belongs to vannweinkauf.");
    expect(html).toContain("Final score");
    expect(html).toContain("326.0");
    expect(html).toContain("251.5");
    expect(html).not.toContain("Current score");
    expect(html).not.toContain("Week 1 matchups");
    expect(html).not.toContain("Saved AI matchup preview");
  });

  it("is byte-identical when the live week advances underneath it", () => {
    const before = renderArchived(liveEntries(0, 0));
    const after = renderArchived(advancedEntries());
    expect(after).toBe(before);
  });
});
