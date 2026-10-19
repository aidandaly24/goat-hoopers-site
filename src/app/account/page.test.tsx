import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ account: vi.fn(), member: vi.fn(), authEnabled: vi.fn(), enrollmentEnabled: vi.fn() }));
vi.mock('next/headers', () => ({ headers: async () => new Headers() }));
vi.mock('@/data/friends-auth/config', () => ({ friendsAuthEnabled: mocks.authEnabled, friendsEnrollmentEnabled: mocks.enrollmentEnabled }));
vi.mock('@/data/friends-auth/runtime', () => ({ getVerifiedAccount: mocks.account, getProviderUser: mocks.member }));
vi.mock('@/surfaces/accounts/AccountForm', async () => {
  const { createElement } = await import('react');
  return {
    AccountForm: ({ mode, notice, returnTo }: { mode: string; notice?: string; returnTo?: string }) =>
      createElement('div', { 'data-account-form-mode': mode, 'data-return-to': returnTo }, notice),
  };
});
import AccountPage, { dynamic } from './page';
beforeEach(() => {
  vi.resetAllMocks();
  mocks.enrollmentEnabled.mockReturnValue(true);
  mocks.authEnabled.mockReturnValue(true);
  mocks.account.mockResolvedValue({ subject: 'fixture-subject', sessionId: 'fixture-session', name: 'Fixture Account' });
  mocks.member.mockResolvedValue(null);
});
it('is force-dynamic', () => {
  expect(dynamic).toBe('force-dynamic');
});
it('gives a linked member an account home, not the change-password form (#187)', async () => {
  mocks.member.mockResolvedValue({ id: 'fixture-user', teamId: '3', displayName: 'Fixture Team', createdAt: new Date(0) });
  const html = renderToStaticMarkup(await AccountPage());
  expect(html).not.toContain('data-account-form-mode');
  expect(html).toContain('Account settings');
  expect(html).toContain('Fixture Account');
  expect(html.match(/<h1\b/g)).toHaveLength(1);
  expect(html).toContain('Your email account is linked to your existing team. Your team identity and history stay together.');
  expect(html).toContain('href="/team"');
  expect(html).toContain('My Team');
  expect(html).toContain('href="/account/password"');
  expect(html).toContain('Change account password');
});
it('keeps the unlinked claim branch unchanged, with the password link', async () => {
  const html = renderToStaticMarkup(await AccountPage());
  expect(html).toContain('data-account-form-mode="claim"');
  expect(html).toContain('href="/account/password"');
  expect(html).toContain('Change account password');
});
it('keeps the unlinked not-yet-enabled branch unchanged, with the password link', async () => {
  mocks.authEnabled.mockReturnValue(false);
  const html = renderToStaticMarkup(await AccountPage());
  expect(html).not.toContain('data-account-form-mode');
  expect(html).toContain('Your email account is ready');
  expect(html).toContain('href="/account/password"');
  expect(html).toContain('Change account password');
});

it('retains the intended safe destination through the supplied claim form', async () => {
  const html = renderToStaticMarkup(await AccountPage({ searchParams: Promise.resolve({ next: '/team' }) }));
  expect(html).toContain('data-return-to="/team"');
});
it('escapes the verified account name without exposing identity credentials', async () => {
  mocks.member.mockResolvedValue({ displayName: 'Member' });
  mocks.account.mockResolvedValue({ name: '<img src=x onerror=alert(1)>', subject: 'private-subject', sessionId: 'private-session' });
  const html = renderToStaticMarkup(await AccountPage());
  expect(html).toContain('&lt;img'); expect(html).not.toContain('<img src=x');
  expect(html).not.toContain('private-subject'); expect(html).not.toContain('private-session');
});
it('keeps signed-out settings behind login with the explicit account return', async () => {
  mocks.account.mockResolvedValue(null);
  await expect(AccountPage()).rejects.toMatchObject({ digest: 'NEXT_REDIRECT;replace;/account/login?next=%2Faccount;307;' });
  expect(mocks.member).not.toHaveBeenCalled();
});
it('keeps disabled enrollment behind the existing gate without private reads', async () => {
  mocks.enrollmentEnabled.mockReturnValue(false);
  await expect(AccountPage()).rejects.toMatchObject({ digest: 'NEXT_REDIRECT;replace;/login;307;' });
  expect(mocks.account).not.toHaveBeenCalled();
});
