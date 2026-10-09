import { AI_PROBABILITY_LABEL, type AiDecideRequest, type AiDecideResponse } from "@/domain/ai-decider";

export type DecisionTransport = (request: AiDecideRequest, signal: AbortSignal) => Promise<AiDecideResponse>;
const failures = new Set(["unavailable", "invalid", "unauthenticated", "rate_limited", "busy", "refused", "timeout"]);
const unavailable = (): AiDecideResponse => ({ status: "unavailable", code: "invalid_response", message: "No verified result is available. Your draft is preserved." });
const object = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;
const unit = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 1;

/** Reject malformed transport results; never repair/normalize provider probabilities. */
export function readDecisionResponse(value: unknown, expectedChoices?: string[]): AiDecideResponse {
  if (!object(value)) return unavailable();
  if (typeof value.status === "string" && failures.has(value.status) && typeof value.code === "string" && typeof value.message === "string") {
    return { status: value.status, code: value.code, message: value.message, ...(typeof value.retryAfterSeconds === "number" && Number.isFinite(value.retryAfterSeconds) && value.retryAfterSeconds >= 0 ? { retryAfterSeconds: value.retryAfterSeconds } : {}) } as AiDecideResponse;
  }
  if (value.status !== "ready" || !object(value.result)) return unavailable();
  const r = value.result;
  if (typeof r.model !== "string" || !r.model || typeof r.promptVersion !== "string" || !r.promptVersion || typeof r.choice !== "string" || !unit(r.confidence) || r.probabilityLabel !== AI_PROBABILITY_LABEL || !Array.isArray(r.evidence) || !r.evidence.every(e => typeof e === "string") || !Array.isArray(r.probabilities) || r.probabilities.length < 2 || r.probabilities.length > 8) return unavailable();
  const probabilities = r.probabilities;
  if (!probabilities.every(p => object(p) && typeof p.choice === "string" && p.choice.length > 0 && unit(p.probability))) return unavailable();
  const labels = probabilities.map(p => p.choice as string);
  if (new Set(labels).size !== labels.length || !labels.includes(r.choice) || Math.abs(probabilities.reduce((sum, p) => sum + (p.probability as number), 0) - 1) > .0001) return unavailable();
  if (expectedChoices && (labels.length !== expectedChoices.length || !expectedChoices.every(c => labels.includes(c)))) return unavailable();
  const snapshot = r.snapshot;
  if (snapshot !== null && (!object(snapshot) || !["hash", "model", "promptVersion", "capturedAt", "cutoffAt", "startsAt", "endsAt", "statsSeason", "scoringMode", "baselineVersion"].every(k => typeof snapshot[k] === "string"))) return unavailable();
  return value as AiDecideResponse;
}

/** Only a manual run calls the app route. No key, provider URL, polling or retry. */
export const postDecision: DecisionTransport = async (request, signal) => {
  const response = await fetch("/api/ai-decides", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify(request), signal, cache: "no-store" });
  const value: unknown = await response.json();
  if (!response.ok && object(value) && value.status === "ready") return unavailable();
  return readDecisionResponse(value, request.kind === "custom" ? request.choices : request.teamIds);
};

export function draftError(prompt: string, choices: string[]): string | null {
  if (!prompt.trim() || choices.some(c => !c.trim())) return "Add a question and fill in every choice.";
  if (prompt.length > 2000 || choices.length < 2 || choices.length > 8 || choices.some(c => c.length > 120)) return "Use a question up to 2,000 characters and 2–8 choices up to 120 characters each.";
  if (new Set(choices.map(c => c.trim().toLowerCase())).size !== choices.length) return "Each choice needs to be different.";
  return null;
}

export const percent = (n: number) => `${Number((n * 100).toFixed(1))}%`;
export const timestamp = (v: string | null | undefined) => v && Number.isFinite(Date.parse(v)) ? new Date(v).toLocaleString("en-GB", { timeZone: "UTC", dateStyle: "medium", timeStyle: "short" }) + " UTC" : "Not available";
