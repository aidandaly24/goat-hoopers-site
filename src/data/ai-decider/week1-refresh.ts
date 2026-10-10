import "server-only";
import { createHash } from "node:crypto";
import type { AiWeeklyPublishResponse } from "@/domain/ai-decider";
import { aiDataDeadline } from "./deadline";
import { publicationSources, type AiPublicationSources } from "./publication";
import { availability, evaluate, failure, predictionOpen, resolveAiIdentity, type AiRuntime } from "./service";
import { validAiIdentity, type AiIdentity, type AiStoredWeek } from "./store";
import { AI_LIMITS, exactKeys, isRecord, readAiBody } from "./validation";
import { inputTokenReservation } from "./provider";
import { WEEK1_REFRESH_KEY } from "./refresh-policy";
import { cachedWeek, canonicalJson, completeWeeklySlate, manifestForInput, prepareWeeklySlate, validWeeklyInput, weekHash, weekKey, weeklyDecision, weeklyReadiness } from "./weekly";

/** Original stays public until a separately sealed, complete five-pair replacement. */
export async function refreshWeek1(identity: AiIdentity, runtime: AiRuntime, sources: AiPublicationSources = publicationSources): Promise<AiWeeklyPublishResponse> {
  if (!runtime.week1Refresh) return failure("unavailable", "refresh_disabled", "The one-time Week 1 refresh is switched off.");
  if (!validAiIdentity(identity) || identity.kind === "weekly_job") return failure("unauthenticated", "sign_in_required", "A current manager session is required for this one-time refresh.");
  const state = await availability(runtime);
  if (state.status !== "available") return failure("unavailable", state.code, state.message);
  try {
    const persistence = runtime.store!.persistence;
    const original = await persistence.getOriginalWeek(WEEK1_REFRESH_KEY);
    if (!original?.result || original.hash !== runtime.week1Refresh.originalHash || cachedWeek(original, runtime.now()).status !== "ready") return failure("unavailable", "refresh_original_changed", "The reviewed original Week 1 record is unavailable. No refresh was started.");
    const previous = await persistence.getWeekRefresh();
    if (previous) return previous.result && cachedWeek(previous, runtime.now()).status === "ready"
      ? { status: "ready", weekly: cachedWeek(previous, runtime.now()) }
      : failure("unavailable", "refresh_sealed", "The one-time refresh has a sealed attempt. The original picks remain public; review is required, and no paid retry was started.");
    const context = await aiDataDeadline(sources.context(), 6000);
    if (weekKey(context) !== WEEK1_REFRESH_KEY || context.phase !== "pre" || context.leg !== 0) return failure("unavailable", "weekly_closed", "The reviewed preseason Week 1 refresh window is closed.");
    const input = await aiDataDeadline(sources.input(context), 10000);
    if (!validWeeklyInput(input) || !input.preview || weekKey(input) !== WEEK1_REFRESH_KEY || input.phase !== "pre" || input.preview.sourceLeg !== 0 || canonicalJson(input.matchups) !== canonicalJson(original.input.matchups)) return failure("unavailable", "weekly_input", "The source could not establish the same five Week 1 pairings.");
    const now = runtime.now(), reason = weeklyReadiness(input, now);
    if (reason || now - Date.parse(input.capturedAt) > 60000) return failure("unavailable", "weekly_not_ready", reason ?? "A fresh input capture is required.");
    const slate = prepareWeeklySlate(input, now);
    if (!slate.matchups.every(m => m.baseline?.teamValues.every(v => v.value !== null))) return failure("unavailable", "weekly_not_ready", "All five pairs need complete eligible lineups and at least 8/10 observed prior-season starters per team.");
    if (!(await predictionOpen(input, runtime))) return failure("unavailable", "weekly_closed", "The source changed before the refresh could be sealed.");
    const safety = createHash("sha256").update(`goat-ai:${identity.userId}`).digest("hex");
    const decision = weeklyDecision(input, slate, safety);
    try { inputTokenReservation(decision.payload, AI_LIMITS.weeklyInputTokens); }
    catch { return failure("invalid", "input_limit", "The complete five-pair snapshot exceeds the unchanged weekly input budget."); }
    const candidate: AiStoredWeek = { key: WEEK1_REFRESH_KEY, hash: weekHash(input), manifest: structuredClone(manifestForInput(input)), input: structuredClone(input), slate, result: null };
    // Only the INSERT winner may enter paid evaluation, even after a lease expires.
    if (!(await persistence.claimWeekRefresh(candidate, identity))) return failure("unavailable", "refresh_sealed", "The one-time attempt could not be claimed. Existing picks remain public; no paid retry was started.");
    const fingerprint = createHash("sha256").update(`week1-refresh:${candidate.hash}`).digest("hex");
    const response = await evaluate(runtime, identity, decision.payload, decision.specs, fingerprint, AI_LIMITS.weeklyInputTokens, true);
    if (!("results" in response)) return response.status === "ready" ? failure("unavailable", "publication_invalid", "The refresh result could not be validated.") : response;
    if (!(await predictionOpen(input, runtime))) return failure("unavailable", "weekly_closed", "Generation completed after the source window closed. Original picks remain public.");
    const completed = completeWeeklySlate(input, slate, decision.eligible, response.results, new Date(runtime.now()).toISOString());
    if (completed.status !== "ready") return failure("refused", "refresh_partial", "The model declined at least one pair. The original five picks remain public; the sealed attempt is retained without retry.");
    cachedWeek({ ...candidate, result: completed }, runtime.now());
    if (!(await persistence.completeWeekRefresh(candidate.hash, completed, identity))) return failure("unavailable", "state_unavailable", "The replacement could not be safely published. Original picks remain public.");
    const final = await persistence.getWeekRefresh();
    if (!final?.result) throw new Error("refresh_state");
    return { status: "ready", weekly: cachedWeek(final, runtime.now()) };
  } catch { return failure("unavailable", "refresh_unavailable", "The source or durable refresh state could not be validated. Existing picks are preserved; no automatic retry is made."); }
}

/** No cron, query parameters, arbitrary week, dates, facts or client identity. */
export async function handleAiWeek1RefreshPost(request: Request, token: string | undefined, runtime: AiRuntime, sources: AiPublicationSources = publicationSources): Promise<Response> {
  const respond = (body: AiWeeklyPublishResponse) => Response.json(body, { status: { ready: 200, invalid: 400, unauthenticated: 401, unavailable: 503, rate_limited: 429, busy: 409, refused: 422, timeout: 504 }[body.status], headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", ...(body.status !== "ready" && body.retryAfterSeconds !== undefined ? { "Retry-After": String(body.retryAfterSeconds) } : {}) } });
  if (request.headers.get("origin") !== new URL(request.url).origin || request.headers.get("sec-fetch-site") === "cross-site" || new URL(request.url).search) return respond(failure("invalid", "origin_required", "Refresh from this site's authenticated manager flow."));
  let raw: unknown;
  try { raw = await readAiBody(request, 1024); } catch { return respond(failure("invalid", "invalid_body", "Send a bounded empty JSON refresh request.")); }
  if (!isRecord(raw) || !exactKeys(raw, [])) return respond(failure("invalid", "invalid_request", "Send an empty request; the server fixes the one-time week and evidence."));
  try {
    const identity = await resolveAiIdentity(token, runtime);
    return respond(identity ? await refreshWeek1(identity, runtime, sources) : failure("unauthenticated", "sign_in_required", "Sign in before requesting the one-time refresh."));
  } catch { return respond(failure("unavailable", "session_unavailable", "The current manager session could not be validated.")); }
}
