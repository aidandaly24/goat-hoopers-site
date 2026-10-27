import { describe, expect, it } from "vitest";
import { loadAiForecastInput, type AiForecastContext, type AiForecastEvidenceDeps } from "../forecast-evidence";
import { GOAT_LEAGUE_ID } from "../weekly";

/**
 * Loader fixture tests with synthetic feeds (no network): the played-games
 * list that classification consumes must be chronological — the final
 * element is treated as the latest played game — whatever order the
 * Sleeper scores feed returned.
 */
const KEYS = ["minutes", "points", "rebounds", "assists", "steals", "blocks", "turnovers", "threePointFieldGoalsMade-threePointFieldGoalsAttempted"];
const line = (points: string) => ["30", points, "0", "0", "0", "0", "0", "0-0"];
const box = (points: string) => ({
  boxscore: {
    players: [
      { statistics: [{ keys: KEYS, athletes: [{ athlete: { id: "6430" }, stats: line(points) }] }] },
      { statistics: [{ keys: KEYS, athletes: [{ athlete: { id: "999999" }, stats: line("5") }] }] },
    ],
  },
});
const scoreboardFor = (date: string) => ({
  events: [{
    id: `ev-${date}`, status: { type: { completed: true } },
    competitions: [{ competitors: [{ team: { abbreviation: date === "20261026" ? "NYK" : "MIA" } }, { team: { abbreviation: "BOS" } }] }],
  }],
});

function shuffledDeps(): AiForecastEvidenceDeps {
  const gameA = { game_id: "401", status: "complete", start_time: Date.parse("2026-10-26T23:00:00Z"), metadata: { home_team: { team: "BOS" }, away_team: { team: "NYK" } } };
  const gameB = { game_id: "402", status: "complete", start_time: Date.parse("2026-10-29T00:00:00Z"), metadata: { home_team: { team: "BOS" }, away_team: { team: "MIA" } } };
  const gameC = { game_id: "403", status: "scheduled", start_time: Date.parse("2026-10-31T00:00:00Z"), metadata: { home_team: { team: "BOS" }, away_team: { team: "CHI" } } };
  return {
    league: async () => ({ season: "2026", scoring_settings: { pts: 1 } }),
    state: async () => ({ season: "2026", season_type: "regular", leg: 2, previous_season: "2025" }),
    matchups: async () => Array.from({ length: 10 }, (_, n) => ({
      roster_id: n + 1, matchup_id: Math.floor(n / 2) + 1,
      starters: [n === 0 ? "1000" : `9${n + 1}00`], points: 0, players_points: {},
    })),
    stats: async () => ({}),
    players: async () => ({ "1000": { team: "BOS" } }),
    // The feed returns the later game first: source order is not chronological.
    scores: async () => ({ data: { scores: [gameB, gameC, gameA] } }),
    scoreboard: async (date: string) => scoreboardFor(date),
    summary: async (eventId: string) => box(eventId === "ev-20261026" ? "25" : "12"),
    now: () => Date.parse("2026-10-30T15:00:00Z"),
  } as unknown as AiForecastEvidenceDeps;
}

const context: AiForecastContext = { leagueId: GOAT_LEAGUE_ID, season: "2026", phase: "regular", leg: 2, week: 2, statsSeason: "2025" };

describe("forecast evidence loader", () => {
  it("builds playedGames chronologically even when the scores feed returns games out of order", async () => {
    const input = await loadAiForecastInput(context, shuffledDeps());
    const starter = input.teams[0].starters[0];
    expect(starter.playerId).toBe("1000");
    expect(starter.playedGames).toEqual([
      { gameId: "401", points: 25 },
      { gameId: "402", points: 12 },
    ]);
    expect(starter.gamesRemaining).toBe(1);
  });
});
