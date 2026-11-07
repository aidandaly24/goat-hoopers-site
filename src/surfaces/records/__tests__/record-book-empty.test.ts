import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RecordBook } from "../RecordBook";

/**
 * Issue #94, part B: the /intel Record Book is current-season only (it is
 * computed from live Sleeper matchups), while the all-time archive lives in
 * the Trophy Room (/history). The empty state must say so truthfully.
 *
 * Rendered with an explicit `dataState: "pre-tipoff"` (issue #224
 * follow-through): the season-scoped wording below is the pre-tipoff
 * world's copy. With no proven state the surface now defaults to the
 * neutral unavailable copy instead — that default is pinned by
 * IntelHub.test.tsx.
 */
describe("RecordBook empty state", () => {
  const html = renderToStaticMarkup(
    createElement(RecordBook, { book: null, dataState: "pre-tipoff" })
  );

  it("scopes the empty state to the current season", () => {
    expect(html).toContain("No records yet this season");
  });

  it("links the all-time archive instead of claiming no history exists", () => {
    expect(html).toContain('href="/history"');
    expect(html).toContain("Trophy Room");
  });

  it("does not advertise the list as all-time", () => {
    expect(html).toContain("This Season");
    expect(html).not.toMatch(/all-time/i);
  });
});
