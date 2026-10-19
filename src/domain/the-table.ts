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
  /** 1-based rank by totalValue (nulls last). Ties break by roster id so
   *  the order is deterministic across renders. */
  rank: number;
  /**
   * Sum of StockQuote.price across the team's current roster. Null when no
   * rostered player carries a modeled price — an unpriced roster is
   * unknown, never $0.
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
   * True once any team has a recorded result (a win/loss/tie or points).
   * Before that, standings exist but carry no real order — the surface
   * lists teams unranked and withholds the #1 treatment.
   */
  hasResults: boolean;
  league: TableLeagueRow[] | null;
  value: TableValueData | null;
};

/**
 * Sum modeled FAAB prices per roster. Pure — quotes and roster membership
 * arrive as parameters (the data layer owns both sources).
 *
 * Ranking: priced totals descend; a roster with no priced players
 * (totalValue null) ranks below every priced roster; remaining ties break
 * by numeric roster id, so the board is stable and reproducible.
 */
export function computeTeamValues(
  rosters: readonly { team: Team; playerIds: readonly string[] }[],
  quotes: readonly StockQuote[]
): TableValueRow[] {
  const priceByPlayer = new Map(quotes.map((q) => [q.playerId, q.price]));
  const rows = rosters.map(({ team, playerIds }) => {
    let total = 0;
    let pricedPlayers = 0;
    for (const playerId of playerIds) {
      const price = priceByPlayer.get(playerId);
      if (price !== undefined) {
        total += price;
        pricedPlayers += 1;
      }
    }
    return {
      team,
      rank: 0,
      totalValue: pricedPlayers > 0 ? Math.round(total * 100) / 100 : null,
      pricedPlayers,
      rosterPlayers: playerIds.length,
    };
  });
  rows.sort((a, b) => {
    if (a.totalValue === null && b.totalValue === null) {
      return Number(a.team.id) - Number(b.team.id);
    }
    if (a.totalValue === null) return 1;
    if (b.totalValue === null) return -1;
    if (b.totalValue !== a.totalValue) return b.totalValue - a.totalValue;
    return Number(a.team.id) - Number(b.team.id);
  });
  rows.forEach((row, i) => {
    row.rank = i + 1;
  });
  return rows;
}
