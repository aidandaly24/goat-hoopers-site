import type { PriceHistoryPoint } from "./stock";

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

/** One point of a roster's repriced series: the summed modeled value of
 * the roster's currently priced players at one instant, with how many of
 * the series' players contribute at that instant (`priced` of
 * `participants`). `current` marks the appended live modeled quote — the
 * freshest point, which is NOT a recorded snapshot; every other point sits
 * at a genuinely recorded snapshot instant. */
export type RosterValuePoint = { date: string; value: number; priced: number; current: boolean };

/** A repricing of TODAY'S roster built only from recorded price points:
 * each priced player's recorded snapshots plus their current modeled
 * quote, summed piecewise-constantly — a player's last recorded price
 * carries forward until their next recorded point, and a player enters
 * the sum at their first recorded point, never earlier. Selection and
 * summation only: no interpolation, no backfill, no invented points.
 * This is not the team's historical value: membership is today's roster
 * at every instant, so the series must be labelled as a repricing, never
 * as portfolio performance. Null unless at least two genuinely recorded
 * instants survive — one snapshot plus the appended current quote is not
 * a recorded series, so the surface shows an unavailable state instead. */
export type RosterValueTrend = { points: RosterValuePoint[]; delta: number; participants: number };

/** Sparkline budget. Reduction selects existing sums only (last sum per
 * UTC day, then a stride) — it never averages or mutates a value. */
const TREND_POINT_CAP = 48;

export function rosterValueTrend(playerIds: readonly string[] | null,
  quotes: readonly { playerId: string; price: number }[],
  history: Readonly<Record<string, readonly PriceHistoryPoint[]>> | null,
  now: string): RosterValueTrend | null {
  if (playerIds === null) return null;
  const nowMs = Date.parse(now);
  if (!Number.isFinite(nowMs)) return null;
  const currentCents = new Map(quotes.filter(quote => quote.price >= 0 && Number.isSafeInteger(Math.round(quote.price * 100)))
    .map(quote => [quote.playerId, Math.round(quote.price * 100)]));
  const series: { time: number; cents: number }[][] = [];
  for (const id of new Set(playerIds)) {
    const current = currentCents.get(id);
    if (current === undefined) continue;
    // Only currently priced players take part, exactly as the valuation
    // total excludes the unpriced; a player with history but no current
    // quote never enters, so the series cannot fake a drop at the end.
    const byTime = new Map<number, number>();
    for (const point of history?.[id] ?? []) {
      const time = Date.parse(point.date);
      const cents = Math.round(point.price * 100);
      if (!Number.isFinite(time) || time > nowMs || !Number.isFinite(point.price) || point.price < 0 || !Number.isSafeInteger(cents)) continue;
      byTime.set(time, cents);
    }
    // The current modeled quote is the freshest point; it wins an
    // equal-instant tie against a just-recorded snapshot.
    byTime.set(nowMs, current);
    series.push([...byTime.entries()].map(([time, cents]) => ({ time, cents })).sort((a, b) => a.time - b.time));
  }
  if (!series.length) return null;
  const times = [...new Set(series.flatMap(points => points.map(point => point.time)))].sort((a, b) => a - b);
  const cursors = series.map(() => -1);
  const sums = times.map(time => {
    let cents = 0;
    let priced = 0;
    series.forEach((playerPoints, index) => {
      while (cursors[index] + 1 < playerPoints.length && playerPoints[cursors[index] + 1].time <= time) cursors[index]++;
      if (cursors[index] >= 0) { cents += playerPoints[cursors[index]].cents; priced++; }
    });
    return { time, cents, priced };
  });
  if (sums.length < 2) return null;
  let reduced = sums;
  if (reduced.length > TREND_POINT_CAP) {
    const byDay = new Map<string, { time: number; cents: number; priced: number }>();
    for (const point of reduced) byDay.set(new Date(point.time).toISOString().slice(0, 10), point);
    reduced = [...byDay.values()];
  }
  if (reduced.length > TREND_POINT_CAP) {
    const stride = Math.ceil(reduced.length / TREND_POINT_CAP);
    reduced = reduced.filter((_, index) => index % stride === 0 || index === reduced.length - 1);
  }
  if (reduced.length < 2) reduced = [sums[0], sums[sums.length - 1]];
  const points = reduced.map(point => ({
    date: new Date(point.time).toISOString(),
    value: point.cents / 100,
    priced: point.priced,
    current: point.time === nowMs,
  }));
  // The appended current quote never counts toward the recorded series:
  // fewer than two recorded points means there is no honest line to draw.
  if (points.filter(point => !point.current).length < 2) return null;
  return {
    points,
    delta: (reduced[reduced.length - 1].cents - reduced[0].cents) / 100,
    participants: series.length,
  };
}

/** Comparable complete current rosters only; equal totals share competition rank. */
export function rosterValueRank(own: RosterValuation, league: readonly RosterValuation[]): { rank: number; teams: number; tied: boolean } | null {
  if (!own.complete || own.total === null || !league.length || league.some(value => !value.complete || value.total === null)) return null;
  return { rank: 1 + league.filter(value => value.total! > own.total!).length,
    teams: league.length, tied: league.filter(value => value.total === own.total).length > 1 };
}
