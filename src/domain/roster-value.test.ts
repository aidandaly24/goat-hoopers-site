import { describe, expect, it } from 'vitest';
import { rosterValueRank, rosterValueTrend, summarizeRosterValue } from './roster-value';
it('sums the full roster with exact cents, deduplicates IDs, and keeps unpriced players unknown', () => {
  const quotes = [{ playerId: 'a', price: 10.11 }, { playerId: 'b', price: 20.22 }, { playerId: 'c', price: 0 }];
  expect(summarizeRosterValue(['a', 'b', 'a', 'c'], quotes)).toMatchObject({ total: 30.33, priced: 3, unpriced: 0, complete: true });
  expect(summarizeRosterValue(['a', 'missing'], quotes)).toMatchObject({ total: 10.11, priced: 1, unpriced: 1, complete: false, players: [{ id: 'a', value: 10.11 }, { id: 'missing', value: null }] });
});
it('distinguishes known zero/empty from missing quotes, missing roster and invalid values', () => {
  expect(summarizeRosterValue(['zero'], [{ playerId: 'zero', price: 0 }]).total).toBe(0);
  expect(summarizeRosterValue([], []).total).toBe(0);
  expect(summarizeRosterValue(null, []).total).toBeNull();
  expect(summarizeRosterValue(['x'], []).total).toBeNull();
  for (const price of [NaN, Infinity, -1, Number.MAX_VALUE]) expect(summarizeRosterValue(['x'], [{ playerId: 'x', price }]).total).toBeNull();
});
describe('rosterValueTrend', () => {
  const now = '2026-11-10T12:00:00.000Z';
  const point = (date: string, price: number) => ({ date, price, source: 'live' as const });

  it('sums priced players per recorded instant, carrying each last recorded price forward', () => {
    const trend = rosterValueTrend(['a', 'b'],
      [{ playerId: 'a', price: 30 }, { playerId: 'b', price: 7 }],
      { a: [point('2026-11-01T12:00:00Z', 10), point('2026-11-05T12:00:00Z', 25)],
        b: [point('2026-11-03T12:00:00Z', 5)] }, now);
    expect(trend).toEqual({
      points: [
        { date: '2026-11-01T12:00:00.000Z', value: 10, priced: 1, current: false },
        { date: '2026-11-03T12:00:00.000Z', value: 15, priced: 2, current: false },
        { date: '2026-11-05T12:00:00.000Z', value: 30, priced: 2, current: false },
        { date: '2026-11-10T12:00:00.000Z', value: 37, priced: 2, current: true },
      ],
      delta: 27,
      participants: 2,
    });
  });

  it('never backfills a player before their first recorded point and excludes the currently unpriced', () => {
    const trend = rosterValueTrend(['a', 'gone', 'late'],
      [{ playerId: 'a', price: 10 }, { playerId: 'late', price: 4 }],
      { a: [point('2026-11-01T12:00:00Z', 8), point('2026-11-04T12:00:00Z', 9)], gone: [point('2026-11-01T12:00:00Z', 99), point('2026-11-02T12:00:00Z', 99)] }, now);
    // 'gone' has history but no current quote: excluded entirely, so no
    // fake end-of-series drop. 'late' has no history: enters only at now.
    expect(trend).toEqual({
      points: [
        { date: '2026-11-01T12:00:00.000Z', value: 8, priced: 1, current: false },
        { date: '2026-11-04T12:00:00.000Z', value: 9, priced: 1, current: false },
        { date: '2026-11-10T12:00:00.000Z', value: 14, priced: 2, current: true },
      ],
      delta: 6,
      participants: 2,
    });
  });

  it('returns null under two recorded instants, for a missing roster, and with no priced players', () => {
    expect(rosterValueTrend(['a'], [{ playerId: 'a', price: 10 }], null, now)).toBeNull();
    expect(rosterValueTrend(['a'], [{ playerId: 'a', price: 10 }], { a: [] }, now)).toBeNull();
    // One recorded snapshot plus the appended current quote is not a
    // recorded series — the surface must show an unavailable state.
    expect(rosterValueTrend(['a'], [{ playerId: 'a', price: 10 }], { a: [point('2026-11-01T12:00:00Z', 8)] }, now)).toBeNull();
    expect(rosterValueTrend(null, [{ playerId: 'a', price: 10 }], { a: [point('2026-11-01T12:00:00Z', 8), point('2026-11-02T12:00:00Z', 9)] }, now)).toBeNull();
    expect(rosterValueTrend(['a'], [], { a: [point('2026-11-01T12:00:00Z', 8), point('2026-11-02T12:00:00Z', 9)] }, now)).toBeNull();
    expect(rosterValueTrend(['a'], [{ playerId: 'a', price: 10 }], { a: [point('2026-11-01T12:00:00Z', 8), point('2026-11-02T12:00:00Z', 9)] }, 'not-a-date')).toBeNull();
  });

  it('drops invalid and future points, and the current quote wins an equal-instant tie', () => {
    const trend = rosterValueTrend(['a'], [{ playerId: 'a', price: 12 }],
      { a: [point('2026-11-01T12:00:00Z', 8), point('2026-11-03T12:00:00Z', 9), point('2026-12-01T12:00:00Z', 50),
        point('not-a-date', 3), point('2026-11-02T12:00:00Z', -4), point('2026-11-10T12:00:00Z', 99)] }, now);
    expect(trend).toEqual({
      points: [
        { date: '2026-11-01T12:00:00.000Z', value: 8, priced: 1, current: false },
        { date: '2026-11-03T12:00:00.000Z', value: 9, priced: 1, current: false },
        { date: '2026-11-10T12:00:00.000Z', value: 12, priced: 1, current: true },
      ],
      delta: 4,
      participants: 1,
    });
  });

  it('keeps exact cents across the series and reports a signed delta', () => {
    const trend = rosterValueTrend(['a', 'b'],
      [{ playerId: 'a', price: 10.11 }, { playerId: 'b', price: 20.22 }],
      { a: [point('2026-11-01T12:00:00Z', 11.11)], b: [point('2026-11-01T12:00:00Z', 22.22), point('2026-11-05T12:00:00Z', 21)] }, now);
    expect(trend?.points[0].value).toBe(33.33);
    expect(trend?.points[1].value).toBe(32.11);
    expect(trend?.points[trend.points.length - 1].value).toBe(30.33);
    expect(trend?.delta).toBe(-3);
  });

  it('reduces an over-budget series by selecting real sums only, endpoints kept', () => {
    const days = Array.from({ length: 90 }, (_, index) => point(new Date(Date.UTC(2026, 8, 1 + index)).toISOString(), 100 + index));
    const trend = rosterValueTrend(['a'], [{ playerId: 'a', price: 500 }], { a: days }, '2026-12-15T12:00:00.000Z');
    expect(trend).not.toBeNull();
    expect(trend!.points.length).toBeLessThanOrEqual(48);
    expect(trend!.points[0]).toMatchObject({ date: days[0].date, value: 100, priced: 1, current: false });
    expect(trend!.points[trend!.points.length - 1].value).toBe(500);
    // Every rendered point is an unmodified recorded sum (100 + day index,
    // or the current quote) — selection never averages.
    for (const rendered of trend!.points.slice(0, -1)) {
      const dayIndex = (Date.parse(rendered.date) - Date.UTC(2026, 8, 1)) / 86400000;
      expect(rendered.value).toBe(100 + dayIndex);
    }
  });
});

it('ranks complete totals with shared ties and rejects uneven coverage', () => {
  const value = (price: number) => summarizeRosterValue(['a'], [{ playerId: 'a', price }]);
  expect(rosterValueRank(value(20), [value(30), value(20), value(20), value(10)])).toEqual({ rank: 2, teams: 4, tied: true });
  expect(rosterValueRank(value(20), [value(30), summarizeRosterValue(['missing'], [])])).toBeNull();
});
