import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { Standing, Team } from "@/domain";
import type { LiveClubhouseDirectoryEntry } from "@/domain/clubhouse-directory";
import { reigningChampionRosterId } from "@/data/history-2025";
import { CourtsideDirectory } from "@/surfaces/season-hub/CourtsideDirectory";
import { StandingsTable } from "@/surfaces/season-hub/StandingsTable";
import { TeamDirectory } from "@/surfaces/teams/TeamDirectory";

const team = (id: string, name: string): Team => ({
  id,
  name,
  managerName: `${name} Manager`,
  avatar: null,
  wins: 0,
  losses: 0,
  ties: 0,
  pointsFor: 0,
  pointsAgainst: 0,
});

const directoryProps = (entries: LiveClubhouseDirectoryEntry[]) => ({
  entries,
  seasonLabel: "Fixture 2026",
  checkedAt: "2026-10-08T00:00:00Z",
  preseason: true,
  rosterNamesAvailable: true,
  portraits: {},
});

const entry = (
  id: string,
  finish: number,
): LiveClubhouseDirectoryEntry => ({
  identity: team(id, `Team ${id}`),
  currentRecord: null,
  previousSeason: { season: "2025", wins: 17, losses: 4, finish, ownerNote: null },
  players: [],
  featuredPlayerIds: [],
  opener: null,
  recentMove: null,
  currentMatchup: null,
  latestMove: null,
});

describe("champion crown rollout — non-homepage surfaces", () => {
  it("CourtsideDirectory crowns the finish===1 entry, whatever its id (no hardcoded roster)", () => {
    const html = renderToStaticMarkup(
      createElement(
        CourtsideDirectory,
        directoryProps([entry("9", 1), entry("5", 4)]),
      ),
    );
    // Exactly one badge crown, on the synthetic finish-1 entry — not roster 5.
    expect(html.match(/data-champion-crown="badge"/g)).toHaveLength(1);
    expect(html).not.toContain('data-champion-crown="interactive"');
    expect(html).toContain("2025 champion");
    const crownAt = html.indexOf('data-champion-crown="badge"');
    expect(html.indexOf('data-team-id="9"')).toBeLessThan(crownAt);
    expect(html.indexOf('data-team-id="5"')).toBeGreaterThan(crownAt);
  });

  it("CourtsideDirectory renders no crown when no entry finished first", () => {
    const html = renderToStaticMarkup(
      createElement(CourtsideDirectory, directoryProps([entry("5", 4)])),
    );
    expect(html).not.toContain("data-champion-crown");
    expect(html).not.toContain("2025 champion");
  });

  it("StandingsTable crowns only the derived champion row, as a badge", () => {
    const standings: Standing[] = [
      { team: team("5", "Champs"), rank: 1, wins: 0, losses: 0, ties: 0, pointsFor: 0, gamesBack: 0 },
      { team: team("1", "Runners"), rank: 2, wins: 0, losses: 0, ties: 0, pointsFor: 0, gamesBack: 0 },
    ];
    const html = renderToStaticMarkup(
      createElement(StandingsTable, {
        standings,
        championTeamId: reigningChampionRosterId() ?? undefined,
      }),
    );
    expect(html.match(/data-champion-crown="badge"/g)).toHaveLength(1);
    expect(html).not.toContain('data-champion-crown="interactive"');
  });

  it("StandingsTable renders no crown without a champion id", () => {
    const standings: Standing[] = [
      { team: team("5", "Champs"), rank: 1, wins: 0, losses: 0, ties: 0, pointsFor: 0, gamesBack: 0 },
    ];
    const html = renderToStaticMarkup(createElement(StandingsTable, { standings }));
    expect(html).not.toContain("data-champion-crown");
  });

  it("TeamDirectory crowns only the derived champion row", () => {
    const html = renderToStaticMarkup(
      createElement(TeamDirectory, {
        teams: [team("5", "Champs"), team("1", "Runners")],
        championTeamId: reigningChampionRosterId() ?? undefined,
      }),
    );
    expect(html.match(/data-champion-crown="badge"/g)).toHaveLength(1);
    expect(html).not.toContain('data-champion-crown="interactive"');
  });
});
