import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import type { AiForecastRefreshResponse, AiForecastRevision, AiForecastState } from "@/domain/ai-decider";
import { aiDataDeadline } from "./deadline";
import { loadAiForecastContext, loadAiForecastInput, type AiForecastContext } from "./forecast-evidence";
import { buildForecastRevision, computeForecastTeamLine, forecastDecision, forecastEvidenceHash, forecastWeekUnderway, validForecastInput, validForecastRevision, type AiForecastInput } from "./forecast";
import { availability, evaluate, failure, resolveAiIdentity, type AiRuntime } from "./service";
import { validAiIdentity, type AiIdentity } from "./store";
import { AI_LIMITS, exactKeys, isRecord, readAiBody } from "./validation";
import { inputTokenReservation } from "./provider";
import { weekKey } from "./weekly";

export type AiForecastSources = {
  context(): Promise<AiForecastContext>;
  input(context: AiForecastContext): Promise<AiForecastInput>;
};
export const forecastSources: AiForecastSources = { context: () => loadAiForecastContext(), input: context => loadAiForecastInput(context) };

const unavailableState = (message: string): AiForecastState => ({ status: "unavailable", message, revision: null, revisionCount: 0 });

const readyState = (revision: AiForecastRevision, revisionCount: number): AiForecastState => {
  const declined = revision.matchups.filter(m => m.result === null).length;
  return {
    status: "ready",
    message: declined ? `In-season rolling forecast; the model declined ${declined} of ${revision.matchups.length} pairings in this revision. Locked and projected points are server-computed from evidence.` : "In-season rolling forecast: locked points are counted facts, projected remaining points are estimates.",
    revision,
    revisionCount,
  };
};

/** Public read: the week's current revision and the series size. Never generates. */
export async function loadAiForecastState(runtime: AiRuntime, key: string): Promise<AiForecastState> {
  if (!runtime.store) return unavailableState("The forecast store is unavailable.");
  const series = await runtime.store.persistence.getForecasts(key);
  if (series.length === 0) return unavailableState("No in-season forecast has been published for this week yet.");
  // Public selection goes through the recorded current pointer, never
  // insertion order: after evidence recurs (A → B → A) the pointer names
  // A again although B was inserted later, so the public read agrees
  // with what the refresh path considers current. A series with no
  // pointer recorded yet falls back to its latest revision; a pointer
  // naming no stored revision is corrupt and fails closed.
  const pointer = await runtime.store.persistence.getForecastCurrent(key);
  let current: AiForecastRevision | undefined;
  if (pointer) {
    current = pointer.weekKey === key ? series.find(r => r.revisionId === pointer.revisionId && r.evidenceHash === pointer.evidenceHash) : undefined;
    if (!current) return unavailableState("The stored forecast revision could not be validated.");
  } else {
    current = series[series.length - 1];
  }
  if (!validForecastRevision(current) || weekKey(current) !== key) return unavailableState("The stored forecast revision could not be validated.");
  return readyState(current, series.length);
}

/**
 * One refresh attempt. Identical evidence returns the stored revision
 * without provider spend (dedupe); a genuinely changed evidence state
 * appends exactly one new revision through the existing budget/lease
 * overlap protection, and a lost publication race converges on the
 * winner. Every outcome — dedupe hit included — re-observes the
 * resolved revision as the week's current selection, so the public
 * read through the pointer always agrees with this resolution.
 */
export async function refreshForecast(identity: AiIdentity, runtime: AiRuntime, sources: AiForecastSources = forecastSources): Promise<AiForecastRefreshResponse> {
  if (!validAiIdentity(identity)) return failure("unauthenticated", "sign_in_required", "A validated forecast identity is required.");
  const state = await availability(runtime);
  if (state.status !== "available") return failure("unavailable", state.code, state.message);
  try {
    const persistence = runtime.store!.persistence;
    if (identity.kind === "weekly_job" && !(await persistence.authorizeWeeklyOperator(identity))) return failure("unauthenticated", "operator_unavailable", "The configured weekly app identity is unavailable.");
    const context = await aiDataDeadline(sources.context(), 6000);
    const key = weekKey(context);
    const input = await aiDataDeadline(sources.input(context), 20000);
    if (!validForecastInput(input) || input.leagueId !== context.leagueId || input.season !== context.season || input.week !== context.week) return failure("unavailable", "forecast_input", "The live sources could not establish a valid in-season forecast input.");
    if (!forecastWeekUnderway(input)) return failure("unavailable", "forecast_not_started", "No starter has completed a game this week yet. The pregame slate owns the window before play begins.");
    const lines = input.teams.map(team => computeForecastTeamLine(team, input.capturedAt));
    const evidenceHash = forecastEvidenceHash(input);
    const observedAt = new Date(runtime.now()).toISOString();
    // Dedupe across the week's whole series, not just its latest
    // revision: evidence can recur (A → B → A), and the stored revision
    // for THIS evidence state is the ready result — never a later
    // revision computed from different evidence. The hit appends
    // nothing, but it DOES re-observe that revision as current: the
    // pointer moves back to it, so public reads present it too.
    const existing = await persistence.getForecastByEvidenceHash(key, evidenceHash);
    if (existing && validForecastRevision(existing) && weekKey(existing) === key) {
      if (!(await persistence.markForecastCurrent(key, existing.revisionId, existing.evidenceHash, observedAt))) return failure("unavailable", "forecast_unavailable", "The forecast revision could not be safely recorded.");
      const series = await persistence.getForecasts(key);
      return { status: "ready", forecast: readyState(existing, series.length) };
    }
    const safety = createHash("sha256").update(`goat-ai:${identity.userId}`).digest("hex");
    const decision = forecastDecision(input, lines, safety);
    try { inputTokenReservation(decision.payload, AI_LIMITS.weeklyInputTokens); }
    catch { return failure("invalid", "input_limit", "This forecast exceeds the bounded input budget. No revision was appended."); }
    const fingerprint = createHash("sha256").update(`forecast:${key}:${evidenceHash}`).digest("hex");
    const response = await evaluate(runtime, identity, decision.payload, decision.specs, fingerprint, AI_LIMITS.weeklyInputTokens, true);
    if (!("results" in response)) {
      if (response.status === "ready") return failure("unavailable", "forecast_unavailable", "The forecast evaluation could not be validated.");
      return response;
    }
    // Serialized publication: the append is a chain-head CAS — it lands
    // only on top of the predecessor the revision names. A concurrent
    // different-evidence refresh (cron vs manual is enough) can move
    // the head first; the loser re-reads the head, rebuilds on top of
    // it (the evaluation results are reused — no extra provider spend)
    // and retries, so the series stays one linear chain and the
    // pointer ends on the chain head. A concurrent same-evidence
    // refresh converges on the stored revision for this evidence.
    let predecessor = await persistence.getLatestForecast(key);
    for (let attempt = 0; attempt < 3; attempt++) {
      const revision = buildForecastRevision(input, lines, response.results, observedAt, predecessor && validForecastRevision(predecessor) ? predecessor.revisionId : null);
      if (await persistence.publishForecast(key, revision, observedAt)) {
        const stored = await persistence.getForecastByEvidenceHash(key, evidenceHash);
        if (stored && validForecastRevision(stored) && weekKey(stored) === key) {
          const series = await persistence.getForecasts(key);
          return { status: "ready", forecast: readyState(stored, series.length) };
        }
      }
      const stored = await persistence.getForecastByEvidenceHash(key, evidenceHash);
      if (stored && validForecastRevision(stored) && weekKey(stored) === key) {
        if (!(await persistence.markForecastCurrent(key, stored.revisionId, stored.evidenceHash, observedAt))) return failure("unavailable", "forecast_unavailable", "The forecast revision could not be safely recorded.");
        const series = await persistence.getForecasts(key);
        return { status: "ready", forecast: readyState(stored, series.length) };
      }
      predecessor = await persistence.getLatestForecast(key);
    }
    return failure("unavailable", "forecast_unavailable", "The forecast revision could not be safely recorded.");
  } catch { return failure("unavailable", "forecast_unavailable", "The live forecast sources or durable controls are unavailable."); }
}

function forecastResponse(body: AiForecastRefreshResponse): Response {
  const codes = { ready: 200, invalid: 400, unauthenticated: 401, unavailable: 503, rate_limited: 429, busy: 409, refused: 422, timeout: 504 };
  return Response.json(body, { status: codes[body.status], headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", ...(body.status !== "ready" && body.retryAfterSeconds !== undefined ? { "Retry-After": String(body.retryAfterSeconds) } : {}) } });
}

/** Manual operator request contains no facts, dates, prompt, credentials or provider options. */
export async function handleAiForecastPost(request: Request, token: string | undefined, runtime: AiRuntime, sources: AiForecastSources = forecastSources): Promise<Response> {
  if (request.headers.get("origin") !== new URL(request.url).origin || request.headers.get("sec-fetch-site") === "cross-site" || new URL(request.url).search) return forecastResponse(failure("invalid", "origin_required", "Refresh from this site's authenticated operator flow."));
  let body: unknown;
  try { body = await readAiBody(request); } catch { return forecastResponse(failure("invalid", "invalid_body", "Send a bounded JSON forecast request.")); }
  if (!isRecord(body) || !exactKeys(body, [])) return forecastResponse(failure("invalid", "invalid_request", "Send an empty forecast request. The server supplies all evidence."));
  try {
    const identity = await resolveAiIdentity(token, runtime);
    if (!identity) return forecastResponse(failure("unauthenticated", "sign_in_required", "Sign in before refreshing the in-season forecast."));
    return forecastResponse(await refreshForecast(identity, runtime, sources));
  } catch { return forecastResponse(failure("unavailable", "forecast_unavailable", "The forecast request could not be safely validated.")); }
}

/** Vercel supplies the bearer server-side. No browser session or header passthrough. */
export async function handleAiForecastCron(request: Request, secret: string | undefined, runtime: AiRuntime, sources: AiForecastSources = forecastSources): Promise<Response> {
  const header = request.headers.get("authorization");
  if (!secret || secret.length < 32 || secret.length > 256 || /\s/.test(secret) || !header || header.length > 512 || new URL(request.url).search || !timingSafeEqual(createHash("sha256").update(header).digest(), createHash("sha256").update(`Bearer ${secret}`).digest())) return forecastResponse(failure("unauthenticated", "operator_auth_required", "Authorized forecast scheduler access is required."));
  if (!runtime.weeklyOperator) return forecastResponse(failure("unavailable", "operator_unconfigured", "The weekly app identity has not been configured."));
  return forecastResponse(await refreshForecast(runtime.weeklyOperator, runtime, sources));
}
