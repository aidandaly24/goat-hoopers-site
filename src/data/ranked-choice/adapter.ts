import "server-only";
import { createHash } from "node:crypto";
import { parseChoicePolicy, type ChoiceAssessment, type ChoiceChallenge, type ChoiceGameId, type ChoicePolicy, type LockedChoice } from "@/domain/arcade/ranked-game-contract";

/** Muse owns actual quote/production adapters. issue reads only already-produced
 * bounded snapshots; assess is pure, synchronous and makes no I/O/model calls. */
export type ChoiceAdapter = {
  gameId: ChoiceGameId; formatVersion: string; policy: ChoicePolicy;
  issue(): Promise<ChoiceChallenge | null>;
  assess(challenge: ChoiceChallenge, choices: readonly LockedChoice[]): ChoiceAssessment;
};
const canonical = (value: unknown): unknown => Array.isArray(value) ? value.map(canonical) : value && typeof value === "object"
  ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, v]) => [key, canonical(v)])) : value;
export const manifestHash = (challenge: ChoiceChallenge) => createHash("sha256").update(JSON.stringify(canonical(challenge))).digest("hex");
export function choiceRulesVersion(adapter: Pick<ChoiceAdapter, "gameId" | "formatVersion" | "policy">): string {
  const policy = parseChoicePolicy(adapter.policy);
  if (!policy || !/^[a-f0-9]{64}$/.test(adapter.formatVersion)) throw new Error("invalid_choice_adapter");
  return createHash("sha256").update(JSON.stringify({ gameId: adapter.gameId, formatVersion: adapter.formatVersion, policy })).digest("hex");
}

/** Deliberately empty until source receipts, scoring and per-game policies pass
 * joint review. Flags alone cannot synthesize an adapter or open either game. */
export function registeredChoiceAdapters(): readonly ChoiceAdapter[] { return []; }
