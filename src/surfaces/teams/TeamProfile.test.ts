import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { archetype, franchise, profile, teams } from "../../../qa/team-profile/fixtures";
import { TeamProfile } from "./TeamProfile";

const query = vi.hoisted(() => ({ value: "", suspend: false }));
vi.mock("next/navigation", () => ({ useSearchParams: () => {
  if (query.suspend) throw new Promise(() => {});
  return new URLSearchParams(query.value);
} }));
beforeEach(() => { query.value = ""; query.suspend = false; });
const render = (props: Parameters<typeof TeamProfile>[0] = { profile, teams }) =>
  renderToStaticMarkup(createElement(TeamProfile, props));
const ids = (html: string, attribute: string) => [...html.matchAll(new RegExp(`${attribute}="([^"]+)"`, "g"))].map(match => match[1]);

describe("compact profile capability parity", () => {
  it("preserves identity, records, roster order, every pick and structured wire destination without fetching", () => {
    const before = JSON.stringify({ profile, teams });
    const fetch = vi.spyOn(globalThis, "fetch");
    try {
      const html = render();
      expect(html).toContain(profile.team.name);
      expect(html).toContain(`managed by ${profile.team.managerName}`);
      expect(html).toContain("5812.3");
      expect(html).toContain("5720.8");
      expect(html).toContain("<dt>T</dt>");
      expect(html).toContain("Active streak");
      expect(ids(html, "data-roster-player")).toEqual(profile.players.map(player => player.id));
      expect(ids(html, "data-pick-number")).toEqual(profile.draftPicks.map(pick => String(pick.pickNo)));
      expect(ids(html, "data-transaction-id")).toEqual(profile.transactions.map(move => move.id));
      for (const player of profile.players) expect(html).toContain(`href="/player/${player.id}"`);
      for (const pick of profile.draftPicks) {
        expect(html).toContain(pick.playerName);
        expect(html).toContain(`href="/player/${pick.playerId}"`);
      }
      for (const move of [...profile.transactions[0].adds, ...profile.transactions[0].drops])
        expect(html).toContain(`href="/player/${move.playerId}"`);
      expect(html).toContain("completed a trade");
      expect(html).toContain('href="/teams/8"');
      expect(html).toContain('href="/teams/2"');
      expect(html).not.toMatch(/frozen|simulated|prototype|<canvas|<dialog|hooper-.*\.glb/i);
      expect(fetch).not.toHaveBeenCalled();
      expect(JSON.stringify({ profile, teams })).toBe(before);
    } finally { fetch.mockRestore(); }
  });

  it("selects the earliest pending matchup without dropping or reordering finals, partial scores, zeroes or ties", () => {
    const html = render();
    const next = html.split('id="team-matchup"')[1].split('id="team-roster"')[0];
    expect(next).toContain('class="gh-num">5</span>');
    expect(next).not.toContain('class="gh-num">6</span>');
    expect(next).toContain(teams[1].name);
    expect(next).toContain(`managed by ${teams[1].managerName}`);
    expect(ids(html, "data-matchup-week")).toEqual(["6", "5", "4", "3"]);
    const games = html.split('id="team-games"')[1].split('id="team-picks"')[0];
    expect(games.match(/href="\/teams\/8"/g)).toHaveLength(profile.matchups.length);
    expect(games.match(/href="\/teams\/2"/g)).toHaveLength(profile.matchups.length);
    expect(games).toContain("points: 22.5");
    expect(games).toContain("points: 0.0");
    expect(games).toContain("points: 10.0");
    expect(games).toContain("points: —");
    expect(games.match(/>Pending<\/span>/g)).toHaveLength(2);
    expect(games).toContain(">Tie</span>");
    expect(games).toContain(">Final</span>");
  });

  it("shows truthful empty sections without controls or invented games, moves, picks or current-season labels", () => {
    const empty = { ...profile, players: [], matchups: [], draftPicks: [], transactions: [], streak: 0 };
    const html = render({ profile: empty, teams });
    for (const text of ["Roster unavailable right now.", "No games supplied yet.", "No upcoming matchup supplied.", "No picks on record.", "No recent moves supplied."])
      expect(html).toContain(text);
    expect(html).not.toContain("<input");
    expect(html).not.toContain("data-matchup-week=");
    expect(html).not.toContain("Active streak");
    expect(html).not.toContain("2026 draft");
  });

  it("keeps optional, null and supplied GM contracts plus season/manager attribution and full franchise history", () => {
    expect(render()).not.toContain('id="team-gm"');
    expect(render({ profile, teams, archetype: null })).toContain("No archetype yet");
    const html = render({ profile, teams, archetype, franchise });
    expect(html).toContain('id="team-gm"');
    expect(html).toContain(archetype.seasons[0].priorManagerNote!);
    expect(html).toContain("2025");
    expect(html).toContain("Patience: unmeasured");
    expect(html).toContain(franchise.timeline[0].description);
    expect(html).toContain(franchise.discontinuity);
    expect(html).toContain("12–8");
    expect(html).toContain('href="#team-history"');
  });

  it("filters only the roster through the URL while retaining all other team capabilities", () => {
    query.value = "position=C&rosterSearch=sengun";
    const html = render();
    expect(ids(html, "data-roster-player")).toEqual(["accent-player"]);
    expect(html).toContain("1 of 3 players shown");
    expect(ids(html, "data-matchup-week")).toHaveLength(profile.matchups.length);
    expect(ids(html, "data-pick-number")).toHaveLength(profile.draftPicks.length);
    expect(ids(html, "data-transaction-id")).toHaveLength(profile.transactions.length);
  });

  it("prerenders the complete canonical roster when the URL hook suspends", () => {
    query.suspend = true;
    const html = render();
    expect(ids(html, "data-roster-player")).toEqual(profile.players.map(player => player.id));
    for (const player of profile.players) expect(html).toContain(`href="/player/${player.id}"`);
    expect(html).toContain("Alperen Şengün headshot");
    expect(html).toContain("Unknown Metadata Player headshot unavailable");
    expect(html).not.toContain('name="roster-position"');
  });
});
