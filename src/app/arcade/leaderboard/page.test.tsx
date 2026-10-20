import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import ArcadeLeaderboardPage from "./page";

it("renders the held scheduled opening in the real page with disabled scopes, practice access and no invented policy", () => {
  const html = renderToStaticMarkup(createElement(ArcadeLeaderboardPage));
  expect(html).toContain("2026-10-20T19:00:00.000Z"); expect(html).toContain("3:00 PM EDT");
  expect(html).toContain("Reaching zero does not open entries"); expect(html).toContain('href="/arcade/free-throw"');
  expect(html.match(/disabled=""/g)?.length).toBe(2);
  for (const copy of ["Start ranked", "120 seconds", "10 FAAB", "Week ends in"]) expect(html).not.toContain(copy);
  expect(html).not.toContain("<main");
});
