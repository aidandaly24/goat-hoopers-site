import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Player } from "@/domain";
import { TeamRoster, TeamRosterList } from "./TeamRoster";

const query = vi.hoisted(() => ({ value: "" }));
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(query.value) }));
const players: Player[] = [
  { id: "p-long", fullName: "A Complete Long Player Name That Must Wrap", position: "PG", nbaTeam: "LAL", espnId: null },
  { id: "p-accent", fullName: "Alperen Şengün", position: "C", nbaTeam: "HOU", espnId: "123" },
  { id: "p-null", fullName: "Unknown Metadata", position: null, nbaTeam: null, espnId: null },
];

beforeEach(() => { query.value = ""; });

describe("compact roster rendering", () => {
  it("keeps every supplied player, ordinary profile href, headshot/fallback and metadata", () => {
    const fetch = vi.spyOn(globalThis, "fetch");
    const before = JSON.stringify(players);
    try {
      const html = renderToStaticMarkup(createElement(TeamRosterList, { players, teamId: "8" }));
      expect([...html.matchAll(/data-roster-player="([^"]+)"/g)].map((match) => match[1]))
        .toEqual(players.map((player) => player.id));
      expect([...html.matchAll(/href="([^"]+)"/g)].map((match) => match[1]))
        .toEqual(players.map((player) => `/player/${player.id}`));
      for (const player of players) expect(html).toContain(player.fullName);
      expect(html).toContain("Position: ");
      expect(html).toContain("NBA club: ");
      expect(html).toContain(">PG</span>");
      expect(html).toContain(">LAL</span>");
      expect(html).toContain("Unknown Metadata headshot unavailable");
      expect(html).toContain('loading="lazy"');
      expect(html).toContain("Alperen Şengün headshot");
      expect(html.match(/<a /g)).toHaveLength(players.length);
      expect(html).not.toContain("<button");
      expect(fetch).not.toHaveBeenCalled();
      expect(JSON.stringify(players)).toBe(before);
    } finally { fetch.mockRestore(); }
  });

  it("renders the URL-filtered roster and counts without a second data set", () => {
    query.value = "position=C&rosterSearch=sengun";
    const html = renderToStaticMarkup(createElement(TeamRoster, { players, teamId: "8" }));
    expect(html).toContain('value="sengun"');
    expect(html).toContain("1 of 3 players shown");
    expect(html).toContain('href="/player/p-accent"');
    expect(html).not.toContain('href="/player/p-long"');
    expect(html).not.toContain('href="/player/p-null"');
    expect(html).toContain('name="roster-position"');
  });

  it("provides an honest no-match state and clear action; unknown position stays All", () => {
    query.value = "rosterSearch=nonmatching";
    const empty = renderToStaticMarkup(createElement(TeamRoster, { players, teamId: "8" }));
    expect(empty).toContain("No roster players match these filters.");
    expect(empty).toContain("Clear filters</button>");
    expect(empty).not.toContain('href="/player/');
    query.value = "position=not-a-supplied-position";
    const all = renderToStaticMarkup(createElement(TeamRoster, { players, teamId: "8" }));
    expect(all).toContain("3 of 3 players shown");
    expect(all.match(/data-roster-player=/g)).toHaveLength(players.length);
  });
});
