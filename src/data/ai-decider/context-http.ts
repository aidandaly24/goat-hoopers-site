import "server-only";
import type { AiContextPreviewResponse } from "@/domain/ai-decider";
import { aiDataDeadline } from "./deadline";
import { aiResponse } from "./http";
import { failure, resolveAiIdentity, type AiRuntime } from "./service";
import { parseAiContextRequest, readAiBody } from "./validation";
import { buildAiContextPreview } from "./context-preview";

/** Authenticated free source read. Does not inspect a key, reserve spend or call a model. */
export async function loadAiContextPreview(raw: unknown, token: string | undefined, runtime: AiRuntime): Promise<AiContextPreviewResponse> {
  const request = parseAiContextRequest(raw);
  if (!request) return failure("invalid", "invalid_request", "Choose two different league teams.");
  try {
    if (!(await resolveAiIdentity(token, runtime))) return failure("unauthenticated", "sign_in_required", "Sign in before loading roster context.");
  } catch { return failure("unavailable", "session_unavailable", "Your session could not be validated."); }
  try {
    if (!runtime.getLeagueContext) throw new Error("league_context");
    const input = await aiDataDeadline(runtime.getLeagueContext(request.teamIds), 6000);
    return { status: "ready", preview: buildAiContextPreview(input, request.teamIds, runtime.now()) };
  } catch (error) {
    if (error instanceof Error && error.message === "input_limit") return failure("invalid", "input_limit", "The complete roster context exceeds the input budget. No players were omitted and no decision was run.");
    return failure("unavailable", "league_context_unavailable", "The selected teams' roster evidence could not be validated. Your draft is preserved.");
  }
}

export async function handleAiContextPost(request: Request, token: string | undefined, runtime: AiRuntime): Promise<Response> {
  if (request.headers.get("origin") !== new URL(request.url).origin || request.headers.get("sec-fetch-site") === "cross-site" || new URL(request.url).search) return aiResponse(failure("invalid", "origin_required", "Load roster context from this site's playground."));
  let raw: unknown;
  try { raw = await readAiBody(request, 1024); } catch { return aiResponse(failure("invalid", "invalid_body", "Send a bounded JSON team selection.")); }
  const response = await loadAiContextPreview(raw, token, runtime);
  return response.status === "ready" ? Response.json(response, { headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } }) : aiResponse(response);
}
