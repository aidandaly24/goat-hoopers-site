import "server-only";
import { createHash } from "node:crypto";
import type { AiDecideRequest, AiDecideResponse, AiDecisionResult, AiWeeklyInput, AiWeeklySlate, AiLeagueRosterInput } from "@/domain/ai-decider";
import type { GameStore } from "../arcade";
import type { getProviderIdentity } from "../friends-auth/runtime";
import { AI_LIMITS, parseAiRequest, teamIdValid, uuidValid } from "./validation";
import { callWithTimeout, customDecision, decodeDecision, inputTokenReservation, readDecisionUsage, type DecisionsClient, type DecisionPayload, type DecisionSpec } from "./provider";
import { AiDeciderStore, validAiIdentity, type AiIdentity, type AiStoredWeek, type AiWeeklyJobIdentity } from "./store";
import { cachedWeek, canonicalJson, currentGenerationManifest, manifestForInput, preparePlaygroundMatchup, prepareWeeklySlate, validWeeklyInput, weekHash, weekKey, weeklyDecision, weeklyReadiness } from "./weekly";
import { aiDataDeadline } from "./deadline";
import { leagueRosterDecision } from "./roster-context";

export type AiRuntime = {
  enabled: boolean;
  client: DecisionsClient | null;
  store: AiDeciderStore | null;
  sessions: Pick<GameStore, "getSessionUser"> | null;
  /** Present only for the server-selected provider cutover; failure never uses legacy auth. */
  providerSession?: () => ReturnType<typeof getProviderIdentity>;
  now: () => number;
  getWeekKey: () => Promise<string>;
  /** Only explicit authenticated league requests load current roster evidence. */
  getLeagueContext?: (teamIds: [string, string]) => Promise<AiLeagueRosterInput>;
  /** Fresh public NBA state rechecks the source-leg publication boundary. */
  getSourceState?: () => Promise<{ season: string; leg: number; phase: string }>;
  weeklyOperator?: AiWeeklyJobIdentity | null;
  timeoutMs?: number;
};
export const failure = (status: Exclude<AiDecideResponse["status"], "ready">, code: string, message: string, retryAfterSeconds?: number): Exclude<AiDecideResponse, { status: "ready" }> => ({ status, code, message, ...(retryAfterSeconds === undefined ? {} : { retryAfterSeconds }) });

async function predictionOpen(input: AiWeeklyInput, runtime: AiRuntime): Promise<boolean> {
  if (!input.preview) return !!input.startsAt && runtime.now() < Date.parse(input.startsAt);
  if (!runtime.getSourceState) return false;
  const source = await aiDataDeadline(runtime.getSourceState(), 3000);
  return source.season === input.season && source.phase === input.phase && Number.isSafeInteger(source.leg) && source.leg === input.preview.sourceLeg && (!input.startsAt || runtime.now() < Date.parse(input.startsAt));
}

/** Server-selected session verifier is the authority; request bodies never supply identity. */
export async function resolveAiIdentity(token: string | undefined, runtime: AiRuntime): Promise<AiIdentity | null> {
  if (runtime.providerSession) {
    const record = await aiDataDeadline(runtime.providerSession());
    if (!record || !teamIdValid(record.user.teamId) || !(record.expiresAt instanceof Date) || !Number.isFinite(record.expiresAt.getTime()) || record.expiresAt.getTime() <= runtime.now()) return null;
    const identity: AiIdentity = { kind: "friends", userId: record.user.id, sessionId: record.sessionId, subject: record.subject };
    return validAiIdentity(identity) ? identity : null;
  }
  if (!token || !/^[a-f0-9]{64}$/.test(token) || !runtime.sessions) return null;
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const record = await aiDataDeadline(runtime.sessions.getSessionUser(tokenHash));
  if (!record || !uuidValid(record.user.id) || !teamIdValid(record.user.teamId) || !(record.expiresAt instanceof Date) || !Number.isFinite(record.expiresAt.getTime()) || record.expiresAt.getTime() <= runtime.now()) return null;
  return { kind: "legacy", userId: record.user.id, tokenHash };
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
    if (reservation.status === "rate_limited") return failure("rate_limited", "global_token_budget", "This request would exceed the shared daily token budget. It resets at 00:00 UTC.", reservation.retryAfterSeconds);
    if (reservation.status === "burst_limited") return failure("rate_limited", "minute_burst", "This account has started 20 requests in the last minute. Try again when the oldest request leaves that window.", reservation.retryAfterSeconds);
    if (reservation.status === "busy" || reservation.status === "duplicate") return failure("busy", reservation.status, reservation.status === "duplicate" ? "An identical request still has an active reservation. Wait for it to finish or expire." : "The active request limit is reached. Wait for a decision to finish or its reservation to expire.", reservation.retryAfterSeconds);
    if (reservation.status !== "reserved") return failure("unavailable", "state_unavailable", "The usage reservation could not be validated.");
    leaseId = reservation.leaseId;
  } catch { return failure("unavailable", "state_unavailable", "AI Decides usage controls are unavailable. Try later."); }

  let decoded: ReturnType<typeof decodeDecision> | null = null;
  let actualTokens: number | null = null;
  let errorCode: string | null = null;
  try {
    const raw = await callWithTimeout(runtime.client, payload, runtime.timeoutMs);
    actualTokens = readDecisionUsage(raw);
    if (actualTokens === null) errorCode = "usage_unknown";
    else decoded = decodeDecision(raw, specs);
  }
  catch (e) { errorCode = e instanceof Error && e.message === "provider_timeout" ? "provider_timeout" : "provider_unavailable"; }
  try { await runtime.store.finish(leaseId, actualTokens, errorCode !== null || decoded?.results.some(r => r === null) === true, actualTokens === null, runtime.now()); }
  catch { return failure("unavailable", "state_unavailable", "The decision could not be safely recorded. Try later."); }
  if (actualTokens !== null && actualTokens > reserved) return failure("unavailable", "usage_overrun", "The input accounting guard stopped AI Decides. Review is required.");
  if (errorCode === "provider_timeout") return failure("timeout", "provider_timeout", "The decision timed out. Its usage reservation remains counted.");
  if (errorCode === "usage_unknown") return failure("unavailable", "usage_unknown", "Provider usage could not be validated. Its full reservation and lease remain counted.");
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
  else if (request.kind === "league") {
    try {
      if (!runtime.getLeagueContext) throw new Error("league_context");
      const context = await aiDataDeadline(runtime.getLeagueContext(request.teamIds), 3000);
      decision = leagueRosterDecision(request, context, runtime.now(), safety);
    } catch (e) {
      if (e instanceof Error && e.message === "league_choices_changed") return failure("invalid", "league_choices_changed", "Team names changed or do not match the selected roster IDs. Refresh the teams and check your choices.");
      return failure("unavailable", "league_context_unavailable", "The selected teams' roster evidence could not be validated. No decision was run; refresh or try later.");
    }
  }
  else {
    try {
      const record = await runtime.store!.persistence.getWeek(await runtime.getWeekKey());
      if (!record) return failure("unavailable", "weekly_not_ready", "A verified weekly input snapshot has not been prepared yet.");
      const slate = cachedWeek(record, runtime.now());
      if (slate.status === "stale" || !(await predictionOpen(record.input, runtime))) return failure("unavailable", "weekly_closed", "This weekly prediction window has closed.");
      if (!currentGenerationManifest(record.manifest)) return failure("unavailable", "weekly_policy", "This snapshot uses an earlier generation policy. Its cached picks remain available.");
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
  let identity: AiIdentity | null;
  try { identity = await resolveAiIdentity(token, runtime); } catch { return failure("unavailable", "session_unavailable", "Your session could not be validated."); }
  if (!identity) return failure("unauthenticated", "sign_in_required", "A validated manager session is required.");
  return generateWeeklyPicksAsIdentity(input, identity, runtime);
}

/** Server operator seam. The unchanged atomic budget CAS revalidates this exact session. */
export async function generateWeeklyPicksAsIdentity(input: AiWeeklyInput, identity: AiIdentity, runtime: AiRuntime): Promise<AiWeeklySlate | AiDecideResponse> {
  if (!validAiIdentity(identity)) return failure("unauthenticated", "sign_in_required", "A validated manager session is required.");
  if (!validWeeklyInput(input)) return failure("invalid", "weekly_input", "Weekly inputs are incomplete or invalid.");
  const prepared = prepareWeeklySlate(input, runtime.now());
  const readiness = weeklyReadiness(input, runtime.now());
  if (readiness) return failure("unavailable", "weekly_not_ready", readiness);
  if (!prepared.matchups.some(m => m.baseline?.teamValues.every(v => v.value !== null))) return failure("unavailable", "weekly_not_ready", "No matchups have complete eligible starter production. The week has not been sealed.");
  try {
    if ((!input.preview && runtime.now() > Date.parse(input.cutoffAt)) || !(await predictionOpen(input, runtime))) return failure("unavailable", "weekly_closed", "A new snapshot must be sealed before its prediction window closes.");
  } catch { return failure("unavailable", "source_unavailable", "The publication boundary could not be validated."); }
  if (!runtime.store) return failure("unavailable", "state_unavailable", "The weekly store is unavailable.");
  const state = await availability(runtime);
  if (state.status === "unavailable") return failure("unavailable", state.code, state.message);
  const safety = createHash("sha256").update(`goat-ai:${identity.userId}`).digest("hex");
  // Reject oversized preparation before consuming the immutable week key.
  try { inputTokenReservation(weeklyDecision(input, prepared, safety).payload, AI_LIMITS.weeklyInputTokens); }
  catch { return failure("invalid", "input_limit", "This weekly snapshot exceeds the bounded input budget. The week remains unsealed."); }
  const candidate: AiStoredWeek = { key: weekKey(input), hash: weekHash(input), manifest: structuredClone(manifestForInput(input)), input: structuredClone(input), slate: prepared, result: null };
  let record: AiStoredWeek;
  try {
    record = await runtime.store.persistence.sealWeek(candidate);
    if (record.hash !== candidate.hash) return failure("unavailable", "snapshot_conflict", "This week already has an immutable input snapshot.");
    const cached = cachedWeek(record, runtime.now());
    if (record.result) return cached;
  } catch { return failure("unavailable", "state_unavailable", "The weekly snapshot could not be safely sealed."); }
  const decision = weeklyDecision(record.input, record.slate, safety);
  let completed = structuredClone(record.slate);
  if (decision.specs.length > 0) {
    const fingerprint = createHash("sha256").update(`weekly:${record.key}:${record.hash}`).digest("hex");
    const response = await evaluate(runtime, identity, decision.payload, decision.specs, fingerprint, AI_LIMITS.weeklyInputTokens, true);
    if (!("results" in response)) return response;
    const generatedAt = new Date(runtime.now()).toISOString();
    try {
      if (!(await predictionOpen(input, runtime))) return failure("unavailable", "weekly_closed", "Generation completed after the prediction window closed.");
    } catch { return failure("unavailable", "source_unavailable", "The completed pick's publication boundary could not be validated."); }
    completed = { ...completed, generatedAt, matchups: completed.matchups.map(m => {
      const n = decision.eligible.findIndex(e => e.matchupId === m.matchupId);
      const result = n < 0 ? null : response.results[n];
      return result ? { ...m, status: "ready", result, message: input.preview ? "Saved experimental lineup-strength preview; missing facts remain unknown." : "Cached experimental AI pick, based on the frozen supplied evidence." } : { ...m, message: n < 0 ? m.message : "The model declined this matchup." };
    }) };
    completed.status = completed.matchups.every(m => m.status === "ready") ? "ready" : "unavailable";
    completed.message = completed.status === "ready" ? (input.preview ? `${input.phase === "pre" ? "Preseason" : "Upcoming-week"} lineup previews: five saved picks with explicit prior-stat coverage. Model probabilities are not calibrated sports odds.` : "Five cached experimental picks. Model probabilities are not calibrated sports odds.") : "Some matchups are unavailable; missing evidence is not replaced with a guess.";
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
