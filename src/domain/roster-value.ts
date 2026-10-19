/** Current roster valuation only. No historical ownership or account data. */
export type RosterValuation = {
  total: number | null; priced: number; unpriced: number; complete: boolean; knownRoster: boolean;
  players: { id: string; value: number | null }[];
};

/** Sum known modeled quotes in integer cents, never impute an unknown as zero. */
export function summarizeRosterValue(playerIds: readonly string[] | null,
  quotes: readonly { playerId: string; price: number }[]): RosterValuation {
  if (playerIds === null) return { total: null, priced: 0, unpriced: 0, complete: false, knownRoster: false, players: [] };
  const cents = new Map(quotes.filter(quote => quote.price >= 0 && Number.isSafeInteger(Math.round(quote.price * 100)))
    .map(quote => [quote.playerId, Math.round(quote.price * 100)]));
  const players = [...new Set(playerIds)].map(id => ({ id, value: cents.has(id) ? cents.get(id)! / 100 : null }));
  const priced = players.filter(player => player.value !== null).length;
  const totalCents = players.reduce((sum, player) => sum + (cents.get(player.id) ?? 0), 0);
  const total = Number.isSafeInteger(totalCents) && (priced > 0 || players.length === 0) ? totalCents / 100 : null;
  return { total, priced, unpriced: players.length - priced, complete: priced === players.length && total !== null, knownRoster: true, players };
}

/** Comparable complete current rosters only; equal totals share competition rank. */
export function rosterValueRank(own: RosterValuation, league: readonly RosterValuation[]): { rank: number; teams: number; tied: boolean } | null {
  if (!own.complete || own.total === null || !league.length || league.some(value => !value.complete || value.total === null)) return null;
  return { rank: 1 + league.filter(value => value.total! > own.total!).length,
    teams: league.length, tied: league.filter(value => value.total === own.total).length > 1 };
}
