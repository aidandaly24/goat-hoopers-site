import { expect, it } from "vitest";
import { canFinalize, parseCompetitionCalendar, periodPhase, type PeriodRecord } from "./competition-period";
const starts = Date.parse("2026-10-20T19:00:00Z");
const p: PeriodRecord = { id: "free-throw-2026-week-1", gameId: "free-throw", week: "2026-W01", label: "Week 1 · Free throws", order: 1,
  opensAtMs: starts, predecessorId: null, calendarSource: "https://example.test/verified-calendar", calendarVersion: "synthetic-test-only",
  fixtures: [{ id: "123456789", date: "20261020", startsAtMs: starts }], closedAtMs: null, finalizedAtMs: null,
  receipt: { checkedAtMs: starts, source: "test-only", states: { "123456789": "live" } } };
it("enforces exact server opening and blocks missing/stale/postponed authority", () => {
  expect(periodPhase(p, starts - 1, true)).toBe("upcoming"); expect(periodPhase(p, starts, true)).toBe("open");
  expect(periodPhase(p, starts, false)).toBe("blocked"); expect(periodPhase({ ...p, receipt: null }, starts, true)).toBe("blocked");
  expect(periodPhase(p, starts + 600001, true)).toBe("blocked");
  for (const state of ["missing", "postponed"] as const) expect(periodPhase({ ...p, receipt: { ...p.receipt!, states: { "123456789": state } } }, starts, true)).toBe("blocked");
});
it("requires every assigned genuine final, never scheduled end or a partial response", () => {
  expect(canFinalize(p, p.receipt!, starts)).toBe(false);
  expect(canFinalize(p, { ...p.receipt!, states: {} }, starts)).toBe(false);
  expect(canFinalize(p, { ...p.receipt!, states: { "123456789": "final" } }, starts)).toBe(true);
  expect(canFinalize({ ...p, finalizedAtMs: starts }, { ...p.receipt!, states: { "123456789": "final" } }, starts)).toBe(false);
});
it("delays the next period until previous finalization, without resetting its stable ID", () => {
  const next = { ...p, id: "free-throw-2026-week-2", predecessorId: p.id, opensAtMs: starts + 1000 };
  expect(periodPhase(next, starts + 1000, false)).toBe("blocked");
  expect(periodPhase(next, starts + 1000, true)).toBe("open"); expect(next.id).toBe("free-throw-2026-week-2");
});
it.each([["2026-03-02T05:00:00Z", "2026-03-09T04:00:00Z", 167], ["2026-10-26T04:00:00Z", "2026-11-02T05:00:00Z", 169]])("preserves DST calendar instants %s to %s", (a, b, hours) => {
  const first = { ...p, opensAtMs: Date.parse(String(a)) }, next = { ...p, id: "next-period", order: 2, predecessorId: p.id, opensAtMs: Date.parse(String(b)), fixtures: [{ ...p.fixtures[0], id: "123456790" }] };
  expect((next.opensAtMs - first.opensAtMs) / 3600000).toBe(hours);
  expect(parseCompetitionCalendar([first, next])?.[1].opensAtMs).toBe(next.opensAtMs);
});

it("rejects duplicate assignments, invalid dates, broken chains and later openings away from New York midnight", () => {
  expect(parseCompetitionCalendar([{ ...p, fixtures: [null] }])).toBeNull();
  expect(parseCompetitionCalendar([{ ...p, fixtures: [{ ...p.fixtures[0], date: "20260231" }] }])).toBeNull();
  const next = { ...p, id: "next-period", order: 2, predecessorId: p.id, opensAtMs: Date.parse("2026-10-26T04:00:00Z") };
  expect(parseCompetitionCalendar([p, next])).toBeNull();
  const valid = { ...next, fixtures: [{ ...p.fixtures[0], id: "123456790" }] };
  expect(parseCompetitionCalendar([p, valid])).toHaveLength(2);
  expect(parseCompetitionCalendar([p, { ...valid, opensAtMs: valid.opensAtMs + 3600000 }])).toBeNull();
  expect(parseCompetitionCalendar([p, { ...valid, predecessorId: null }])).toBeNull();
});
