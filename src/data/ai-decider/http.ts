import "server-only";
import { failure, runAiDecision, type AiRuntime } from "./service";
import { readAiBody } from "./validation";
import type { AiDecideResponse } from "@/domain/ai-decider";

const codes = { ready: 200, invalid: 400, unauthenticated: 401, unavailable: 503, rate_limited: 429, busy: 409, refused: 422, timeout: 504 };
export function aiResponse(body: AiDecideResponse): Response {
  const headers: Record<string, string> = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };
  if (body.status !== "ready" && body.retryAfterSeconds !== undefined) headers["Retry-After"] = String(body.retryAfterSeconds);
  return Response.json(body, { status: codes[body.status], headers });
}

/** Origin plus JSON blocks cross-site spending with existing SameSite=Lax cookies. */
export async function handleAiPost(request: Request, token: string | undefined, runtime: AiRuntime): Promise<Response> {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin || request.headers.get("sec-fetch-site") === "cross-site") return aiResponse(failure("invalid", "origin_required", "Submit decisions from this site's playground."));
  let raw: unknown;
  try { raw = await readAiBody(request); } catch { return aiResponse(failure("invalid", "invalid_body", "Send a JSON draft within the request size limit.")); }
  try { return aiResponse(await runAiDecision(raw, token, runtime)); }
  catch { return aiResponse(failure("unavailable", "state_unavailable", "AI Decides could not safely validate this request. Try later.")); }
}
