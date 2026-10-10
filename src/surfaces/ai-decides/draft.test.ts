import { describe, expect, it } from "vitest";
import { choiceKey, decisionDraft, draftContextLabel } from "./draft";
import { teams } from "./test/fixtures";

describe("explicit draft context", () => {
  it("keeps saved wins on the existing frozen matchup path", () => {
    expect(decisionDraft("Who wins?", ["Current One", "Current Two"], teams, ["1", "2"])).toEqual({ kind: "matchup", teamIds: ["1", "2"] });
  });
  it("preserves prompt, choice strings and index-to-roster mapping for recognized edited/edge drafts", () => {
    const draft = decisionDraft("  Which long-term roster?  ", [" current TWO ", "Ｃｕｒｒｅｎｔ Ｏｎｅ"], teams, null);
    expect(draft).toEqual({ kind: "league", prompt: "Which long-term roster?", choices: ["current TWO", "Ｃｕｒｒｅｎｔ Ｏｎｅ"], teamIds: ["2", "1"] });
    expect(draftContextLabel(draft)).toContain("Full-roster league context requested");
    expect(choiceKey(" Ｃｕｒｒｅｎｔ Ｏｎｅ ")).toBe("current one");
  });
  it.each([["Apple", "Banana"], ["Current", "Current Two"], ["1", "2"], ["Current One", "Current One"], ["Current One", "Current Two", "Third"], ["", "Current Two"]].map(choices => ({ choices })))("keeps unrecognized, duplicate, partial, numeric or extra choices text-only: $choices", ({ choices }) => {
    const draft = decisionDraft("Pick?", choices, teams, null);
    expect(draft.kind).toBe("custom");
    expect(draft).not.toHaveProperty("teamIds");
    expect(draftContextLabel(draft)).toContain("No league roster data will be supplied");
  });
  it("never picks an arbitrary team when names or IDs are ambiguous", () => {
    for (const identities of [[...teams, { id: "3", name: " CURRENT ONE " }], [...teams, { id: "1", name: "Current One" }], [{ id: "11", name: "Current One" }, teams[1]]]) {
      expect(decisionDraft("Pick?", ["Current One", "Current Two"], identities, null).kind).toBe("custom");
    }
  });
  it("adding and removing an extra choice recomputes context without keeping hidden IDs", () => {
    expect(decisionDraft("Pick?", ["Current One", "Current Two", "Other"], teams, null).kind).toBe("custom");
    expect(decisionDraft("Pick?", ["Current One", "Current Two"], teams, null).kind).toBe("league");
    expect(decisionDraft("", ["", ""], teams, null).kind).toBe("custom");
  });
});
