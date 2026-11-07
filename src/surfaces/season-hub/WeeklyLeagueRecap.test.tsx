import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { weeklyHomeFixture } from "@/test/home-weekly-fixture";
import { buildHomeWeeklyContext } from "@/data/home-weekly-context";
import { WeeklyLeagueRecap } from "./WeeklyLeagueRecap";
import { HomePowerRankings } from "./HomePowerRankings";
import { CourtsideHome } from "./CourtsideHome";

describe("completed league recap presentation", () => {
  it("labels official totals and all player evidence states, with every team expandable", () => {
    const { home, receipt } = weeklyHomeFixture();
    const recap = buildHomeWeeklyContext(home, [receipt]).recap;
    const html = renderToStaticMarkup(createElement(WeeklyLeagueRecap, { recap }));
    expect(html.match(/data-weekly-team=/g)).toHaveLength(10);
    expect(html).toContain('data-weekly-award="stud"');
    expect(html).toContain('data-weekly-award="chud"');
    expect(html).toContain("Official team total");
    expect(html).toContain("Every player value below is an estimate");
    expect(html).toContain("Exact counted fantasy points");
    expect(html).toContain("Est. 30.0 pts");
    expect(html).toContain("0.0 pts");
    expect(html).toContain("No counted game; no points recorded");
    expect(html).toContain("one-game sample");
    expect(html).toContain("Locked game");
    expect(html).toContain("Final played game");
    expect(html).toContain('href="/player/2-player-0"');
    expect(html).toContain('href="/teams/9"');
    expect(html).not.toContain("Synthetic 9 Player");
    expect(html).toContain("today’s roster may differ");
    expect(html).toContain(receipt.generatedAt);
  });

  it("never fills Lineup Power with retrospective standings or fake ranks", () => {
    const html = renderToStaticMarkup(createElement(HomePowerRankings));
    expect(html).toContain('data-home-power="unavailable"');
    expect(html).toContain("all 11 legal starting slots");
    expect(html).toContain("comparable prior snapshot");
    expect(html).not.toContain("<table");
    expect(html).not.toContain("No. 1");
  });

  it.each([false, true])("keeps live recap and old editorial independently accessible (missing edition: %s)", missing => {
    const { home, receipt } = weeklyHomeFixture();
    if (missing) home.edition = null;
    const html = renderToStaticMarkup(createElement(CourtsideHome, { data: home, archive: [], portraits: {}, weeklyRecap: buildHomeWeeklyContext(home, [receipt]).recap }));
    expect(html.match(/data-weekly-recap=/g)).toHaveLength(1);
    expect(html).toContain('data-home-power="unavailable"');
    expect(html).toContain("Standings, leaders &amp; moves.");
    expect(html).toContain('href="/arcade"');
    expect(html).toContain('href="/weekly"');
    if (!missing) expect(html).toContain("From the editorial notebook");
  });

  it("never injects today's recap or Power state into an archived edition", () => {
    const { home, receipt } = weeklyHomeFixture();
    const html = renderToStaticMarkup(createElement(CourtsideHome, { data: home, archive: [], portraits: {}, archived: true, weeklyRecap: buildHomeWeeklyContext(home, [receipt]).recap }));
    expect(html).not.toContain("data-weekly-recap");
    expect(html).not.toContain("data-home-power");
    expect(html).not.toContain("From the editorial notebook");
  });
});
