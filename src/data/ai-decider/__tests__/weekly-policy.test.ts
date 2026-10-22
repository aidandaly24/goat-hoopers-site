import { describe, expect, it } from "vitest";
import { GOAT_LINEUP_POLICY } from "@/domain/ai-lineup-policy";
import type { AiSourceConfiguration, AiWeeklyInput } from "@/domain/ai-decider";
import type { AiStoredWeek } from "../store";
import { AI_ELEVEN_STARTER_MANIFEST, AI_LINEUP_PREVIEW_MANIFEST, cachedWeek, canonicalJson, completeWeeklySlate, currentGenerationManifest, manifestForInput, prepareWeeklySlate, validGenerationManifest, validWeeklyInput, weekHash, weekKey, weeklyDecision, weeklyReadiness, withSourceCompatibility } from "../weekly";
import legacy from "./legacy-weekly-fixtures.json";
import { loadAiDecidesData } from "../runtime";
import { harness } from "./fixtures";

// Captured from the unchanged production functions at main6994603 before this
// implementation. Inputs, prepared evidence, results and hashes are frozen.
const records = legacy.records as unknown as AiStoredWeek[];
function currentInput(observed = 11): AiWeeklyInput {
  const input = structuredClone(records[1].input);
  input.lineupPolicy = GOAT_LINEUP_POLICY.version;
  input.starterSlots = [...GOAT_LINEUP_POLICY.starterSlots];
  input.teams.forEach((team, n) => {
    const added = String(2000 + n);
    team.starters.push(added);
    team.players.push({ playerId: added, priorFantasyPpg: 20 + n, priorGames: 70 });
    team.players.forEach((p, index) => { p.priorFantasyPpg = index < observed ? 20 + n : null; p.priorGames = index < observed ? 70 : null; });
  });
  return input;
}
const configuration = (input: AiWeeklyInput): AiSourceConfiguration => ({ starterSlots: [...input.starterSlots], scoring: { ...input.scoring }, gameModeCode: input.preview?.gameModeCode ?? null });

describe("versioned eleven-starter lineup policy", () => {
  it.each(records)("reconstructs frozen schema$manifest.schemaVersion without changing its hash, prepared evidence or saved results", record => {
    const before = canonicalJson(record);
    expect(validGenerationManifest(record.manifest)).toBe(true);
    expect(currentGenerationManifest(record.manifest)).toBe(false);
    expect(validWeeklyInput(record.input)).toBe(true);
    expect(weekHash(record.input, record.manifest)).toBe(record.hash);
    expect(prepareWeeklySlate(record.input, legacy.now, record.manifest)).toEqual(record.slate);
    expect(cachedWeek(record, legacy.now)).toEqual(record.result);
    expect(canonicalJson(record)).toBe(before);
  });
  it.each([9, 10, 11])("supports all eleven source starters with %i observed productions", observed => {
    const input = currentInput(observed), slate = prepareWeeklySlate(input, legacy.now);
    expect(validWeeklyInput(input)).toBe(true); expect(weeklyReadiness(input, legacy.now)).toBeNull();
    expect(manifestForInput(input)).toEqual(AI_ELEVEN_STARTER_MANIFEST);
    expect(currentGenerationManifest(manifestForInput(input))).toBe(true);
    expect(slate.matchups.every(m => m.baseline?.teamValues.every(v => v.value !== null))).toBe(true);
    expect(slate.matchups[0].evidence.join(" ")).toContain(`${observed}/11`);
    expect(slate.matchups[0].baseline?.teamValues).toEqual([{ teamId: "6", value: 25 }, { teamId: "10", value: 29 }]);
    expect(slate.matchups[0].baseline?.label).toContain("Not an eleven-player total");
    const payload = weeklyDecision(input, slate, "f".repeat(64)).payload;
    expect(payload.questions).toHaveLength(5); expect(payload.questions[0].instructions).toContain("at least nine");
    expect(JSON.parse(payload.input).snapshot.teams[0].players).toHaveLength(11);
    expect(slate.snapshot?.scoringMode).toBe("unknown");
    expect(slate.matchups[0].evidence.join(" ")).toContain("raw code 1");
    expect(slate.matchups[0].evidence.join(" ")).toContain("no Lock-In or Game Pick strategy is assumed");
  });
  it("round-trips a new schema3 result with eleven-player evidence and its versioned hash", () => {
    const input = currentInput(9), slate = prepareWeeklySlate(input, legacy.now), manifest = manifestForInput(input);
    const results = slate.matchups.map((pair, index) => ({ ...structuredClone(records[1].result!.matchups[index].result!), evidence: [...pair.evidence], snapshot: slate.snapshot, model: manifest.model, promptVersion: manifest.promptVersion }));
    const result = completeWeeklySlate(input, slate, slate.matchups, results, input.capturedAt);
    const record = { key: weekKey(input), hash: weekHash(input), manifest, input, slate, result };
    expect(result.status).toBe("ready"); expect(cachedWeek(record, legacy.now)).toEqual(result);
    expect(record.hash).not.toBe(records[1].hash);
  });
  it("preserves the historical schema2 minimum8/10 independently of the new floor", () => {
    const input = structuredClone(records[1].input);
    input.teams.forEach(team => { team.players[1].priorFantasyPpg = null; team.players[1].priorGames = null; });
    const slate = prepareWeeklySlate(input, legacy.now);
    expect(slate.matchups.every(pair => pair.baseline?.teamValues.every(row => row.value !== null))).toBe(true);
    expect(slate.matchups[0].evidence.join(" ")).toContain("8/10");
  });
  it("refuses eight observed starters and any missing, duplicate, reserve or taxi starter without zero filling", () => {
    for (const change of ["coverage", "missing", "duplicate", "reserve", "taxi", "ownership"] as const) {
      const input = currentInput(change === "coverage" ? 8 : 11), team = input.teams[5];
      if (change === "missing") { team.starters.pop(); team.players.pop(); }
      if (change === "duplicate") team.starters[10] = team.starters[0];
      if (change === "reserve") team.reserve.push(team.starters[10]);
      if (change === "taxi") team.taxi.push(team.starters[10]);
      if (change === "ownership") team.eligibilityKnown = false;
      const pair = prepareWeeklySlate(input, legacy.now).matchups[0];
      expect(pair.baseline?.teamValues.every(v => v.value === null)).toBe(true);
      expect(pair.message).toContain("minimum 9/11");
    }
  });
  it("fails closed on unknown input/manifest versions and cross-version pairing", () => {
    const input = currentInput();
    expect(validWeeklyInput({ ...input, lineupPolicy: "future-policy" })).toBe(false);
    expect(validGenerationManifest({ ...AI_ELEVEN_STARTER_MANIFEST, schemaVersion: 4 })).toBe(false);
    expect(() => prepareWeeklySlate(input, legacy.now, AI_LINEUP_PREVIEW_MANIFEST)).toThrow("weekly_input");
    expect(() => prepareWeeklySlate(records[1].input, legacy.now, AI_ELEVEN_STARTER_MANIFEST)).toThrow("weekly_input");
    const untagged = { ...input }; delete untagged.lineupPolicy;
    expect(validWeeklyInput(untagged)).toBe(false); // Eleven players cannot enter the legacy decoder.
  });
  it("labels a saved ten-starter result against eleven source slots without rewriting history", () => {
    const record = records[1], before = canonicalJson(record);
    const saved = cachedWeek(record, legacy.now), derived = withSourceCompatibility(saved, record.input, configuration(currentInput()));
    expect(derived).toMatchObject({ status: "stale", sourceCompatibility: { status: "changed", currentWindow: true, savedStarterCount: 10, currentStarterCount: 11, savedPolicy: "legacy-ten-starters" } });
    expect(derived.sourceCompatibility?.message).toContain("not a current-settings prediction");
    expect(derived.snapshot).toEqual(saved.snapshot); expect(derived.matchups).toEqual(saved.matchups);
    expect(canonicalJson(record)).toBe(before); expect(saved.sourceCompatibility).toBeUndefined();
  });
  it.each(records)("annotates schema$manifest.schemaVersion through the public read without provider work or writes", async record => {
    const h = harness(), before = canonicalJson(record);
    h.persistence.weeks.set(record.key, structuredClone(record));
    const read = await loadAiDecidesData(h.runtime, async () => ({ leagueId: record.input.leagueId, season: record.input.season, week: record.input.week, phase: record.input.phase, matchups: record.input.matchups, configuration: configuration(currentInput()) }));
    expect(read.weekly).toMatchObject({ status: "stale", sourceCompatibility: { status: "changed", currentWindow: true, savedStarterCount: 10, currentStarterCount: 11 } });
    expect(read.weekly.matchups).toEqual(record.result!.matchups);
    expect(h.create).not.toHaveBeenCalled(); expect(canonicalJson(h.persistence.weeks.get(record.key))).toBe(before);
  });
  it("retains temporal staleness when a source warning is added after the source leg advances", () => {
    const record = records[1], expired = cachedWeek(record, legacy.now, 2);
    expect(expired.status).toBe("stale");
    const annotated = withSourceCompatibility(expired, record.input, configuration(currentInput()));
    expect(annotated).toMatchObject({ status: "stale", sourceCompatibility: { status: "changed", currentWindow: false } });
    expect(annotated.message).toBe(expired.message);
    expect(annotated.matchups).toEqual(record.result!.matchups);
  });
  it("checks scoring and raw mode separately, and treats absent source facts as unverified", () => {
    const input = currentInput(), slate = prepareWeeklySlate(input, legacy.now);
    expect(withSourceCompatibility(slate, input, configuration(input)).sourceCompatibility?.status).toBe("compatible");
    expect(withSourceCompatibility(slate, input, { ...configuration(input), scoring: { pts: .5 } }).sourceCompatibility?.message).toContain("scoring settings changed");
    expect(withSourceCompatibility(slate, input, { ...configuration(input), gameModeCode: 2 }).sourceCompatibility?.message).toContain("raw game-mode code changed");
    expect(withSourceCompatibility(slate, input).sourceCompatibility?.status).toBe("unverified");
    expect(withSourceCompatibility(slate, input, { ...configuration(input), starterSlots: null }).sourceCompatibility?.status).toBe("unverified");
  });
});
