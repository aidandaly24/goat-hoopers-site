import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { Standing, Team, TheTableData, TableLeagueRow, TableValueRow } from "@/domain";
import { LeaguePanel, ValuePanel } from "./TheTable";

// Synthetic fixtures only — the champion id here is a fixture, not the
// canonical derived id. Page-level wiring to reigningChampionRosterId is
// covered in src/app/table/page.test.tsx.
const team = (id: string, name: string): Team => ({
  id, name, managerName: `${name} Manager`, avatar: null,
  wins: 0, losses: 0, ties: 0, pointsFor: 0, pointsAgainst: 0,
});

const leagueRow = (teamId: string, rank: number): TableLeagueRow => ({
  standing: {
    team: team(teamId, `Team ${teamId}`), rank,
    wins: rank === 1 ? 3 : 1, losses: 0, ties: 0, pointsFor: 0, gamesBack: rank - 1,
  } satisfies Standing,
  streak: null,
});

const valueRow = (teamId: string, rank: number): TableValueRow => ({
  team: team(teamId, `Team ${teamId}`),
  rank, totalValue: 100 - rank * 10, pricedPlayers: 15, rosterPlayers: 15,
});

const data = (): TheTableData => ({
  season: null,
  hasResults: true,
  league: [leagueRow("5", 1), leagueRow("9", 2)],
  value: {
    rows: [valueRow("5", 1), valueRow("9", 2)],
    pricingBasis: "preseason",
    computedAt: "2026-10-19T00:00:00Z",
  },
});

const badgeCount = (html: string): number =>
  html.match(/data-champion-crown="badge"/g)?.length ?? 0;

describe("The Table champion crown wiring (issue #209 / #210)", () => {
  it("LeaguePanel crowns only the champion row, as a non-interactive badge", () => {
    const html = renderToStaticMarkup(
      createElement(LeaguePanel, { data: data(), viewerTeamId: null, championTeamId: "5" }),
    );
    expect(badgeCount(html)).toBe(1);
    expect(html).not.toContain('data-champion-crown="interactive"');
    // The visually-hidden champion meaning lands in the crowned avatar's wrap.
    expect(html.match(/Reigning champion/g)).toHaveLength(1);
    // The badge sits inside the champion's row link (aria-label "View Team 5").
    const badgeAt = html.indexOf('data-champion-crown="badge"');
    expect(html.slice(0, badgeAt)).toContain('aria-label="View Team 5"');
  });

  it("LeaguePanel crowns the viewer's pinned strip when the viewer is the champion", () => {
    const html = renderToStaticMarkup(
      createElement(LeaguePanel, { data: data(), viewerTeamId: "5", championTeamId: "5" }),
    );
    // One on the pinned strip, one on the champion's league row.
    expect(badgeCount(html)).toBe(2);
  });

  it("LeaguePanel leaves the pinned strip uncrowned when the viewer is not the champion", () => {
    const html = renderToStaticMarkup(
      createElement(LeaguePanel, { data: data(), viewerTeamId: "9", championTeamId: "5" }),
    );
    expect(badgeCount(html)).toBe(1);
  });

  it("LeaguePanel renders no crown without a champion id", () => {
    const html = renderToStaticMarkup(
      createElement(LeaguePanel, { data: data(), viewerTeamId: "5" }),
    );
    expect(html).not.toContain("data-champion-crown");
    expect(html).not.toContain("Reigning champion");
  });

  it("ValuePanel crowns only the champion row and the champion's pinned strip", () => {
    const html = renderToStaticMarkup(
      createElement(ValuePanel, { data: data(), viewerTeamId: "5", championTeamId: "5" }),
    );
    expect(badgeCount(html)).toBe(2);
    expect(html).not.toContain('data-champion-crown="interactive"');
  });

  it("ValuePanel renders no crown without a champion id", () => {
    const html = renderToStaticMarkup(
      createElement(ValuePanel, { data: data(), viewerTeamId: "5" }),
    );
    expect(html).not.toContain("data-champion-crown");
  });

  it("badge stays non-interactive inside row links", () => {
    const html = renderToStaticMarkup(
      createElement(LeaguePanel, { data: data(), viewerTeamId: null, championTeamId: "5" }),
    );
    // No nested interactive element inside the row's team link.
    expect(html).not.toContain("<button");
  });
});
