import { describe, expect, it } from "vitest";
import {
  getRecordedQuoteStore, recordedQuoteChunks, RECORDED_QUOTE_CHUNK_DAYS,
  type RecordedQuote,
} from "../recorded-quotes";
import type { Db } from "../db";

/**
 * Retention correction (#224): snapshots are append-only, so history
 * windows span years. These tests pin the paged read: windows split
 * into bounded day-chunks, chunks aggregate in order, and a chunk that
 * hits the row cap fails the whole window closed (never a silently
 * partial quote set).
 */

const quote = (quoteId: string, nativeTimestamp: string): RecordedQuote => ({
  quoteId, playerId: "101", priceCents: 100, nativeTimestamp,
});

const daySpan = (fromDay: string, toDay: string) =>
  Math.round((Date.parse(`${toDay}T00:00:00Z`) - Date.parse(`${fromDay}T00:00:00Z`)) / 86_400_000);

describe("recordedQuoteChunks", () => {
  it("covers a multi-year window with consecutive bounded half-open chunks", () => {
    const chunks = recordedQuoteChunks({ playerIds: ["101"], fromDay: "2025-10-20", toDay: "2026-10-21" });
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0].fromDay).toBe("2025-10-20");
    expect(chunks.at(-1)!.toDay).toBe("2026-10-21");
    for (const [i, chunk] of chunks.entries()) {
      expect(daySpan(chunk.fromDay, chunk.toDay)).toBeGreaterThan(0);
      expect(daySpan(chunk.fromDay, chunk.toDay)).toBeLessThanOrEqual(RECORDED_QUOTE_CHUNK_DAYS);
      if (i > 0) expect(chunk.fromDay).toBe(chunks[i - 1].toDay);
      expect(chunk.playerIds).toEqual(["101"]);
    }
  });

  it("keeps a short window in one chunk and an empty window chunkless", () => {
    expect(recordedQuoteChunks({ playerIds: ["101"], fromDay: "2026-10-08", toDay: "2026-10-21" }))
      .toEqual([{ playerIds: ["101"], fromDay: "2026-10-08", toDay: "2026-10-21" }]);
    expect(recordedQuoteChunks({ playerIds: ["101"], fromDay: "2026-10-21", toDay: "2026-10-21" }))
      .toEqual([]);
  });
});

describe("recorded-quote store paging", () => {
  it("aggregates chunk results in window order", async () => {
    const pages = [
      [quote("q1", "2025-10-20T04:00:00.000000")],
      [quote("q2", "2025-11-25T04:00:00.000000"), quote("q3", "2025-11-26T04:00:00.000000")],
      [],
    ];
    let calls = 0;
    const store = getRecordedQuoteStore({
      execute: async () => ({ rows: [{ records: pages[calls++] ?? [] }] }),
    } as unknown as Db);
    const result = await store!.readWindow({ playerIds: ["101"], fromDay: "2025-10-20", toDay: "2025-12-25" });
    expect(calls).toBe(3); // 66 days in 31-day chunks
    expect(result.truncated).toBe(false);
    expect(result.quotes.map(q => q.quoteId)).toEqual(["q1", "q2", "q3"]);
  });

  it("fails closed when a later chunk truncates, and stops paging", async () => {
    const many = Array.from({ length: 5001 }, (_, i) => quote(`m${i}`, "2025-11-25T04:00:00.000000"));
    const pages = [[quote("q1", "2025-10-20T04:00:00.000000")], many, [quote("never", "2025-12-25T04:00:00.000000")]];
    let calls = 0;
    const store = getRecordedQuoteStore({
      execute: async () => ({ rows: [{ records: pages[calls++] ?? [] }] }),
    } as unknown as Db);
    const result = await store!.readWindow({ playerIds: ["101"], fromDay: "2025-10-20", toDay: "2025-12-25" });
    expect(result.truncated).toBe(true);
    expect(result.quotes).toHaveLength(1 + 5000);
    expect(calls).toBe(2); // the third chunk is never read
  });

  it("reads nothing for an empty window and rejects a malformed chunk envelope", async () => {
    let calls = 0;
    const store = getRecordedQuoteStore({
      execute: async () => { calls += 1; return { rows: [{ records: [] }] }; },
    } as unknown as Db);
    await expect(store!.readWindow({ playerIds: ["101"], fromDay: "2026-10-21", toDay: "2026-10-21" }))
      .resolves.toEqual({ quotes: [], truncated: false });
    expect(calls).toBe(0);

    const broken = getRecordedQuoteStore({
      execute: async () => ({ rows: [{}] }),
    } as unknown as Db);
    await expect(broken!.readWindow({ playerIds: ["101"], fromDay: "2026-10-08", toDay: "2026-10-21" }))
      .rejects.toThrow("Missing recorded-quote read envelope");
  });
});
