import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AiDecidesHomeEntry, AiWeekly, ChoiceLabel, ProbabilityRows } from "./AiWeekly";
import { cachedData, interactiveResult, teams } from "./test/fixtures";

describe("backend roster-ID display", () => {
  it.each(["weekly", "home"])("shows the actual %s choice independently of order/probability/confidence", surface => {
    const data = cachedData(), before = JSON.stringify(data);
    const html = surface === "weekly" ? renderToStaticMarkup(createElement(AiWeekly, { data, teams, onPair: () => {} })) : renderToStaticMarkup(createElement(AiDecidesHomeEntry, { data, teams }));
    expect(html).toContain("Model choice: Current Six");
    expect(html).toContain("Roster 6 · current name");
    expect(html).toContain("Roster 10 · current name");
    expect(html.indexOf('data-choice-id="10"')).toBeLessThan(html.indexOf('data-choice-id="6"'));
    expect(html).toContain("62%"); expect(html).toContain("38%");
    if (surface === "weekly") { expect(html).toContain("API confidence 21%"); expect(html).toContain("Frozen roster 6 prior inputs"); }
    expect(JSON.stringify(data)).toBe(before);
  });
  it("uses the same explicit matchup context for personal choice and probability labels", () => {
    const result = interactiveResult(), matchup = { teamIds: ["1", "2"] as [string, string], teams };
    const chosen = renderToStaticMarkup(createElement(ChoiceLabel, { choice: result.choice, matchup }));
    const rows = renderToStaticMarkup(createElement(ProbabilityRows, { result, matchup }));
    expect(chosen).toContain("Current One"); expect(chosen).toContain("Roster 1 · current name");
    expect(rows.indexOf('data-choice-id="2"')).toBeLessThan(rows.indexOf('data-choice-id="1"'));
    expect(rows).toContain("67%"); expect(rows).toContain("33%");
  });
  it("keeps numeric custom choices literal despite matching current roster IDs", () => {
    const result = { ...interactiveResult(), snapshot: null };
    const html = renderToStaticMarkup(createElement(ProbabilityRows, { result }));
    expect(renderToStaticMarkup(createElement(ChoiceLabel, { choice: "1" }))).toBe("1");
    expect(html).not.toContain("Current One"); expect(html).not.toContain("Roster 1");
  });
  it("falls back to honest roster IDs when current names are unavailable", () => {
    const html = renderToStaticMarkup(createElement(AiWeekly, { data: cachedData(), teams: [], onPair: () => {} }));
    expect(html).toContain("Model choice: Roster 6"); expect(html).toContain("Name unavailable");
    expect(html).toContain("Frozen roster 6 prior inputs"); expect(html).not.toContain("Current Six");
  });
});
