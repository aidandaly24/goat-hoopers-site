import { expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { teamValueHistoryDetailFixture, teamValueHistoryFixture } from "@/test/team-value-history-fixture";
import { isTeamValueHistoryDetail } from "@/domain/team-value-history";
import { TeamValueHistoryDetail } from "./TeamValueHistoryDetail";
import { TeamValueHistory } from "./TeamValueHistory";
import { membershipDetail } from "../../../qa/team-value-history/membership-fixture";

test("dated player changes and roster differences never become a trade-profit claim", () => {
  const before = teamValueHistoryDetailFixture("2026-10-08"), after = teamValueHistoryDetailFixture("2026-10-19");
  after.players[2] = { ...after.players[2], id: "new-player", name: "New roster member" };
  after.moves[0] = { ...after.moves[0], type: "trade", adds: [{ id: "other-roster-add", name: "Other roster participant", rosterId: 99 }], drops: [{ id: "unknown-side", name: "Unknown side participant", rosterId: 99 }] };
  const html = renderToStaticMarkup(<TeamValueHistoryDetail detail={after} previous={before} />);
  expect(html).toContain("11 days between observations");
  expect(html).toContain("+$35.00");
  expect(html).toContain("+$11.66");
  expect(html).toContain("Joined this roster between the two observations");
  expect(html).toContain("Left this roster between observations");
  expect(html).toContain("Selected roster ID unavailable");
  expect(html).toContain("Received by roster 99: Other roster participant");
  expect(html).toContain("Sent by roster 99: Unknown side participant");
  expect(html).toContain("Trade net: unavailable");
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
  expect(html).toContain('aria-pressed="true">Since inception');
  expect(html).toContain("Oct 19, 2025");
  expect(html).toContain("Some dates in this range have not loaded");
  expect(html).not.toContain('type="date"');
  expect(html).not.toContain('Calendar month');
  expect(html).toMatch(/<\/figure><section[^>]+data-history-inspector/);
  expect(html).toContain("data-history-inspector");
});

test("scopes both sides of a multi-roster trade without inventing counterparties or prices", () => {
  const d = teamValueHistoryDetailFixture("2026-10-19"); d.teamId = "1";
  d.moves = [{ ...d.moves[0], type: "trade", rosterIds: [1, 2, 3, 2], waiverBid: null,
    adds: [{ id: "a", name: "Our incoming player", rosterId: 1 }, { id: "b", name: "Other incoming player", rosterId: 2 }],
    drops: [{ id: "b", name: "Our outgoing player", rosterId: 1 }, { id: "a", name: "Other outgoing player", rosterId: 2 }],
    draftPicks: [
      { season: "2027", round: 1, rosterId: 7, previousOwnerId: 2, ownerId: 1 },
      { season: "2028", round: 2, rosterId: 8, previousOwnerId: 1, ownerId: 3 },
      { season: "2029", round: 3, rosterId: 1, previousOwnerId: 2, ownerId: 3 },
      { season: null, round: null, rosterId: null, previousOwnerId: null, ownerId: null },
    ] }];
  expect(isTeamValueHistoryDetail(d)).toBe(true);
  const html = renderToStaticMarkup(<TeamValueHistoryDetail detail={d} />);
  const received = html.match(/<p data-move-received="[^"]*"[^>]*>(.*?)<\/p>/)![1];
  const sent = html.match(/<p data-move-sent="[^"]*"[^>]*>(.*?)<\/p>/)![1];
  expect(received).toContain("Our incoming player"); expect(received).not.toContain("Other incoming");
  expect(sent).toContain("Our outgoing player"); expect(sent).not.toContain("Other outgoing");
  expect(html).toContain("Other declared participants: Roster 2, Roster 3");
  expect(html).toContain('data-pick-direction="received"'); expect(html).toContain('data-pick-direction="sent"');
  expect(html).toContain('data-pick-direction="other"'); expect(html).toContain("Original roster 1");
  expect(html).toContain("Season unavailable"); expect(html).toContain("Recipient unavailable");
  expect(html).toContain("Trade net: unavailable"); expect(html).toContain("Source league synthetic-2026");
  d.teamId = "2";
  const other = renderToStaticMarkup(<TeamValueHistoryDetail detail={d} />);
  expect(other.match(/<p data-move-received="[^"]*"[^>]*>(.*?)<\/p>/)![1]).toContain("Other incoming player");
});

test("pick-only prior-season events preserve unknown roster/value, missing terms and date precision", () => {
  const d = teamValueHistoryDetailFixture("2025-11-01");
  Object.assign(d, { teamId: "1", rosterStatus: "ambiguous", rosterCount: null, priced: 0, subtotalCents: null, players: [] });
  d.moves = [{ ...d.moves[0], type: "trade", leagueId: "source-2025", precision: "day", effectiveAt: null, day: d.day,
    adds: [], drops: [], waiverBid: null, rosterIds: [1, 2], draftPicks: [{ season: "2027", round: 1, rosterId: 3, ownerId: 1, previousOwnerId: 2 }] }];
  expect(isTeamValueHistoryDetail(d)).toBe(true);
  let html = renderToStaticMarkup(<TeamValueHistoryDetail detail={d} />);
  expect(html).toContain("Roster cannot be verified"); expect(html).toContain("0 of unknown players priced");
  expect(html).toContain("day precision only"); expect(html).toContain("source-2025");
  expect(html).toContain("Received pick"); expect(html).toContain("No player additions recorded");
  expect(html).not.toContain("$0.00"); expect(html).not.toContain("data-history-comparison");
  d.moves[0].draftPicks = null;
  html = renderToStaticMarkup(<TeamValueHistoryDetail detail={d} />); expect(html).toContain("Pick terms unavailable");
  d.moves[0].draftPicks = [];
  html = renderToStaticMarkup(<TeamValueHistoryDetail detail={d} />); expect(html).toContain("No draft picks carried");
  expect(html).not.toContain("Pick terms unavailable");
});

test("waiver amounts preserve zero and whole FAAB units without implying a player price", () => {
  const d = teamValueHistoryDetailFixture("2026-10-19"); d.teamId = "1";
  for (const bid of [0, 12]) {
    d.moves[0].waiverBid = bid;
    const html = renderToStaticMarkup(<TeamValueHistoryDetail detail={d} />);
    expect(html).toContain(`${bid} FAAB units`); expect(html).toContain("Sleeper settings.waiver_bid");
    expect(html).toContain("not a player valuation");
  }
  d.moves[0].waiverBid = null;
  expect(renderToStaticMarkup(<TeamValueHistoryDetail detail={d} />)).toContain("Not recorded");
});

test.each([
  ["2025-11-01", "2 players priced", false],
  ["2025-11-02", "0 players priced", true],
  ["2026-04-03", "unknown players priced", false],
])("membership-only detail keeps known, empty and unknown distinct on %s", (day, expected, empty) => {
  const d = membershipDetail(day, "a");
  expect(isTeamValueHistoryDetail(d)).toBe(true);
  const html = renderToStaticMarkup(<TeamValueHistoryDetail detail={d} />);
  expect(html).toContain(expected);
  expect(html.includes("No players on this roster at the selected date.")).toBe(empty);
  expect(html).not.toContain("$0.00");
  if (d.rosterCount) expect(html).toContain("Synthetic a roster member");
  expect(html).toContain(`dateTime="${d.valuationAt}"`);
  expect(html).toContain(d.valuationAt);
});

test("inspection time preserves native quote microseconds and evidence remains literal prose", () => {
  const d = teamValueHistoryDetailFixture("2026-10-19");
  d.valuationAt = "2026-10-19T12:00:00.123456Z";
  d.rosterEvidence = ["Synthetic prose <replayed> with 99 moves; it does not supply a roster count.", "Additional evidence."];
  const html = renderToStaticMarkup(<TeamValueHistoryDetail detail={d} />);
  expect(html).toContain('dateTime="2026-10-19T12:00:00.123456Z"');
  expect(html).toContain("Synthetic prose &lt;replayed&gt; with 99 moves");
  expect(html).toContain("3 of 3 players priced");
  expect(html).toContain("Additional evidence.");
  expect(html.match(/Synthetic prose/g)).toHaveLength(1);
});
