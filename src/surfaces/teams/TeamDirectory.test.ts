import { Children, createElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import Link from "next/link";
import { describe, expect, it, vi } from "vitest";
import type { Team } from "@/domain";
import { getTeams } from "@/data/league";
import TeamsPage from "@/app/teams/page";
import { TeamDirectory } from "./TeamDirectory";

vi.mock("@/data/league", () => ({ getTeams: vi.fn() }));

const team: Team = {
  id: "5", name: "Josh Diddy's Roster", managerName: "Synthetic Manager", avatar: null,
  wins: 0, losses: 0, ties: 0, pointsFor: 0, pointsAgainst: 0,
};
type Props = { children?: ReactNode; [key: string]: unknown };
function descendants(node: ReactNode): ReactElement<Props>[] {
  return Children.toArray(node).flatMap(child => isValidElement<Props>(child)
    ? [child, ...descendants(child.props.children)] : []);
}

describe("public teams directory", () => {
  it("keeps supplied order, full identities, values and one ordinary profile link per team", () => {
    const teams = [
      { ...team, name: "Northside's Incredibly Long Basketball Club & Friends", managerName: "A Very Long Synthetic Manager Name" },
      { ...team, id: "1", name: "Reaves Dropper", managerName: "Synthetic Élodie", wins: 12, losses: 9, pointsFor: 1234567 },
    ];
    const frozen = JSON.stringify(teams);
    const links = descendants(TeamDirectory({ teams })).filter(node => node.type === Link);
    expect(links.map(link => link.props.href)).toEqual(["/teams/5", "/teams/1"]);
    expect(links.map(link => link.props["aria-label"])).toEqual(teams.map(t => `View ${t.name}`));
    for (const [index, link] of links.entries()) {
      const content = descendants(link.props.children);
      expect(content.filter(node => node.type === Link || (typeof node.type === "string" && ["a", "button", "input", "select", "textarea", "summary"].includes(node.type)))).toEqual([]);
      expect(link.props.onClick).toBeUndefined();
      expect(link.props.onKeyDown).toBeUndefined();
      expect(link.props.tabIndex).toBeUndefined();
      expect(link.props.prefetch).toBeUndefined();
      expect(content.some(node => node.props.children === teams[index].name)).toBe(true);
      expect(content.some(node => node.props.children === teams[index].managerName)).toBe(true);
      expect(content.filter(node => node.type === "dd").map(node => node.props.children)).toEqual([
        teams[index].wins, teams[index].losses, (teams[index].pointsFor / 100).toFixed(1),
      ]);
      expect(content.filter(node => node.type === "dd").every(node => node.props.className === "gh-num")).toBe(true);
    }
    expect(JSON.stringify(teams)).toBe(frozen);
  });

  it("renders the same points scale/precision, including known zero and rounding boundaries", () => {
    for (const [pointsFor, displayed] of [[0, "0.0"], [5, "0.1"], [12345, "123.5"], [98765432, "987654.3"], [-250, "-2.5"]] as const) {
      const html = renderToStaticMarkup(createElement(TeamDirectory, { teams: [{ ...team, pointsFor }] }));
      expect(html).toContain(`<dd class="gh-num">${displayed}</dd>`);
      expect(html).toContain('title="Wins">W</abbr>');
      expect(html).toContain('title="Losses">L</abbr>');
      expect(html).toContain("Points for</dt>");
      expect(html.match(/<a /g)).toHaveLength(1);
    }
  });

  it("preserves the existing lazy avatar and marks the team-color cue decorative", () => {
    const html = renderToStaticMarkup(createElement(TeamDirectory, { teams: [{ ...team, avatar: "synthetic-avatar" }] }));
    expect(html).toContain('src="https://sleepercdn.com/avatars/thumbs/synthetic-avatar"');
    expect(html).toContain('loading="lazy"');
    expect(html).toContain('style="background-color:var(--gh-team-5)" aria-hidden="true"');
    expect(html).not.toContain("<button");
  });

  it("retains the exact empty state with no dead profile destinations", () => {
    const html = renderToStaticMarkup(createElement(TeamDirectory, { teams: [] }));
    expect(html).toContain("Couldn&#x27;t load the teams right now. Try again in a bit.");
    expect(html).toContain(">Teams</h2>");
    expect(html).not.toContain("<ul");
    expect(html).not.toContain("<a ");
  });

  it("keeps the thin route to one loader call and rendering to zero fetches", async () => {
    const fetch = vi.spyOn(globalThis, "fetch");
    const loader = vi.mocked(getTeams).mockResolvedValue([team]);
    loader.mockClear();
    try {
      const page = await TeamsPage();
      const html = renderToStaticMarkup(page);
      expect(loader).toHaveBeenCalledTimes(1);
      expect(html).toContain('href="/teams/5"');
      renderToStaticMarkup(createElement(TeamDirectory, { teams: [team] }));
      renderToStaticMarkup(createElement(TeamDirectory, { teams: [] }));
      expect(fetch).not.toHaveBeenCalled();
      expect(loader).toHaveBeenCalledTimes(1);
    } finally { fetch.mockRestore(); }
  });
});
