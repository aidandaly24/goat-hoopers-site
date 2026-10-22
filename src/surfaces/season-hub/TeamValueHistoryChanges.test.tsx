import { expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { isTeamValueHistoryDetail } from "@/domain/team-value-history";
import { changesDetail } from "../../../qa/team-value-history/changes-fixture";
import { TeamValueHistoryDetail } from "./TeamValueHistoryDetail";
import { TeamValueHistory } from "./TeamValueHistory";
import { RosterValueSection } from "./RosterValueSection";
import { changesHistory } from "../../../qa/team-value-history/changes-fixture";
import { personalizedFixture } from "@/test/personalized-home-fixture";
import { buildPersonalizedHome } from "@/data/personalized-home";

const render = (mode = "changed") => {
  const before = changesDetail("2026-10-19", mode), after = changesDetail("2026-10-20", mode);
  expect(isTeamValueHistoryDetail(before)).toBe(true); expect(isTeamValueHistoryDetail(after)).toBe(true);
  return renderToStaticMarkup(<TeamValueHistoryDetail detail={after} previous={before} />);
};
const changedRows = (html: string) => html.match(/<ul[^>]*data-history-price-changes[^>]*>([\s\S]*?)<\/ul>/)?.[1] ?? "";

test("the default changes list shows only Tobias's genuine -13.39 change, retaining the unchanged roster behind a disclosure", () => {
  const html = render(), rows = changedRows(html);
  expect(rows).toContain("Tobias Harris"); expect(rows).toContain("$24.35"); expect(rows).toContain("$10.96"); expect(rows).toContain("−$13.39");
  expect(rows).toContain(" to ");
  for (const name of ["Damian Lillard", "Joel Embiid", "Myles Turner", "Derrick White", "Grayson Allen", "Anthony Edwards", "Payton Pritchard"]) {
    expect(rows).not.toContain(name); expect(html).toContain(name);
  }
  expect(html).toContain("1 changed · 7 unchanged");
  expect(html).toMatch(/<details[^>]+data-history-snapshot[^>]*><summary>Selected roster/);
  expect(html).not.toMatch(/<details[^>]* open/);
  expect(html).toContain("Snapshot evidence"); expect(html).toContain("2026-10-20T04:00:00.123456Z");
});

test("zero changes and missing comparisons remain different states", () => {
  const unchanged = render("unchanged"), unknown = render("unknown");
  expect(changedRows(unchanged)).toBe(""); expect(unchanged).toContain("0 changed · 8 unchanged");
  expect(unchanged).toContain("No comparable player-price changes."); expect(unchanged).not.toContain("comparison unavailable");
  expect(changedRows(unknown)).toContain("Tobias Harris"); expect(changedRows(unknown)).not.toContain("Damian Lillard");
  expect(unknown).toContain("1 changed · 6 unchanged · 1 comparison unavailable");
  expect(unknown).toContain("Comparison unavailable");
});

test("source contradictions cannot become a displayed price change", () => {
  const before = changesDetail("2026-10-19"), after = changesDetail("2026-10-20");
  if (before.players[0].price?.kind === "recorded" && after.players[0].price?.kind === "recorded")
    after.players[0].price.quoteId = before.players[0].price.quoteId;
  const html = renderToStaticMarkup(<TeamValueHistoryDetail detail={after} previous={before} />);
  expect(changedRows(html)).toBe(""); expect(html).toContain("7 unchanged · 1 comparison unavailable");
  expect(html).toContain("Unavailable comparisons are not counted as unchanged");
});

test("matching amounts with different reconstructed-model versions are unknown, not unchanged", () => {
  const before = changesDetail("2026-10-19"), after = changesDetail("2026-10-20");
  for (const [index, detail] of [before, after].entries()) {
    detail.players[1].price = { kind: "reconstructed", source: "event-log", datasetId: "synthetic-dataset", modelVersion: `v${index}`,
      inputCutoff: detail.valuationAt, availableFrom: detail.valuationAt, validUntil: null };
    expect(isTeamValueHistoryDetail(detail)).toBe(true);
  }
  const html = renderToStaticMarkup(<TeamValueHistoryDetail detail={after} previous={before} />);
  expect(changedRows(html)).toContain("Tobias Harris"); expect(changedRows(html)).not.toContain("Damian Lillard");
  expect(html).toContain("1 changed · 6 unchanged · 1 comparison unavailable");
});

test("real zero-price transitions remain non-zero comparable changes and sort by magnitude", () => {
  const before = changesDetail("2026-10-19"), after = changesDetail("2026-10-20");
  before.players[1].priceCents = 0; after.players[1].priceCents = 100;
  before.players[2].priceCents = 200; after.players[2].priceCents = 0;
  for (const detail of [before, after]) {
    detail.subtotalCents = detail.players.reduce((sum, player) => sum + player.priceCents!, 0);
    expect(isTeamValueHistoryDetail(detail)).toBe(true);
  }
  const rows = changedRows(renderToStaticMarkup(<TeamValueHistoryDetail detail={after} previous={before} />));
  expect(rows).toContain("+$1.00"); expect(rows).toContain("−$2.00");
  expect(rows.indexOf("Tobias Harris")).toBeLessThan(rows.indexOf("Joel Embiid"));
  expect(rows.indexOf("Joel Embiid")).toBeLessThan(rows.indexOf("Damian Lillard"));
});

test("the initial current marker matches the headline while saved observations keep their original totals and rosters", () => {
  const f = personalizedFixture(), history = changesHistory();
  f.market.updatedAt = Date.parse(history.asOf); f.home.checkedAt = history.asOf;
  const data = buildPersonalizedHome({ kind: "member", teamId: "1" }, f.home, f.weekly, f.market);
  if (data.kind !== "member" || !data.summary) throw Error("Missing synthetic member summary");
  const html = renderToStaticMarkup(<RosterValueSection summary={data.summary} portraits={{}} teamHistory={history} />);
  const current = html.match(/<p[^>]+data-history-current-model[^>]*>([\s\S]*?)<\/p>/)?.[1] ?? "";
  const selected = html.match(/<div[^>]+data-history-readout[^>]*>([\s\S]*?)<\/div>/)?.[1] ?? "";
  expect(data.summary.valuation.total).toBe(110);
  expect(current).toContain("$110.00"); expect(current).toContain("4/4 priced"); expect(current).toContain(history.asOf);
  expect(selected).toContain("$110.00"); expect(selected).toContain("Current"); expect(selected).toContain("4/4 priced");
  expect(selected).not.toContain("$202.96");
  expect(history.points.at(-1)?.subtotalCents).toBe(20296); expect(history.points.at(-1)?.rosterCount).toBe(8);
  expect(html).toContain("$202.96"); expect(html).toContain("Oct 20, 2026");
  expect(html).toContain("Different dates, rosters or price coverage can produce different totals");
  expect(html).toContain("Saved quote for current roster: $100.96");
  expect(html).toContain("All days opens the full league calendar");
});

test.each([
  { total: 123, priced: 1, unpriced: 3, complete: false, knownRoster: true, expected: "Current roster value above subtotal: $123.00 · 1/4 priced" },
  { total: 123, priced: 4, unpriced: 0, complete: true, knownRoster: true, expected: "Current roster value above: $123.00 · 4/4 priced" },
  { total: 0, priced: 0, unpriced: 0, complete: true, knownRoster: true, expected: "Current roster value above: $0.00 · 0/0 priced" },
  { total: null, priced: 0, unpriced: 0, complete: false, knownRoster: false, expected: "Current roster value above: unavailable · 0/unknown priced" },
])("current-value context keeps $priced priced / $unpriced unpriced truthful", ({ expected, ...valuation }) => {
  const history = changesHistory();
  const html = renderToStaticMarkup(<TeamValueHistory history={history} currentValue={{ team: history.team, market: null, valuation }} />);
  expect(html).toContain(expected);
  expect(html).not.toContain("calculated <time");
  const wrongTeam = renderToStaticMarkup(<TeamValueHistory history={history} currentValue={{ team: { id: "another-team" }, market: null, valuation }} />);
  expect(wrongTeam).not.toContain("data-history-current-model");
});

test("roster additions and departures are not attributed as comparable player-price changes", () => {
  const before = changesDetail("2026-10-19"), after = changesDetail("2026-10-20");
  after.players[1] = { ...after.players[1], id: "synthetic-new-member", name: "New member" };
  const html = renderToStaticMarkup(<TeamValueHistoryDetail detail={after} previous={before} />);
  expect(changedRows(html)).not.toContain("New member");
  expect(html).toContain("Joined this roster"); expect(html).toContain("Left this roster");
  expect(html).toContain("not comparable price changes"); expect(html).toContain("not trade profit");
});

test.each(["loading", "unavailable", "changed", "no-previous"])("%s comparison does not claim players were unchanged", state => {
  const html = renderToStaticMarkup(<TeamValueHistoryDetail detail={changesDetail("2026-10-20")}
    comparisonLoading={state === "loading"} comparisonError={state === "unavailable" ? "unavailable" : state === "changed" ? "changed" : undefined} />);
  expect(changedRows(html)).toBe(""); expect(html).not.toContain("0 changed"); expect(html).not.toContain("No comparable player-price changes");
  expect(html).toContain("Selected roster");
});
