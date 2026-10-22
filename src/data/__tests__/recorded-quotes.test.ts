import { describe, expect, it } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";
import {
  getRecordedQuoteStore, recordedQuoteChunks, RECORDED_QUOTE_CHUNK_DAYS,
  MAX_RECORDED_QUOTE_QUERIES, MAX_RECORDED_QUOTE_TOTAL_ROWS,
  type RecordedQuote,
} from "../recorded-quotes";
import type { Db } from "../db";

/**
 * Retention correction (#224): snapshots are append-only, so history
 * windows span years and the read as a WHOLE is bounded — one span
 * probe over the populated span, day-chunk paging under a per-chunk
 * cap, a cumulative row budget and a query budget. These tests pin
 * the dot's evidence list: >5,000 retained rows across chunks, exact
 * boundaries/ties, an overflowing chunk, total-budget exhaustion, a
 * failed middle chunk, bounded query/transfer counts, and read-only
 * behavior (no delete/write on read). Any cap, exhaustion or failure
 * fails closed — never a partial enumeration reported as complete.
 */

const quote = (quoteId: string, nativeTimestamp: string): RecordedQuote => ({
  quoteId, playerId: "101", priceCents: 100, nativeTimestamp,
});

const daySpan = (fromDay: string, toDay: string) =>
  Math.round((Date.parse(`${toDay}T00:00:00Z`) - Date.parse(`${fromDay}T00:00:00Z`)) / 86_400_000);

type Span = { earliest: string; latest: string } | null;

/** Scripted store transport: call 1 answers the span probe, later calls
 * serve chunk pages in order. Rendered statements are captured. */
function scriptedStore(pages: Array<RecordedQuote[] | Error>, span: Span) {
  const rendered: Array<{ sql: string; params: unknown[] }> = [];
  let calls = 0;
  const store = getRecordedQuoteStore({
    execute: async (query: unknown) => {
      calls += 1;
      rendered.push(new PgDialect().sqlToQuery(query as never));
      if (calls === 1) {
        return { rows: [{ span: span ?? { earliest: null, latest: null } }] };
      }
      const page = pages[calls - 2];
      if (page instanceof Error) throw page;
      return { rows: [{ records: page ?? [] }] };
    },
  } as unknown as Db);
  return { store: store!, rendered, calls: () => calls };
}

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

describe("recorded-quote store bounded reads", () => {
  it("probes the populated span instead of paging empty inception days", async () => {
    // The requested window opens 2025-10-20, but retained quotes begin
    // 2026-10-08: the empty prefix must cost zero chunk queries.
    const rows = [quote("q1", "2026-10-08T04:00:00.000000"), quote("q2", "2026-10-09T04:00:00.000000")];
    const { store, rendered, calls } = scriptedStore([rows],
      { earliest: "2026-10-08T04:00:00.000000", latest: "2026-10-09T04:00:00.000000" });
    const result = await store.readWindow({ playerIds: ["101"], fromDay: "2025-10-20", toDay: "2027-01-01" });
    expect(result).toEqual({ quotes: rows, truncated: false });
    expect(calls()).toBe(2); // one probe + one chunk over [2026-10-08, 2026-10-10)
    expect(rendered[1].params).toContain("2026-10-08");
    expect(rendered[1].params).toContain("2026-10-10");
  });

  it("aggregates more than 5,000 retained rows across chunks, in order", async () => {
    const page = (prefix: string, count: number, ts: string) =>
      Array.from({ length: count }, (_, i) => quote(`${prefix}${i}`, ts));
    const { store, calls } = scriptedStore([
      page("a", 3000, "2025-10-20T04:00:00.000000"),
      page("b", 3000, "2025-11-25T04:00:00.000000"),
      page("c", 1000, "2025-12-24T04:00:00.000000"),
    ], { earliest: "2025-10-20T04:00:00.000000", latest: "2025-12-24T04:00:00.000000" });
    const result = await store.readWindow({ playerIds: ["101"], fromDay: "2025-10-20", toDay: "2025-12-25" });
    expect(result.truncated).toBe(false);
    expect(result.quotes).toHaveLength(7000);
    expect(result.quotes[0].quoteId).toBe("a0");
    expect(result.quotes.at(-1)!.quoteId).toBe("c999");
    expect(calls()).toBe(4); // probe + 3 chunks
  });

  it("preserves exact chunk boundaries, duplicates and timestamp ties verbatim", async () => {
    const { store } = scriptedStore([
      [quote("b1", "2026-01-31T23:59:59.999999"), quote("b2", "2026-01-31T23:59:59.999999")],
      [quote("b3", "2026-02-01T00:00:00.000000"), quote("b4", "2026-02-01T00:00:00.000000")],
    ], { earliest: "2026-01-01T00:00:00.000000", latest: "2026-02-28T23:59:59.999999" });
    const result = await store.readWindow({ playerIds: ["101"], fromDay: "2026-01-01", toDay: "2026-03-01" });
    expect(result.truncated).toBe(false);
    expect(result.quotes.map(q => q.quoteId)).toEqual(["b1", "b2", "b3", "b4"]);
  });

  it("fails closed when a later chunk overflows the per-chunk cap, and stops paging", async () => {
    const many = Array.from({ length: 5001 }, (_, i) => quote(`m${i}`, "2025-11-25T04:00:00.000000"));
    const { store, calls } = scriptedStore([
      [quote("q1", "2025-10-20T04:00:00.000000")], many, [quote("never", "2025-12-24T04:00:00.000000")],
    ], { earliest: "2025-10-20T04:00:00.000000", latest: "2025-12-24T04:00:00.000000" });
    const result = await store.readWindow({ playerIds: ["101"], fromDay: "2025-10-20", toDay: "2025-12-25" });
    expect(result.truncated).toBe(true);
    expect(result.quotes).toHaveLength(1 + 5000);
    expect(calls()).toBe(3); // probe + 2 chunks; the third chunk is never read
  });

  it("fails closed at the cumulative row budget", async () => {
    const full = Array.from({ length: 5000 }, (_, i) => quote(`f${i}`, "2024-06-01T04:00:00.000000"));
    const pages = Array.from({ length: 30 }, () => full);
    const { store, calls } = scriptedStore(pages,
      { earliest: "2024-01-01T04:00:00.000000", latest: "2025-12-31T04:00:00.000000" });
    const result = await store.readWindow({ playerIds: ["101"], fromDay: "2024-01-01", toDay: "2026-01-01" });
    expect(result.truncated).toBe(true);
    expect(result.quotes).toHaveLength(MAX_RECORDED_QUOTE_TOTAL_ROWS);
    expect(calls()).toBe(1 + 21); // probe + 20 full chunks + the chunk that crosses the budget
  });

  it("fails closed at the query budget over a very long populated span", async () => {
    const pages = Array.from({ length: 200 }, () => [quote("x", "2020-01-01T04:00:00.000000")]);
    const { store, calls } = scriptedStore(pages,
      { earliest: "2016-01-01T04:00:00.000000", latest: "2025-12-31T04:00:00.000000" });
    const result = await store.readWindow({ playerIds: ["101"], fromDay: "2016-01-01", toDay: "2026-01-01" });
    expect(result.truncated).toBe(true);
    expect(calls()).toBe(MAX_RECORDED_QUOTE_QUERIES);
    expect(result.quotes).toHaveLength(MAX_RECORDED_QUOTE_QUERIES - 1); // one row per chunk read
  });

  it("propagates a failed middle chunk instead of reporting a partial read as complete", async () => {
    const { store } = scriptedStore([
      [quote("q1", "2025-10-20T04:00:00.000000")], new Error("chunk boom"),
      [quote("q3", "2025-12-24T04:00:00.000000")],
    ], { earliest: "2025-10-20T04:00:00.000000", latest: "2025-12-24T04:00:00.000000" });
    await expect(store.readWindow({ playerIds: ["101"], fromDay: "2025-10-20", toDay: "2025-12-25" }))
      .rejects.toThrow("chunk boom");
  });

  it("returns empty after one probe when the window holds no snapshots", async () => {
    const { store, calls } = scriptedStore([], null);
    await expect(store.readWindow({ playerIds: ["101"], fromDay: "2025-10-20", toDay: "2026-10-21" }))
      .resolves.toEqual({ quotes: [], truncated: false });
    expect(calls()).toBe(1);
    await expect(store.readWindow({ playerIds: [], fromDay: "2025-10-20", toDay: "2026-10-21" }))
      .resolves.toEqual({ quotes: [], truncated: false });
    expect(calls()).toBe(1); // empty scope still reads nothing at all
  });

  it("rejects malformed span and chunk envelopes", async () => {
    const badSpan = getRecordedQuoteStore({
      execute: async () => ({ rows: [{}] }),
    } as unknown as Db);
    await expect(badSpan!.readWindow({ playerIds: ["101"], fromDay: "2026-10-08", toDay: "2026-10-21" }))
      .rejects.toThrow("Missing recorded-quote span envelope");

    let call = 0;
    const badChunk = getRecordedQuoteStore({
      execute: async () => {
        call += 1;
        return call === 1
          ? { rows: [{ span: { earliest: "2026-10-08T04:00:00.000000", latest: "2026-10-09T04:00:00.000000" } }] }
          : { rows: [{}] };
      },
    } as unknown as Db);
    await expect(badChunk!.readWindow({ playerIds: ["101"], fromDay: "2026-10-08", toDay: "2026-10-21" }))
      .rejects.toThrow("Missing recorded-quote read envelope");
    expect(getRecordedQuoteStore(null)).toBeNull();
  });

  it("issues only SELECT statements — reads never write or delete", async () => {
    const { store, rendered } = scriptedStore([[quote("q1", "2026-10-08T04:00:00.000000")]],
      { earliest: "2026-10-08T04:00:00.000000", latest: "2026-10-08T04:00:00.000000" });
    await store.readWindow({ playerIds: ["101"], fromDay: "2025-10-20", toDay: "2026-10-21" });
    expect(rendered.length).toBeGreaterThan(0);
    for (const { sql } of rendered) {
      expect(sql.trimStart()).toMatch(/^(select|with)\b/i);
      expect(sql).not.toMatch(/\b(insert|update|delete|drop)\b/i);
    }
  });
});
