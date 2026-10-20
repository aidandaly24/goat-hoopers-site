import "server-only";
import { issueRankedRun, loadRankedLeaderboard, loadRankedResult, submitRankedScore, type RankedRuntime } from "./service";

type Action = "start" | "submit" | "leaderboard" | "result";
const response = (body: unknown, status: number) => Response.json(body, { status,
  headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });

async function body(request: Request): Promise<{ value: unknown } | { error: "invalid_submission" | "too_large" }> {
  const reader = request.body?.getReader();
  if (!reader) return { error: "invalid_submission" };
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > 16384) { await reader.cancel(); return { error: "too_large" }; }
    chunks.push(value);
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  try { return { value: JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)) }; }
  catch { return { error: "invalid_submission" }; }
}

/** Backend only. Practice never calls these routes; admission remains closed by default. */
export async function handleRankedRequest(request: Request, action: Action, runtime: RankedRuntime): Promise<Response> {
  if (runtime.configuration.status !== "ready") return response({ status: "disabled" }, 503);
  try {
    if (request.method !== (["leaderboard", "result"].includes(action) ? "GET" : "POST")) return response({ status: "method_not_allowed" }, 405);
    if (action === "result") {
      const params = new URL(request.url).searchParams;
      if (request.url.length > 2048 || [...params.keys()].some(key => key !== "runId") || params.getAll("runId").length !== 1) return response({ status: "invalid_submission" }, 400);
      const account = await runtime.account(request.headers);
      if (!account) return response({ status: "unauthenticated" }, 401);
      const result = await loadRankedResult(runtime, account, params.get("runId")!);
      return response(result, result.status === "saved" ? 200 : result.status === "not_found" ? 404 : 400);
    }
    if (action === "leaderboard") {
      if (request.url.length > 2048) return response({ status: "invalid_query" }, 400);
      const params = new URL(request.url).searchParams;
      if ([...params.keys()].some(key => !["scope", "limit"].includes(key) || params.getAll(key).length !== 1)) return response({ status: "invalid_query" }, 400);
      const scope = params.get("scope") ?? "everyone", rawLimit = params.get("limit") ?? "50";
      if (!["everyone", "league"].includes(scope) || !/^(?:[1-9]|[1-9][0-9]|100)$/.test(rawLimit)) return response({ status: "invalid_query" }, 400);
      const result = await loadRankedLeaderboard(runtime, await runtime.account(request.headers), scope as "everyone" | "league", Number(rawLimit));
      return response(result, 200);
    }
    if (request.headers.get("origin") !== runtime.origin()) return response({ status: "invalid_origin" }, 403);
    if (request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase() !== "application/json") return response({ status: "use_json" }, 415);
    const parsed = await body(request);
    if ("error" in parsed) return response({ status: parsed.error }, parsed.error === "too_large" ? 413 : 400);
    if (action === "start" && (!parsed.value || typeof parsed.value !== "object" || Array.isArray(parsed.value) || Object.keys(parsed.value).length !== 0)) {
      return response({ status: "invalid_submission" }, 400);
    }
    const account = await runtime.account(request.headers);
    if (!account) return response({ status: "unauthenticated" }, 401);
    if (!await runtime.admitRequest(action)) return response({ status: "rate_limited" }, 429);
    const result = action === "start" ? await issueRankedRun(runtime, account) : await submitRankedScore(runtime, account, parsed.value);
    const status = result.status === "created" || result.status === "saved" ? 201 : result.status === "unauthenticated" ? 401
      : result.status === "quota" ? 429 : ["invalid_submission", "invalid_replay"].includes(result.status) ? 400
        : ["disabled", "invalid"].includes(result.status) ? 503 : 409;
    return response(result, status);
  } catch { return response({ status: "unavailable" }, 503); }
}
