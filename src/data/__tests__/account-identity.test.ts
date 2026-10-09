import { describe, expect, it, vi } from "vitest";
import { resolveAccountUser, type AccountIdentityReader } from "../account-identity";
import { FakeGameStore } from "../arcade";
import { auditAccountIdentity, type AccountIdentity } from "@/domain/arcade/account-identity";
import type { SiteUser } from "@/domain/arcade/types";

const now = new Date("2026-10-09T00:00:00Z");
const user: SiteUser = { id: "stable-fixture-id", teamId: "1", displayName: "Fixture", createdAt: now };
const identity: AccountIdentity = { provider: "better-auth", subject: "provider-fixture-id", userId: user.id, active: true };
const reader = (): AccountIdentityReader => ({
  verifySession: vi.fn(async () => ({ subject: identity.subject, expiresAt: new Date(now.getTime() + 1000) })),
  findIdentity: vi.fn(async () => identity),
  getUserById: vi.fn(async () => user),
});

describe("provider-to-app identity seam (no provider or database calls)", () => {
  it("returns the existing app ID and display data, not provider subject or profile", async () => {
    const deps = reader();
    expect(await resolveAccountUser(deps, now)).toEqual(user);
    expect(deps.findIdentity).toHaveBeenCalledWith(identity.subject);
    expect(deps.getUserById).toHaveBeenCalledWith(user.id);
  });

  it("retains fake score/reward ownership and an AI user budget key through credential replacement", async () => {
    const store = new FakeGameStore();
    const owner = await store.createUser({ teamId: "1", displayName: "Owner", passwordHash: "synthetic-hash" });
    const score = await store.createScore({ userId: owner.id, gameId: "free-throw", week: "2026-W41", score: 3 });
    const reward = await store.createReward({ userId: owner.id, displayName: "Owner", gameId: "free-throw", week: "2026-W41", amountFaab: 0 });
    const aiBudget = new Map([[owner.id, 2]]);
    const resolved = await resolveAccountUser({
      verifySession: async () => ({ subject: "replacement-provider-id", expiresAt: new Date(now.getTime() + 1000) }),
      findIdentity: async subject => ({ provider: "better-auth", subject, userId: owner.id, active: true }),
      getUserById: id => store.getUserById(id),
    }, now);
    expect(resolved?.id).toBe(owner.id);
    expect(score.userId).toBe(resolved?.id);
    expect(await store.getRewards(resolved!.id)).toEqual([reward]);
    expect(aiBudget.get(resolved!.id)).toBe(2);
    expect((await store.getLeaderboard("free-throw", "2026-W41"))[0]).toMatchObject({ score: 3, teamId: "1" });
  });

  it.each([null, { subject: "", expiresAt: now }, { subject: identity.subject, expiresAt: now },
    { subject: identity.subject, expiresAt: new Date(NaN) }])("rejects absent/expired/invalid sessions before lookup: %j", async session => {
    const deps = reader();
    deps.verifySession = vi.fn(async () => session);
    expect(await resolveAccountUser(deps, now)).toBeNull();
    expect(deps.findIdentity).not.toHaveBeenCalled();
  });

  it.each([null, { ...identity, active: false }, { ...identity, subject: "different" }, { ...identity, userId: "" }])(
    "rejects missing/disabled/mismatched links without a name/team/email fallback: %j", async link => {
      const deps = reader();
      deps.findIdentity = async () => link;
      expect(await resolveAccountUser(deps, now)).toBeNull();
      expect(deps.getUserById).not.toHaveBeenCalled();
    });

  it("rejects missing or wrong app account", async () => {
    const deps = reader();
    deps.getUserById = async () => ({ ...user, id: "other" });
    expect(await resolveAccountUser(deps, now)).toBeNull();
    deps.getUserById = async () => null;
    expect(await resolveAccountUser(deps, now)).toBeNull();
  });

  it("propagates unavailable state without creating an anonymous or legacy fallback", async () => {
    const deps = reader();
    deps.findIdentity = async () => { throw new Error("synthetic-storage-failure"); };
    await expect(resolveAccountUser(deps, now)).rejects.toThrow("synthetic-storage-failure");
  });
});

describe("read-only reset inventory", () => {
  it("preserves every old user, including accounts with no scores; does not require enrollment yet", () => {
    const users = [user, { ...user, id: "second", teamId: "2" }];
    const snapshot = structuredClone(users);
    expect(auditAccountIdentity(users, [
      { source: "game_scores", userId: user.id }, { source: "rewards", userId: user.id },
      { source: "sessions", userId: user.id }, { source: "invite_codes", userId: user.id },
      { source: "ai_budget", userId: user.id },
    ], [identity])).toEqual({ ok: true, preserveUserIds: ["second", user.id], problems: [] });
    expect(users).toEqual(snapshot);
  });

  it("blocks orphan score/reward/invite/session/AI owners", () => {
    const sources = ["game_scores", "rewards", "sessions", "invite_codes", "ai_budget"] as const;
    const result = auditAccountIdentity([user], sources.map(source => ({ source, userId: "missing" })), []);
    expect(result.ok).toBe(false);
    expect(result.problems).toEqual(sources.map(source => `orphan:${source}`));
  });

  it("blocks ambiguous team or provider-to-account ownership", () => {
    expect(auditAccountIdentity([user, { ...user, id: "other" }], [], [identity, { ...identity, subject: "new" }]).problems)
      .toEqual(["duplicate_or_empty_team_id", "duplicate_identity_for_user"]);
    expect(auditAccountIdentity([user], [], [identity, { ...identity, userId: "missing" }]).problems)
      .toEqual(["invalid_or_duplicate_subject", "orphan:account_identity"]);
    expect(auditAccountIdentity([user, user], [], []).ok).toBe(false);
  });
});
