import { isFinal, signedStreak, type Matchup } from "./matchup";
import { rosterValueRank, summarizeRosterValue } from "./roster-value";
import type { Season } from "./season";
import type { Standing } from "./standing";
import type { StockQuote } from "./stock";
import type { Team } from "./team";

/**
 * The Table — the league leaderboard (issue #184). One board, four lenses:
 * League (the standings), Value (total roster modeled FAAB value), Power
 * (week-over-week movement), and Arcade (mini-game points). This module
 * carries the two lenses v1 can build honestly from existing data; Power
 * and Arcade ship as explicit unavailable states in the surface until
 * weekly table snapshots and arcade scoring exist — no placeholder rows.
 */

/** League lens row: a league Standing plus the team's signed active streak. */
export type TableLeagueRow = {
  standing: Standing;
  /**
   * Signed active streak ending with the latest final week (positive =
   * wins, negative = losses), per the domain rule in matchup.ts. Null when
   * the team has no final game yet — an unplayed schedule is not a streak.
   */
  streak: number | null;
};

/** Value lens row: one team's roster priced in modeled FAAB dollars. */
export type TableValueRow = {
  team: Team;
  /**
   * 1-based rank under the shared roster-value policy (roster-value.ts),
   * or null when the league's totals are not fully comparable: a rank
   * exists only when EVERY roster is completely priced, because a partial
   * subtotal cannot be ordered against complete totals — the missing
   * quotes could reverse the order. Equal complete totals share a rank.
   * Display order stays deterministic (totals desc, nulls last, then
   * roster id) whether or not ranks are assigned.
   */
  rank: number | null;
  /**
   * Sum of StockQuote.price across the team's current roster (the priced
   * subtotal when coverage is partial — the coverage counts ride along so
   * it never reads as a complete total). Null when no rostered player
   * carries a modeled price — an unpriced roster is unknown, never $0.
   */
  totalValue: number | null;
  /** Rostered players with a modeled price. Coverage is shown whenever it
   *  is partial, so a partial sum never reads as a complete one. */
  pricedPlayers: number;
  /** Players on the team's current Sleeper roster. */
  rosterPlayers: number;
};

/** Value lens data plus the market provenance its footnote prints. */
export type TableValueData = {
  rows: TableValueRow[];
  /** StockMarket.pricingBasis at computation time — named in the footnote. */
  pricingBasis: "preseason" | "in-season";
  /** ISO timestamp of the market computation (StockMarket.updatedAt). */
  computedAt: string;
};

/** Everything The Table surface renders. Sections fail independently:
 *  a null section renders that lens's honest unavailable state. */
export type TheTableData = {
  season: Season | null;
  /**
   * True once any team has a VERIFIED final result: a recorded win, loss
   * or tie in the standings, or a final matchup in a completed week (see
   * projectTableLeague). Live points in the in-progress week never count
   * — points-for ticks up mid-week while every record is still 0–0.
   * Before any final result, standings exist but carry no real order —
   * the surface lists teams unranked and withholds the #1 treatment.
   */
  hasResults: boolean;
  league: TableLeagueRow[] | null;
  value: TableValueData | null;
};

/**
 * League lens projection over VERIFIED FINAL results only. Pure — the
 * data layer supplies the standings, every fetched week's matchups
 * (index 0 = week 1) and the current week number.
 *
 * Completion provenance: Sleeper serves the current week's scores live,
 * so non-null points in the current week are in progress, not final —
 * score presence is not completion evidence. A week counts as final only
 * once a later week is current (its scores are locked), so streaks are
 * computed over completed weeks exclusively; a team with no final game
 * in a completed week keeps a null streak.
 *
 * `hasResults` follows the same rule: a recorded win/loss/tie (standings
 * records are posted only for final weeks) or a final matchup in a
 * completed week. Points-for alone never qualifies — it accumulates live
 * during the in-progress week while records are still 0–0.
 */
export function projectTableLeague(
  standings: readonly Standing[],
  matchupsByWeek: Matchup[][],
  currentWeek: number
): { rows: TableLeagueRow[]; hasResults: boolean } {
  const completedWeeks = matchupsByWeek.slice(
    0,
    Math.max(0, currentWeek - 1)
  );
  const hasResults =
    completedWeeks.some((week) => week.some((m) => isFinal(m))) ||
    standings.some((s) => s.wins + s.losses + s.ties > 0);
  const rows = standings.map((standing) => {
    const played = completedWeeks.some((week) =>
      week.some(
        (m) =>
          isFinal(m) &&
          (m.home.id === standing.team.id || m.away.id === standing.team.id)
      )
    );
    return {
      standing,
      streak: played ? signedStreak(standing.team.id, completedWeeks) : null,
    };
  });
  return { rows, hasResults };
}

/**
 * Sum modeled FAAB prices per roster. Pure — quotes and roster membership
 * arrive as parameters (the data layer owns both sources).
 *
 * Totals and coverage come from the shared summarizeRosterValue, ranks
 * from the shared rosterValueRank (domain/roster-value.ts) — the same
 * policy the homepage applies: a rank exists only when every roster in
 * the league is completely priced, and equal complete totals share a
 * rank. A partial subtotal is shown with its coverage but never ordered
 * against complete totals.
 *
 * Display order stays deterministic regardless of ranks: priced totals
 * descend, rosters with no priced players (totalValue null) go last, and
 * remaining ties break by numeric roster id.
 */
export function computeTeamValues(
  rosters: readonly { team: Team; playerIds: readonly string[] }[],
  quotes: readonly StockQuote[]
): TableValueRow[] {
  const valuations = rosters.map(({ team, playerIds }) => ({
    team,
    valuation: summarizeRosterValue(playerIds, quotes),
  }));
  const league = valuations.map(({ valuation }) => valuation);
  const rows: TableValueRow[] = valuations.map(({ team, valuation }) => ({
    team,
    rank: rosterValueRank(valuation, league)?.rank ?? null,
    totalValue: valuation.total,
    pricedPlayers: valuation.priced,
    rosterPlayers: valuation.players.length,
  }));
  rows.sort((a, b) => {
    if (a.totalValue === null && b.totalValue === null) {
      return Number(a.team.id) - Number(b.team.id);
    }
    if (a.totalValue === null) return 1;
    if (b.totalValue === null) return -1;
    if (b.totalValue !== a.totalValue) return b.totalValue - a.totalValue;
    return Number(a.team.id) - Number(b.team.id);
  });
  return rows;
}
