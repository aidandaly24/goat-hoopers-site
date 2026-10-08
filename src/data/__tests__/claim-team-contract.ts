/**
 * claim-team-contract.ts — shared contract suite for the atomic team-claim operation.
 *
 * `claimTeamContract` encodes the invariants from issue #30. It runs
 * against any GameStore implementation via a factory, so the fake and
 * (with an isolated DB) the Drizzle store prove the same contract.
 * DB-level locking/rollback needs separate integration evidence — the
 * fake proves the logic, not the database.
 */
import { describe, expect, it } from "vitest";
import type { GameStore } from "../arcade";

export function claimTeamContract(name: string, createStore: () => GameStore) {
  describe(`claimTeam contract: ${name}`, () => {
    it("creates the account and consumes the code atomically", async () => {
      const store = createStore();
      await store.createInviteCode("1", "111111");

      const result = await store.claimTeam({
        code: "111111",
        displayName: "Test Team",
        passwordHash: "hash-abc",
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.user.teamId).toBe("1");
      expect(result.user.displayName).toBe("Test Team");
      // Account persisted…
      const user = await store.getUserByTeam("1");
      expect(user?.id).toBe(result.user.id);
      // …and the code consumed by that account, together.
      const invite = await store.getInviteByCode("111111");
      expect(invite?.usedBy).toBe(result.user.id);
      expect(invite?.usedAt).toBeInstanceOf(Date);
    });

    it("rejects unknown codes without writing anything", async () => {
      const store = createStore();

      const result = await store.claimTeam({
        code: "999999",
        displayName: "Nobody",
        passwordHash: "hash-xyz",
      });

      expect(result).toEqual({ ok: false, reason: "invalid_code" });
      expect(await store.getUserByTeam("1")).toBeNull();
    });

    it("rejects reused codes without creating a duplicate account", async () => {
      const store = createStore();
      await store.createInviteCode("1", "222222");

      const first = await store.claimTeam({
        code: "222222",
        displayName: "First",
        passwordHash: "hash-1",
      });
      expect(first.ok).toBe(true);

      const second = await store.claimTeam({
        code: "222222",
        displayName: "Second",
        passwordHash: "hash-2",
      });
      expect(second).toEqual({ ok: false, reason: "already_used" });

      const user = await store.getUserByTeam("1");
      expect(user?.displayName).toBe("First");
    });

    it("rejects a second invite for a claimed team without consuming the loser invite", async () => {
      const store = createStore();
      await store.createInviteCode("1", "333333");
      await store.createInviteCode("1", "444444");

      const first = await store.claimTeam({
        code: "333333",
        displayName: "First",
        passwordHash: "hash-1",
      });
      expect(first.ok).toBe(true);

      const second = await store.claimTeam({
        code: "444444",
        displayName: "Second",
        passwordHash: "hash-2",
      });
      expect(second).toEqual({ ok: false, reason: "team_claimed" });

      // The loser's invite is untouched — a rollback, not a partial claim.
      const loserInvite = await store.getInviteByCode("444444");
      expect(loserInvite?.usedBy).toBeNull();
      expect(loserInvite?.usedAt).toBeNull();

      // No duplicate account.
      const user = await store.getUserByTeam("1");
      expect(user?.displayName).toBe("First");
    });

    it("allows exactly one winner under concurrent claims", async () => {
      const store = createStore();
      await store.createInviteCode("1", "555555");

      const results = await Promise.all(
        Array.from({ length: 5 }, (_, i) =>
          store.claimTeam({
            code: "555555",
            displayName: `Racer ${i}`,
            passwordHash: `hash-${i}`,
          }),
        ),
      );

      const winners = results.filter((r) => r.ok);
      expect(winners.length).toBe(1);
      for (const r of results) {
        if (!r.ok) expect(r.reason).toBe("already_used");
      }
      const winner = winners[0];
      if (winner.ok) {
        const invite = await store.getInviteByCode("555555");
        expect(invite?.usedBy).toBe(winner.user.id);
      }
    });
  });
}

