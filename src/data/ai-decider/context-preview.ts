import "server-only";
import { createHash } from "node:crypto";
import { AI_PROMPT_MAX_CHARS, AI_VISIBLE_LEAGUE_PROMPT_VERSION, type AiContextPreview, type AiDecideRequest, type AiLeagueRosterInput } from "@/domain/ai-decider";
import { inputTokenReservation, makePayload, type DecisionSpec } from "./provider";
import { leagueRosterEvidence, LEAGUE_ROSTER_INSTRUCTIONS, validAiLeagueRosterInput } from "./roster-context";
import { AI_LIMITS } from "./validation";
import { canonicalJson } from "./weekly";

export const VISIBLE_ROSTER_INSTRUCTIONS = LEAGUE_ROSTER_INSTRUCTIONS + " The complete editable question and roster block are supplied once in userRequest. Use only those visible facts; no other roster evidence or live research is supplied.";
const unknown = (value: string | number | null) => value === null ? "unknown" : String(value);
const stats = (value: { fppg: number; games: number } | null) => value === null ? "unknown" : `${value.fppg},${value.games}`;

/** Deterministic complete text, not a signed token or a model-generated explanation. */
export function buildAiContextPreview(input: AiLeagueRosterInput, teamIds: [string, string], now: number): AiContextPreview {
  if (!validAiLeagueRosterInput(input)) throw new Error("league_context");
  const choices: [string, string] = [input.teams[0].name, input.teams[1].name];
  const { leagueContext } = leagueRosterEvidence({ kind: "league", prompt: "Roster context", choices, teamIds }, input, now);
  const lines = [
    "[GOAT roster context]",
    `Season ${input.season}; phase ${input.phase}; observed fantasy stats. Missing values are unknown, never zero.`,
  ];
  for (const team of input.teams) {
    lines.push("", `${team.name} (roster ${team.teamId}) — ${team.players.length} players`,
      `Player | ID | Age | Position | ${input.priorStatsSeason} fantasy PPG,games | ${input.season} fantasy PPG,games`);
    for (const player of team.players) lines.push(`${unknown(player.name)} | ${player.id} | ${unknown(player.age)} | ${unknown(player.position)} | ${stats(player.prior)} | ${stats(player.current)}`);
    lines.push(`Starter IDs: ${team.starters === null ? "unknown" : team.starters.join(", ") || "none"}; 0 means empty slot.`,
      `Reserve IDs: ${team.reserve === null ? "unknown" : team.reserve.join(", ") || "none"}. Taxi IDs: ${team.taxi === null ? "unknown" : team.taxi.join(", ") || "none"}.`);
  }
  lines.push("", `Sleeper league ${input.leagueId}; scoring mode unknown.`,
    `Fantasy scoring weights: ${Object.entries(input.scoring).sort(([a], [b]) => a.localeCompare(b, "en-US")).map(([key, value]) => `${key}=${value}`).join(", ")}.`,
    `Observed stats: ${input.priorStatsSeason} ${input.availability.priorStats}; ${input.season} ${input.availability.currentStats}.`,
    "Source update time unknown. Revalidation: league/rosters/players 5 minutes; stats 24 hours. Failed refreshes may serve older data.",
    "Injuries, schedules, contracts, draft picks, future development and game-selection rules are unknown. No verified long-term projection or weekly-score forecast; no PPG-by-games adjustment.");
  lines.push("[/GOAT roster context]");
  const text = lines.join("\n");
  // Leave room for a 2,000-character question. Never drop players or round facts.
  if (text.length > AI_PROMPT_MAX_CHARS - 2002) throw new Error("input_limit");
  const spec: DecisionSpec = { name: "decision", labels: choices, instructions: VISIBLE_ROSTER_INSTRUCTIONS, promptVersion: AI_VISIBLE_LEAGUE_PROMPT_VERSION, evidence: [], leagueContext };
  inputTokenReservation(makePayload(canonicalJson({ userRequest: `Question\n\n${text}` }), [spec], "preview"), AI_LIMITS.inputTokens);
  return { text, digest: createHash("sha256").update(text).digest("hex"), teamIds: [...teamIds], choices, context: leagueContext, promptVersion: AI_VISIBLE_LEAGUE_PROMPT_VERSION };
}

/** Exact displayed text is the sole model input; metadata is validated separately. */
export function visibleRosterDecision(request: Extract<AiDecideRequest, { kind: "league" }>, input: AiLeagueRosterInput, now: number, safety: string) {
  const preview = buildAiContextPreview(input, request.teamIds, now);
  const { evidence, leagueContext } = leagueRosterEvidence(request, input, now);
  const suffix = `\n\n${preview.text}`;
  if (request.contextDigest !== preview.digest || !request.prompt.endsWith(suffix) || !request.prompt.slice(0, -suffix.length).trim()) throw new Error("context_changed");
  const spec: DecisionSpec = { name: "decision", labels: request.choices, instructions: VISIBLE_ROSTER_INSTRUCTIONS, promptVersion: AI_VISIBLE_LEAGUE_PROMPT_VERSION, evidence: [...evidence, "The exact visible roster block was revalidated before this run and supplied once in the editable prompt."], leagueContext };
  return { payload: makePayload(canonicalJson({ userRequest: request.prompt }), [spec], safety), specs: [spec] };
}
