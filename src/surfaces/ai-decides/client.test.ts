import { describe, expect, it, vi } from "vitest";
import { AI_PROBABILITY_LABEL } from "@/domain/ai-decider";
import { draftError, percent, postDecision, readDecisionResponse } from "./client";

const ready = () => ({ status: "ready", result: { model: "historical-model", promptVersion: "frozen-v0", choice: "B", confidence: .21, probabilities: [{ choice: "A", probability: .3333333333 }, { choice: "B", probability: .3333333333 }, { choice: "C", probability: .3333333334 }], evidence: ["Prior completed-season inputs only"], probabilityLabel: AI_PROBABILITY_LABEL, snapshot: null } });
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
  it("supports eight choices, rejects blanks/duplicates/oversize, and never changes the draft", () => {
    const choices = Array.from({ length: 8 }, (_, i) => `Option ${i}`); expect(draftError("Pick?", choices)).toBeNull(); expect(choices).toHaveLength(8);
    expect(draftError("", choices)).not.toBeNull(); expect(draftError("Pick?", [" A ", "a"])).not.toBeNull(); expect(draftError("Pick?", ["", "B"])).not.toBeNull(); expect(draftError("x".repeat(2001), choices)).not.toBeNull(); expect(draftError("Pick?", [...choices, "ninth"])).not.toBeNull();
  });
});
