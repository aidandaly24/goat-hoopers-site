import type { AiContextPreview, AiDecideRequest } from "@/domain/ai-decider";
import type { AiTeam } from "./AiWeekly";

/** Mirrors canonical-name equality; no aliases or fuzzy matching. */
export const choiceKey = (name: string) => name.trim().normalize("NFKC").toLocaleLowerCase("en-US");

export function recognizedTeamPair(choices: string[], teams: AiTeam[]): [string, string] | null {
  if (choices.length !== 2 || choices.some(choice => !choice.trim())) return null;
  const matches = choices.map(choice => teams.filter(team => choiceKey(team.name) === choiceKey(choice)));
  if (matches.some(pair => pair.length !== 1) || matches[0][0].id === matches[1][0].id || matches.some(pair => !/^(?:[1-9]|10)$/.test(pair[0].id))) return null;
  return [matches[0][0].id, matches[1][0].id];
}

/** Only the exact visible suffix can retain the server's source check. */
export function previewIsIntact(prompt: string, choices: string[], preview: AiContextPreview | null): boolean {
  return !!preview && prompt.endsWith("\n\n" + preview.text) && !!prompt.slice(0, -(preview.text.length + 2)).trim() && choices.length === 2 && choices.every((choice, i) => choiceKey(choice) === choiceKey(preview.choices[i]));
}

export function decisionDraft(prompt: string, choices: string[], preview: AiContextPreview | null = null): AiDecideRequest {
  if (previewIsIntact(prompt, choices, preview) && preview) {
    return { kind: "league", prompt, choices: [choices[0], choices[1]], teamIds: [...preview.teamIds], contextDigest: preview.digest };
  }
  // The entire editable text is sent once; recognition alone never adds hidden data.
  return { kind: "custom", prompt, choices: [...choices] };
}

export function draftContextLabel(request: AiDecideRequest, preview: AiContextPreview | null = null): string {
  if (request.kind === "league" && request.contextDigest) return "Roster/stats are in this prompt. The server checks the unchanged data before running; question edits are allowed.";
  if (preview) return "Edited draft: all visible text is sent as custom content. Roster/stat edits and changed choices are not verified league evidence.";
  return "Text-only custom: only this prompt and your choices are sent. Add roster/stats for two recognized league teams, or use a preset.";
}
