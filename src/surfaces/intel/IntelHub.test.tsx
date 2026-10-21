/**
 * IntelHub.test.tsx — the four tools' empty states must describe the
 * league's actual state (issue #224 follow-through).
 *
 * The loaders return null in two different worlds: before tip-off (no
 * games have started) and in-season with no completed week yet (Week 1
 * live — finals, not live scores, are the evidence every tool runs on).
 * The pre-tipoff copy ("the schedule drops when the season tips off")
 * is a false claim in the second world; with `seasonStarted` the empty
 * states say the true thing instead: underway, nothing closed yet.
 */
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { IntelHub } from "./IntelHub";

const renderEmpty = (seasonStarted: boolean) =>
  renderToStaticMarkup(
    createElement(IntelHub, {
      previews: null,
      rankings: null,
      odds: null,
      book: null,
      seasonStarted,
    }),
  );

describe("IntelHub empty states", () => {
  it("before tip-off, keeps the pre-tipoff copy", () => {
    const html = renderEmpty(false);
    expect(html).toContain("the schedule drops when the season");
    expect(html).toContain("Rankings drop when the season tips off");
    expect(html).toContain("Odds go live when games do");
    expect(html).toContain("history starts when the first whistle");
  });

  it("once the season is underway, distinguishes no completed weeks from no games", () => {
    const html = renderEmpty(true);
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
});
