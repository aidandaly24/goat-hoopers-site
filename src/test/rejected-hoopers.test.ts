import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import type { Team, TeamProfile as Profile } from "@/domain";
import type { LiveClubhouseDirectoryEntry } from "@/domain/clubhouse-directory";
import { TeamProfile } from "@/surfaces/teams/TeamProfile";
import { CourtsideDirectory } from "@/surfaces/season-hub/CourtsideDirectory";
import assets from "./fixtures/rejected-hoopers-assets.json";

const viewer = vi.hoisted(() => vi.fn(() => null));
vi.mock("@/three/GLBViewer", () => ({ GLBViewer: viewer }));

const teams: Team[] = Array.from({ length: 10 }, (_, index) => ({
  id: String(index + 1), name: `Franchise ${index + 1}`, managerName: `Manager ${index + 1}`,
  avatar: index % 2 ? `fixture-avatar-${index + 1}` : null,
  wins: index, losses: 10 - index, ties: 0, pointsFor: 12345, pointsAgainst: 12000,
}));
const profile = (team: Team): Profile => ({
  team, players: [{ id: `player-${team.id}`, fullName: `Roster Player ${team.id}`, position: "C", nbaTeam: null, espnId: null }],
  matchups: [{ home: team, away: teams[Number(team.id) % 10], week: 1, homePoints: null, awayPoints: null }],
  streak: 0, draftPicks: [], transactions: [],
});

describe("rejected hooper family removal", () => {
  it.each(assets.removed)("does not publicly deliver $path", ({ path }) => {
    expect(existsSync(path)).toBe(false);
  });

  it("preserves the 92 audited hashes, allowing only PR107's five separately owned starter removals", () => {
    expect(assets.preserved).toHaveLength(92);
    expect(assets.separatelyOwnedStarterRemovals).toEqual([
      "public/file.svg", "public/globe.svg", "public/next.svg", "public/vercel.svg", "public/window.svg",
    ]);
    for (const { path, sha256 } of assets.preserved) {
      // Those five unapproved Next starter SVGs are already owned by PR107.
      // Every retained file must match; all 87 actual identity/prop/source files
      // must exist. Do not make an unrelated, authorized cleanup fail CI.
      if (!existsSync(path) && assets.separatelyOwnedStarterRemovals.includes(path)) continue;
      expect(createHash("sha256").update(readFileSync(path)).digest("hex"), path).toBe(sha256);
    }
  });

  it.each(teams)("keeps identity, record, roster and opponent links for team $id without a model", team => {
    const fetch = vi.spyOn(globalThis, "fetch");
    const html = renderToStaticMarkup(createElement(TeamProfile, { profile: profile(team), teams }));
    expect(html).toContain(`<h1`);
    expect(html).toContain(team.name);
    expect(html).toContain(`managed by ${team.managerName}`);
    expect(html).toContain("<dt>W</dt>");
    expect(html).toContain("<dt>PA</dt>");
    expect(html).toContain(`href="/player/player-${team.id}"`);
    expect(html).toContain(`href="/teams/${teams[Number(team.id) % 10].id}"`);
    if (team.avatar) expect(html).toContain(`https://sleepercdn.com/avatars/thumbs/${team.avatar}`);
    else expect(html).toContain(`F${team.id[0]}`);
    expect(html).not.toMatch(/figurine|<canvas|<dialog|hooper-.*\.glb/i);
    expect(viewer).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
    fetch.mockRestore();
  });

  it("keeps all home roster disclosures/profile links and unavailable-data paths without inspection dialogs", () => {
    const entries: LiveClubhouseDirectoryEntry[] = teams.map(identity => ({
      identity, players: profile(identity).players, currentRecord: null, previousSeason: null,
      featuredPlayerIds: [], opener: null, recentMove: null, currentMatchup: null, latestMove: null,
    }));
    const fetch = vi.spyOn(globalThis, "fetch");
    for (const rosterNamesAvailable of [true, false]) {
      const html = renderToStaticMarkup(createElement(CourtsideDirectory, { entries,
        seasonLabel: "Fixture 2026", checkedAt: "2026-10-09T00:00:00Z", preseason: true,
        rosterNamesAvailable, portraits: {},
      }));
      for (const team of teams) {
        expect(html).toContain(`data-team-id="${team.id}"`);
        expect(html).toContain(`href="/teams/${team.id}"`);
      }
      if (rosterNamesAvailable) for (const team of teams) expect(html).toContain(`href="/player/player-${team.id}"`);
      expect(html).toContain("Full team profile");
      expect(html).not.toMatch(/figurine|<dialog|<canvas|hooper-.*\.glb/i);
    }
    expect(viewer).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
    fetch.mockRestore();
  });

  it("removes all eleven public GLBs and loaders without touching other prop delivery", () => {
    expect(readdirSync("public/3d").filter(name => /^hooper-.*\.glb$/.test(name))).toEqual([]);
    for (const name of ["basketball", "trophy", "crown", "hoop"]) expect(existsSync(`public/3d/${name}.glb`)).toBe(true);
    for (const name of ["HooperViewer", "CourtsideFigurine"]) expect(existsSync(`src/three/${name}.tsx`)).toBe(false);
    expect(existsSync("courtside-preview/court.js")).toBe(false);
    expect(existsSync("courtside-preview/prepare-viewer.cjs")).toBe(false);
  });

  it("leaves no production hooper URL or loader/inspection import", () => {
    function check(directory: string) {
      for (const entry of readdirSync(directory, { withFileTypes: true })) {
        const file = join(directory, entry.name);
        if (entry.isDirectory()) { if (entry.name !== "__tests__") check(file); }
        else if (/\.(tsx?|css)$/.test(file) && !file.endsWith(".test.ts")) {
          expect(readFileSync(file, "utf8"), file).not.toMatch(/\bHooperViewer|\bCourtsideFigurine|\bFigurineDialog|\/3d\/hooper-/);
        }
      }
    }
    for (const directory of ["src/app", "src/three", "src/surfaces", "src/ui"]) check(directory);
  });

  it("keeps published and independent comparisons free of rejected models and dangling dialogs", () => {
    for (const root of ["public/design-preview/neutral-courtside", "design-previews/neutral-courtside", "courtside-preview"]) {
      for (const file of readdirSync(root).filter(name => /\.(html|js|cjs)$/.test(name))) {
        expect(readFileSync(join(root, file), "utf8"), join(root, file)).not.toMatch(/hooper-.*\.glb|data-inspect|club-dialog|Inspect existing league figurine|CourtsideFigurine/);
      }
    }
    for (const file of ["design-previews/neutral-courtside/home.html", "public/design-preview/neutral-courtside/home.html"]) {
      const html = readFileSync(file, "utf8");
      expect(html.match(/data-team-id="/g)).toHaveLength(10);
      expect(html).toContain("Full team profile");
      expect(html).toContain("Why this matchup?");
    }
  });
});
