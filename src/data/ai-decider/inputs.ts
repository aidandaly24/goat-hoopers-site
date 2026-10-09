import type { AiWeeklyInput } from "@/domain/ai-decider";
import type { SeasonStatLines } from "../nba-stats";
import type { RawLeague, RawMatchupEntry, RawRoster } from "../sleeper";
import { fppgUnderScoring } from "../transform";
import { GOAT_LEAGUE_ID } from "./weekly";

/** Reviewed week dates/mode are explicit. The numeric game_mode is not mapped. */
export type AiWeekPreparation = Pick<AiWeeklyInput, "season" | "week" | "capturedAt" | "cutoffAt" | "startsAt" | "endsAt" | "phase" | "scoringMode" | "statsSeason" | "statsAvailableAt">;

export function aiMatchupPairs(entries: RawMatchupEntry[]): AiWeeklyInput["matchups"] {
  const groups = new Map<number, string[]>();
  for (const entry of entries) {
    const pair = groups.get(entry.matchup_id) ?? [];
    pair.push(String(entry.roster_id));
    groups.set(entry.matchup_id, pair);
  }
  return [...groups].sort(([a], [b]) => a - b).flatMap(([id, teams]) => teams.length === 2 ? [{ matchupId: String(id), teamIds: teams as [string, string] }] : []);
}

/** Only starter facts; no outcomes, bench statistics, names or full directory. */
export function buildAiWeeklyInput(preparation: AiWeekPreparation, league: RawLeague, rosters: RawRoster[], matchups: RawMatchupEntry[], stats: SeasonStatLines): AiWeeklyInput {
  return {
    leagueId: GOAT_LEAGUE_ID,
    ...preparation,
    scoring: { ...league.scoring_settings },
    starterSlots: [...(league.roster_positions ?? [])],
    matchups: aiMatchupPairs(matchups),
    teams: rosters.map(roster => {
      // Week-specific matchup starters are authoritative. Missing is unknown.
      const starters = matchups.find(m => m.roster_id === roster.roster_id)?.starters;
      return { teamId: String(roster.roster_id), starters: [...(starters ?? [])], reserve: [...(roster.reserve ?? [])], taxi: [...(roster.taxi ?? [])], eligibilityKnown: Object.hasOwn(roster, "reserve") && Object.hasOwn(roster, "taxi"), players: [...new Set(starters ?? [])].filter(id => id !== "0").map(playerId => {
        const production = stats[playerId] && roster.players.includes(playerId) ? fppgUnderScoring(stats[playerId], league.scoring_settings) : null;
        return { playerId, priorFantasyPpg: production?.fppg ?? null, priorGames: production?.games ?? null };
      }) };
    }),
  };
}
