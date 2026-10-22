import { describe, expect, it } from "vitest";
import { getStockStore } from "../stocks";
import type { Db } from "../db";

/**
 * Retention correction (#224, Aidan directive 2026-10-22): recorded
 * snapshots are append-only evidence for team value history. The
 * pre-correction saveSnapshot deleted every row older than 30 days on
 * each write; these tests pin that no write path deletes snapshots.
 */

type FakeDbOptions = { latestAt: Date | null };

function fakeDb({ latestAt }: FakeDbOptions) {
  const inserted: unknown[] = [];
  let deleteCalls = 0;
  const db = {
    select: () => ({
      from: () => ({
        orderBy: () => ({
          limit: async () => (latestAt ? [{ at: latestAt }] : []),
        }),
      }),
    }),
    insert: () => ({
      values: async (values: unknown) => { inserted.push(values); },
    }),
    delete: () => {
      deleteCalls += 1;
      throw new Error("saveSnapshot must never delete snapshots");
    },
  };
  return { db: db as unknown as Db, inserted, deleteCalls: () => deleteCalls };
}

describe("saveSnapshot retention", () => {
  it("appends the daily batch and never deletes older snapshots", async () => {
    const { db, inserted, deleteCalls } = fakeDb({ latestAt: new Date(Date.now() - 48 * 60 * 60 * 1000) });
    await getStockStore(db).saveSnapshot({ "101": 12.34, "102": 5 });
    expect(inserted).toEqual([[
      { playerId: "101", priceCents: 1234 },
      { playerId: "102", priceCents: 500 },
    ]]);
    expect(deleteCalls()).toBe(0);
  });

  it("still throttles inside the 24h minimum interval without writing or deleting", async () => {
    const { db, inserted, deleteCalls } = fakeDb({ latestAt: new Date(Date.now() - 60 * 1000) });
    await getStockStore(db).saveSnapshot({ "101": 12.34 });
    expect(inserted).toEqual([]);
    expect(deleteCalls()).toBe(0);
  });

  it("writes the first snapshot when the table is empty", async () => {
    const { db, inserted, deleteCalls } = fakeDb({ latestAt: null });
    await getStockStore(db).saveSnapshot({ "101": 1 });
    expect(inserted).toHaveLength(1);
    expect(deleteCalls()).toBe(0);
  });
});
