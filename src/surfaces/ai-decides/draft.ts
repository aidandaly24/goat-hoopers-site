import type { AiDecideRequest } from "@/domain/ai-decider";
import type { AiTeam } from "./AiWeekly";

/** Mirrors the server's canonical-name equality; no aliases or fuzzy matching. */
export const choiceKey = (name: string) => name.trim().normalize("NFKC").toLocaleLowerCase("en-US");

export function decisionDraft(prompt: string, choices: string[], teams: AiTeam[], matchup: [string, string] | null): AiDecideRequest {
  if (matchup) return { kind: "matchup", teamIds: matchup };
  const trimmed = choices.map(choice => choice.trim());
  if (trimmed.length === 2 && trimmed.every(Boolean)) {
    const matches = trimmed.map(choice => teams.filter(team => choiceKey(team.name) === choiceKey(choice)));
    if (matches.every(pair => pair.length === 1) && matches[0][0].id !== matches[1][0].id && matches.every(pair => /^(?:[1-9]|10)$/.test(pair[0].id))) {
      return { kind: "league", prompt: prompt.trim(), choices: [trimmed[0], trimmed[1]], teamIds: [matches[0][0].id, matches[1][0].id] };
    }
  }
  return { kind: "custom", prompt: prompt.trim(), choices: trimmed };
}

export function draftContextLabel(request: AiDecideRequest): string {
  if (request.kind === "matchup") return "Weekly starter context requested. Edit to make it custom.";
  if (request.kind === "league") return `Full-roster league context requested for ${request.choices[0]} and ${request.choices[1]}. The server verifies names and available evidence before running.`;
  return "Text-only custom: choices do not uniquely identify two league teams. No league roster data will be supplied.";
}
