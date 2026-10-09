import { describe, expect, it, vi } from "vitest";
import { AI_PROBABILITY_LABEL } from "@/domain/ai-decider";
import { comparisonLabel, draftError, percent, periodLabel, postDecision, postWeeklyPreviews, readDecisionResponse, readWeeklyPublishResponse } from "./client";
import { cachedData, interactiveResult } from "./test/fixtures";

const ready = () => ({ status: "ready", result: { model: "historical-model", promptVersion: "frozen-v0", choice: "B", confidence: .21, probabilities: [{ choice: "A", probability: .3333333333 }, { choice: "B", probability: .3333333333 }, { choice: "C", probability: .3333333334 }], evidence: ["Prior completed-season inputs only"], probabilityLabel: AI_PROBABILITY_LABEL, snapshot: null } });
const published = () => {
  const weekly = cachedData().weekly;
  weekly.matchups = Array.from({ length: 5 }, (_, index) => {
    const teamIds: [string, string] = [String(index * 2 + 1), String(index * 2 + 2)];
    return { ...weekly.matchups[0], matchupId: `fixture-${index}`, teamIds, result: { ...interactiveResult(), choice: teamIds[0], probabilities: [{ choice: teamIds[1], probability: .67 }, { choice: teamIds[0], probability: .33 }] } };
  });
  return { status: "ready", weekly };
};
describe("AI Decides client boundary", () => {
  it("preserves every raw probability, order, chosen option, independent confidence and historical model", () => {
    const value = ready(); expect(readDecisionResponse(value, ["A", "B", "C"])).toBe(value);
    expect(percent(value.result.probabilities[2].probability)).toBe("33.3%");
  });
  it.each(["unavailable", "invalid", "unauthenticated", "rate_limited", "busy", "refused", "timeout"])("preserves %s without inventing a result", status => {
    const v = readDecisionResponse({ status, code: "safe", message: "Safe message", retryAfterSeconds: 30 }); expect(v.status).toBe(status); expect(v).not.toHaveProperty("result");
  });
  it.each([NaN, Infinity, -1, 2])("rejects non-unit probability %s", probability => { const v = ready(); v.result.probabilities[0].probability = probability; expect(readDecisionResponse(v).status).toBe("unavailable"); });
  it("rejects a missing choice, duplicate choice, false sum and unknown choice", () => {
    const missing = ready(); missing.result.probabilities.pop(); expect(readDecisionResponse(missing, ["A", "B", "C"]).status).toBe("unavailable");
    const duplicate = ready(); duplicate.result.probabilities[1].choice = "A"; expect(readDecisionResponse(duplicate).status).toBe("unavailable");
    const sum = ready(); sum.result.probabilities[0].probability = .5; expect(readDecisionResponse(sum).status).toBe("unavailable");
    const chosen = ready(); chosen.result.choice = "D"; expect(readDecisionResponse(chosen).status).toBe("unavailable");
  });
  it("fails closed on malformed output or a successful-looking HTTP failure", async () => {
    expect(readDecisionResponse(null).status).toBe("unavailable");
    expect(readDecisionResponse({ status: "ready", result: { probabilities: [] } }).status).toBe("unavailable");
    const fetcher = vi.fn().mockResolvedValue({ ok: false, json: async () => ready() }); vi.stubGlobal("fetch", fetcher);
    try { expect((await postDecision({ kind: "custom", prompt: "Pick?", choices: ["A", "B", "C"] }, new AbortController().signal)).status).toBe("unavailable"); } finally { vi.unstubAllGlobals(); }
  });
  it("calls only the relative app route, once, with the current abort signal", async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ready() }); vi.stubGlobal("fetch", fetcher);
    try { const signal = new AbortController().signal; await postDecision({ kind: "custom", prompt: "Pick?", choices: ["A", "B", "C"] }, signal); expect(fetcher).toHaveBeenCalledTimes(1); expect(fetcher).toHaveBeenCalledWith("/api/ai-decides", expect.objectContaining({ credentials: "same-origin", method: "POST", signal, cache: "no-store" })); } finally { vi.unstubAllGlobals(); }
  });
  it("validates a backend-shaped matchup response against the exact requested roster IDs", async () => {
    const valid = { status: "ready", result: interactiveResult() };
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => valid }); vi.stubGlobal("fetch", fetcher);
    try {
      const response = await postDecision({ kind: "matchup", teamIds: ["1", "2"] }, new AbortController().signal);
      expect(response).toBe(valid); expect(valid.result.probabilities.map(p => p.choice)).toEqual(["2", "1"]);
      expect((await postDecision({ kind: "matchup", teamIds: ["6", "10"] }, new AbortController().signal)).status).toBe("unavailable");
      valid.result.probabilities[0].choice = "Current Two";
      expect((await postDecision({ kind: "matchup", teamIds: ["1", "2"] }, new AbortController().signal)).status).toBe("unavailable");
    } finally { vi.unstubAllGlobals(); }
  });
  it("preserves historical metadata and preview metadata without rewriting probabilities", () => {
    const historical = { status: "ready", result: interactiveResult() };
    expect(readDecisionResponse(historical, ["1", "2"])).toBe(historical);
    for (const comparison of ["preseason_lineup_preview", "weekly_lineup_preview"]) {
      const preview = { status: "ready", result: { ...interactiveResult(), snapshot: { ...historical.result.snapshot, comparison, sourceLeg: 0, startsAt: null, endsAt: null } } };
      expect(readDecisionResponse(preview, ["1", "2"])).toBe(preview);
      expect(preview.result.probabilities).toEqual(historical.result.probabilities);
    }
  });
  it.each(["hash", "model", "promptVersion", "capturedAt", "cutoffAt", "statsSeason", "scoringMode", "baselineVersion"])("does not allow null %s metadata", key => {
    const value = { status: "ready", result: { ...interactiveResult(), snapshot: { ...interactiveResult().snapshot, [key]: null } } };
    expect(readDecisionResponse(value).status).toBe("unavailable");
  });
  it.each([undefined, 4, {}, false])("rejects a non-string/non-null preview period %s", startsAt => {
    const value = { status: "ready", result: { ...interactiveResult(), snapshot: { ...interactiveResult().snapshot, startsAt } } };
    expect(readDecisionResponse(value).status).toBe("unavailable");
  });
  it.each(["capturedAt", "cutoffAt", "startsAt", "endsAt"])("rejects malformed %s dates without rewriting them", key => {
    const value = { status: "ready", result: { ...interactiveResult(), snapshot: { ...interactiveResult().snapshot, [key]: "not-an-ISO-date" } } };
    expect(readDecisionResponse(value).status).toBe("unavailable");
  });
  it("rejects calendar rollover and accepts real leap days and timezone offsets", () => {
    const withStart = (startsAt: string) => ({ status: "ready", result: { ...interactiveResult(), snapshot: { ...interactiveResult().snapshot, startsAt } } });
    for (const date of ["2026-02-30T00:00:00Z", "2026-02-29T00:00:00Z", "2026-10-20T24:00:00Z"]) expect(readDecisionResponse(withStart(date)).status).toBe("unavailable");
    for (const date of ["2028-02-29T00:00:00Z", "2026-10-20T02:00:00+02:00"]) expect(readDecisionResponse(withStart(date)).status).toBe("ready");
  });
  it.each([{ comparison: "forecast" }, { comparison: null }, { sourceLeg: -1 }, { sourceLeg: 1.5 }, { sourceLeg: "1" }, { sourceLeg: null }, { sourceLeg: Number.MAX_SAFE_INTEGER + 1 }])("rejects malformed additive preview metadata %s", metadata => {
    const value = { status: "ready", result: { ...interactiveResult(), snapshot: { ...interactiveResult().snapshot, ...metadata } } };
    expect(readDecisionResponse(value).status).toBe("unavailable");
  });
  it("describes historical periods, explicit publication closure and unknown calendar without inventing dates", () => {
    const historical = interactiveResult().snapshot!;
    expect(comparisonLabel(historical)).toBeNull();
    expect(periodLabel(historical)).toBe("Period 12 Oct 2026, 00:00 UTC — 19 Oct 2026, 00:00 UTC.");
    const preseason = { ...historical, comparison: "preseason_lineup_preview" as const, startsAt: "2026-10-20T00:00:00Z", endsAt: null };
    expect(comparisonLabel(preseason)).toBe("Preseason lineup preview");
    expect(periodLabel(preseason)).toBe("Publication closes 20 Oct 2026, 00:00 UTC.");
    const weekly = { ...historical, comparison: "weekly_lineup_preview" as const, startsAt: null, endsAt: null };
    expect(comparisonLabel(weekly)).toBe("Weekly lineup preview");
    expect(periodLabel(weekly)).toBe("Period dates unavailable.");
    expect(periodLabel({ ...preseason, startsAt: null })).toBe("Publication closure unavailable.");
  });
  it("supports eight choices, rejects blanks/duplicates/oversize, and never changes the draft", () => {
    const choices = Array.from({ length: 8 }, (_, i) => `Option ${i}`); expect(draftError("Pick?", choices)).toBeNull(); expect(choices).toHaveLength(8);
    expect(draftError("", choices)).not.toBeNull(); expect(draftError("Pick?", [" A ", "a"])).not.toBeNull(); expect(draftError("Pick?", ["", "B"])).not.toBeNull(); expect(draftError("x".repeat(2001), choices)).not.toBeNull(); expect(draftError("Pick?", [...choices, "ninth"])).not.toBeNull();
  });
});

describe("manual weekly publication boundary", () => {
  it("preserves the complete five-pick slate and independent model choice", () => {
    const value = published(), before = JSON.stringify(value);
    expect(readWeeklyPublishResponse(value)).toBe(value);
    expect(value.weekly.matchups[0].result!.choice).toBe("1");
    expect(value.weekly.matchups[0].result!.probabilities[0].choice).toBe("2");
    expect(JSON.stringify(value)).toBe(before);
  });
  it("rejects partial, stale, malformed and repeated-identity success payloads", () => {
    const partial = published(); partial.weekly.matchups[0].status = "unavailable"; partial.weekly.matchups[0].result = null;
    const stale = published(); stale.weekly.status = "stale";
    const date = published(); date.weekly.generatedAt = "2026-02-30T00:00:00Z";
    const count = published(); count.weekly.matchups.pop();
    const repeated = published(); repeated.weekly.matchups[1] = { ...repeated.weekly.matchups[0], matchupId: "different" };
    const probability = published(); probability.weekly.matchups[0].result!.probabilities[0].probability = NaN;
    const baseline = published(); baseline.weekly.matchups[0].baseline = { version: "fixture", label: "Fixture", pick: null, teamValues: [{ teamId: "1", value: NaN }] };
    for (const value of [partial, stale, date, count, repeated, probability, baseline]) expect(readWeeklyPublishResponse(value).status).toBe("unavailable");
  });
  it("posts only an empty same-origin body once and retains backend failure messages", async () => {
    const signal = new AbortController().signal;
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => published() }); vi.stubGlobal("fetch", fetcher);
    try {
      expect((await postWeeklyPreviews(signal)).status).toBe("ready");
      expect(fetcher).toHaveBeenCalledTimes(1);
      expect(fetcher).toHaveBeenCalledWith("/api/ai-decides/weekly", expect.objectContaining({ method: "POST", credentials: "same-origin", body: "{}", signal, cache: "no-store" }));
      fetcher.mockResolvedValue({ ok: false, json: async () => ({ status: "rate_limited", code: "budget", message: "Budget exhausted", retryAfterSeconds: 60 }) });
      expect(await postWeeklyPreviews(signal)).toEqual({ status: "rate_limited", code: "budget", message: "Budget exhausted", retryAfterSeconds: 60 });
      fetcher.mockResolvedValue({ ok: false, json: async () => published() });
      expect((await postWeeklyPreviews(signal)).status).toBe("unavailable");
    } finally { vi.unstubAllGlobals(); }
  });
});
