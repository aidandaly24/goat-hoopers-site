import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { Standing, Team } from "@/domain";
import type { LiveClubhouseDirectoryEntry } from "@/domain/clubhouse-directory";
import { CourtsideDirectory } from "@/surfaces/season-hub/CourtsideDirectory";
import { StandingsTable } from "@/surfaces/season-hub/StandingsTable";

const team: Team = { id: "synthetic", name: "Synthetic Team", managerName: "Synthetic Manager", avatar: null,
  wins: 0, losses: 0, ties: 0, pointsFor: 0, pointsAgainst: 0 };

describe("homepage initial HTML contracts", () => {
  it("renders native labelled sorting buttons, one active aria-sort, links, and the points field used by sorting", () => {
    const standings: Standing[] = [
      { team, rank: 2, wins: 0, losses: 0, ties: 0, pointsFor: NaN, gamesBack: 0 },
      { team: { ...team, id: "other", name: "Other Team" }, rank: 1, wins: 10, losses: 2, ties: 0, pointsFor: 12345, gamesBack: 0 },
    ];
    const html = renderToStaticMarkup(createElement(StandingsTable, { standings }));
    expect(html.match(/role="columnheader"/g)).toHaveLength(5);
    expect(html.match(/aria-sort="ascending"/g)).toHaveLength(1);
    expect(html.match(/aria-sort="none"/g)).toHaveLength(4);
    expect(html).toContain('type="button"');
    expect(html).toContain('aria-label="Points for: sort descending"');
    expect(html.indexOf('href="/teams/other"')).toBeLessThan(html.indexOf('href="/teams/synthetic"'));
    expect(html).toMatch(/data-label="PF">123\.5<\/span>/);
    expect(html).toMatch(/data-label="PF">—<\/span>/);
    expect(html).not.toContain(">NaN<");
    expect(html.match(/role="cell"/g)).toHaveLength(10);
  });

  it("retains working selectors, search/disclosures and profile links without fetching or rejected figurines", () => {
    const fetch = vi.spyOn(globalThis, "fetch");
    try {
      const entries: LiveClubhouseDirectoryEntry[] = [{ identity: team, currentRecord: null,
        previousSeason: { season: "2025", wins: 1, losses: 20, finish: 10, ownerNote: "Previous synthetic manager." },
        players: [{ id: "hidden-player", fullName: "Nonfeatured Player", position: "C", nbaTeam: null }],
        featuredPlayerIds: [], opener: null, recentMove: null, currentMatchup: null, latestMove: null }];
      const html = renderToStaticMarkup(createElement(CourtsideDirectory, { entries, seasonLabel: "Fixture 2026",
        checkedAt: "2026-10-08T00:00:00Z", preseason: true, rosterNamesAvailable: true, portraits: {} }));
      expect(html).toContain('<option value="league" selected="">League order</option>');
      expect(html).toContain('<option value="finish">2025 finish</option>');
      expect(html).toContain('type="search"');
      expect(html).toContain('aria-controls="directory-list"');
      expect(html).toContain('aria-label="Sort teams by column"');
      expect(html).toContain('aria-pressed="false"');
      expect(html).toContain('data-team-id="synthetic"');
      expect(html).toContain('href="/player/hidden-player"');
      expect(html).toContain('href="/teams/synthetic"');
      expect(html).toContain("Previous manager");
      expect(html).not.toContain("Inspect existing league figurine");
      expect(fetch).not.toHaveBeenCalled();
    } finally { fetch.mockRestore(); }
  });
});
