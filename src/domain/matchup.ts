import type { Team } from "./team";

/**
 * Matchup — one head-to-head pairing in a given week.
 *
 * Points are null when the matchup hasn't been played yet (preseason or
 * future weeks). Surfaces must handle null points as "upcoming", never as 0.
 */
export type Matchup = {
  week: number;
  home: Team;
  away: Team;
  homePoints: number | null;
  awayPoints: number | null;
};

/**
 * True when both teams have scores.
 *
 * Score presence only — NOT completion evidence. Sleeper serves the
 * current week's points live (0 pre-tip placeholders, partial totals
 * mid-week), so an in-progress matchup can satisfy this while its week
 * is still being played. Anything that needs genuinely finished games
 * (streaks, records, Elo, the record book) must first restrict to
 * completed weeks via `completedMatchupsByWeek`.
 */
export function isFinal(m: Matchup): boolean {
  return m.homePoints !== null && m.awayPoints !== null;
}

/**
 * The completed weeks of a season: every week before the current one.
 *
 * The shared completion boundary (issue #224 P1). Sleeper serves the
 * current week's scores live, so a week counts as complete only once a
 * later week is current — its scores are locked. This is the rule The
 * Table (`projectTableLeague`) and the stats loader (`fetchStatsInput`)
 * already applied locally; consumers of the full analytics assembly use
 * this helper so the boundary is expressed exactly once.
 *
 * `matchupsByWeek` is indexed from week 1 (index 0 = week 1) and
 * `currentWeek` is Sleeper's current week number (1-based). A
 * `currentWeek` of 0 or 1 completes nothing; weeks at or after the
 * current week are excluded even when they carry live scores.
 */
export function completedMatchupsByWeek(
  matchupsByWeek: Matchup[][],
  currentWeek: number
): Matchup[][] {
  return matchupsByWeek.slice(0, Math.max(0, currentWeek - 1));
}

/** The winning team of a final matchup, null if not final or tied. */
export function winner(m: Matchup): Team | null {
  if (!isFinal(m)) return null;
  if (m.homePoints === m.awayPoints) return null;
  return (m.homePoints as number) > (m.awayPoints as number) ? m.home : m.away;
}

/**
 * Signed active streak for a team across completed games.
 *
 * Positive = consecutive wins, negative = consecutive losses, 0 = none.
 * Pure — takes matchups as a parameter, no fetching.
 *
 * Completion rule: trailing pending/future weeks (null scores) are
 * skipped to find the latest CONFIRMED completed matchup. A missing
 * matchup ends this search: unavailable history cannot establish an active
 * streak, even before counting starts. An unplayed
 * game is not a tie or a loss. Once counting starts, a tie, an opposite
 * result, or an unknown historical gap (missing/interior pending
 * matchup) ends the streak — we never silently join across a gap, since
 * an empty week cannot prove a bye vs. a failed fetch.
 *
 * Score semantics: raw fantasy points compared directly. A finalized
 * 0-0 is a tie (ends the streak); a finalized 0-10 is a loss. Null
 * scores are pending, never zero.
 */
export function signedStreak(
  teamId: string,
  matchupsByWeek: Matchup[][]
): number {
  const findMatchup = (week: Matchup[]) =>
    week.find((x) => x.home.id === teamId || x.away.id === teamId);

  // Phase 1: find the latest confirmed completed matchup, skipping
  // trailing pending/future weeks.
  let start = -1;
  for (let w = matchupsByWeek.length - 1; w >= 0; w--) {
    const m = findMatchup(matchupsByWeek[w]);
    if (!m) return 0;
    if (isFinal(m)) {
      start = w;
      break;
    }
  }
  if (start === -1) return 0;

  // Phase 2: count backwards from the latest final game.
  let streak = 0;
  for (let w = start; w >= 0; w--) {
    const m = findMatchup(matchupsByWeek[w]);
    if (!m || !isFinal(m)) break;
    const isHome = m.home.id === teamId;
    const mine = (isHome ? m.homePoints : m.awayPoints) as number;
    const theirs = (isHome ? m.awayPoints : m.homePoints) as number;
    const result = mine > theirs ? 1 : mine < theirs ? -1 : 0;
    if (result === 0) break;
    if (streak !== 0 && Math.sign(streak) !== result) break;
    streak += result;
  }
  return streak;
}
