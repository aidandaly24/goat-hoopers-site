import { createHash } from "node:crypto";
import { vi } from "vitest";
import type { AiWeeklyInput, AiWeeklyOutcome, AiWeeklySlate } from "@/domain/ai-decider";
import type { AiRuntime } from "../service";
import { AiDeciderStore, emptyBudgetState, type AiControl, type AiBudgetState, type AiIdentity, type AiLegacyIdentity, type AiPersistence, type AiStoredWeek } from "../store";
import type { DecisionPayload, DecisionsClient } from "../provider";
import { weekKey } from "../weekly";

export const NOW = Date.parse("2026-10-19T07:00:00Z");
export const TOKEN = "a".repeat(64);
export const USER = "00000000-0000-4000-8000-000000000001";
export const identity = (n = 1): AiLegacyIdentity => ({ kind: "legacy", userId: `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`, tokenHash: createHash("sha256").update(TOKEN).digest("hex") });
export const fingerprint = (n = 1) => createHash("sha256").update(`synthetic-${n}`).digest("hex");

/** Test-only atomic persistence, shared by independent stores to force CAS contention. */
export class TestPersistence implements AiPersistence {
  control: AiControl | null = { enabled: true, revision: 0, state: emptyBudgetState(NOW) };
  weeks = new Map<string, AiStoredWeek>();
  outcomes = new Map<string, AiWeeklyOutcome>();
  revoked = new Set<string>();
  conflicts = 0;
  async readControl() { return structuredClone(this.control); }
  async compareControl(revision: number, state: AiBudgetState, auth?: AiIdentity, disable = false) {
    if (!this.control || this.control.revision !== revision || (auth && (this.revoked.has(auth.userId) || !this.control.enabled))) { this.conflicts++; return false; }
    this.control = { enabled: disable ? false : this.control.enabled, revision: revision + 1, state: structuredClone(state) };
    return true;
  }
  async sealWeek(record: AiStoredWeek) {
    if (!this.weeks.has(record.key)) this.weeks.set(record.key, structuredClone(record));
    return structuredClone(this.weeks.get(record.key)!);
  }
  async getWeek(key: string) { return structuredClone(this.weeks.get(key) ?? null); }
  async completeWeek(key: string, hash: string, slate: AiWeeklySlate) {
    const record = this.weeks.get(key);
    if (!record || record.hash !== hash || record.result) return false;
    record.result = structuredClone(slate);
    return true;
  }
  async recordOutcome(key: string, outcome: AiWeeklyOutcome) {
    const id = `${key}:${outcome.matchupId}`;
    if (this.outcomes.has(id)) return false;
    this.outcomes.set(id, structuredClone(outcome));
    return true;
  }
}

export function weeklyInput(): AiWeeklyInput {
  return {
    leagueId: "1387473752807190528", season: "2026", week: 1, capturedAt: new Date(NOW).toISOString(), cutoffAt: "2026-10-19T12:00:00Z", startsAt: "2026-10-20T00:00:00Z", endsAt: "2026-10-27T00:00:00Z", phase: "regular", scoringMode: "lock_in", scoring: { pts: 1 }, starterSlots: ["PG", "SG", "G", "SF", "PF", "F", "C", "UTIL", "UTIL", "UTIL"], statsSeason: "2025", statsAvailableAt: "2026-07-01T00:00:00Z",
    matchups: [["6", "10"], ["2", "8"], ["3", "4"], ["1", "5"], ["7", "9"]].map((p, i) => ({ matchupId: String(i + 1), teamIds: p as [string, string] })),
    teams: Array.from({ length: 10 }, (_, n) => ({ teamId: String(n + 1), starters: Array.from({ length: 10 }, (_, i) => String(1000 + n * 10 + i)), reserve: [], taxi: [], eligibilityKnown: true, players: Array.from({ length: 10 }, (_, i) => ({ playerId: String(1000 + n * 10 + i), priorFantasyPpg: 20 + n, priorGames: 70 })) })),
  };
}

export function providerAnswer(payload: DecisionPayload, inputTokens = 100) {
  return { model: "gpt-6-luna", answers: payload.questions.map(q => ({ type: "choice", name: q.name, choice: "c1", confidence: 0.65, probabilities: q.choices.map((c, i) => ({ value: c.value, probability: i === 1 ? 0.65 : 0.35 / (q.choices.length - 1) })) })), usage: { input_tokens: inputTokens, output_tokens: 0, total_tokens: inputTokens } };
}
export function harness() {
  const persistence = new TestPersistence();
  let time = NOW;
  const create = vi.fn<DecisionsClient["create"]>(async (payload: DecisionPayload) => providerAnswer(payload));
  const getSessionUser = vi.fn<NonNullable<AiRuntime["sessions"]>["getSessionUser"]>(async () => ({ user: { id: USER, teamId: "1", displayName: "Synthetic manager", createdAt: new Date(NOW) }, expiresAt: new Date(NOW + 86400000) }));
  const runtime: AiRuntime = { enabled: true, client: { create }, store: new AiDeciderStore(persistence), sessions: { getSessionUser }, now: () => time, getWeekKey: async () => weekKey(weeklyInput()) };
  return { persistence, runtime, create, getSessionUser, setTime: (t: number) => { time = t; } };
}
