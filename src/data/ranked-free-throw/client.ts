import { decodeOutcomes, parseFreeThrowPolicy, parseRankedCalendar, parseRankedReplayContext, rankedId, record, safeInteger, summarizeOutcomes,
  type RankedAdmission, type RankedBoard, type RankedScore, type RankedScope, type RunStatistics } from "@/domain/arcade/ranked-free-throw";
import type { ShotInput } from "@/domain/arcade/competition";
import { parseRankedRecordFeedback, type RankedAcceptedScore } from "@/domain/arcade/ranked-record-feedback";

type Reply<T> = { ok: true; value: T } | { ok: false; status: string };
export type RankedClient = {
  start(signal?: AbortSignal): Promise<Reply<RankedAdmission>>;
  submit(body: { runId: string; shots: readonly ShotInput[] }, signal?: AbortSignal): Promise<Reply<RankedAcceptedScore>>;
  result(runId: string, signal?: AbortSignal): Promise<Reply<RankedScore>>;
  leaderboard(scope: RankedScope, signal?: AbortSignal): Promise<Reply<RankedBoard>>;
};
const time = (value: unknown): value is number => safeInteger(value) && value >= 0;
const version = (value: unknown): value is string => typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
const week = (value: unknown): value is string => typeof value === "string" && /^\d{4}-W(?:0[1-9]|[1-4]\d|5[0-3])$/.test(value);
function period(value: unknown) {
  return record(value) && week(value.week) && time(value.startsAtMs) && (time(value.endsAtMs) && value.startsAtMs < value.endsAtMs || value.endsAtMs === null && typeof value.id === "string")
    ? { ...(typeof value.id === "string" ? { id: value.id } : {}), week: value.week, startsAtMs: value.startsAtMs, endsAtMs: value.endsAtMs as number | null } : null;
}
function statistics(value: Record<string, unknown>): RunStatistics | null {
  if (!safeInteger(value.attempts) || value.attempts < 1 || value.attempts > 100 || !safeInteger(value.makes) || value.makes < 0 || value.makes > value.attempts ||
    value.score !== value.makes || value.accuracy !== value.makes / value.attempts || !safeInteger(value.longestStreak) || value.longestStreak < 0 || value.longestStreak > value.makes ||
    !safeInteger(value.endingStreak) || value.endingStreak < 0 || value.endingStreak > value.longestStreak) return null;
  return { score: value.makes, makes: value.makes, attempts: value.attempts, accuracy: value.makes / value.attempts, longestStreak: value.longestStreak, endingStreak: value.endingStreak };
}
function admission(value: unknown): RankedAdmission | null {
  if (!record(value) || !record(value.run)) return null;
  const rules = parseFreeThrowPolicy(value.rules), replayContext = parseRankedReplayContext(value.replayContext), r = value.run, p = period(r.period);
  if (!rules || !replayContext || rules.engine !== replayContext.engine || !p || !rankedId(r.id) || r.gameId !== "free-throw" || r.week !== p.week || !version(r.rulesVersion) ||
    !time(r.startedAtMs) || !time(r.expiresAtMs) || r.expiresAtMs - r.startedAtMs !== rules.durationMs || r.startedAtMs < p.startsAtMs || (p.endsAtMs !== null && r.expiresAtMs > p.endsAtMs)) return null;
  return { rules, replayContext, run: { id: r.id, gameId: "free-throw", week: p.week, rulesVersion: r.rulesVersion, startedAtMs: r.startedAtMs, expiresAtMs: r.expiresAtMs, period: p } };
}
function score(value: unknown): RankedScore | null {
  if (!record(value) || !rankedId(value.id) || !rankedId(value.runId) || value.gameId !== "free-throw" || !week(value.week) || !version(value.rulesVersion) ||
    !time(value.startedAtMs) || !time(value.achievedAtMs) || value.achievedAtMs < value.startedAtMs || !Array.isArray(value.outcomes) || !Array.isArray(value.inputs)) return null;
  let outcomes;
  try { outcomes = decodeOutcomes(value.outcomes.map(bit => bit === 0 ? "0" : bit === 1 ? "1" : "x").join("")); } catch { return null; }
  const stats = summarizeOutcomes(outcomes), context = parseRankedReplayContext(value.replayContext);
  if (!context || !statistics(value) || Object.entries(stats).some(([key, item]) => value[key] !== item) || value.inputs.length !== outcomes.length) return null;
  const inputs: ShotInput[] = [];
  for (const input of value.inputs) {
    if (!record(input) || Object.keys(input).length !== 3 || !time(input.atMs) || typeof input.direction !== "number" || !Number.isFinite(input.direction) || Math.abs(input.direction) > 14 ||
      typeof input.power !== "number" || !Number.isFinite(input.power) || input.power < 0 || input.power > 100) return null;
    inputs.push({ atMs: input.atMs, direction: input.direction, power: input.power });
  }
  return { ...stats, id: value.id, runId: value.runId, gameId: "free-throw", week: value.week, rulesVersion: value.rulesVersion,
    startedAtMs: value.startedAtMs, achievedAtMs: value.achievedAtMs, outcomes, inputs, replayContext: context };
}
function board(value: unknown): RankedBoard | null {
  if (!record(value) || value.gameId !== "free-throw" || !version(value.rulesVersion) || typeof value.ruleSetId !== "string" || !["league", "everyone"].includes(String(value.scope)) || !record(value.calendar)) return null;
  const p = period(value.period);
  const calendar = parseRankedCalendar(value.calendar);
  if (!p || !calendar || !Array.isArray(value.entries) || value.entries.length > 100) return null;
  const entries: RankedBoard["entries"] = [];
  for (const row of value.entries) {
    if (!record(row) || !statistics(row) || !safeInteger(row.rank) || row.rank < 1 || typeof row.username !== "string" || row.username.length > 40 ||
      !(row.teamId === null || typeof row.teamId === "string" && /^(?:[1-9]|10)$/.test(row.teamId)) || !time(row.achievedAtMs) || typeof row.isCurrentUser !== "boolean") return null;
    entries.push({ ...statistics(row)!, rank: row.rank, username: row.username, teamId: row.teamId, achievedAtMs: row.achievedAtMs, isCurrentUser: row.isCurrentUser });
  }
  return { gameId: "free-throw", rulesVersion: value.rulesVersion, ruleSetId: value.ruleSetId, calendar, scope: value.scope as RankedScope, period: p, entries };
}

/** Same-origin, injected browser transport; no auth secrets, SDKs or database code. */
export function createRankedClient(fetcher: (input: string, init?: RequestInit) => Promise<Response> = (input, init) => fetch(input, init)): RankedClient {
  async function send<T>(path: string, decode: (value: unknown) => T | null, signal?: AbortSignal, body?: unknown): Promise<Reply<T>> {
    try {
      const response = await fetcher(`/api/arcade/free-throw/${path}`, { method: body === undefined ? "GET" : "POST", credentials: "same-origin", cache: "no-store", signal,
        ...(body === undefined ? {} : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }) });
      const value: unknown = await response.json();
      if (!response.ok) return { ok: false, status: record(value) && typeof value.status === "string" ? value.status : "unavailable" };
      const parsed = decode(value);
      return parsed ? { ok: true, value: parsed } : { ok: false, status: "invalid_response" };
    } catch { return { ok: false, status: signal?.aborted ? "aborted" : "network" }; }
  }
  return { start: signal => send("runs", admission, signal, {}),
    submit: (body, signal) => send("scores", value => {
      if (!record(value) || value.status !== "saved") return null;
      const saved = score(value.score);
      return saved ? { ...saved, recordFeedback: parseRankedRecordFeedback(value.recordFeedback, saved) } : null;
    }, signal, { runId: body.runId, shots: body.shots.map(input => ({ atMs: input.atMs, direction: input.direction, power: input.power })) }),
    result: (id, signal) => send(`results?runId=${encodeURIComponent(id)}`, value => record(value) ? score(value.score) : null, signal),
    leaderboard: (scope, signal) => send(`leaderboard?scope=${scope}&limit=50`, board, signal) };
}
