import { describe, expect, test } from "vitest";
import { historyPickDirection, historyRosterId, historyInitialRange, historyObservationRange } from "./team-value-history-view";
import { compactHistory } from "../../../qa/team-value-history/compact-fixture";

import { teamValueHistoryFixture, teamValueHistoryDetailFixture } from "@/test/team-value-history-fixture";
import { historyCalendarDays, historyCalendarMonths, historyDayAtPosition, historyLargestChanges, historyUnpricedRanges, historyValueChanges, historyPreviousPoint, compareHistoryRosters } from "./team-value-history-view";

test("selected roster ids are canonical, and pick origin never implies direction", () => {
  expect(historyRosterId("1")).toBe(1);
  for (const id of ["synthetic-team", "01", "1.5", "1e2", "0", "-1", "9007199254740992"]) expect(historyRosterId(id)).toBeNull();
  const pick = { season: "2027", round: 1, rosterId: 1, ownerId: 2, previousOwnerId: 3 };
  expect(historyPickDirection(pick, 1)).toBe("other");
  expect(historyPickDirection(pick, 2)).toBe("received");
  expect(historyPickDirection(pick, 3)).toBe("sent");
  expect(historyPickDirection({ ...pick, ownerId: 3 }, 3)).toBe("unchanged");
  expect(historyPickDirection({ ...pick, ownerId: null }, 1)).toBe("unresolved");
  expect(historyPickDirection(pick, null)).toBe("unresolved");
});

describe("the league calendar is independent of price coverage", () => {
  test("focuses sparse observations on first view without moving inception or creating prices", () => {
    const h = compactHistory(), original = structuredClone(h);
    expect(historyCalendarDays(h.leagueRange)).toHaveLength(368);
    expect(h.points).toHaveLength(15);
    expect(historyInitialRange(h.points, h.leagueRange)).toEqual({ from: "2026-10-07", toExclusive: "2026-10-22" });
    expect(h.points.at(-1)?.day).toBe("2026-10-21");
    expect(h.asOf.slice(0, 10)).toBe("2026-10-22");
    expect(h).toEqual(original);
    expect(historyInitialRange([], h.leagueRange)).toEqual(h.leagueRange);
    expect(historyObservationRange([h.points[0]], h.leagueRange)).toEqual({ from: "2026-10-06", toExclusive: "2026-10-09" });
    expect(historyInitialRange([h.points[0], { ...h.points[1], day: h.leagueRange.from }], h.leagueRange)).toEqual(h.leagueRange);
  });
  test("preserves inception rather than using the first quote or a rolling year", () => {
    const range = { from: "2024-09-15", toExclusive: "2026-10-21" };
    const days = historyCalendarDays(range), months = historyCalendarMonths(range);
    expect(days[0]).toBe("2024-09-15");
    expect(days.at(-1)).toBe("2026-10-20");
    expect(days).toHaveLength(766);
    expect(months.flatMap(month => month.days)).toEqual(days);
    expect(months[0].label).toBe("September 2024");
    expect(months.at(-1)?.id).toBe("2026-10");
  });

  test("includes leap day and every UTC day across daylight-saving transitions", () => {
    expect(historyCalendarDays({ from: "2024-02-28", toExclusive: "2024-03-02" })).toEqual(["2024-02-28", "2024-02-29", "2024-03-01"]);
    expect(historyCalendarDays({ from: "2026-03-07", toExclusive: "2026-03-10" })).toEqual(["2026-03-07", "2026-03-08", "2026-03-09"]);
  });

  test("every timeline position can select a day, including missing dates and both edges", () => {
    const range = { from: "2025-10-20", toExclusive: "2026-10-21" }, days = historyCalendarDays(range);
    for (const [index, day] of days.entries()) expect(historyDayAtPosition(range, (index + .5) / days.length)).toBe(day);
    expect(historyDayAtPosition(range, -1)).toBe(range.from);
    expect(historyDayAtPosition(range, 1)).toBe("2026-10-20");
    expect(historyDayAtPosition(range, 2)).toBe("2026-10-20");
  });

  test("gaps remain unpriced ranges, never invented zero-valued observations", () => {
    const source = teamValueHistoryFixture("one");
    expect(historyUnpricedRanges(source.points, source.leagueRange)).toEqual([
      { from: "2025-10-19", toExclusive: "2026-06-30" }, { from: "2026-07-01", toExclusive: "2026-10-21" },
    ]);
    expect(source.points).toHaveLength(1);
    expect(historyUnpricedRanges([], source.leagueRange)).toEqual([source.leagueRange]);
  });
});

describe("supported observation change markers", () => {
  test("keeps total differences separate from trade or player attribution", () => {
    const source = teamValueHistoryFixture();
    expect(historyValueChanges(source.points)).toEqual([
      { day: "2026-10-09", previousDay: "2026-10-08", cents: 1000, priceKind: "recorded" },
      { day: "2026-10-12", previousDay: "2026-10-11", cents: 500, priceKind: "reconstructed" },
      { day: "2026-10-19", previousDay: "2026-10-18", cents: 500, priceKind: "recorded" },
    ]);
  });

  test("a recorded difference across a gap is labeled with both actual observations", () => {
    const source = teamValueHistoryFixture();
    const pair = source.points.filter(point => point.day === "2026-10-08" || point.day === "2026-10-19");
    expect(historyValueChanges(pair)).toEqual([{ day: "2026-10-19", previousDay: "2026-10-08", cents: 3500, priceKind: "recorded" }]);
    expect(historyPreviousPoint([...pair].reverse(), "2026-10-20")).toEqual(pair[1]);
    expect(historyPreviousPoint(pair, "2026-10-08")).toBeUndefined();
    for (const replacement of [{ priceKind: "reconstructed" as const }, { priced: 2 }])
      expect(historyValueChanges([pair[0], { ...pair[1], ...replacement }])).toEqual([]);
    const reconstructed = source.points.filter(point => point.day === "2026-10-11" || point.day === "2026-10-12");
    for (const replacement of [{ continuityId: "another" }, { standalone: true }])
      expect(historyValueChanges([reconstructed[0], { ...reconstructed[1], ...replacement }])).toEqual([]);
  });

  test("ranks actual positive and negative comparable differences, not gaps or price levels", () => {
    const source = teamValueHistoryFixture();
    const changes = historyValueChanges(source.points);
    const negative = { ...changes[0], day: "2026-10-20", cents: -2000 };
    expect(historyLargestChanges([...changes, negative, { ...negative, day: "2026-10-21", cents: 0 }], 2)).toEqual([negative, changes[0]]);
  });
});


describe("dated roster comparisons do not invent trade prices", () => {
  test("compares continuing quotes, records entry/exit and states the elapsed gap", () => {
    const before = teamValueHistoryDetailFixture("2026-10-08");
    const after = teamValueHistoryDetailFixture("2026-10-19");
    after.players[2] = { ...after.players[2], id: "new-player", name: "New roster member" };
    const result = compareHistoryRosters(before, after)!;
    expect(result.daysApart).toBe(11);
    expect(result.continuing.map(player => player.deltaCents)).toEqual([1166, 1166]);
    expect(result.entered.map(player => player.id)).toEqual(["new-player"]);
    expect(result.exited.map(player => player.id)).toEqual([before.players[2].id]);
    expect(result.totalDifferenceCents).toBe(3500);
    expect(before.players[0].priceCents).toBe(10000);
  });

  test("missing prices, source/model switches and conflicting same-quote amounts stay unknown", () => {
    const before = teamValueHistoryDetailFixture("2026-10-08"), after = teamValueHistoryDetailFixture("2026-10-19");
    after.players[0] = { ...after.players[0], priceCents: null, price: null, missingReason: "Missing" };
    after.priced = 2;
    let result = compareHistoryRosters(before, after)!;
    expect(result.continuing[0].deltaCents).toBeNull();
    expect(result.totalDifferenceCents).toBeNull();
    const reconstructed = teamValueHistoryDetailFixture("2026-10-12");
    expect(compareHistoryRosters(before, reconstructed)!.continuing.every(player => player.deltaCents === null)).toBe(true);
    const earlierModel = teamValueHistoryDetailFixture("2026-10-11");
    if (reconstructed.players[0].price?.kind === "reconstructed") reconstructed.players[0].price.modelVersion = "other-model";
    expect(compareHistoryRosters(earlierModel, reconstructed)!.continuing[0].deltaCents).toBeNull();
    after.players[0] = { ...before.players[0], priceCents: 12345 };
    result = compareHistoryRosters(before, after)!;
    expect(result.continuing[0].deltaCents).toBeNull();
  });

  test("refuses different generations, teams, reversed dates and ambiguous rosters", () => {
    const before = teamValueHistoryDetailFixture("2026-10-08"), after = teamValueHistoryDetailFixture("2026-10-19");
    for (const replacement of [{ generation: "new" }, { teamId: "another" }, { rosterStatus: "ambiguous" as const }, { day: before.day }])
      expect(compareHistoryRosters(before, { ...after, ...replacement })).toBeNull();
    expect(compareHistoryRosters(after, before)).toBeNull();
  });
});
