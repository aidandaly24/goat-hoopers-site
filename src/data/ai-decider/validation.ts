import type { AiDecideRequest } from "@/domain/ai-decider";

export const AI_LIMITS = Object.freeze({ bodyBytes: 8192, promptChars: 2000, choiceChars: 120, choices: 8, inputTokens: 6144, weeklyInputTokens: 20000, providerTimeoutMs: 8000 });
export const isRecord = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === "object" && !Array.isArray(v);
export const exactKeys = (v: Record<string, unknown>, keys: string[]) => Object.keys(v).length === keys.length && keys.every(k => Object.hasOwn(v, k));
export const teamIdValid = (v: unknown): v is string => typeof v === "string" && /^(?:[1-9]|10)$/.test(v);
export const uuidValid = (v: unknown): v is string => typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
const textValid = (v: unknown, max: number): v is string => typeof v === "string" && v.trim().length > 0 && v.length <= max && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(v);

/** Strict allowlist: client data can never configure the provider transport. */
export function parseAiRequest(raw: unknown): AiDecideRequest | null {
  if (!isRecord(raw)) return null;
  if (raw.kind === "custom" && exactKeys(raw, ["kind", "prompt", "choices"])) {
    if (!textValid(raw.prompt, AI_LIMITS.promptChars) || !Array.isArray(raw.choices) || raw.choices.length < 2 || raw.choices.length > AI_LIMITS.choices || !raw.choices.every(c => textValid(c, AI_LIMITS.choiceChars))) return null;
    const choices = raw.choices.map(c => c.trim());
    if (new Set(choices.map(c => c.normalize("NFKC").toLocaleLowerCase("en-US"))).size !== choices.length) return null;
    return { kind: "custom", prompt: raw.prompt.trim(), choices };
  }
  if (raw.kind === "matchup" && exactKeys(raw, ["kind", "teamIds"]) && Array.isArray(raw.teamIds) && raw.teamIds.length === 2 && raw.teamIds.every(teamIdValid) && raw.teamIds[0] !== raw.teamIds[1]) {
    return { kind: "matchup", teamIds: [raw.teamIds[0], raw.teamIds[1]] };
  }
  return null;
}

/** Streamed cap also handles dishonest/missing Content-Length and UTF-8 bodies. */
export async function readAiBody(request: Request): Promise<unknown> {
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json" || request.headers.has("content-encoding")) throw new Error("invalid_body");
  const declared = request.headers.get("content-length");
  if (declared !== null && (!/^\d+$/.test(declared) || Number(declared) > AI_LIMITS.bodyBytes)) throw new Error("invalid_body");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("invalid_body");
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; void reader.cancel().catch(() => {}); }, 3000);
  try {
    for (;;) {
      const part = await reader.read();
      if (part.done) break;
      bytes += part.value.length;
      if (bytes > AI_LIMITS.bodyBytes) throw new Error("invalid_body");
      chunks.push(part.value);
    }
    if (timedOut) throw new Error("invalid_body");
    const all = new Uint8Array(bytes);
    let offset = 0;
    for (const c of chunks) { all.set(c, offset); offset += c.length; }
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(all));
  } finally { clearTimeout(timer); await reader.cancel().catch(() => {}); }
}
