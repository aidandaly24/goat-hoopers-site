import { expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { historyCalendarPresetRange, historyDayCount, HISTORY_CALENDAR_PRESETS } from "./team-value-history-view";
import { currentTeamQuote } from "@/domain/current-team-quote";
import { buildPersonalizedHome } from "@/data/personalized-home";
import { personalizedFixture } from "@/test/personalized-home-fixture";
import { TeamValueHistory } from "./TeamValueHistory";
import { compactHistory } from "../../../qa/team-value-history/compact-fixture";

const league = { from: "2024-01-01", toExclusive: "2026-10-23" };
test.each([
  ["1W", "2026-10-16"], ["1M", "2026-09-23"], ["3M", "2026-07-23"], ["6M", "2026-04-23"],
  ["YTD", "2026-01-01"], ["1Y", "2025-10-23"], ["all", "2024-01-01"],
] as const)("%s uses an exact half-open UTC calendar window", (preset, from) => {
  expect(historyCalendarPresetRange(league, preset)).toEqual({ from, toExclusive: league.toExclusive });
});
test("YTD follows the included date's year at the UTC New Year boundary", () => {
  expect(historyCalendarPresetRange({ ...league, toExclusive: "2027-01-01" }, "YTD").from).toBe("2026-01-01");
  expect(historyCalendarPresetRange({ ...league, toExclusive: "2027-01-02" }, "YTD").from).toBe("2027-01-01");
});
test("calendar month/year subtraction clamps instead of overflowing month ends", () => {
  expect(historyCalendarPresetRange({ ...league, from: "2020-01-01", toExclusive: "2024-03-31" }, "1M").from).toBe("2024-02-29");
  expect(historyCalendarPresetRange({ ...league, toExclusive: "2025-03-31" }, "1M").from).toBe("2025-02-28");
  const leapYear = historyCalendarPresetRange({ ...league, from: "2020-01-01", toExclusive: "2024-03-01" }, "1Y");
  expect(leapYear.from).toBe("2023-03-01"); expect(historyDayCount(leapYear)).toBe(366);
  expect(historyDayCount(historyCalendarPresetRange({ ...league, toExclusive: "2026-03-10" }, "1W"))).toBe(7);
});
test("every window clips to actual inception without moving its cutoff", () => {
  const recent = { from: "2026-10-20", toExclusive: "2026-10-23" };
  for (const preset of HISTORY_CALENDAR_PRESETS) expect(historyCalendarPresetRange(recent, preset)).toEqual(recent);
});
test("all controls render without inventing points and a loaded empty range is explicit", () => {
  const h = compactHistory(); h.points = []; h.currentQuote = null;
  const original = structuredClone(h), html = renderToStaticMarkup(<TeamValueHistory history={h} />);
  for (const label of ["1W", "1M", "3M", "6M", "YTD", "1Y", "All"]) expect(html).toContain(`>${label}</button>`);
  expect(html).toContain('aria-label="Calendar range"'); expect(html).toContain("0 loaded value dates across 368 calendar days");
  expect(html).toContain("No supported historical values in this range"); expect(html).not.toContain("$0.00");
  expect(h).toEqual(original);
});
test("unloaded coverage cannot be reported as an empty historical range", () => {
  const h = compactHistory();h.points = [];h.loadedRange = { from: "2026-10-19", toExclusive: "2026-10-21" };
  const html = renderToStaticMarkup(<TeamValueHistory history={h} />);
  expect(html).toContain("Range coverage incomplete");expect(html).not.toContain("No supported historical values in this range");
});


test("a fresh Current quote at the historical cutoff edge keeps a valid initial slider", () => {
  const h = compactHistory();
  h.points.unshift({ ...h.points[0], id: "synthetic-inception", day: h.leagueRange.from, valuationAt: `${h.leagueRange.from}T04:00:00.000Z`, seasonId: "2025" });
  const f = personalizedFixture(); f.market.updatedAt = Date.parse(`${h.leagueRange.toExclusive}T00:10:00.000Z`);
  const home = buildPersonalizedHome({ kind: "member", teamId: "1" }, f.home, f.weekly, f.market);
  if (home.kind !== "member" || !home.summary) throw Error("Synthetic member missing");
  const html = renderToStaticMarkup(<TeamValueHistory history={h} currentQuote={currentTeamQuote(home.summary)} />);
  expect(html).toContain("data-history-current=");
  const max = Number(html.match(/aria-valuemax="(\d+)"/)![1]), now = Number(html.match(/aria-valuenow="(\d+)"/)![1]);
  expect(now).toBeLessThanOrEqual(max); expect(html).not.toContain("data-history-range-coverage");
});
