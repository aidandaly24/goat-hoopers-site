/**
 * recent-activity.test.ts — regression coverage for issue #28.
 *
 * The homepage feed must show the newest ten moves across valid season
 * weeks, not a hardcoded week-1 fetch. Tests cover the pure selector
 * (selectRecentTransactions) and week validation (validSeasonWeeks).
 */
import { describe, expect, it } from "vitest";
import { selectRecentTransactions } from "@/data/transform";
import { validSeasonWeeks } from "@/data/league";
import { rawTransaction } from "./fixtures";
import type { RawTransaction } from "@/data/sleeper";

const tx = (
  id: string,
  week: number,
  created: string
): RawTransaction =>
  rawTransaction({ transaction_id: id, leg: week, created: Date.parse(created) });

describe("selectRecentTransactions", () => {
  it("picks the newest moves across weeks, newest first", () => {
    const byWeek = [
      [tx("week-1", 1, "2026-10-01T12:00:00Z")],
      [tx("week-2", 2, "2026-10-08T12:00:00Z")],
      [tx("week-3", 3, "2026-10-15T12:00:00Z")],
    ];
    const recent = selectRecentTransactions(byWeek);
    expect(recent.map((t) => t.transaction_id)).toEqual([
      "week-3",
      "week-2",
      "week-1",
    ]);
  });

  it("falls back to earlier weeks when the current week is quiet", () => {
    const byWeek = [
      [tx("week-1", 1, "2026-10-01T12:00:00Z")],
      [tx("week-2", 2, "2026-10-08T12:00:00Z")],
      [],
    ];
    const recent = selectRecentTransactions(byWeek);
    expect(recent.map((t) => t.transaction_id)).toEqual(["week-2", "week-1"]);
  });

  it("returns empty for an empty season", () => {
    expect(selectRecentTransactions([[], []])).toEqual([]);
  });

  it("selects the newest ten deterministically when there are more", () => {
    const week: RawTransaction[] = Array.from({ length: 15 }, (_, i) =>
      tx(
        `tx-${i}`,
        1,
        `2026-10-01T${String(i).padStart(2, "0")}:00:00Z`
      )
    );
    const recent = selectRecentTransactions([week]);
    expect(recent).toHaveLength(10);
    expect(recent[0].transaction_id).toBe("tx-14");
    expect(recent[9].transaction_id).toBe("tx-5");
  });

  it("deduplicates by transaction_id, keeping the first occurrence", () => {
    const byWeek = [
      [tx("dup", 1, "2026-10-01T12:00:00Z")],
      [tx("dup", 2, "2026-10-08T12:00:00Z")],
    ];
    const recent = selectRecentTransactions(byWeek);
    expect(recent).toHaveLength(1);
    expect(recent[0].leg).toBe(1);
  });

  it("tolerates failed weeks as empty buckets", () => {
    const byWeek = [[], [tx("week-2", 2, "2026-10-08T12:00:00Z")]];
    const recent = selectRecentTransactions(byWeek);
    expect(recent.map((t) => t.transaction_id)).toEqual(["week-2"]);
  });
});

describe("validSeasonWeeks", () => {
  const state = (week: unknown) =>
    ({ season_type: "regular", week }) as never;

  it("returns weeks 1..current for a regular-season week", () => {
    expect(validSeasonWeeks(state(3))).toEqual([1, 2, 3]);
  });

  it("rejects zero, negative, non-integer, and non-finite weeks", () => {
    expect(validSeasonWeeks(state(0))).toEqual([]);
    expect(validSeasonWeeks(state(-1))).toEqual([]);
    expect(validSeasonWeeks(state(2.5))).toEqual([]);
    expect(validSeasonWeeks(state(NaN))).toEqual([]);
    expect(validSeasonWeeks(state(Infinity))).toEqual([]);
  });

  it("rejects null state and missing week", () => {
    expect(validSeasonWeeks(null)).toEqual([]);
    expect(validSeasonWeeks({} as never)).toEqual([]);
  });
});
