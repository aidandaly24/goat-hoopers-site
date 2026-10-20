import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { RankedFreeThrow } from "./RankedFreeThrow";
import type { RankedClient } from "@/data/ranked-free-throw/client";

it("keeps disabled ranked play closed with practice reachable and no account/API work", () => {
  const client = { start: vi.fn(), submit: vi.fn(), result: vi.fn(), leaderboard: vi.fn() } as RankedClient;
  const html = renderToStaticMarkup(createElement(RankedFreeThrow, { availability: { status: "disabled" }, client }));
  expect(html).toContain("Ranked play is closed"); expect(html).toContain('href="/arcade/free-throw"');
  expect(html).not.toContain("Start ranked round"); expect(html).not.toContain("Weekly rankings"); expect(html).not.toContain("10 FAAB");
  for (const method of Object.values(client)) expect(method).not.toHaveBeenCalled();
});
it("provides a personal sign-in entry only when ranked configuration is available", () => {
  const html = renderToStaticMarkup(createElement(RankedFreeThrow, { availability: { status: "sign_in" } }));
  expect(html).toContain('href="/account/login"'); expect(html).not.toContain("Start ranked round");
});
