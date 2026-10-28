import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { HomePowerRankings } from "./HomePowerRankings";
import { CourtsideHome } from "./CourtsideHome";
import { homeLineupPowerFixture } from "@/test/home-lineup-power-fixture";
import { weeklyHomeFixture } from "@/test/home-weekly-fixture";
import { buildHomeLineupPower } from "@/data/home-lineup-power";
import { buildHomeWeeklyContext } from "@/data/home-weekly-context";

describe("homepage legal-lineup Power consumer", () => {
  it("renders all ten teams, rank ties, projected units and explicit coverage without fabricated movement", () => {
    const { home } = weeklyHomeFixture();
    const data = buildHomeLineupPower(home, homeLineupPowerFixture());
    const fetch = vi.spyOn(globalThis, "fetch");
    try {
      const html = renderToStaticMarkup(createElement(HomePowerRankings, { data }));
      expect(html.match(/data-power-team=/g)).toHaveLength(10);
      expect(html).toContain('Projected Week 3');
      expect(html).toContain('projected pts');
      expect(html).toContain('220.00');
      expect(html.match(/aria-label="Power rank 8"/g)).toHaveLength(2);
      expect(html).toContain('aria-label="Unranked"');
      expect(html).toContain('Partial evidence · 11/11 slots · includes 2025 prior-season statistics');
      expect(html).toContain('10/11 slots evidenced · no total or rank inferred');
      expect(html).toContain('data-power-movement="unavailable"');
      expect(html).toContain('no stored comparable prior snapshot');
      expect(html).toContain('calculation time, not the provider’s statistics-update time');
      expect(html).toContain('Source leg 2; explicit projected Week 3; horizon next-week');
      expect(html).toContain('href="/teams/3"');
      expect(html).not.toContain('$');
      expect(html).not.toContain('123456');
      expect(fetch).not.toHaveBeenCalled();
    } finally { fetch.mockRestore(); }
  });

  it("keeps zero projections ranked and an all-unavailable league unranked", () => {
    const { home } = weeklyHomeFixture(), source = homeLineupPowerFixture();
    source.snapshot.teams[0].projectedCountedPoints = 0;
    const zero = renderToStaticMarkup(createElement(HomePowerRankings, { data: buildHomeLineupPower(home, source) }));
    expect(zero).toContain('0.00');
    expect(zero).toContain('aria-label="Power rank 9"');
    const missing = renderToStaticMarkup(createElement(HomePowerRankings, { data: buildHomeLineupPower(home, homeLineupPowerFixture(true)) }));
    expect(missing.match(/aria-label="Unranked"/g)).toHaveLength(10);
    expect(missing).toContain('Every team remains unranked');
    expect(missing).not.toContain('projected pts');
  });

  it.each([undefined, { status: 'unavailable' as const, message: 'Synthetic source unavailable' }])('preserves a compact unavailable state without fake rows', data => {
    const html = renderToStaticMarkup(createElement(HomePowerRankings, { data }));
    expect(html).toContain('data-home-power="unavailable"');
    expect(html).not.toContain('data-power-team');
  });

  it.each([false, true])('composes Power exactly once with the recap, including missing edition: %s', missing => {
    const { home, receipt } = weeklyHomeFixture();
    if (missing) home.edition = null;
    const html = renderToStaticMarkup(createElement(CourtsideHome, { data: home, archive: [], portraits: {}, weeklyRecap: buildHomeWeeklyContext(home, [receipt]).recap, lineupPower: buildHomeLineupPower(home, homeLineupPowerFixture()) }));
    expect(html.match(/data-home-power=/g)).toHaveLength(1);
    expect(html).toContain('data-weekly-recap="available"');
    expect(html).toContain('Standings, leaders &amp; moves.');
  });

  it("never adds today's Power projections to an archived edition", () => {
    const { home, receipt } = weeklyHomeFixture();
    const html = renderToStaticMarkup(createElement(CourtsideHome, { data: home, archive: [], portraits: {}, archived: true, weeklyRecap: buildHomeWeeklyContext(home, [receipt]).recap, lineupPower: buildHomeLineupPower(home, homeLineupPowerFixture()) }));
    expect(html).not.toContain('data-home-power');
  });
});
