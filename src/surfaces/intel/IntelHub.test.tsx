/**
 * IntelHub.test.tsx — the four tools' empty states must describe only
 * the world the data layer PROVED (issue #224 follow-through).
 *
 * The loaders return null in three different worlds: before tip-off
 * (no games have started), in-season with no completed week yet
 * (Week 1 live — finals, not live scores, are the evidence every tool
 * runs on), and unavailable (a feed failed, or weeks have closed and
 * a null tool is a data gap — e.g. Week 3 previews with completed
 * finals on file but the current schedule missing). The pre-tipoff
 * copy ("the schedule drops when the season tips off") is a false
 * claim in both other worlds, and "no week has closed yet" is just
 * as false in the third; `dataState` carries the proven world so no
 * empty state has to guess.
 */
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { DataToolsState } from "@/domain";
import { IntelHub } from "./IntelHub";

const renderEmpty = (dataState?: DataToolsState) =>
  renderToStaticMarkup(
    createElement(IntelHub, {
      previews: null,
      rankings: null,
      odds: null,
      book: null,
      dataState,
    }),
  );

describe("IntelHub empty states", () => {
  it("before tip-off, keeps the pre-tipoff copy", () => {
    const html = renderEmpty("pre-tipoff");
    expect(html).toContain("the schedule drops when the season");
    expect(html).toContain("Rankings drop when the season tips off");
    expect(html).toContain("Odds go live when games do");
    expect(html).toContain("history starts when the first whistle");
  });

  it("once the season is underway, distinguishes no completed weeks from no games", () => {
    const html = renderEmpty("no-closed-week");
    // No tool may claim the season has not tipped off.
    expect(html).not.toContain("tips off");
    expect(html).not.toContain("first whistle");
    expect(html).not.toContain("Odds go live when games do");
    // Each tool names the real blocker: no completed-week evidence yet.
    expect(html).toContain("projections run on completed finals, and no week has closed yet");
    expect(html).toContain("rankings come from completed finals, and no week has closed yet");
    expect(html).toContain("the simulation runs on completed finals, and no week has closed yet");
    expect(html).toContain("records come from finals, and no week has closed yet");
  });

  it("when the data is unavailable, every tool says so neutrally — no tip-off claim, no closed-week claim", () => {
    const html = renderEmpty("unavailable");
    // Each tool names the actual state: the required data is unavailable.
    expect(html).toContain("Previews are unavailable right now");
    expect(html).toContain("Rankings are unavailable right now");
    expect(html).toContain("Odds are unavailable right now");
    expect(html).toContain("The record book is unavailable right now");
    expect(html).toContain("the required data is unavailable");
    expect(html).not.toContain("did not answer");
    // And none of them dresses the gap up as either proven world.
    expect(html).not.toContain("tips off");
    expect(html).not.toContain("first whistle");
    expect(html).not.toContain("Odds go live when games do");
    expect(html).not.toContain("no week has closed");
  });

  it("without a proven state, defaults to the claim-free unavailable copy", () => {
    const html = renderEmpty(undefined);
    expect(html).toContain("Previews are unavailable right now");
    expect(html).not.toContain("tips off");
    expect(html).not.toContain("no week has closed");
  });
});
