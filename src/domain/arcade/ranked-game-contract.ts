/** Ranked choice-game protocol. No strength model or quote loader.
 * The existing unranked games remain independent. Only server-issued immutable
 * pools/deals can validate input; a client never supplies a score or source. */
export type ChoiceGameId = "week-2-preview" | "priced-in";
export type ChoiceSource = { provider: string; sourceUrl: string; observedAtMs: number; season: string; version: string; contentHash: string };
export type DraftPool = { teamId: string; playerIds: readonly string[] };
export type DraftChallenge = { gameId: "week-2-preview"; formatVersion: string; source: ChoiceSource; pools: readonly DraftPool[] };
export type PriceChallenge = { gameId: "priced-in"; formatVersion: string; source: ChoiceSource; rounds: readonly { playerId: string; lineCents: number; answerCents: number }[] };
export type ChoiceChallenge = DraftChallenge | PriceChallenge;
export type DraftChoice = { teamId: string; playerId: string };
export type PriceChoice = { call: "over" | "under" };
export type ChoiceInput = DraftChoice | PriceChoice;
export type LockedChoice = { index: number; input: ChoiceInput };
export type ChoiceValidation = { status: "accepted"; choice: LockedChoice } | { status: "duplicate"; choice: LockedChoice } | { status: "invalid" } | { status: "conflict" };
export type DraftAssessment = { status: "unavailable"; reason: "missing_coverage" | "model_unavailable" }
  | { status: "scored"; wins: number; losses: number; modelVersion: string; sourceHash: string };
export type ChoiceResult = { gameId: "week-2-preview"; score: number; metric: { kind: "modeled-record"; wins: number; losses: number }; formatVersion: string; sourceHash: string }
  | { gameId: "priced-in"; score: number; metric: { kind: "price-points"; correct: number; rounds: 5 }; formatVersion: string; sourceHash: string };
export type ChoiceAssessment = { status: "scored"; result: ChoiceResult } | { status: "unscored"; reason: "missing_coverage" | "model_unavailable" | "source_unavailable" };
/** Each adapter must supply reviewed policy; nothing inherits the shooting rules. */
export type ChoicePolicy = { durationMs: number; maxRunsPerPeriod: number | null; sourceMaxAgeMs: number };
export type ChoiceRunView = {
  id: string; gameId: ChoiceGameId; periodId: string; formatVersion: string;
  startedAtMs: number; expiresAtMs: number; asOfMs: number; state: "open" | "completed" | "expired";
  choices: LockedChoice[]; step: ReturnType<typeof publicChoiceStep>;
  basis: Pick<ChoiceSource, "provider" | "season" | "version" | "observedAtMs" | "contentHash">;
  reveals: { index: number; playerId: string; answerCents: number }[];
  completion: (ChoiceAssessment & { id: string; achievedAtMs: number }) | null;
};
export type ChoiceBoardEntry = { rank: number; username: string; teamId: string | null; achievedAtMs: number; isCurrentUser: boolean; score: number; metric: ChoiceResult["metric"] };

const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const keys = (v: Record<string, unknown>, expected: string[]) => Object.keys(v).length === expected.length && expected.every(k => Object.hasOwn(v, k));
const id = (v: unknown): v is string => typeof v === "string" && /^\d{1,15}$/.test(v);
const hash = (v: unknown): v is string => typeof v === "string" && /^[a-f0-9]{64}$/.test(v);
const integer = (v: unknown): v is number => typeof v === "number" && Number.isSafeInteger(v) && v >= 0;
const text = (v: unknown, max: number): v is string => typeof v === "string" && v.length > 0 && v.length <= max && !/[\u0000-\u001f]/.test(v);
export const choiceGameId = (value: unknown): value is ChoiceGameId => value === "week-2-preview" || value === "priced-in";
export function parseChoicePolicy(v: unknown): ChoicePolicy | null {
  if (!record(v) || !keys(v, ["durationMs", "maxRunsPerPeriod", "sourceMaxAgeMs"]) || !integer(v.durationMs) || v.durationMs < 1000 || v.durationMs > 1800000 ||
    !(v.maxRunsPerPeriod === null || integer(v.maxRunsPerPeriod) && v.maxRunsPerPeriod >= 1 && v.maxRunsPerPeriod <= 1000) ||
    !integer(v.sourceMaxAgeMs) || v.sourceMaxAgeMs < 1000 || v.sourceMaxAgeMs > 366 * 86400000) return null;
  return { durationMs: v.durationMs, maxRunsPerPeriod: v.maxRunsPerPeriod, sourceMaxAgeMs: v.sourceMaxAgeMs };
}
export function parseChoiceAssessment(value: unknown, challenge: Pick<ChoiceChallenge, "gameId" | "formatVersion"> & { source: Pick<ChoiceSource, "contentHash"> }): ChoiceAssessment | null {
  if (!record(value)) return null;
  if (value.status === "unscored") return keys(value, ["status", "reason"]) && ["missing_coverage", "model_unavailable", "source_unavailable"].includes(String(value.reason))
    ? { status: "unscored", reason: value.reason as "missing_coverage" | "model_unavailable" | "source_unavailable" } : null;
  const r = value.result;
  if (!keys(value, ["status", "result"]) || value.status !== "scored" || !record(r) || !keys(r, ["gameId", "score", "metric", "formatVersion", "sourceHash"]) ||
    r.gameId !== challenge.gameId || r.formatVersion !== challenge.formatVersion || !hash(r.sourceHash) || r.sourceHash !== challenge.source.contentHash || !integer(r.score) || !record(r.metric)) return null;
  const m = r.metric;
  if (r.gameId === "week-2-preview" && keys(m, ["kind", "wins", "losses"]) && m.kind === "modeled-record" && integer(m.wins) && integer(m.losses) && m.wins + m.losses === 82 && r.score === m.wins)
    return { status: "scored", result: { gameId: r.gameId, score: r.score, metric: { kind: m.kind, wins: m.wins, losses: m.losses }, formatVersion: challenge.formatVersion, sourceHash: challenge.source.contentHash } };
  if (r.gameId === "priced-in" && keys(m, ["kind", "correct", "rounds"]) && m.kind === "price-points" && integer(m.correct) && m.correct <= 5 && m.rounds === 5 && r.score >= m.correct * 100 && r.score <= m.correct * 150)
    return { status: "scored", result: { gameId: r.gameId, score: r.score, metric: { kind: m.kind, correct: m.correct, rounds: 5 }, formatVersion: challenge.formatVersion, sourceHash: challenge.source.contentHash } };
  return null;
}
function source(v: unknown): v is ChoiceSource {
  if (!record(v) || !keys(v, ["provider", "sourceUrl", "observedAtMs", "season", "version", "contentHash"]) ||
    !text(v.provider, 80) || !text(v.sourceUrl, 2048) || !integer(v.observedAtMs) || !text(v.season, 30) || !text(v.version, 128) || !hash(v.contentHash)) return false;
  try { const url = new URL(v.sourceUrl); return url.protocol === "https:" && !url.username && !url.password; } catch { return false; }
}

/** This validates source shape only. An actual source/model agreement is a
 * separate server-adapter prerequisite; a syntactically valid manifest cannot
 * claim verified production or enable a game. Exactly five issued steps. */
export function parseChoiceChallenge(v: unknown): ChoiceChallenge | null {
  if (!record(v) || !hash(v.formatVersion) || !source(v.source)) return null;
  if (v.gameId === "week-2-preview") {
    if (!keys(v, ["gameId", "formatVersion", "source", "pools"]) || !Array.isArray(v.pools) || v.pools.length !== 5) return null;
    const pools: DraftPool[] = [], teams = new Set<string>();
    for (const p of v.pools) {
      if (!record(p) || !keys(p, ["teamId", "playerIds"]) || !id(p.teamId) || teams.has(p.teamId) ||
        !Array.isArray(p.playerIds) || p.playerIds.length < 1 || p.playerIds.length > 40 || !p.playerIds.every(id) || new Set(p.playerIds).size !== p.playerIds.length) return null;
      teams.add(p.teamId); pools.push({ teamId: p.teamId, playerIds: [...p.playerIds] });
    }
    return { gameId: v.gameId, formatVersion: v.formatVersion, source: { ...v.source }, pools };
  }
  if (v.gameId === "priced-in") {
    if (!keys(v, ["gameId", "formatVersion", "source", "rounds"]) || !Array.isArray(v.rounds) || v.rounds.length !== 5) return null;
    const rounds: PriceChallenge["rounds"][number][] = [], players = new Set<string>();
    for (const r of v.rounds) {
      if (!record(r) || !keys(r, ["playerId", "lineCents", "answerCents"]) || !id(r.playerId) || players.has(r.playerId) ||
        !integer(r.lineCents) || r.lineCents < 100 || r.lineCents > 100000000 || !integer(r.answerCents) || r.answerCents < 500 || r.answerCents > 100000000 || Math.abs(r.lineCents - r.answerCents) < 200) return null;
      players.add(r.playerId); rounds.push({ playerId: r.playerId, lineCents: r.lineCents, answerCents: r.answerCents });
    }
    return { gameId: v.gameId, formatVersion: v.formatVersion, source: { ...v.source }, rounds };
  }
  return null;
}
function normalized(challenge: ChoiceChallenge, index: number, value: unknown): ChoiceInput | null {
  if (!record(value)) return null;
  if (challenge.gameId === "priced-in") return keys(value, ["call"]) && (value.call === "over" || value.call === "under")
    ? { call: value.call } : null;
  const pool = challenge.pools[index];
  return keys(value, ["teamId", "playerId"]) && pool && value.teamId === pool.teamId && id(value.playerId) && pool.playerIds.includes(value.playerId)
    ? { teamId: pool.teamId, playerId: value.playerId } : null;
}
function same(a: ChoiceInput, b: ChoiceInput) {
  return "call" in a && "call" in b ? a.call === b.call : "playerId" in a && "playerId" in b && a.playerId === b.playerId && a.teamId === b.teamId;
}

/** Must run against locked, authoritative stored steps. Same-step delivery is
 * idempotent; changed history/future steps/client totals are rejected. */
export function validateChoiceInput(challenge: ChoiceChallenge, locked: readonly LockedChoice[], index: unknown, value: unknown): ChoiceValidation {
  if (!integer(index) || index >= 5 || locked.length > 5) return { status: "invalid" };
  for (let n = 0; n < locked.length; n++) {
    if (locked[n].index !== n || !normalized(challenge, n, locked[n].input)) return { status: "invalid" };
    if ("playerId" in locked[n].input && locked.slice(0, n).some(p => "playerId" in p.input && p.input.playerId === (locked[n].input as DraftChoice).playerId)) return { status: "invalid" };
  }
  const input = normalized(challenge, index, value);
  if (!input || index > locked.length) return { status: "invalid" };
  if (index < locked.length) return same(locked[index].input, input) ? { status: "duplicate", choice: locked[index] } : { status: "conflict" };
  if ("playerId" in input && locked.some(p => "playerId" in p.input && p.input.playerId === input.playerId)) return { status: "invalid" };
  return { status: "accepted", choice: { index, input } };
}

/** A public step omits later draws and ALL price answers. */
export function publicChoiceStep(challenge: ChoiceChallenge, index: number) {
  if (!Number.isSafeInteger(index) || index < 0 || index >= 5) return null;
  return challenge.gameId === "week-2-preview" ? { gameId: challenge.gameId, index, teamId: challenge.pools[index].teamId, playerIds: [...challenge.pools[index].playerIds] }
    : { gameId: challenge.gameId, index, playerId: challenge.rounds[index].playerId, lineCents: challenge.rounds[index].lineCents };
}

/** Only a trusted agreed server grader can provide this assessment. This is
 * structural verification, not the missing strength algorithm. No client route
 * accepts this object, and an unavailable model never becomes a zero score. */
export function validateDraftAssessment(challenge: DraftChallenge, choices: readonly LockedChoice[], assessment: DraftAssessment): ChoiceResult | null {
  if (choices.length !== 5 || assessment.status !== "scored" || !integer(assessment.wins) || assessment.wins > 82 ||
    !integer(assessment.losses) || assessment.wins + assessment.losses !== 82 || assessment.modelVersion !== challenge.source.version || assessment.sourceHash !== challenge.source.contentHash ||
    choices.some((c, i) => validateChoiceInput(challenge, choices.slice(0, i), c.index, c.input).status !== "accepted")) return null;
  return { gameId: "week-2-preview", score: assessment.wins, metric: { kind: "modeled-record", wins: assessment.wins, losses: assessment.losses },
    formatVersion: challenge.formatVersion, sourceHash: challenge.source.contentHash };
}
