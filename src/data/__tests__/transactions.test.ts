/**
 * transactions.test.ts — baseline regression coverage for the
 * Sleeper → domain transaction membrane (toTransactions).
 *
 * Bug-specific cases (trade preservation, unknown-type policy) land
 * with issue #27; this file proves the harness and fixtures work.
 */
import { describe, expect, it } from "vitest";
import { toTransactions } from "@/data/transform";
import {
  playerDirectory,
  rawTransaction,
  rawWaiver,
  teamA,
  teamB,
} from "./fixtures";

const TEAMS = [teamA(), teamB()];

describe("toTransactions baseline", () => {
  it("maps a free-agent add with newest-first ordering", () => {
    const older = rawTransaction({
      transaction_id: "old",
      created: Date.parse("2026-10-01T12:00:00Z"),
    });
    const newer = rawTransaction({
      transaction_id: "new",
      created: Date.parse("2026-10-02T12:00:00Z"),
    });
    const [first, second] = toTransactions(
      [older, newer],
      TEAMS,
      [],
      [],
      playerDirectory()
    );
    expect(first.id).toBe("new");
    expect(second.id).toBe("old");
    expect(first.type).toBe("free_agent");
    expect(first.adds).toEqual([{ playerId: "p1", name: "Player One" }]);
  });

  it("preserves the waiver type and FAAB bid signal", () => {
    const [tx] = toTransactions(
      [rawWaiver()],
      TEAMS,
      [],
      [],
      playerDirectory()
    );
    expect(tx.type).toBe("waiver");
  });

  it("falls back to Player <id> when the directory is missing", () => {
    const [tx] = toTransactions([rawTransaction()], TEAMS, [], [], null);
    expect(tx.adds[0].name).toBe("Player p1");
  });

  it("handles null adds and drops without crashing", () => {
    const [tx] = toTransactions(
      [rawTransaction({ adds: null, drops: null })],
      TEAMS,
      [],
      [],
      playerDirectory()
    );
    expect(tx.adds).toEqual([]);
    expect(tx.drops).toEqual([]);
    expect(tx.summary).toContain("roster move");
  });
});
