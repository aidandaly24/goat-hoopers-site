import { expect, it } from "vitest";
import { parseChoiceChallenge, publicChoiceStep, validateChoiceInput, validateDraftAssessment, type DraftChallenge, type LockedChoice, type PriceChallenge } from "./ranked-game-contract";
const source = { provider: "Synthetic fixture only", sourceUrl: "https://example.test/fixture", observedAtMs: 1, season: "test-only", version: "fixture-not-a-production-model", contentHash: "a".repeat(64) };
const draft: DraftChallenge = { gameId: "week-2-preview", formatVersion: "b".repeat(64), source, pools: Array.from({ length: 5 }, (_, i) => ({ teamId: String(i + 1), playerIds: [String(100 + i), "999"] })) };
const price: PriceChallenge = { gameId: "priced-in", formatVersion: "c".repeat(64), source, rounds: Array.from({ length: 5 }, (_, i) => ({ playerId: String(i + 1), lineCents: 4000, answerCents: 4200 })) };
it("accepts five distinct frozen teams or priced players and refuses partial/invalid private manifests", () => {
  expect(parseChoiceChallenge(draft)).toEqual(draft); expect(parseChoiceChallenge(price)).toEqual(price);
  expect(parseChoiceChallenge({ ...draft, pools: draft.pools.slice(0, 4) })).toBeNull();
  expect(parseChoiceChallenge({ ...draft, pools: Array(5).fill(draft.pools[0]) })).toBeNull();
  expect(parseChoiceChallenge({ ...price, rounds: [...price.rounds.slice(1), price.rounds[1]] })).toBeNull();
  expect(parseChoiceChallenge({ ...price, source: { ...source, sourceUrl: "https://user:secret@example.test" } })).toBeNull();
  expect(parseChoiceChallenge({ ...price, rounds: price.rounds.map(r => ({ ...r, answerCents: r.lineCents })) })).toBeNull();
});
it("enforces sequence, exact team/pool membership, unique players and immutable retry semantics", () => {
  const first = validateChoiceInput(draft, [], 0, { teamId: "1", playerId: "100" }); expect(first.status).toBe("accepted");
  if (first.status !== "accepted") throw Error("fixture invalid");
  expect(validateChoiceInput(draft, [], 1, { teamId: "2", playerId: "101" }).status).toBe("invalid");
  expect(validateChoiceInput(draft, [], 0, { teamId: "2", playerId: "101" }).status).toBe("invalid");
  expect(validateChoiceInput(draft, [first.choice], 0, { playerId: "100", teamId: "1" }).status).toBe("duplicate");
  expect(validateChoiceInput(draft, [first.choice], 0, { playerId: "999", teamId: "1" }).status).toBe("conflict");
  const duplicate: LockedChoice = { index: 0, input: { teamId: "1", playerId: "999" } };
  expect(validateChoiceInput(draft, [duplicate], 1, { teamId: "2", playerId: "999" }).status).toBe("invalid");
  expect(validateChoiceInput(draft, [{ ...first.choice, index: 3 }], 1, { teamId: "2", playerId: "101" }).status).toBe("invalid");
});
it("rejects injected identities, prices and scores and exposes only the current public step", () => {
  for (const extra of [{ score: 750 }, { answerCents: 4200 }, { userId: "other" }]) expect(validateChoiceInput(price, [], 0, { call: "over", ...extra }).status).toBe("invalid");
  expect(validateChoiceInput(price, [], 0, { call: "over" }).status).toBe("accepted");
  expect(publicChoiceStep(price, 0)).toEqual({ gameId: "priced-in", index: 0, playerId: "1", lineCents: 4000 });
  expect(JSON.stringify(publicChoiceStep(price, 0))).not.toMatch(/answer|source|4200/);
  expect(publicChoiceStep(draft, 0)).toEqual({ gameId: "week-2-preview", index: 0, teamId: "1", playerIds: ["100", "999"] });
  expect(publicChoiceStep(draft, 5)).toBeNull();
});
it.each(["over", "under"] as const)("stores a literal %s call and retries it idempotently", call => {
  const first = validateChoiceInput(price, [], 0, { call });
  expect(first).toEqual({ status: "accepted", choice: { index: 0, input: { call } } });
  if (first.status !== "accepted") throw Error("literal call rejected");
  expect(validateChoiceInput(price, [first.choice], 0, { call })).toEqual({ status: "duplicate", choice: first.choice });
  expect(validateChoiceInput(price, [first.choice], 0, { call: call === "over" ? "under" : "over" }).status).toBe("conflict");
});
it("rejects coercible and malformed price calls without accepting them as stored history", () => {
  for (const call of [["over"], [["under"]], [], null, true, 1, { toString: () => "over" }, "OVER", "over "]) {
    expect(validateChoiceInput(price, [], 0, { call }).status).toBe("invalid");
    const invalidHistory = [{ index: 0, input: { call } }] as unknown as LockedChoice[];
    expect(validateChoiceInput(price, invalidHistory, 1, { call: "under" }).status).toBe("invalid");
  }
});
it("never invents a draft score without complete choices and a matching agreed server assessment", () => {
  const picks = draft.pools.map((p, index) => ({ index, input: { teamId: p.teamId, playerId: p.playerIds[0] } }));
  expect(validateDraftAssessment(draft, picks, { status: "unavailable", reason: "missing_coverage" })).toBeNull();
  const assessment = { status: "scored" as const, wins: 50, losses: 32, modelVersion: source.version, sourceHash: source.contentHash };
  expect(validateDraftAssessment(draft, picks, assessment)).toMatchObject({ score: 50, metric: { kind: "modeled-record", wins: 50, losses: 32 } });
  expect(validateDraftAssessment(draft, picks.slice(0, 4), assessment)).toBeNull();
  expect(validateDraftAssessment(draft, picks, { ...assessment, modelVersion: "another-version" })).toBeNull();
  expect(validateDraftAssessment(draft, picks, { ...assessment, losses: 33 })).toBeNull();
});
