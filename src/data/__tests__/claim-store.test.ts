/**
 * claim-store.test.ts — contract tests for the GameStore claim flow,
 * run against FakeGameStore.
 *
 * Issue #30 adds an atomic `claimTeam` operation; both the fake and the
 * DB adapter must satisfy these invariants. The DB-backed suite is a
 * separate opt-in integration run against an isolated test database —
 * it never touches production credentials.
 */
import { describe, expect, it } from "vitest";
import { FakeGameStore } from "@/data/arcade";

function seededStore() {
  const store = new FakeGameStore();
  return store;
}

describe("FakeGameStore claim invariants (baseline)", () => {
  it("consumeInviteCode is guarded: second use returns false", async () => {
    const store = seededStore();
    await store.createInviteCode("1", "111111");
    expect(await store.consumeInviteCode("111111", "user-1")).toBe(true);
    expect(await store.consumeInviteCode("111111", "user-2")).toBe(false);
    const invite = await store.getInviteByCode("111111");
    expect(invite?.usedBy).toBe("user-1");
  });

  it("returns null for unknown invite codes", async () => {
    const store = seededStore();
    expect(await store.getInviteByCode("000000")).toBeNull();
  });

  it("createUser persists a user retrievable by team", async () => {
    const store = seededStore();
    const user = await store.createUser({
      teamId: "1",
      displayName: "Amy",
      passwordHash: "hash",
    });
    expect(await store.getUserByTeam("1")).toMatchObject({
      id: user.id,
      teamId: "1",
    });
    // Password hashes never leak through the public user shape.
    expect(await store.getUserByTeam("1")).not.toHaveProperty("passwordHash");
    expect(await store.getPasswordHash("1")).toBe("hash");
  });

  it("claim attempt counters lock out after 5 failures and clear on success", async () => {
    const store = seededStore();
    for (let i = 1; i <= 5; i++) {
      const r = await store.recordFailedClaimAttempt("ip-hash");
      expect(r.attempts).toBe(i);
      expect(r.locked).toBe(i === 5);
    }
    await store.clearClaimAttempts("ip-hash");
    expect(await store.getClaimAttempts("ip-hash")).toBeNull();
  });
});
