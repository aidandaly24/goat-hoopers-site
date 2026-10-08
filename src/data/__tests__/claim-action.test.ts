/** Post-commit session recovery and used-invite authorization regressions; no live accounts. */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createHash } from 'node:crypto';
import type { GameStore } from '@/data/arcade';

const harness = vi.hoisted(() => ({
  store: null as GameStore | null,
  events: [] as string[],
  failCookie: false,
}));

vi.mock('@/data/arcade', async importOriginal => ({
  ...await importOriginal<typeof import('@/data/arcade')>(),
  getGameStore: () => harness.store,
}));
vi.mock('next/headers', () => ({
  headers: async () => ({ get: () => 'fixture-client' }),
  cookies: async () => ({
    set: () => {
      harness.events.push('cookie');
      if (harness.failCookie) throw new Error('fixture-cookie-failure');
    },
  }),
}));
vi.mock('next/navigation', () => ({
  redirect: () => { harness.events.push('redirect'); throw new Error('fixture-redirect'); },
}));
vi.mock('bcryptjs', () => ({
  hash: async (password: string) => `fixture:${password}`,
  compare: async (password: string, stored: string) => stored === `fixture:${password}`,
}));

import { FakeGameStore } from '@/data/arcade';
import { claimAccount, login } from '@/app/actions';

const ipHash = createHash('sha256').update('fixture-client').digest('hex');
const password = 'fixture-password';
const capture = <T>(operation: Promise<T>) => operation.catch(error => ({ thrown: error.message }));

beforeEach(() => {
  harness.store = new FakeGameStore();
  harness.events = [];
  harness.failCookie = false;
});

describe('claim action recovery with fake store and offline auth mocks', () => {
  it('claims before starting session, sets cookie only after session row', async () => {
    const store = harness.store!;
    await store.createInviteCode('1', '111111');
    const createSession = store.createSession.bind(store);
    vi.spyOn(store, 'createSession').mockImplementation(async record => {
      expect((await store.getInviteByCode('111111'))?.usedBy).toBe(record.userId);
      expect((await store.getUserByTeam('1'))?.id).toBe(record.userId);
      await createSession(record);
      harness.events.push('session');
    });
    expect(await capture(claimAccount('111111', password, 'Fixture'))).toEqual({ thrown: 'fixture-redirect' });
    expect(harness.events).toEqual(['session', 'cookie', 'redirect']);
    expect(await store.getClaimAttempts(ipHash)).toBeNull();
  });

  it('used code never authorizes a new session or modifies the owner', async () => {
    const store = harness.store!;
    await store.createInviteCode('1', '111111');
    await store.claimTeam({ code: '111111', displayName: 'Owner', passwordHash: `fixture:${password}` });
    const sessions = vi.spyOn(store, 'createSession');
    const result = await claimAccount('111111', 'other-fixture-password', 'Other');
    expect(result.ok).toBe(false);
    expect(sessions).not.toHaveBeenCalled();
    expect(harness.events).toEqual([]);
    expect((await store.getUserByTeam('1'))?.displayName).toBe('Owner');
  });

  it('infrastructure failure does not count as a wrong-code attempt', async () => {
    const store = harness.store!;
    await store.createInviteCode('1', '111111');
    vi.spyOn(store, 'claimTeam').mockRejectedValue(new Error('fixture-infrastructure'));
    expect(await capture(claimAccount('111111', password, 'Fixture'))).toEqual({ thrown: 'fixture-infrastructure' });
    expect(await store.getClaimAttempts(ipHash)).toBeNull();
    expect(await store.getUserByTeam('1')).toBeNull();
    expect((await store.getInviteByCode('111111'))?.usedBy).toBeNull();
    expect(harness.events).toEqual([]);
  });

  it('session failure leaves committed claim; retry rejected; password login recovers', async () => {
    const store = harness.store!;
    await store.createInviteCode('1', '111111');
    const createSession = store.createSession.bind(store);
    const spy = vi.spyOn(store, 'createSession').mockRejectedValue(new Error('fixture-session-failure'));
    expect(await capture(claimAccount('111111', password, 'Fixture'))).toEqual({ thrown: 'fixture-session-failure' });
    const user = await store.getUserByTeam('1');
    expect(user).not.toBeNull();
    expect((await store.getInviteByCode('111111'))?.usedBy).toBe(user?.id);
    expect(harness.events).toEqual([]);
    expect((await claimAccount('111111', password, 'Fixture')).ok).toBe(false);
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockImplementation(createSession);
    expect(await capture(login('1', 'wrong-fixture-password'))).toEqual({ ok: false, error: 'Wrong password.' });
    expect(await capture(login('1', password))).toEqual({ thrown: 'fixture-redirect' });
    expect(harness.events).toEqual(['cookie', 'redirect']);
  });

  it('cookie failure happens after persisted session and leaves claim available to login', async () => {
    const store = harness.store!;
    await store.createInviteCode('1', '111111');
    const createSession = store.createSession.bind(store);
    let persistedSession = false;
    vi.spyOn(store, 'createSession').mockImplementation(async record => {
      await createSession(record);
      persistedSession = (await store.getSessionUser(record.tokenHash))?.user.id === record.userId;
    });
    harness.failCookie = true;
    expect(await capture(claimAccount('111111', password, 'Fixture'))).toEqual({ thrown: 'fixture-cookie-failure' });
    expect(persistedSession).toBe(true);
    expect((await store.getInviteByCode('111111'))?.usedBy).toBe((await store.getUserByTeam('1'))?.id);
    harness.failCookie = false;
    expect(await capture(login('1', password))).toEqual({ thrown: 'fixture-redirect' });
  });
});
