/**
 * LiveGame — one NBA game for the live score strip (issue #56, Phase 1
 * of #47).
 *
 * Sourced from ESPN's public scoreboard API, polled directly from the
 * browser. Sleeper has no live-game data, so this is the only live
 * sports concept on the site. Scores are informational only — they never
 * feed the stock market (that's Phase 2+ territory).
 */
export type LiveGameStatus = "scheduled" | "in-progress" | "final";

export type LiveGame = {
  /** ESPN event id. */
  id: string;
  awayAbbr: string;
  awayName: string;
  homeAbbr: string;
  homeName: string;
  awayScore: number;
  homeScore: number;
  status: LiveGameStatus;
  /**
   * Display clock: "Q3 4:32" / "Half" / "OT 1:05" for in-progress,
   * "Final" / "Final/OT" for completed, "7:00 PM ET" for scheduled.
   * Taken from ESPN's shortDetail so we don't reinvent their formatting.
   */
  clock: string;
};

/** True when the strip should keep polling (a game is live or upcoming). */
export function isGameDay(games: LiveGame[]): boolean {
  return games.some(
    (g) => g.status === "in-progress" || g.status === "scheduled"
  );
}
