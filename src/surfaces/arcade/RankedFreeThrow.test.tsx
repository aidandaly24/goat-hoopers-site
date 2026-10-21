import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { claimAcceptedScore, rankedLoginHref, RankedFreeThrow, SavedRoundFeedback } from "./RankedFreeThrow";
import { loginContinuationHref, safeLoginDestination } from "@/domain/login-navigation";
import type { RankedClient } from "@/data/ranked-free-throw/client";
import type { RankedRecordFeedback } from "@/domain/arcade/ranked-record-feedback";
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
  expect(html).toContain(`href="${rankedLoginHref()}"`); expect(html).not.toContain("Start ranked round");
});
it("retains a ranked bookmark through login validation and continuation without accepting an arbitrary redirect", () => {
  const id = "11111111-1111-4111-8111-111111111111";
  const destination = `/arcade/ranked-free-throw?run=${id}`;
  const login = new URL(rankedLoginHref(id), "https://fixture.invalid");
  expect(login.pathname).toBe("/account/login");
  expect(login.search).toBe(`?next=${encodeURIComponent(destination)}`);
  expect(safeLoginDestination(login.searchParams.get("next"))).toBe(destination);
  const continuation = new URL(loginContinuationHref(login.searchParams.get("next")), login.origin);
  expect(safeLoginDestination(continuation.searchParams.get("next"))).toBe(destination);
  const html = renderToStaticMarkup(createElement(RankedFreeThrow, { availability: { status: "sign_in" }, initialRunId: id }));
  expect(html).toContain(`href="${rankedLoginHref(id)}"`);
  expect(html).toContain("Sign in to check this round");
  for (const hostile of ["https://attacker.invalid", "//attacker.invalid", "/arcade/ranked-free-throw?next=//attacker.invalid", `${id}&next=https://attacker.invalid`, "%2f%2fattacker.invalid", "invalid"]) {
    expect(new URL(rankedLoginHref(hostile), login.origin).searchParams.get("next")).toBe("/arcade/ranked-free-throw");
  }
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

const score = { ...sampleScore, score: 1, makes: 1, attempts: 2, accuracy: .5 };
const feedback = (outcome: "first" | "beaten" | "tied" | "below"): RankedRecordFeedback => {
  const comparison = { previousScore: outcome === "first" ? null : outcome === "beaten" ? 0 : outcome === "tied" ? 1 : 2, outcome };
  return { version: 1, scoreId: score.id, acceptedAtMs: score.achievedAtMs, periodId: "synthetic-week", scoreVersion: "a".repeat(64), scope: "everyone",
    personalBest: comparison, weeklyRecord: comparison, allTimeRecord: comparison };
};
it("labels first and tied records honestly and reserves the record effect for strictly beaten scores", () => {
  for (const outcome of ["first", "beaten", "tied", "below"] as const) {
    const html = renderToStaticMarkup(createElement(SavedRoundFeedback, { score, justAccepted: true, feedback: feedback(outcome) }));
    expect(html.includes('data-record-beaten="true"')).toBe(outcome === "beaten");
    expect(html.includes("Record beaten!")).toBe(outcome === "beaten");
    expect(html).toContain("Confirmed at acceptance");
    expect(html).toContain("compatible score formats");
    expect(html).toContain("Everyone");
    expect(html).toContain("not a current rank or a League award");
    if (outcome === "first") expect(html).toContain("First personal score");
    if (outcome === "beaten") { expect(html).toContain("New personal best"); expect(html).toContain("0 to 1 makes"); }
    if (outcome === "tied") expect(html).toContain("Personal best tied");
    if (outcome === "below") expect(html).not.toMatch(/First personal|New personal|record tied/);
  }
});
it("suppresses all record notices on recovery, missing feedback and a different score ID", () => {
  for (const props of [{ justAccepted: false, feedback: feedback("beaten") }, { justAccepted: true }, { justAccepted: true, feedback: { ...feedback("beaten"), scoreId: "different-score" } }]) {
    const html = renderToStaticMarkup(createElement(SavedRoundFeedback, { score, ...props }));
    expect(html).not.toContain("Server-confirmed score comparisons");
    expect(html).not.toContain('data-record-beaten="true"');
  }
});
it("dedupes by accepted score ID across rerenders and mounted sessions, with unavailable-storage fallback", () => {
  const values = new Map<string, string>();
  const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); } };
  const seen = new Set<string>();
  expect(claimAcceptedScore(score.id, seen, storage)).toBe(true);
  expect(claimAcceptedScore(score.id, seen, storage)).toBe(false);
  expect(claimAcceptedScore(score.id, new Set(), storage)).toBe(false);
  expect(claimAcceptedScore("another-score", seen, storage)).toBe(true);
  const unavailable = { getItem: () => { throw new Error("storage blocked"); }, setItem: () => {} };
  expect(claimAcceptedScore("storage-blocked", seen, unavailable)).toBe(true);
  expect(claimAcceptedScore("storage-blocked", seen, unavailable)).toBe(false);
});
