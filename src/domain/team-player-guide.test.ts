import { describe, expect, it } from 'vitest';
import { buildTeamPlayerGuide, type PlayerGuideSources } from './team-player-guide';
const roster = Array.from({ length: 8 }, (_, index) => ({ id: String(index + 1), name: `Synthetic Player ${index + 1}`, espnId: null }));
function fixture(): Parameters<typeof buildTeamPlayerGuide>[0] & { sources: PlayerGuideSources } {
  const sources: PlayerGuideSources = { checkedAt: '2026-11-12T12:00:00Z', formSeason: '2026', form: Object.fromEntries(roster.map((p, i) => [p.id, { fppg: 40 - i, games: 8 }])), injuries: { '1': null, '2': 'Out', '3': 'Questionable' }, scheduledGames: null,
    completedWeek: { season: '2026', week: 2, teamId: '4', complete: true, startsAt: '2026-11-02T00:00:00Z', endsAt: '2026-11-09T00:00:00Z', players: roster.map((p, i) => ({ playerId: p.id, fantasyPoints: i * 10, gamesPlayed: 2, injuryNote: null })) } };
  return { teamId: '4', season: '2026', phase: 'in_season', currentWeek: 3, now: sources.checkedAt, roster, market: roster.map(p => ({ playerId: p.id, prevPrice: 20, changePct: 10 })), sources };
}
describe('weekly player guide evidence and boundaries', () => {
  it('prints separate EMA and recorded-point bases, retains zero with verified games, and never mutates inputs', () => {
    const input = fixture(), before = JSON.stringify(input), result = buildTeamPlayerGuide(input);
    expect(result.watch.basis).toBe('form'); expect(result.watch.rows.map(p => p.id)).toEqual(['1', '3', '4']);
    expect(result.best.map(p => p.value)).toEqual([70, 60, 50]); expect(result.rough[0]).toMatchObject({ id: '1', value: 0, games: 2 });
    expect(result.period).toContain('2026 · Week 2'); expect(JSON.stringify(input)).toBe(before);
  });
  it.each(['pre_season', 'pre_draft'])('has no prior week during %s and labels watch as market movement', phase => {
    const result = buildTeamPlayerGuide({ ...fixture(), phase, currentWeek: 1 });
    expect(result.previousWeek).toBeNull(); expect(result.best).toEqual([]); expect(result.rough).toEqual([]);
    expect(result.watch.basis).toBe('market'); expect(result.watch.message).toContain('not observed performance'); expect(result.watch.rows.every(p => p.id !== '2')).toBe(true);
  });
  it('does not carry previous-season results into Week 1 or select a period from the wall-clock year', () => {
    const input = fixture(); input.currentWeek = 1; input.sources.completedWeek!.season = '2025';
    expect(buildTeamPlayerGuide(input).previousWeek).toBeNull(); expect(buildTeamPlayerGuide(input).best).toEqual([]);
    input.currentWeek = 3; input.sources.completedWeek!.season = '2026'; input.sources.completedWeek!.startsAt = '2026-12-28T00:00:00Z'; input.sources.completedWeek!.endsAt = '2027-01-04T00:00:00Z'; input.now = '2027-01-04T00:00:00Z';
    expect(buildTeamPlayerGuide(input).best).toHaveLength(3);
  });
  it.each(['season', 'week', 'team', 'incomplete', 'future end', 'invalid period'])('does not rank a mismatched %s week', variant => {
    const input = fixture(), week = input.sources.completedWeek!;
    if (variant === 'season') week.season = '2025';
    if (variant === 'week') week.week = 3;
    if (variant === 'team') week.teamId = '1';
    if (variant === 'incomplete') week.complete = false;
    if (variant === 'future end') week.endsAt = '2026-11-13T00:00:00Z';
    if (variant === 'invalid period') week.endsAt = week.startsAt;
    expect(buildTeamPlayerGuide(input).best).toEqual([]); expect(buildTeamPlayerGuide(input).rough).toEqual([]);
  });
  it('accepts the exact completed boundary and rejects the instant before it', () => {
    const input = fixture(); input.now = input.sources.completedWeek!.endsAt;
    expect(buildTeamPlayerGuide(input).best).toHaveLength(3);
    input.now = new Date(Date.parse(input.now) - 1).toISOString(); expect(buildTeamPlayerGuide(input).best).toEqual([]);
  });
  it('excludes no-game and unknown participation, preserves sparse played samples and factual injury notes', () => {
    const input = fixture(); input.sources.completedWeek!.players = [
      { playerId: '1', fantasyPoints: 0, gamesPlayed: 0, injuryNote: 'Did not play' },
      { playerId: '2', fantasyPoints: 0, gamesPlayed: null, injuryNote: null },
      { playerId: '3', fantasyPoints: null, gamesPlayed: 2, injuryNote: null },
      { playerId: '4', fantasyPoints: 0, gamesPlayed: 1, injuryNote: 'Source reports an injury-shortened week' },
    ];
    const result = buildTeamPlayerGuide(input); expect(result.eligiblePlayed).toBe(1);
    expect(result.best).toHaveLength(1); expect(result.rough).toHaveLength(1);
    expect(result.rough[0]).toMatchObject({ id: '4', value: 0, games: 1, note: 'Source reports an injury-shortened week' }); expect(result.coverage).toContain('may overlap');
  });
  it('does not infer form from a one-game/zero-game sample, an unkeyed EMA season, injury or zero scheduled games', () => {
    const input = fixture(); input.sources.form['1'].games = 1; input.sources.form['3'].games = 0; input.sources.scheduledGames = { '4': 0 };
    expect(buildTeamPlayerGuide(input).watch.rows.map(p => p.id)).toEqual(['5', '6', '7']);
    input.sources.formSeason = null; expect(buildTeamPlayerGuide(input).watch.rows).toEqual([]);
  });
  it('does not invent market risers from absent/zero baselines or a price fall', () => {
    const input = fixture(); input.phase = 'pre_season'; input.market = [{ playerId: '1', changePct: 10, prevPrice: null }, { playerId: '3', changePct: 10, prevPrice: 0 }, { playerId: '4', changePct: -3, prevPrice: 20 }];
    expect(buildTeamPlayerGuide(input).watch.rows).toEqual([]);
  });
  it.each(['off_season', 'complete', 'unknown'])('has honest inactive states during %s', phase => {
    const result = buildTeamPlayerGuide({ ...fixture(), phase }); expect(result.watch.rows).toEqual([]); expect(result.best).toEqual([]); expect(result.rough).toEqual([]); expect(result.currentWeek).toBeNull();
  });
  it('does not infer a current period or last week from missing source week', () => {
    const result = buildTeamPlayerGuide({ ...fixture(), currentWeek: null }); expect(result.currentWeek).toBeNull(); expect(result.previousWeek).toBeNull(); expect(result.best).toEqual([]);
  });
});
