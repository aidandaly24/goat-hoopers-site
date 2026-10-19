import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, expect, it, vi } from 'vitest';
import { personalizedFixture } from '@/test/personalized-home-fixture';
const mocks = vi.hoisted(() => ({ member: vi.fn(), account: vi.fn(), linked: vi.fn(), home: vi.fn(), ai: vi.fn(), market: vi.fn(), news: vi.fn(), guide: vi.fn() }));
vi.mock('@/app/actions', () => ({ getCurrentUser: mocks.member }));
vi.mock('next/headers', () => ({ headers: async () => new Headers() }));
vi.mock('@/data/friends-auth/config', () => ({ friendsAuthEnabled: () => true }));
vi.mock('@/data/friends-auth/runtime', () => ({ getVerifiedAccount: mocks.account }));
vi.mock('@/data/home-viewer', async importOriginal => ({ ...await importOriginal<typeof import('@/data/home-viewer')>(), hasHomeMembership: mocks.linked }));
vi.mock('@/data/league', () => ({ getCourtsideHomeData: mocks.home, getAiDecidesData: mocks.ai, getStockMarketData: mocks.market, getLeagueNewsEdition: mocks.news, getHomePlayerGuideSources: mocks.guide, getWeeklyArchive: () => [], getCourtsidePortraits: () => ({ '1-player-1': '/courtside/portraits/player-1362.png' }) }));
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
  expect(html[0]).toContain('data-personal-home="member" data-team-id="1"'); expect(html[0]).not.toContain('data-personal-home="member" data-team-id="4"');
  expect(html[1]).toContain('data-personal-home="member" data-team-id="4"'); expect(html[1]).not.toContain('data-personal-home="member" data-team-id="9"');
  expect(html[0]).toContain('src="/courtside/portraits/player-1362.png"');
  expect(html[1]).not.toContain('src="/courtside/portraits/player-1362.png"');
  expect(mocks.account).not.toHaveBeenCalled(); expect(mocks.linked).not.toHaveBeenCalled();
  const signedOut = renderToStaticMarkup(await Home()); expect(signedOut).not.toContain('data-personal-home');
});
it('offers the account claim path only for a verified account with no existing identity mapping', async () => {
  mocks.account.mockResolvedValue({ subject: 'private-fixture-subject', sessionId: 'private-fixture-session' });
  const html = renderToStaticMarkup(await Home()); expect(html).toContain('Claim my team');
  expect(mocks.linked).toHaveBeenCalledWith('private-fixture-subject');
  expect(html).not.toContain('private-fixture'); expect(mocks.market).not.toHaveBeenCalled();
  mocks.linked.mockResolvedValue(true);
  expect(renderToStaticMarkup(await Home())).not.toContain('data-personal-home');
});
it('keeps expired/unverified sessions signed out and a resolver outage free of any team identity', async () => {
  const html = renderToStaticMarkup(await Home()); expect(html).not.toContain('data-personal-home'); expect(mocks.market).not.toHaveBeenCalled();
  mocks.member.mockRejectedValue(Error('session unavailable'));
  const unavailable = renderToStaticMarkup(await Home()); expect(unavailable).toContain('Your team is temporarily unavailable'); expect(unavailable).not.toContain('data-personal-home="member"');
});
it('retains the team and public league content when market data is unavailable', async () => {
  mocks.member.mockResolvedValue({ teamId: '4' }); mocks.market.mockRejectedValue(Error('market unavailable'));
  const html = renderToStaticMarkup(await Home()); expect(html).toContain('data-personal-home="member" data-team-id="4"'); expect(html).toContain('Player values are temporarily unavailable'); expect(html).toContain('data-courtside-home');
});
