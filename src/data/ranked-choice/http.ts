import "server-only";
import { choiceGameId } from "@/domain/arcade/ranked-game-contract";
import { rankedId } from "@/domain/arcade/ranked-free-throw";
import { createChoiceRuntime, type ChoiceRuntime } from "./runtime";
const response = (body: unknown, status: number) => Response.json(body, { status, headers: { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
async function body(request: Request): Promise<unknown> {
  const reader = request.body?.getReader(); if (!reader) throw new Error("invalid_json");
  const chunks: Uint8Array[] = []; let length = 0;
  while (true) { const part = await reader.read(); if (part.done) break; length += part.value.byteLength;
    if (length > 2048) { await reader.cancel(); throw new Error("too_large"); } chunks.push(part.value); }
  const bytes = new Uint8Array(length); let offset = 0; for (const c of chunks) { bytes.set(c, offset); offset += c.byteLength; }
  return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
}
/** Only input commands. No route accepts a score, source, policy or account ID. */
export async function choiceRequest(request: Request, action: "start" | "choose" | "read", runtime: ChoiceRuntime = createChoiceRuntime()) {
  if (!runtime.enabled) return response({ status: "disabled" }, 503);
  try {
    if (request.method !== (action === "read" ? "GET" : "POST")) return response({ status: "method_not_allowed" }, 405);
    const params = new URL(request.url).searchParams, gameId = params.get("gameId"), id = params.get("runId");
    const expected = action === "start" ? ["gameId"] : ["gameId", "runId"];
    if (request.url.length > 2048 || !choiceGameId(gameId) || action !== "start" && !rankedId(id) ||
      [...params.keys()].some(k => !expected.includes(k) || params.getAll(k).length !== 1) || expected.some(k => !params.has(k))) return response({ status: "invalid_query" }, 400);
    if (action !== "read" && request.headers.get("origin") !== runtime.origin()) return response({ status: "invalid_origin" }, 403);
    const adapter = runtime.adapters.find(a => a.gameId === gameId);
    if (action !== "read" && !adapter) return response({ status: "held" }, 503);
    const account = await runtime.account(request.headers);
    if (!account) return response({ status: "unauthenticated" }, 401);
    if (action === "read") {
      if (!await runtime.admitRequest("read")) return response({ status: "rate_limited" }, 429);
      const run = await runtime.store().read(account, id!, gameId);
      return response(run ? { status: "ready", run } : { status: "not_found" }, run ? 200 : 404);
    }
    if (request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase() !== "application/json") return response({ status: "use_json" }, 415);
    let value: unknown;
    try { value = await body(request); } catch (e) { return response({ status: e instanceof Error && e.message === "too_large" ? "too_large" : "invalid_input" }, e instanceof Error && e.message === "too_large" ? 413 : 400); }
    if (!record(value) || action === "start" && Object.keys(value).length !== 0 || action === "choose" &&
      (Object.keys(value).length !== 2 || !Object.hasOwn(value, "index") || !Object.hasOwn(value, "input"))) return response({ status: "invalid_input" }, 400);
    if (!await runtime.admitRequest(action)) return response({ status: "rate_limited" }, 429);
    const result = action === "start" ? await runtime.store().start(account, adapter!, await adapter!.issue())
      : await runtime.store().choose(account, adapter!, id!, value.index, value.input);
    return response(result, ["created", "accepted", "completed"].includes(result.status) ? 201 : result.status === "duplicate" ? 200
      : result.status === "unauthenticated" ? 401 : result.status === "not_found" ? 404 : result.status === "quota" ? 429
        : result.status === "invalid_input" ? 400 : ["held", "unavailable"].includes(result.status) ? 503 : 409);
  } catch { return response({ status: "unavailable" }, 503); }
}
