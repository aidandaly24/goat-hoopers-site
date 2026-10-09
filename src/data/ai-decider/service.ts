import "server-only";
import { createHash } from "node:crypto";
import type { AiDecideRequest, AiDecideResponse, AiDecisionResult, AiWeeklyInput, AiWeeklySlate } from "@/domain/ai-decider";
import type { GameStore } from "../arcade";
import { AI_LIMITS, parseAiRequest, teamIdValid, uuidValid } from "./validation";
import { callWithTimeout, customDecision, decodeDecision, inputTokenReservation, type DecisionsClient, type DecisionPayload, type DecisionSpec } from "./provider";
import { AiDeciderStore, type AiIdentity, type AiStoredWeek } from "./store";
import { cachedWeek, canonicalJson, preparePlaygroundMatchup, prepareWeeklySlate, validWeeklyInput, weekHash, weekKey, weeklyDecision } from "./weekly";
import { aiDataDeadline } from "./deadline";

export type AiRuntime = {
  enabled: boolean;
  client: DecisionsClient | null;
  store: AiDeciderStore | null;
  sessions: Pick<GameStore, "getSessionUser"> | null;
  now: () => number;
  getWeekKey: () => Promise<string>;
  timeoutMs?: number;
};
export const failure = (status: Exclude<AiDecideResponse["status"], "ready">, code: string, message: string, retryAfterSeconds?: number): AiDecideResponse => ({ status, code, message, ...(retryAfterSeconds === undefined ? {} : { retryAfterSeconds }) });

/** The existing session store is the authority; cookies/body never supply user IDs. */
export async function resolveAiIdentity(token: string | undefined, runtime: AiRuntime): Promise<AiIdentity | null> {
  if (!token || !/^[a-f0-9]{64}$/.test(token) || !runtime.sessions) return null;
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const record = await aiDataDeadline(runtime.sessions.getSessionUser(tokenHash));
  if (!record || !uuidValid(record.user.id) || !teamIdValid(record.user.teamId) || !(record.expiresAt instanceof Date) || !Number.isFinite(record.expiresAt.getTime()) || record.expiresAt.getTime() <= runtime.now()) return null;
  return { userId: record.user.id, tokenHash };
}

export async function availability(runtime: AiRuntime): Promise<{ status: "available" | "unavailable"; code: string; message: string }> {
  if (!runtime.enabled) return { status: "unavailable", code: "disabled", message: "AI Decides is switched off. You can still build a draft." };
  if (!runtime.client) return { status: "unavailable", code: "provider_unconfigured", message: "AI Decides is not configured yet. You can still build a draft." };
  try {
    if (!runtime.store || !(await runtime.store.available())) return { status: "unavailable", code: "disabled", message: "AI Decides is switched off. You can still build a draft." };
    return { status: "available", code: "available", message: "Sign in to run a decision. Usage limits apply." };
  } catch { return { status: "unavailable", code: "state_unavailable", message: "AI Decides usage controls are unavailable. Try later." }; }
}

async function evaluate(runtime: AiRuntime, identity: AiIdentity, payload: DecisionPayload, specs: DecisionSpec[], fingerprint: string, maxTokens: number, shared = false): Promise<{ results: (AiDecisionResult | null)[] } | AiDecideResponse> {
  if (!runtime.client || !runtime.store) return failure("unavailable", "provider_unconfigured", "AI Decides is not configured yet.");
  let reserved: number;
  try { reserved = inputTokenReservation(payload, maxTokens); } catch { return failure("invalid", "input_limit", "This request exceeds the input budget. Shorten the prompt or choices."); }
  let leaseId: string;
  try {
    const reservation = await runtime.store.reserve(identity, fingerprint, reserved, runtime.now(), shared);
    if (reservation.status === "disabled") return failure("unavailable", "disabled", "AI Decides is switched off.");
    if (reservation.status === "rate_limited") return failure("rate_limited", "usage_limit", "The user or shared daily usage budget is exhausted.", reservation.retryAfterSeconds);
    if (reservation.status === "busy" || reservation.status === "duplicate") return failure("busy", reservation.status, reservation.status === "duplicate" ? "This request was recently submitted. Wait before running it again." : "A decision is already running. Try again shortly.", reservation.retryAfterSeconds);
    if (reservation.status !== "reserved") return failure("unavailable", "state_unavailable", "The usage reservation could not be validated.");
    leaseId = reservation.leaseId;
  } catch { return failure("unavailable", "state_unavailable", "AI Decides usage controls are unavailable. Try later."); }

  let decoded: ReturnType<typeof decodeDecision> | null = null;
  let errorCode: string | null = null;
  try { decoded = decodeDecision(await callWithTimeout(runtime.client, payload, runtime.timeoutMs), specs); }
  catch (e) { errorCode = e instanceof Error && e.message === "provider_timeout" ? "provider_timeout" : "provider_unavailable"; }
  try { await runtime.store.finish(leaseId, decoded?.inputTokens ?? null, errorCode !== null || decoded?.results.some(r => r === null) === true, errorCode === "provider_timeout", runtime.now()); }
  catch { return failure("unavailable", "state_unavailable", "The decision could not be safely recorded. Try later."); }
  if (decoded && decoded.inputTokens > reserved) return failure("unavailable", "usage_overrun", "The input accounting guard stopped AI Decides. Review is required.");
  if (errorCode === "provider_timeout") return failure("timeout", "provider_timeout", "The decision timed out. Its usage reservation remains counted.");
  if (!decoded) return failure("unavailable", "provider_unavailable", "The decision provider is unavailable or returned an invalid result.");
  return { results: decoded.results };
}

/** Safe entry point for interactive runs; accepts only our application schema. */
export async function runAiDecision(raw: unknown, token: string | undefined, runtime: AiRuntime): Promise<AiDecideResponse> {
  const request = parseAiRequest(raw);
  if (!request) return failure("invalid", "invalid_request", "Choose 2–8 distinct options and a prompt up to 2,000 characters.");
  const state = await availability(runtime);
  if (state.status === "unavailable") return failure("unavailable", state.code, state.message);
  let identity: AiIdentity | null;
  try { identity = await resolveAiIdentity(token, runtime); } catch { return failure("unavailable", "session_unavailable", "Your session could not be validated. Try later."); }
  if (!identity) return failure("unauthenticated", "sign_in_required", "Sign in before running a decision. You can build a draft without signing in.");
  const safety = createHash("sha256").update(`goat-ai:${identity.userId}`).digest("hex");
  let decision: { payload: DecisionPayload; specs: DecisionSpec[] };
  if (request.kind === "custom") decision = customDecision(request.prompt, request.choices, safety);
  else {
    try {
      const record = await runtime.store!.persistence.getWeek(await runtime.getWeekKey());
      if (!record) return failure("unavailable", "weekly_not_ready", "A verified weekly input snapshot has not been prepared yet.");
      const slate = cachedWeek(record, runtime.now());
      if (slate.status === "stale" || runtime.now() >= Date.parse(record.input.startsAt)) return failure("unavailable", "weekly_closed", "This weekly prediction window has closed.");
      const pairing = preparePlaygroundMatchup(record.input, request.teamIds, runtime.now());
      if (!pairing.baseline || !pairing.baseline.teamValues.every(v => v.value !== null)) return failure("unavailable", "matchup_not_ready", pairing.message);
      const selected: AiWeeklySlate = { ...slate, matchups: [pairing] };
      decision = weeklyDecision(record.input, selected, safety);
    } catch { return failure("unavailable", "weekly_not_ready", "The weekly snapshot could not be validated."); }
  }
  const fingerprint = createHash("sha256").update(canonicalJson({ request, payload: decision.payload })).digest("hex");
  const response = await evaluate(runtime, identity, decision.payload, decision.specs, fingerprint, AI_LIMITS.inputTokens);
  if (!("results" in response)) return response;
  const result = response.results[0];
  return result ? { status: "ready", result } : failure("refused", "provider_refused", "The model declined this decision. Try a different request.");
}

/** Explicit pre-week operation; no page/API GET calls it. Uses the same paid-call guards. */
export async function generateWeeklyPicks(input: AiWeeklyInput, token: string | undefined, runtime: AiRuntime): Promise<AiWeeklySlate | AiDecideResponse> {
  if (!validWeeklyInput(input)) return failure("invalid", "weekly_input", "Weekly inputs are incomplete or invalid.");
  const prepared = prepareWeeklySlate(input, runtime.now());
  if (runtime.now() > Date.parse(input.cutoffAt) || runtime.now() >= Date.parse(input.startsAt)) return failure("unavailable", "weekly_closed", "A new snapshot must be sealed by its reviewed pre-week cutoff.");
  if (!runtime.store) return failure("unavailable", "state_unavailable", "The weekly store is unavailable.");
  const state = await availability(runtime);
  if (state.status === "unavailable") return failure("unavailable", state.code, state.message);
  let identity: AiIdentity | null;
  try { identity = await resolveAiIdentity(token, runtime); } catch { return failure("unavailable", "session_unavailable", "Your session could not be validated."); }
  if (!identity) return failure("unauthenticated", "sign_in_required", "A validated manager session is required.");
  const candidate: AiStoredWeek = { key: weekKey(input), hash: weekHash(input), input: structuredClone(input), slate: prepared, result: null };
  let record: AiStoredWeek;
  try {
    record = await runtime.store.persistence.sealWeek(candidate);
    if (record.hash !== candidate.hash) return failure("unavailable", "snapshot_conflict", "This week already has an immutable input snapshot.");
    const cached = cachedWeek(record, runtime.now());
    if (record.result) return cached;
  } catch { return failure("unavailable", "state_unavailable", "The weekly snapshot could not be safely sealed."); }
  const safety = createHash("sha256").update(`goat-ai:${identity.userId}`).digest("hex");
  const decision = weeklyDecision(record.input, record.slate, safety);
  let completed = structuredClone(record.slate);
  if (decision.specs.length > 0) {
    const fingerprint = createHash("sha256").update(`weekly:${record.key}:${record.hash}`).digest("hex");
    const response = await evaluate(runtime, identity, decision.payload, decision.specs, fingerprint, AI_LIMITS.weeklyInputTokens, true);
    if (!("results" in response)) return response;
    const generatedAt = new Date(runtime.now()).toISOString();
    if (runtime.now() >= Date.parse(input.startsAt)) return failure("unavailable", "weekly_closed", "Generation completed after the prediction window closed.");
    completed = { ...completed, generatedAt, matchups: completed.matchups.map(m => {
      const n = decision.eligible.findIndex(e => e.matchupId === m.matchupId);
      const result = n < 0 ? null : response.results[n];
      return result ? { ...m, status: "ready", result, message: "Cached experimental AI pick, based on the frozen supplied evidence." } : { ...m, message: n < 0 ? m.message : "The model declined this matchup." };
    }) };
    completed.status = completed.matchups.every(m => m.status === "ready") ? "ready" : "unavailable";
    completed.message = completed.status === "ready" ? "Five cached experimental picks. Model probabilities are not calibrated sports odds." : "Some matchups are unavailable; missing evidence is not replaced with a guess.";
  }
  try {
    await runtime.store.persistence.completeWeek(record.key, record.hash, completed);
    const final = await runtime.store.persistence.getWeek(record.key);
    if (!final?.result) throw new Error("state_unavailable");
    return cachedWeek(final, runtime.now());
  } catch { return failure("unavailable", "state_unavailable", "The weekly results could not be safely recorded."); }
}

// Keep this import useful to callers inspecting the application draft contract.
export type { AiDecideRequest };
