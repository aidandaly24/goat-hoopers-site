import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import type { AiPublicationContext, AiWeeklyInput, AiWeeklyPublishResponse } from "@/domain/ai-decider";
import { loadAiLineupPreview, loadAiPublicationContext } from "../league";
import { aiDataDeadline } from "./deadline";
import { availability, failure, generateWeeklyPicksAsIdentity, resolveAiIdentity, type AiRuntime } from "./service";
import { validAiIdentity, type AiIdentity } from "./store";
import { exactKeys, isRecord, readAiBody } from "./validation";
import { cachedWeek, prepareWeeklySlate, validWeeklyInput, weekKey, weeklyReadiness } from "./weekly";

export type AiPublicationSources = {
  context(): Promise<AiPublicationContext>;
  input(context: AiPublicationContext): Promise<AiWeeklyInput>;
};
export const publicationSources: AiPublicationSources = { context: loadAiPublicationContext, input: loadAiLineupPreview };

/** One immutable attempt per source week. Daily checks never retry paid work. */
export async function publishWeeklyPreview(identity: AiIdentity, runtime: AiRuntime, sources: AiPublicationSources = publicationSources): Promise<AiWeeklyPublishResponse> {
  if (!validAiIdentity(identity)) return failure("unauthenticated", "sign_in_required", "A validated publication identity is required.");
  const state = await availability(runtime);
  if (state.status !== "available") return failure("unavailable", state.code, state.message);
  try {
    const persistence = runtime.store!.persistence;
    if (identity.kind === "weekly_job" && !(await persistence.authorizeWeeklyOperator(identity))) return failure("unauthenticated", "operator_unavailable", "The configured weekly app identity is unavailable.");
    const context = await aiDataDeadline(sources.context(), 6000);
    const key = weekKey(context);
    const existing = await persistence.getWeek(key);
    if (existing) {
      const weekly = cachedWeek(existing, runtime.now(), context.leg);
      if (existing.result) return weekly.status === "ready" ? { status: "ready", weekly } : failure("unavailable", "publication_partial", "The saved preview has unavailable matchups. Its immutable result is retained.");
      return failure("unavailable", "publication_incomplete", "This week has a sealed incomplete attempt. Review is required before another paid attempt.");
    }
    const input = await aiDataDeadline(sources.input(context), 10000);
    if (!validWeeklyInput(input) || !input.preview || weekKey(input) !== key || input.preview.sourceLeg !== context.leg || input.phase !== context.phase) return failure("unavailable", "weekly_input", "The public source could not establish an upcoming preview.");
    const reason = weeklyReadiness(input, runtime.now());
    if (reason) return failure("unavailable", "weekly_not_ready", reason);
    const prepared = prepareWeeklySlate(input, runtime.now());
    if (!prepared.matchups.every(m => m.baseline?.teamValues.every(v => v.value !== null))) return failure("unavailable", "weekly_not_ready", "All five pairs need eligible lineups and at least 8/10 observed prior-season starters per team. The week remains unsealed.");
    const result = await generateWeeklyPicksAsIdentity(input, identity, runtime);
    if (!("matchups" in result)) return result.status === "ready" ? failure("unavailable", "publication_invalid", "The publication result could not be validated.") : result;
    return result.status === "ready" ? { status: "ready", weekly: result } : failure("unavailable", "publication_partial", "The saved preview has unavailable matchups. Its immutable result is retained.");
  } catch { return failure("unavailable", "publication_unavailable", "The weekly sources or durable publication controls are unavailable."); }
}

function publicationResponse(body: AiWeeklyPublishResponse): Response {
  const codes = { ready: 200, invalid: 400, unauthenticated: 401, unavailable: 503, rate_limited: 429, busy: 409, refused: 422, timeout: 504 };
  return Response.json(body, { status: codes[body.status], headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", ...(body.status !== "ready" && body.retryAfterSeconds !== undefined ? { "Retry-After": String(body.retryAfterSeconds) } : {}) } });
}

/** Manual operator request contains no facts, dates, prompt, credentials or provider options. */
export async function handleAiWeeklyPost(request: Request, token: string | undefined, runtime: AiRuntime, sources: AiPublicationSources = publicationSources): Promise<Response> {
  if (request.headers.get("origin") !== new URL(request.url).origin || request.headers.get("sec-fetch-site") === "cross-site" || new URL(request.url).search) return publicationResponse(failure("invalid", "origin_required", "Publish from this site's authenticated operator flow."));
  let body: unknown;
  try { body = await readAiBody(request); } catch { return publicationResponse(failure("invalid", "invalid_body", "Send a bounded JSON publication request.")); }
  if (!isRecord(body) || !exactKeys(body, [])) return publicationResponse(failure("invalid", "invalid_request", "Send an empty publication request. The server supplies all evidence."));
  try {
    const identity = await resolveAiIdentity(token, runtime);
    if (!identity) return publicationResponse(failure("unauthenticated", "sign_in_required", "Sign in before publishing a weekly preview."));
    return publicationResponse(await publishWeeklyPreview(identity, runtime, sources));
  } catch { return publicationResponse(failure("unavailable", "publication_unavailable", "The publication request could not be safely validated.")); }
}

/** Vercel supplies the bearer server-side. No browser session or header passthrough. */
export async function handleAiWeeklyCron(request: Request, secret: string | undefined, runtime: AiRuntime, sources: AiPublicationSources = publicationSources): Promise<Response> {
  const header = request.headers.get("authorization");
  if (!secret || secret.length < 32 || secret.length > 256 || /\s/.test(secret) || !header || header.length > 512 || new URL(request.url).search || !timingSafeEqual(createHash("sha256").update(header).digest(), createHash("sha256").update(`Bearer ${secret}`).digest())) return publicationResponse(failure("unauthenticated", "operator_auth_required", "Authorized weekly scheduler access is required."));
  if (!runtime.weeklyOperator) return publicationResponse(failure("unavailable", "operator_unconfigured", "The weekly app identity has not been configured."));
  return publicationResponse(await publishWeeklyPreview(runtime.weeklyOperator, runtime, sources));
}
