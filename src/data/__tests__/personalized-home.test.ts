import { describe, expect, it, vi } from 'vitest';
import { buildPersonalizedHome } from '../personalized-home';
import { loadHomeViewer } from '../home-viewer';
import { personalizedFixture } from '@/test/personalized-home-fixture';

function summary(id: string, fixture = personalizedFixture()) {
  const result = buildPersonalizedHome({ kind: 'member', teamId: id }, fixture.home, fixture.weekly, fixture.market);
  if (result.kind !== 'member' || !result.summary) throw Error('Expected member summary');
  return result.summary;
}

describe('request-private homepage viewer', () => {
  it('resolves independent concurrent identities without retaining the previous viewer', async () => {
    const account = vi.fn(), hasMembership = vi.fn(async () => false);
    const viewers = await Promise.all(['1', '4'].map(teamId => loadHomeViewer({ member: async () => ({ teamId }), account, hasMembership })));
    expect(viewers).toEqual([{ kind: 'member', teamId: '1' }, { kind: 'member', teamId: '4' }]);
    expect(account).not.toHaveBeenCalled();
    expect(await loadHomeViewer({ member: async () => null, account: async () => null, hasMembership: async () => false })).toEqual({ kind: 'signed_out' });
  });
  it('offers claims only for a verified account without active membership and omits credentials', async () => {
    expect(await loadHomeViewer({ member: async () => null, account: async () => ({ subject: 'private-fixture', sessionId: 'private-session' }), hasMembership: async () => false })).toEqual({ kind: 'unclaimed' });
  });
  it('does not treat an inactive or orphaned existing link as permission to claim another team', async () => {
    expect(await loadHomeViewer({ member: async () => null, account: async () => ({ subject: 'inactive-fixture' }), hasMembership: async () => true })).toEqual({ kind: 'signed_out' });
  });
  it('fails closed on session/link lookup failure rather than falling back to a client-selected team', async () => {
    const account = vi.fn(), hasMembership = vi.fn(async () => false);
    expect(await loadHomeViewer({ member: async () => { throw Error('session unavailable'); }, account, hasMembership })).toEqual({ kind: 'unavailable' });
    expect(account).not.toHaveBeenCalled();
  });
});

describe('one homepage projection for ten roster identities', () => {
  it.each(Array.from({ length: 10 }, (_, i) => String(i + 1)))('joins only team %s and its roster, standing and saved pairing', id => {
    const fixture = personalizedFixture(), before = JSON.stringify(fixture), fetch = vi.spyOn(globalThis, 'fetch');
    try {
      const view = summary(id, fixture);
      expect(view.team.id).toBe(id); expect(view.standing?.team.id).toBe(id);
      expect(view.matchup && [view.matchup.home.id, view.matchup.away.id]).toContain(id);
      expect(view.players.map(p => p.id)).toEqual([`${id}-player-1`, `${id}-player-2`, `${id}-player-0`]);
      expect(view.ai?.pick.teamIds).toContain(id); expect(view.ai?.opponent.id).not.toBe(id);
      expect(JSON.stringify(fixture)).toBe(before); expect(fetch).not.toHaveBeenCalled();
    } finally { fetch.mockRestore(); }
  });
  it('preserves known zero and unknown scores, and does not choose the largest probability as model choice', () => {
    const view = summary('1');
    expect(view.matchup?.homePoints).toBe(0); expect(view.matchup?.awayPoints).toBeNull();
    expect(view.ai?.pick.result?.choice).toBe('2');
    expect(view.ai?.pick.result?.probabilities.find(p => p.choice === '1')?.probability).toBe(.65);
  });
  it.each(['off_season', 'complete', 'unknown'])('suppresses retained pairings and AI during %s', status => {
    const fixture = personalizedFixture(); fixture.home.hub!.season.status = status;
    const view = summary('4', fixture); expect(view.matchup).toBeNull(); expect(view.ai).toBeNull();
  });
  it('uses no guessed team if membership is unknown or public team data is down', () => {
    const fixture = personalizedFixture();
    expect(buildPersonalizedHome({ kind: 'member', teamId: '999' }, fixture.home, fixture.weekly, fixture.market)).toEqual({ kind: 'member', summary: null });
    expect(buildPersonalizedHome({ kind: 'member', teamId: '1' }, { ...fixture.home, hub: null }, fixture.weekly, fixture.market)).toEqual({ kind: 'member', summary: null });
  });
  it.each(['signed_out', 'unclaimed', 'unavailable'] as const)('keeps %s separate from public team data', kind => {
    const fixture = personalizedFixture(); expect(buildPersonalizedHome({ kind }, fixture.home, fixture.weekly, fixture.market)).toEqual({ kind });
  });
  it('keeps missing/invalid prices unavailable, excludes non-roster players and reports partial coverage', () => {
    const fixture = personalizedFixture(); fixture.market.stocks[0].price = NaN; fixture.market.stocks[1].price = -1;
    fixture.market.stocks.push({ ...fixture.market.stocks[4], playerId: 'unrostered', price: 1000000 });
    const view = summary('1', fixture); expect(view.players.map(p => p.id)).toEqual(['1-player-2', '1-player-3']); expect(view.coverage).toEqual({ priced: 2, roster: 4 });
    expect(buildPersonalizedHome({ kind: 'member', teamId: '1' }, fixture.home, fixture.weekly, null)).toMatchObject({ summary: { players: [], market: null } });
  });
  it.each(['league', 'season', 'week', 'pair', 'missing', 'unavailable', 'invalid probability', 'invalid choice'])('omits mismatched %s AI without inventing a fallback', state => {
    const fixture = personalizedFixture();
    if (state === 'league') fixture.weekly.leagueId = 'different';
    if (state === 'season') fixture.weekly.season = '2025';
    if (state === 'week') fixture.weekly.week = 4;
    if (state === 'pair') fixture.weekly.matchups[0].teamIds = ['1', '4'];
    if (state === 'missing') fixture.weekly.matchups = [];
    if (state === 'unavailable') fixture.weekly.status = 'unavailable';
    if (state === 'invalid probability') fixture.weekly.matchups[0].result!.probabilities[0].probability = 1.2;
    if (state === 'invalid choice') fixture.weekly.matchups[0].result!.choice = '9';
    expect(summary('1', fixture).ai).toBeNull();
  });
  it('preserves matching stale AI as explicitly stale', () => {
    const fixture = personalizedFixture(); fixture.weekly.status = 'stale'; expect(summary('1', fixture).ai?.status).toBe('stale');
  });
  it('accepts the explicit preseason Week 1 snapshot at source leg 0/1 despite a different current pairing week', () => {
    for (const sourceLeg of [0, 1]) {
      const fixture = personalizedFixture(); fixture.home.hub!.season.status = 'pre_season'; fixture.weekly.week = 1;
      fixture.weekly.snapshot = { hash: 'fixture', model: 'fixture-model', promptVersion: 'fixture-v2', capturedAt: fixture.home.checkedAt, cutoffAt: fixture.home.checkedAt, startsAt: null, endsAt: null, statsSeason: '2025', scoringMode: 'unknown', baselineVersion: 'fixture', comparison: 'preseason_lineup_preview', sourceLeg };
      expect(summary('1', fixture).ai).toMatchObject({ label: 'Preseason lineup preview', week: 1 });
      fixture.weekly.snapshot.sourceLeg = 2; expect(summary('1', fixture).ai).toBeNull();
    }
  });
});

it('filters team news by current roster IDs and moves by team ID, without guessing unknown coverage', () => {
  const fixture = personalizedFixture();
  for (const id of ['1', '4']) {
    const result = buildPersonalizedHome({ kind: 'member', teamId: id }, fixture.home, fixture.weekly, fixture.market, fixture.news);
    expect(result).toMatchObject({ summary: { newsAvailable: true, news: [{ id: `fixture-news-${id}` }], moves: [{ id: `fixture-move-${id}` }] } });
  }
  fixture.news.coverage.rosters = 'unknown';
  expect(buildPersonalizedHome({ kind: 'member', teamId: '1' }, fixture.home, fixture.weekly, fixture.market, fixture.news)).toMatchObject({ summary: { newsAvailable: false, news: [] } });
});
it('keeps absent historical changes unknown and real flat/down values distinct', () => {
  const fixture = personalizedFixture(); fixture.market.stocks[1].prevPrice = null;
  const view = summary('1', fixture);
  expect(view.players[0].changePct).toBeNull(); expect(view.players[1].changePct).toBe(0); expect(view.players[2].changePct).toBe(-50);
});

it('values every roster player, exposes unknown rows and suppresses rank when league pricing is incomplete', () => {
  const fixture = personalizedFixture();
  const view = summary('1', fixture);
  expect(view.valuation).toMatchObject({ total: 110, priced: 4, unpriced: 0, complete: true, rank: { rank: 1, teams: 10, tied: true } });
  expect(view.rosterValues).toHaveLength(4);
  fixture.market.stocks = fixture.market.stocks.filter(quote => quote.playerId !== '9-player-1');
  expect(summary('1', fixture).valuation.rank).toBeNull();
  fixture.market.stocks = fixture.market.stocks.filter(quote => quote.playerId !== '1-player-1');
  expect(summary('1', fixture).valuation).toMatchObject({ total: 70, priced: 3, unpriced: 1, complete: false, rank: null });
  expect(summary('1', fixture).rosterValues.find(player => player.id === '1-player-1')?.value).toBeNull();
});
it('does not treat a foreign pairing or an absent roster as the viewer\'s evidence', () => {
  const fixture = personalizedFixture(); fixture.home.directory[0].currentMatchup = fixture.home.directory[3].currentMatchup;
  expect(summary('1', fixture).matchup).toBeNull();
  fixture.home.directory = fixture.home.directory.filter(entry => entry.identity.id !== '1');
  expect(summary('1', fixture).valuation).toMatchObject({ total: null, knownRoster: false, complete: false, rank: null });
});
