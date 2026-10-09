import { describe, expect, it } from "vitest";
import type { Player } from "@/domain";
import { filterRoster, readRosterFilters, rosterFiltersUrl, rosterPositions } from "./rosterQuery";

const players: Player[] = [
  { id: "one", fullName: "Alperen Şengün", position: "C", nbaTeam: "HOU", espnId: null },
  { id: "two", fullName: "Day’Ron Sharpe", position: "C", nbaTeam: "BKN", espnId: null },
  { id: "three", fullName: "A Long Supplied Player Name", position: "G", nbaTeam: null, espnId: "123" },
  { id: "four", fullName: "Unknown Position", position: null, nbaTeam: null, espnId: null },
];

describe("local team roster filters", () => {
  it("preserves supplied order, fields and null references without mutating input", () => {
    const before = JSON.stringify(players);
    expect(filterRoster(players, { search: "", position: "All" })).toEqual(players);
    expect(filterRoster(players, { search: "", position: "C" })).toEqual(players.slice(0, 2));
    expect(JSON.stringify(players)).toBe(before);
    expect(rosterPositions(players)).toEqual(["PG", "SG", "SF", "PF", "C", "G"]);
  });

  it("reuses the domain's accent/apostrophe search and intersects position", () => {
    expect(filterRoster(players, { search: "sengun", position: "C" })).toEqual([players[0]]);
    expect(filterRoster(players, { search: "dayron", position: "All" })).toEqual([players[1]]);
    expect(filterRoster(players, { search: "sengun", position: "PG" })).toEqual([]);
    expect(filterRoster(players, { search: "’", position: "All" })).toEqual([]);
    expect(filterRoster(players, { search: "  ", position: "All" })).toEqual(players);
  });

  it("restores valid URL filters and treats unknown positions as All", () => {
    const positions = rosterPositions(players);
    expect(readRosterFilters(new URLSearchParams("rosterSearch=Day%E2%80%99Ron&position=C"), positions))
      .toEqual({ search: "Day’Ron", position: "C" });
    expect(readRosterFilters(new URLSearchParams("position=unknown"), positions))
      .toEqual({ search: "", position: "All" });
    expect(readRosterFilters(new URLSearchParams("position=G"), positions).position).toBe("G");
  });

  it("changes only owned filters, preserving pathname, hash and unrelated duplicate values", () => {
    const original = "?season=2026&tag=a&tag=b&position=PG&rosterSearch=old";
    const url = rosterFiltersUrl("/teams/8", original, "#team-roster", { search: "Day’Ron & friends", position: "C" });
    const parsed = new URL(url, "https://example.test");
    expect(parsed.pathname).toBe("/teams/8");
    expect(parsed.hash).toBe("#team-roster");
    expect(parsed.searchParams.getAll("tag")).toEqual(["a", "b"]);
    expect(parsed.searchParams.get("season")).toBe("2026");
    expect(parsed.searchParams.get("rosterSearch")).toBe("Day’Ron & friends");
    expect(readRosterFilters(parsed.searchParams, rosterPositions(players)).position).toBe("C");
    expect(rosterFiltersUrl(parsed.pathname, parsed.search, parsed.hash, { search: "", position: "All" }))
      .toBe("/teams/8?season=2026&tag=a&tag=b#team-roster");
    expect(rosterFiltersUrl("/team", "", "", { search: "", position: "All" })).toBe("/team");
  });
});
