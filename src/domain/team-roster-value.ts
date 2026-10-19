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
 * buildTeamRosterValue — pure join of market quotes onto a roster.
 *
 * Membership comes only from the roster's player ids intersected with
 * market.stocks; quote.ownership is league-wide share and is never used
 * for membership. Players keep roster order; equal prices need no
 * tie-break here because nothing is sorted.
 */
export function buildTeamRosterValue(
  rosterPlayerIds: string[],
  market: StockMarket | null,
): TeamRosterValue {
  const priceById = new Map<string, number>();
  if (market) {
    for (const quote of market.stocks) {
      priceById.set(quote.playerId, quote.price);
    }
  }
  const players: RosterPlayerValue[] = rosterPlayerIds.map((playerId) => ({
    playerId,
    price: priceById.has(playerId) ? (priceById.get(playerId) as number) : null,
  }));
  const quoted = players.filter((p) => p.price !== null);
  return {
    players,
    total:
      quoted.length > 0
        ? quoted.reduce((sum, p) => sum + (p.price as number), 0)
        : null,
    quotedCount: quoted.length,
    playerCount: players.length,
    pricingBasis: market ? market.pricingBasis : null,
  };
}
