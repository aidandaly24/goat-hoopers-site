/**
 * TeamRosterValue — one manager's roster priced in modeled FAAB dollars.
 *
 * The per-team view of the stock market: `getStockMarketData()` quotes are
 * joined to the viewer's current roster by Sleeper player id (never by
 * quote.ownership — that is league-wide share, not roster membership) in
 * the same server request, so the join is free of extra provider calls.
 *
 * Honesty rules (issue #189):
 * - A rostered player with no quote has price null and renders "—"
 *   (unknown) — never $0.
 * - The total sums quoted prices only and footnotes its coverage
 *   ("over N of M players with quotes"). A total of null means nothing
 *   was quotable; it renders "—", not $0.
 * - The market's pricingBasis is carried so the surface can label
 *   preseason vs in-season pricing while it applies.
 */
import type { StockMarket } from "./stock";
import { summarizeRosterValue } from "./roster-value";

export type RosterPlayerValue = {
  /** Sleeper player_id — the join key into the roster. */
  playerId: string;
  /**
   * Modeled FAAB price in dollars. Null when the market carries no quote
   * for this player (unknown, never $0).
   */
  price: number | null;
};

export type TeamRosterValue = {
  /** One entry per rostered player, in Sleeper roster order. */
  players: RosterPlayerValue[];
  /**
   * Sum of quoted prices only. Null when no rostered player has a quote
   * (renders "—", never $0).
   */
  total: number | null;
  /** Roster players with a modeled price. */
  quotedCount: number;
  /** Total roster players. */
  playerCount: number;
  /**
   * The market's pricing basis ("preseason" until any player has in-season
   * EMA games). Null when the market itself failed to load.
   */
  pricingBasis: StockMarket["pricingBasis"] | null;
};

/**
 * buildTeamRosterValue — the /team roster-value view over the shared
 * roster-value policy (issue #214).
 *
 * Delegates to `summarizeRosterValue` in `./roster-value` (the same policy
 * the homepage valuation and The Table use), so there is exactly one
 * implementation of per-player quoting, quote filtering, and cent-exact
 * totals. Membership comes only from the roster's player ids; the
 * exported types, honesty rules, and /team surface behavior are unchanged.
 *
 * Adopted shared-policy semantics (called out, not silent):
 * - Duplicate roster ids are de-duplicated (first-seen order). Sleeper
 *   never lists a player twice on a roster; see the parity test.
 * - Quotes that are negative or not whole-cent (non-safe-integer cents)
 *   are treated as unquoted — never counted, never summed.
 * - Per-player prices and the total round-trip through integer cents, so
 *   totals are cent-exact instead of float sums.
 * - An empty roster keeps the #189 total of null (nothing quotable
 *   renders "—"); the shared policy's vacuous sum would be 0.
 */
export function buildTeamRosterValue(
  rosterPlayerIds: string[],
  market: StockMarket | null,
): TeamRosterValue {
  const quotes = (market?.stocks ?? []).map((stock) => ({
    playerId: stock.playerId,
    price: stock.price,
  }));
  const summary = summarizeRosterValue(rosterPlayerIds, quotes);
  return {
    players: summary.players.map((player) => ({
      playerId: player.id,
      price: player.value,
    })),
    total: rosterPlayerIds.length === 0 ? null : summary.total,
    quotedCount: summary.priced,
    playerCount: summary.players.length,
    pricingBasis: market ? market.pricingBasis : null,
  };
}
