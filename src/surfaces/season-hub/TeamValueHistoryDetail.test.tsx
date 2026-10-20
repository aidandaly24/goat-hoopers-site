import { expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { teamValueHistoryDetailFixture, teamValueHistoryFixture } from "@/test/team-value-history-fixture";
import { TeamValueHistoryDetail } from "./TeamValueHistoryDetail";
import { TeamValueHistory } from "./TeamValueHistory";

test("dated player changes and roster differences never become a trade-profit claim", () => {
  const before = teamValueHistoryDetailFixture("2026-10-08"), after = teamValueHistoryDetailFixture("2026-10-19");
  after.players[2] = { ...after.players[2], id: "new-player", name: "New roster member" };
  after.moves[0] = { ...after.moves[0], type: "trade", adds: [{ id: "other-roster-add", name: "Other roster participant" }], drops: [{ id: "unknown-side", name: "Unknown side participant" }] };
  const html = renderToStaticMarkup(<TeamValueHistoryDetail detail={after} previous={before} />);
  expect(html).toContain("11 days between observations");
  expect(html).toContain("+$35.00");
  expect(html).toContain("+$11.66");
  expect(html).toContain("Joined this roster between the two observations");
  expect(html).toContain("Left this roster between observations");
  expect(html).toContain("Players in this trade: Other roster participant, Unknown side participant");
  expect(html).toContain("Received/sent sides, other assets and historical trade net are unavailable");
  expect(html).not.toContain("Assets in");
  expect(html).not.toContain("Assets out");
  expect(html).toContain("not trade profit");
});

test("failed or changed comparison keeps selected evidence without presenting a delta", () => {
  const detail = teamValueHistoryDetailFixture("2026-10-19");
  for (const error of ["changed", "unavailable"] as const) {
    const html = renderToStaticMarkup(<TeamValueHistoryDetail detail={detail} comparisonError={error} retryComparison={() => {}} />);
    expect(html).toContain("Synthetic guard");
    expect(html).not.toContain("data-history-comparison");
    expect(html.includes("Retry comparison")).toBe(error === "unavailable");
  }
});

test("all time defaults to the league bounds even with a subset summary", () => {
  const history = teamValueHistoryFixture("paged");
  history.requestedRange = { from: "2026-10-01", toExclusive: history.leagueRange.toExclusive };
  history.loadedRange = { from: "2026-10-01", toExclusive: "2026-10-19" };
  history.points = history.points.filter(point => point.day >= "2026-10-01");
  const html = renderToStaticMarkup(<TeamValueHistory history={history} detailEndpoint="/api/team-value-history/detail" pageEndpoint="/api/team-value-history/summary" />);
  expect(html).toContain('aria-pressed="true">All time');
  expect(html).toContain("367-day window");
  expect(html).toContain("Summary not loaded");
  expect(html).toContain("Some dates in this range have not loaded");
  expect(html).toContain('value="2025-10"');
  expect(html).toContain("data-history-inspector");
});
