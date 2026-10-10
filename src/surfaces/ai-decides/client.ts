import { AI_LEAGUE_ROSTER_PROMPT_VERSION, AI_PROBABILITY_LABEL, type AiDecideRequest, type AiDecideResponse, type AiLeagueContextMetadata, type AiSnapshotMetadata, type AiWeeklyPublishResponse } from "@/domain/ai-decider";
import { choiceKey } from "./draft";

export type DecisionTransport = (request: AiDecideRequest, signal: AbortSignal) => Promise<AiDecideResponse>;
export type WeeklyTransport = (signal: AbortSignal) => Promise<AiWeeklyPublishResponse>;
const failures = new Set(["unavailable", "invalid", "unauthenticated", "rate_limited", "busy", "refused", "timeout"]);
const unavailable = (): AiDecideResponse => ({ status: "unavailable", code: "invalid_response", message: "No verified result is available. Your draft is preserved." });
const object = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;
const unit = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 1;
const iso = (v: unknown): v is string => {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(v) || !Number.isFinite(Date.parse(v))) return false;
  const year = Number(v.slice(0, 4)), month = Number(v.slice(5, 7)), day = Number(v.slice(8, 10));
  return month >= 1 && month <= 12 && day >= 1 && day <= new Date(Date.UTC(year, month, 0)).getUTCDate() && Number(v.slice(11, 13)) < 24 && Number(v.slice(14, 16)) < 60 && Number(v.slice(17, 19)) < 60;
};
const snapshotValid = (snapshot: unknown): boolean => snapshot === null || (object(snapshot)
  && ["hash", "model", "promptVersion", "statsSeason", "scoringMode", "baselineVersion"].every(k => typeof snapshot[k] === "string")
  && ["capturedAt", "cutoffAt"].every(k => iso(snapshot[k]))
  && ["startsAt", "endsAt"].every(k => snapshot[k] === null || iso(snapshot[k]))
  && (snapshot.comparison === undefined || snapshot.comparison === "preseason_lineup_preview" || snapshot.comparison === "weekly_lineup_preview")
  && (snapshot.sourceLeg === undefined || (typeof snapshot.sourceLeg === "number" && Number.isSafeInteger(snapshot.sourceLeg) && snapshot.sourceLeg >= 0)));

const count = (v: unknown, min: number, max: number): v is number => typeof v === "number" && Number.isSafeInteger(v) && v >= min && v <= max;
const name = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0 && v.length <= 120 && !/[\u0000-\u001f\u007f]/.test(v);
/** Source proof is separate from probabilities; malformed coverage is never repaired. */
function leagueContextValid(v: unknown): v is AiLeagueContextMetadata {
  if (!object(v) || typeof v.hash !== "string" || !/^[a-f0-9]{64}$/.test(v.hash) || v.source !== "sleeper" || v.leagueId !== "1387473752807190528" || !iso(v.capturedAt) || new Date(v.capturedAt).toISOString() !== v.capturedAt || typeof v.season !== "string" || !/^20\d{2}$/.test(v.season) || typeof v.priorStatsSeason !== "string" || !/^20\d{2}$/.test(v.priorStatsSeason) || Number(v.priorStatsSeason) >= Number(v.season) || !["pre", "regular", "post"].includes(v.phase as string) || v.scoringMode !== "unknown" || v.sourceUpdatedAt !== null) return false;
  const cache = v.cacheRevalidateSeconds, availability = v.availability;
  if (!object(cache) || cache.league !== 300 || cache.rosters !== 300 || cache.players !== 300 || cache.stats !== 86400 || !object(availability) || availability.players !== "available" || !["available", "unavailable"].includes(availability.priorStats as string) || !["available", "unavailable", "preseason_not_started"].includes(availability.currentStats as string) || (v.phase === "pre") !== (availability.currentStats === "preseason_not_started") || !Array.isArray(v.teams) || v.teams.length !== 2) return false;
  if (!v.teams.every(t => object(t) && typeof t.teamId === "string" && /^(?:[1-9]|10)$/.test(t.teamId) && name(t.name) && count(t.rosterSize, 1, 30) && count(t.namedPlayers, 1, t.rosterSize) && count(t.priorStatsPlayers, 0, t.rosterSize) && count(t.currentStatsPlayers, 0, t.rosterSize) && [t.startersKnown, t.reserveKnown, t.taxiKnown].every(flag => typeof flag === "boolean") && (availability.priorStats !== "unavailable" || t.priorStatsPlayers === 0) && (availability.currentStats === "available" || t.currentStatsPlayers === 0))) return false;
  return v.teams[0].teamId !== v.teams[1].teamId && choiceKey(v.teams[0].name) !== choiceKey(v.teams[1].name);
}

/** Reject malformed transport results; never repair/normalize provider probabilities. */
export function readDecisionResponse(value: unknown, expectedChoices?: string[], request?: AiDecideRequest): AiDecideResponse {
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
  if (!snapshotValid(r.snapshot)) return unavailable();
  if (r.leagueContext !== undefined && (!leagueContextValid(r.leagueContext) || r.snapshot !== null || r.promptVersion !== AI_LEAGUE_ROSTER_PROMPT_VERSION)) return unavailable();
  if (request?.kind === "league") {
    if (!leagueContextValid(r.leagueContext) || r.snapshot !== null || r.promptVersion !== AI_LEAGUE_ROSTER_PROMPT_VERSION || r.leagueContext.teams.some((team, i) => team.teamId !== request.teamIds[i] || choiceKey(team.name) !== choiceKey(request.choices[i]))) return unavailable();
  } else if (request && r.leagueContext !== undefined) return unavailable();
  return value as AiDecideResponse;
}

/** Only a manual run calls the app route. No key, provider URL, polling or retry. */
export const postDecision: DecisionTransport = async (request, signal) => {
  const response = await fetch("/api/ai-decides", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify(request), signal, cache: "no-store" });
  const value: unknown = await response.json();
  if (!response.ok && object(value) && value.status === "ready") return unavailable();
  return readDecisionResponse(value, request.kind === "matchup" ? request.teamIds : request.choices, request);
};

const weeklyUnavailable = (): AiWeeklyPublishResponse => ({ status: "unavailable", code: "invalid_response", message: "No verified saved slate was returned. Review the publication attempt before retrying." });
export function readWeeklyPublishResponse(value: unknown): AiWeeklyPublishResponse {
  if (!object(value) || value.status !== "ready") {
    const failure = readDecisionResponse(value);
    return failure.status === "ready" ? weeklyUnavailable() : failure;
  }
  const weekly = value.weekly;
  if (!object(weekly) || typeof weekly.leagueId !== "string" || typeof weekly.season !== "string" || typeof weekly.week !== "number" || !Number.isSafeInteger(weekly.week) || weekly.week < 1 || weekly.status !== "ready" || typeof weekly.message !== "string" || !iso(weekly.generatedAt) || !object(weekly.snapshot) || !snapshotValid(weekly.snapshot) || !Array.isArray(weekly.matchups) || weekly.matchups.length !== 5) return weeklyUnavailable();
  if (!weekly.matchups.every(p => {
    if (!object(p) || typeof p.matchupId !== "string" || !Array.isArray(p.teamIds) || p.teamIds.length !== 2 || !p.teamIds.every(id => typeof id === "string" && id.length > 0) || p.teamIds[0] === p.teamIds[1] || typeof p.message !== "string" || !Array.isArray(p.evidence) || !p.evidence.every(e => typeof e === "string")) return false;
    if (p.status !== "ready" || readDecisionResponse({ status: "ready", result: p.result }, p.teamIds, { kind: "matchup", teamIds: [p.teamIds[0], p.teamIds[1]] }).status !== "ready") return false;
    const baseline = p.baseline;
    return baseline === null || (object(baseline) && typeof baseline.version === "string" && typeof baseline.label === "string" && (baseline.pick === null || typeof baseline.pick === "string") && Array.isArray(baseline.teamValues) && baseline.teamValues.every(v => object(v) && typeof v.teamId === "string" && (v.value === null || (typeof v.value === "number" && Number.isFinite(v.value)))));
  }) || new Set(weekly.matchups.map(p => p.matchupId)).size !== 5 || new Set(weekly.matchups.flatMap(p => p.teamIds)).size !== 10) return weeklyUnavailable();
  return value as AiWeeklyPublishResponse;
}

/** Explicit manager click only. No injected prompts, retries or provider URL. */
export const postWeeklyPreviews: WeeklyTransport = async signal => {
  const response = await fetch("/api/ai-decides/weekly", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: "{}", signal, cache: "no-store" });
  const value: unknown = await response.json();
  if (!response.ok && object(value) && value.status === "ready") return weeklyUnavailable();
  return readWeeklyPublishResponse(value);
};

export function draftError(prompt: string, choices: string[]): string | null {
  if (!prompt.trim() || choices.some(c => !c.trim())) return "Add a question and fill in every choice.";
  if (prompt.length > 2000 || choices.length < 2 || choices.length > 8 || choices.some(c => c.length > 120)) return "Use a question up to 2,000 characters and 2–8 choices up to 120 characters each.";
  if (new Set(choices.map(choiceKey)).size !== choices.length) return "Each choice needs to be different.";
  return null;
}

/** Admission waits are distinct from missing or rejected model output. */
export function failureHeading(failure: Exclude<AiDecideResponse, { status: "ready" }>): string {
  if (failure.status === "busy") return failure.code === "duplicate" ? "Already running. Please wait." : "A decision is already running.";
  if (failure.status === "rate_limited") return failure.code === "global_token_budget" ? "Shared daily budget reached." : "Usage limit reached.";
  if (failure.status === "unauthenticated") return "Sign in to run.";
  if (failure.status === "invalid") return "Check your draft.";
  if (failure.status === "refused") return "Request declined.";
  if (failure.status === "timeout") return "Request timed out.";
  return "No result available.";
}

export const percent = (n: number) => `${Number((n * 100).toFixed(1))}%`;
export const timestamp = (v: string | null | undefined) => v && Number.isFinite(Date.parse(v)) ? new Date(v).toLocaleString("en-GB", { timeZone: "UTC", dateStyle: "medium", timeStyle: "short" }) + " UTC" : "Not available";

export const comparisonLabel = (snapshot: AiSnapshotMetadata | null | undefined) => snapshot?.comparison === "preseason_lineup_preview" ? "Preseason lineup preview" : snapshot?.comparison === "weekly_lineup_preview" ? "Weekly lineup preview" : null;

export function leagueContextLines(context: AiLeagueContextMetadata): string[] {
  return [
    `Full-roster Sleeper context · ${context.season} ${context.phase === "pre" ? "preseason" : context.phase === "post" ? "postseason" : "regular season"}. Retrieved ${timestamp(context.capturedAt)}; source update time unknown.`,
    ...context.teams.map(team => `${team.name} (roster ${team.teamId}): ${team.namedPlayers}/${team.rosterSize} named players; ${context.priorStatsSeason} stats ${team.priorStatsPlayers}/${team.rosterSize}${context.availability.priorStats === "unavailable" ? " (source unavailable)" : ""}; ${context.season} stats ${context.availability.currentStats === "preseason_not_started" ? "not started" : `${team.currentStatsPlayers}/${team.rosterSize}${context.availability.currentStats === "unavailable" ? " (source unavailable)" : ""}`}. Starter/reserve/taxi lists: ${[team.startersKnown, team.reserveKnown, team.taxiKnown].map(known => known ? "known" : "unknown").join(" / ")}.`),
    "Revalidation: league, rosters and players 5 minutes; stats 24 hours. Failed refreshes may serve older data. Scoring mode unknown; no verified long-term projection.",
  ];
}
export function periodLabel(snapshot: AiSnapshotMetadata): string {
  const start = timestamp(snapshot.startsAt), end = timestamp(snapshot.endsAt);
  if (snapshot.comparison === "preseason_lineup_preview") return start === "Not available" ? "Publication closure unavailable." : `Publication closes ${start}.`;
  return start === "Not available" || end === "Not available" ? "Period dates unavailable." : `Period ${start} — ${end}.`;
}
