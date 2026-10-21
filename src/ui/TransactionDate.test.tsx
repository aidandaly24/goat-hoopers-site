import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { TransactionDate } from "./TransactionDate";

it.each([
  ["2026-10-20T02:30:00Z", "Oct 19, 2026, EDT"],
  ["2026-10-20T03:59:59Z", "Oct 19, 2026, EDT"],
  ["2026-10-20T04:00:00Z", "Oct 20, 2026, EDT"],
  ["2026-01-01T04:59:59Z", "Dec 31, 2025, EST"],
  ["2026-01-01T05:00:00Z", "Jan 1, 2026, EST"],
  ["2026-03-08T06:59:59Z", "Mar 8, 2026, EST"],
  ["2026-03-08T07:00:00Z", "Mar 8, 2026, EDT"],
  ["2026-11-01T05:30:00Z", "Nov 1, 2026, EDT"],
  ["2026-11-01T06:30:00Z", "Nov 1, 2026, EST"],
])("labels the league calendar day and zone without changing %s", (instant, label) => {
  const html = renderToStaticMarkup(createElement(TransactionDate, { timestamp: Date.parse(instant) }));
  expect(html).toContain(`>${label}</time>`);
  expect(html).toContain(`dateTime="${new Date(instant).toISOString()}"`);
});
it("keeps zero as an instant and fails closed for invalid instants", () => {
  expect(renderToStaticMarkup(createElement(TransactionDate, { timestamp: 0 }))).toContain('dateTime="1970-01-01T00:00:00.000Z"');
  for (const timestamp of [NaN, Infinity, 1e100]) {
    const html = renderToStaticMarkup(createElement(TransactionDate, { timestamp }));
    expect(html).toBe("<span>Date unavailable</span>");
  }
});
