import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { personalizedFixture } from '@/test/personalized-home-fixture';
import { homeLineupPowerFixture } from '@/test/home-lineup-power-fixture';
const mocks = vi.hoisted(() => ({ member: vi.fn(), account: vi.fn(), linked: vi.fn(), home: vi.fn(), ai: vi.fn(), power: vi.fn(), market: vi.fn(), news: vi.fn(), guide: vi.fn(), snapshotHistory: vi.fn(async () => ({})) }));
vi.mock('@/app/actions', () => ({ getCurrentUser: mocks.member }));
vi.mock('next/headers', () => ({ headers: async () => new Headers() }));
vi.mock('@/data/friends-auth/config', () => ({ friendsAuthEnabled: () => true }));
vi.mock('@/data/friends-auth/runtime', () => ({ getVerifiedAccount: mocks.account }));
vi.mock('@/data/home-viewer', async importOriginal => ({ ...await importOriginal<typeof import('@/data/home-viewer')>(), hasHomeMembership: mocks.linked }));
vi.mock('@/data/league', async () => ({ getCourtsideHomeData: mocks.home, getAiDecidesData: mocks.ai, getHomeLineupPowerSource: mocks.power, buildHomeLineupPower: (await import('@/data/home-lineup-power')).buildHomeLineupPower, getStockMarketData: mocks.market, getLeagueNewsEdition: mocks.news, getHomePlayerGuideSources: mocks.guide, getRosterSnapshotHistory: mocks.snapshotHistory, getWeeklyArchive: () => [], getCourtsidePortraits: () => ({}) }));
vi.mock('@/data/team-value-history', () => ({ getTeamValueHistory: async () => null }));
import Home, { dynamic } from './page';
beforeEach(() => {
  vi.resetAllMocks(); const fixture = personalizedFixture();
  mocks.member.mockResolvedValue(null); mocks.account.mockResolvedValue(null); mocks.linked.mockResolvedValue(false);
  mocks.home.mockResolvedValue(fixture.home); mocks.ai.mockResolvedValue({ weekly: fixture.weekly }); mocks.market.mockResolvedValue(fixture.market); mocks.news.mockResolvedValue(null); mocks.guide.mockResolvedValue(null);
  mocks.power.mockResolvedValue(homeLineupPowerFixture());
});
const deskOf = (html: string) => html.match(/<aside[^>]*data-team-desk[^]*?<\/aside>/)?.[0] ?? '';
it('renders two concurrent server identities independently and ignores client team selectors', async () => {
  expect(dynamic).toBe('force-dynamic');
  mocks.member.mockResolvedValueOnce({ teamId: '1' }).mockResolvedValueOnce({ teamId: '4' });
  const outputs = await Promise.all([Home(), Reflect.apply(Home, null, [{ searchParams: Promise.resolve({ teamId: '9' }) }])]);
  const html = outputs.map(output => renderToStaticMarkup(output));
  // The headline is the edition's; identity lives in the team desk.
  expect(html[0]).toContain('data-team-desk'); expect(deskOf(html[0])).toContain('Fixture Club 1'); expect(deskOf(html[0])).toContain('Fixture Club 2'); expect(deskOf(html[0])).not.toContain('Fixture Club 3');
  expect(html[1]).toContain('data-team-desk'); expect(deskOf(html[1])).toContain('Fixture Club 4'); expect(deskOf(html[1])).toContain('Fixture Club 3'); expect(deskOf(html[1])).not.toContain('Fixture Club 9');
  expect(mocks.account).not.toHaveBeenCalled(); expect(mocks.linked).not.toHaveBeenCalled();
  const signedOut = renderToStaticMarkup(await Home()); expect(signedOut).not.toContain('data-team-desk'); expect(signedOut).toContain('data-league-desk'); expect(signedOut).not.toContain('data-home-notice');
  for (const output of [...html, signedOut]) {
    expect(output).toContain('data-home-power="available"');
    expect(output.match(/data-power-team=/g)).toHaveLength(10);
  }
  expect(mocks.power).toHaveBeenCalledTimes(3);
  for (const args of mocks.power.mock.calls) expect(args).toEqual([]);
});
it('offers the account claim path only for a verified account with no existing identity mapping', async () => {
  mocks.account.mockResolvedValue({ subject: 'private-fixture-subject', sessionId: 'private-fixture-session' });
  const html = renderToStaticMarkup(await Home()); expect(html).toContain('Claim my team');
  expect(mocks.linked).toHaveBeenCalledWith('private-fixture-subject');
  expect(html).not.toContain('private-fixture'); expect(html).not.toContain('data-team-desk');
  // The market read is the root ticker's shared request result (league faces);
  // it carries no team identity for a non-member.
  expect(mocks.market).toHaveBeenCalled();
  mocks.linked.mockResolvedValue(true);
  const linked = renderToStaticMarkup(await Home()); expect(linked).not.toContain('data-team-desk'); expect(linked).not.toContain('data-home-notice');
});
it('keeps expired/unverified sessions signed out and a resolver outage free of any team identity', async () => {
  const html = renderToStaticMarkup(await Home()); expect(html).not.toContain('data-team-desk'); expect(html).not.toContain('data-home-notice');
  mocks.member.mockRejectedValue(Error('session unavailable'));
  const unavailable = renderToStaticMarkup(await Home()); expect(unavailable).toContain('Your team is temporarily unavailable'); expect(unavailable).not.toContain('data-team-desk');
});
it('retains the desk and public league content when market data is unavailable', async () => {
  mocks.member.mockResolvedValue({ teamId: '4' }); mocks.market.mockRejectedValue(Error('market unavailable'));
  const html = renderToStaticMarkup(await Home()); expect(html).toContain('data-team-desk'); expect(deskOf(html)).toContain('Fixture Club 4'); expect(deskOf(html)).toContain('Fixture Club 3'); expect(html).toContain('Roster value unavailable'); expect(html).toContain('data-courtside-home'); expect(html).not.toContain('data-faces-strip');
});
