import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ account: vi.fn(), member: vi.fn(), authEnabled: vi.fn(), enrollmentEnabled: vi.fn() }));
vi.mock('next/headers', () => ({ headers: async () => new Headers() }));
vi.mock('@/data/friends-auth/config', () => ({ friendsAuthEnabled: mocks.authEnabled, friendsEnrollmentEnabled: mocks.enrollmentEnabled }));
vi.mock('@/data/friends-auth/runtime', () => ({ getVerifiedAccount: mocks.account, getProviderUser: mocks.member }));
vi.mock('@/surfaces/accounts/AccountForm', async () => {
  const { createElement } = await import('react');
  return {
    AccountForm: ({ mode, notice }: { mode: string; notice?: string }) =>
      createElement('div', { 'data-account-form-mode': mode }, notice),
  };
});
import AccountPage, { dynamic } from './page';
beforeEach(() => {
  vi.resetAllMocks();
  mocks.enrollmentEnabled.mockReturnValue(true);
  mocks.authEnabled.mockReturnValue(true);
  mocks.account.mockResolvedValue({ subject: 'fixture-subject', sessionId: 'fixture-session' });
  mocks.member.mockResolvedValue(null);
});
it('is force-dynamic', () => {
  expect(dynamic).toBe('force-dynamic');
});
it('gives a linked member an account home, not the change-password form (#187)', async () => {
  mocks.member.mockResolvedValue({ id: 'fixture-user', teamId: '3', displayName: 'Fixture Team', createdAt: new Date(0) });
  const html = renderToStaticMarkup(await AccountPage());
  expect(html).not.toContain('data-account-form-mode');
  expect(html).toContain('Your account');
  expect(html).toContain('Fixture Team');
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
