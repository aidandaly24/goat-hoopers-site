import type { Team } from "./team";

/**
 * PlayoffOdds — one team's simulated chances at the postseason.
 *
 * MODEL (documented here, implemented in src/data/analytics.ts):
 *
 * 1. Every team starts at Elo 1500. Final games update Elo with a binary
 *    K=24 result (ties split) — fantasy is head-to-head, margin doesn't
 *    rate skill, only the W/L does.
 * 2. The regular season runs weeks 1..(playoffWeekStart - 1) (18 for this
 *    league). Remaining games are simulated as round-robin proxies: each
 *    week every team draws one random opponent from the other nine, and
 *    the win probability comes from the Elo logistic curve.
 * 3. Ties in the simulated standings break by total points for, the way
 *    Sleeper does. Weekly scores are sampled from a normal distribution
 *    around each team's points-per-game (sd = 15 — a conservative spread
 *    for weekly fantasy-basketball totals).
 * 4. 10,000 trials, mulberry32-seeded by the current week so the odds are
 *    stable within a week and move only when real data does.
 * 5. The top `playoffSpots` teams by (wins, then PF) make it.
 *
 * Preseason (no games played) returns null odds, not a trivial ~60%-each
 * table: uniform-Elo simulation with no data is arithmetic, not insight,
 * and the repo's honesty rules forbid fake numbers. The loader reports
 * odds only once finals exist.
 */
export type PlayoffOdds = {
  team: Team;
  /** Probability of making the playoffs, in [0, 1]. */
  makePlayoffPct: number;
  /** Mean final regular-season wins across trials. */
  expectedWins: number;
  /** Number of simulated seasons. */
  trials: number;
};
