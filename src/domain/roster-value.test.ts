import { expect, it } from 'vitest';
import { rosterValueRank, summarizeRosterValue } from './roster-value';
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
it('ranks complete totals with shared ties and rejects uneven coverage', () => {
  const value = (price: number) => summarizeRosterValue(['a'], [{ playerId: 'a', price }]);
  expect(rosterValueRank(value(20), [value(30), value(20), value(20), value(10)])).toEqual({ rank: 2, teams: 4, tied: true });
  expect(rosterValueRank(value(20), [value(30), summarizeRosterValue(['missing'], [])])).toBeNull();
});
