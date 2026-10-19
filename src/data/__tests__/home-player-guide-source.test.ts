import { expect, it, vi } from 'vitest';
import { getHomePlayerGuideSources } from '../league';
it('projects existing same-request market inputs without inventing weekly participation or an EMA season', async () => {
  const loadInputs = vi.fn(async () => ({ now: Date.parse('2026-10-19T00:00:00Z'), players: { '1': { injury_status: 'Out' }, '2': { injury_status: null }, '3': {} }, statProfiles: { '1': { fppg: 10, careerMinutes: 1000, emaFppg: 20, emaGames: 5, leaguePick: null, seasonHistory: [] } } }));
  const result = await getHomePlayerGuideSources(loadInputs);
  expect(loadInputs).toHaveBeenCalledOnce(); expect(result.injuries).toEqual({ '1': 'Out', '2': null });
  expect(result.form['1']).toEqual({ fppg: 20, games: 5 }); expect(result.formSeason).toBeNull(); expect(result.completedWeek).toBeNull(); expect(result.scheduledGames).toBeNull();
});
