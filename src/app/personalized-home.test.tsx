import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, expect, it, vi } from 'vitest';
import { personalizedFixture } from '@/test/personalized-home-fixture';
const mocks = vi.hoisted(() => ({ member: vi.fn(), account: vi.fn(), linked: vi.fn(), home: vi.fn(), ai: vi.fn(), market: vi.fn(), news: vi.fn(), guide: vi.fn() }));
vi.mock('@/app/actions', () => ({ getCurrentUser: mocks.member }));
vi.mock('next/headers', () => ({ headers: async () => new Headers() }));
vi.mock('@/data/friends-auth/config', () => ({ friendsAuthEnabled: () => true }));
vi.mock('@/data/friends-auth/runtime', () => ({ getVerifiedAccount: mocks.account }));
vi.mock('@/data/home-viewer', async importOriginal => ({ ...await importOriginal<typeof import('@/data/home-viewer')>(), hasHomeMembership: mocks.linked }));
vi.mock('@/data/league', () => ({ getCourtsideHomeData: mocks.home, getAiDecidesData: mocks.ai, getStockMarketData: mocks.market, getLeagueNewsEdition: mocks.news, getHomePlayerGuideSources: mocks.guide, getWeeklyArchive: () => [], getCourtsidePortraits: () => ({}) }));
import Home, { dynamic } from './page';
beforeEach(() => {
  vi.resetAllMocks(); const fixture = personalizedFixture();
  mocks.member.mockResolvedValue(null); mocks.account.mockResolvedValue(null); mocks.linked.mockResolvedValue(false);
  mocks.home.mockResolvedValue(fixture.home); mocks.ai.mockResolvedValue({ weekly: fixture.weekly }); mocks.market.mockResolvedValue(fixture.market); mocks.news.mockResolvedValue(null); mocks.guide.mockResolvedValue(null);
});
it('renders two concurrent server identities independently and ignores client team selectors', async () => {
  expect(dynamic).toBe('force-dynamic');
  mocks.member.mockResolvedValueOnce({ teamId: '1' }).mockResolvedValueOnce({ teamId: '4' });
  const outputs = await Promise.all([Home(), Reflect.apply(Home, null, [{ searchParams: Promise.resolve({ teamId: '9' }) }])]);
  const html = outputs.map(output => renderToStaticMarkup(output));
  expect(html[0]).toContain('data-hero'); expect(html[0]).toContain('Fixture Club 1 vs Fixture Club 2'); expect(html[0]).not.toContain('Fixture Club 3 vs Fixture Club 4');
  expect(html[1]).toContain('data-hero'); expect(html[1]).toContain('Fixture Club 3 vs Fixture Club 4'); expect(html[1]).not.toContain('Fixture Club 9 vs Fixture Club 10');
  expect(mocks.account).not.toHaveBeenCalled(); expect(mocks.linked).not.toHaveBeenCalled();
  const signedOut = renderToStaticMarkup(await Home()); expect(signedOut).not.toContain('data-hero'); expect(signedOut).not.toContain('data-home-notice');
});
it('offers the account claim path only for a verified account with no existing identity mapping', async () => {
  mocks.account.mockResolvedValue({ subject: 'private-fixture-subject', sessionId: 'private-fixture-session' });
  const html = renderToStaticMarkup(await Home()); expect(html).toContain('Claim my team');
  expect(mocks.linked).toHaveBeenCalledWith('private-fixture-subject');
  expect(html).not.toContain('private-fixture'); expect(html).not.toContain('data-hero');
  // The market read is the root ticker's shared request result (league faces);
  // it carries no team identity for a non-member.
  expect(mocks.market).toHaveBeenCalled();
  mocks.linked.mockResolvedValue(true);
  const linked = renderToStaticMarkup(await Home()); expect(linked).not.toContain('data-hero'); expect(linked).not.toContain('data-home-notice');
});
it('keeps expired/unverified sessions signed out and a resolver outage free of any team identity', async () => {
  const html = renderToStaticMarkup(await Home()); expect(html).not.toContain('data-hero'); expect(html).not.toContain('data-home-notice');
  mocks.member.mockRejectedValue(Error('session unavailable'));
  const unavailable = renderToStaticMarkup(await Home()); expect(unavailable).toContain('Your team is temporarily unavailable'); expect(unavailable).not.toContain('data-hero');
});
it('retains the hero and public league content when market data is unavailable', async () => {
  mocks.member.mockResolvedValue({ teamId: '4' }); mocks.market.mockRejectedValue(Error('market unavailable'));
  const html = renderToStaticMarkup(await Home()); expect(html).toContain('data-hero'); expect(html).toContain('Fixture Club 3 vs Fixture Club 4'); expect(html).toContain('>Unavailable<'); expect(html).toContain('data-courtside-home'); expect(html).not.toContain('data-faces-strip');
});
