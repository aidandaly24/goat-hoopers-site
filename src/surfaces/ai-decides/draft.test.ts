import { describe, expect, it } from "vitest";
import { choiceKey, decisionDraft, draftContextLabel, previewIsIntact, recognizedTeamPair } from "./draft";
import { contextPreview, teams } from "./test/fixtures";

describe("explicit draft context", () => {
  it("never infers hidden context from team names alone", () => {
    expect(decisionDraft("Who wins?", ["Current One", "Current Two"])).toEqual({ kind: "custom", prompt: "Who wins?", choices: ["Current One", "Current Two"] });
  });
  it("sends the complete visible prompt and labels byte-for-byte, with exact ordered source proof", () => {
    const preview = contextPreview(), prompt = "  Who wins?\n\n" + preview.text, choices = [" current ONE ", "Ｃｕｒｒｅｎｔ Ｔｗｏ"];
    const draft = decisionDraft(prompt, choices, preview);
    expect(draft).toEqual({ kind: "league", prompt, choices, teamIds: ["1", "2"], contextDigest: preview.digest });
    expect(draftContextLabel(draft, preview)).toContain("Roster/stats are in this prompt");
    expect(choiceKey(" Ｃｕｒｒｅｎｔ Ｏｎｅ ")).toBe("current one");
  });
  it("question-only edits retain proof, while data edits, removal and appended notes become unverified custom", () => {
    const preview = contextPreview(), prompt = "Who wins?\n\n" + preview.text;
    expect(decisionDraft(prompt.replace("Who wins?", "Which roster long term?"), preview.choices, preview).kind).toBe("league");
    for (const edited of [prompt.replace("FPPG 20", "FPPG 99"), "Who wins?", prompt + "\nMy note", prompt.slice(0, -1)]) {
      const draft = decisionDraft(edited, preview.choices, preview);
      expect(draft).toEqual({ kind: "custom", prompt: edited, choices: preview.choices });
      expect(draftContextLabel(draft, preview)).toContain("not verified league evidence");
    }
  });
  it("does not truncate, reappend or normalize edited evidence or question whitespace", () => {
    const prompt = "  Custom notes\n" + "x".repeat(4000) + "\n  ", choices = [" Apple ", "Banana"];
    expect(decisionDraft(prompt, choices, contextPreview())).toEqual({ kind: "custom", prompt, choices });
  });
  it.each([["Apple", "Banana"], ["Current", "Current Two"], ["1", "2"], ["Current One", "Current One"], ["Current One", "Current Two", "Third"], ["", "Current Two"]].map(choices => ({ choices })))("keeps unrecognized, duplicate, partial, numeric or extra choices text-only: $choices", ({ choices }) => {
    const draft = decisionDraft("Pick?", choices);
    expect(draft.kind).toBe("custom");
    expect(draft).not.toHaveProperty("teamIds");
    expect(draftContextLabel(draft)).toContain("only this prompt and your choices are sent");
  });
  it("never picks an arbitrary team when names or IDs are ambiguous", () => {
    for (const identities of [[...teams, { id: "3", name: " CURRENT ONE " }], [...teams, { id: "1", name: "Current One" }], [{ id: "11", name: "Current One" }, teams[1]]]) {
      expect(recognizedTeamPair(["Current One", "Current Two"], identities)).toBeNull();
    }
  });
  it("choice reordering, add/remove, and Reset never attach context to the wrong options", () => {
    const preview = contextPreview(), prompt = "Pick?\n\n" + preview.text;
    expect(recognizedTeamPair(["Current Two", "Current One"], teams)).toEqual(["2", "1"]);
    for (const choices of [["Current Two", "Current One"], ["Current One", "Current Two", "Other"], ["Apple", "Banana"], ["", ""]]) expect(decisionDraft(prompt, choices, preview).kind).toBe("custom");
    expect(decisionDraft(prompt, preview.choices, preview).kind).toBe("league");
    expect(previewIsIntact("", ["", ""], null)).toBe(false);
  });
});
