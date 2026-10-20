import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { RankedFreeThrow, SavedRoundFeedback } from "./RankedFreeThrow";
import type { RankedClient } from "@/data/ranked-free-throw/client";
import { sampleScore } from "@/data/ranked-free-throw/__tests__/fixtures";

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
it("offers owned-result recovery without any new-round or score-submit controls after closure", () => {
  const html = renderToStaticMarkup(createElement(RankedFreeThrow, { availability: { status: "recovery", reason: "closed" }, initialRunId: "11111111-1111-4111-8111-111111111111" }));
  expect(html).toContain("Your saved results remain available");
  expect(html).toContain("Checking saved result");
  expect(html).not.toContain("Start ranked round");
  expect(html).not.toContain("Save completed round");
});

it("celebrates only accepted saves and never manufactures a record claim", () => {
  for (const justAccepted of [true, false]) {
    const html = renderToStaticMarkup(createElement(SavedRoundFeedback, { score: sampleScore, justAccepted }));
    expect(html).toContain(`${sampleScore.makes} of ${sampleScore.attempts} makes`);
    expect(html).toContain("server validated");
    expect(html.includes('role="status"')).toBe(justAccepted);
    expect(html).toContain(justAccepted ? "Round saved" : "Saved result");
    expect(html).not.toMatch(/new record|personal best|you lead/i);
  }
});
