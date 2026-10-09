import { describe, it, expect } from "vitest";
import type { ModelValuationUpdate, ModeledTimelineInput } from "../../domain/modeled-valuation-timeline";
import { buildModeledValuationTimeline, valuationAt, pageTimelineUpdates } from "../modeled-valuation-timeline";

const iso = (day: string) => `${day}T00:00:00.000Z`;
const update = (day: string, priceCents = 10000): ModelValuationUpdate => ({ id: day,
  effectiveAt: iso(day), evidenceAsOf: iso(day), priceCents, reason: "game",
  modelVersion: "fixture-model", calibrationVersion: "fixed-fixture-anchor" });
const input = (changes: Partial<ModeledTimelineInput> = {}): ModeledTimelineInput => ({
  playerId: "fixture", from: iso("2024-06-01"), asOf: iso("2024-11-01"),
  modelVersion: "fixture-model", calibrationVersion: "fixed-fixture-anchor",
  updates: [update("2024-06-15")], recordedSnapshots: [], calendar: [], ...changes,
});
const build = (changes: Partial<ModeledTimelineInput> = {}) => buildModeledValuationTimeline(input(changes));

describe("versioned continuous modeled-state contract", () => {
  it("keeps the interval before the first usable estimate unavailable rather than zero", () => {
    const timeline = build();
    expect(valuationAt(timeline, iso("2024-06-14")).priceCents).toBeNull();
    expect(timeline.intervals[0].meaning).toBe("before-first-estimate");
    expect(build({ updates: [] }).intervals).toHaveLength(1);
    expect(valuationAt(build({ updates: [] }), iso("2024-11-01")).source).toBe("unavailable");
  });
  it("carries the exact value throughout a verified offseason without adding daily records", () => {
    const timeline = build({ calendar: [{ from: iso("2024-06-24"), to: iso("2024-10-22"),
      knownAt: iso("2024-05-01"), phase: "offseason", source: "synthetic-calendar-fixture" }] });
    for (const day of ["2024-07-01", "2024-08-15", "2024-10-21"]) {
      const value = valuationAt(timeline, iso(day));
      expect(value.priceCents).toBe(10000); expect(value.source).toBe("carried-model-estimate");
      expect(value.phase).toBe("offseason"); expect(value.recordedSnapshots).toEqual([]);
    }
    expect(timeline.updates).toHaveLength(1); expect(timeline.recordedSnapshots).toEqual([]);
    expect(timeline.intervals.some(i => i.meaning === "held-offseason-estimate")).toBe(true);
  });
  it("preserves value across an injury-like absence but labels missing in-season evidence honestly", () => {
    const timeline = build({ asOf: iso("2025-03-01"), calendar: [{ from: iso("2024-10-22"),
      to: iso("2025-06-24"), knownAt: iso("2024-08-01"), phase: "in-season", source: "fixture" }],
      coverage: { knownAt: iso("2024-10-22"), status: "partial", sourceRevision: "fixture",
        limitations: ["No DNP, injury or missing-game attribution available"] } });
    const value = valuationAt(timeline, iso("2025-02-20"));
    expect(value.priceCents).toBe(10000); expect(value.phase).toBe("in-season");
    expect(value.coverage?.status).toBe("partial"); expect(value.evidenceAgeDays).toBeGreaterThan(200);
    expect(timeline.intervals.at(-1)?.meaning).toBe("held-without-new-evidence");
  });
  it("changes only at usable updates, including the cutoff, never on a calendar or season boundary", () => {
    const annual = { ...update("2024-07-01", 12500), reason: "annual" as const };
    const timeline = build({ updates: [update("2024-06-15"), annual, update("2024-11-01", 13000)] });
    expect(valuationAt(timeline, "2024-06-30T23:59:59.999Z").priceCents).toBe(10000);
    expect(valuationAt(timeline, iso("2024-07-01")).anchor).toBe(annual);
    expect(valuationAt(timeline, iso("2024-10-22")).priceCents).toBe(12500);
    expect(valuationAt(timeline, timeline.asOf).priceCents).toBe(13000);
    expect(valuationAt(timeline, timeline.asOf).source).toBe("model-update");
  });
  it("preserves snapshot objects, exact cents and same-date order separately from modeled updates", () => {
    const quotes = Object.freeze([Object.freeze({ id: "q2", date: iso("2024-06-15"), priceCents: 9999 }),
      Object.freeze({ id: "q1", date: iso("2024-06-15"), priceCents: 10101 })]);
    const original = input({ recordedSnapshots: quotes }); Object.freeze(original.updates);
    const before = JSON.stringify(original), timeline = buildModeledValuationTimeline(original);
    expect(timeline.recordedSnapshots[0]).toBe(quotes[0]); expect(timeline.recordedSnapshots[1]).toBe(quotes[1]);
    expect(valuationAt(timeline, quotes[0].date).recordedSnapshots).toEqual(quotes);
    expect(valuationAt(timeline, quotes[0].date).priceCents).toBe(10000);
    expect(JSON.stringify(original)).toBe(before); expect(timeline.publishable).toBe(false);
  });
  it("filters future values, versions, snapshots, calendars and coverage before they can affect a prefix", () => {
    const early = input({ asOf: iso("2024-08-01") });
    const future = { ...update("2024-10-23", -999), modelVersion: "later-model", calibrationVersion: "later-scale" };
    expect(buildModeledValuationTimeline({ ...early, updates: [...early.updates, future],
      recordedSnapshots: [{ id: "future", date: iso("2024-10-23"), priceCents: -1 }],
      calendar: [{ from: iso("2024-06-01"), to: iso("2024-11-01"), knownAt: iso("2024-09-01"),
        phase: "offseason", source: "not-yet-known" }],
      coverage: { knownAt: iso("2024-09-01"), status: "complete", sourceRevision: "later", limitations: [] },
    })).toEqual(buildModeledValuationTimeline(early));
  });
  it("rejects evidence used before receipt and makes a sparse first-game estimate available only at its usable time", () => {
    const receipt = "2024-06-17T18:30:00.000Z";
    const first = { ...update("2024-06-15", 1700), effectiveAt: receipt, evidenceAsOf: receipt };
    const timeline = build({ updates: [first] });
    expect(valuationAt(timeline, iso("2024-06-17")).priceCents).toBeNull();
    expect(valuationAt(timeline, receipt).anchor).toBe(first);
    expect(() => build({ updates: [{ ...first, effectiveAt: iso("2024-06-16") }] })).toThrow();
  });
  it("requires explicit stable model and dollar-scale versions instead of normalizing by another player", () => {
    const timeline = build();
    for (const day of ["2024-07-01", "2024-10-01"]) expect(valuationAt(timeline, iso(day)).priceCents).toBe(10000);
    expect(() => build({ updates: [{ ...update("2024-07-01"), calibrationVersion: "changed" }] })).toThrow();
    expect(() => build({ updates: [{ ...update("2024-07-01"), modelVersion: "changed" }] })).toThrow();
  });
  it("retains every update for paged inspection rather than index-sampling the canonical history", () => {
    const updates = Array.from({ length: 501 }, (_, i) => ({ ...update("2024-06-01", i), id: String(i),
      effectiveAt: new Date(Date.UTC(2024, 5, 1) + i * 86400000).toISOString(),
      evidenceAsOf: new Date(Date.UTC(2024, 5, 1) + i * 86400000).toISOString() }));
    const timeline = build({ updates, asOf: iso("2026-01-01") });
    const a = pageTimelineUpdates(timeline), b = pageTimelineUpdates(timeline, a.nextOffset!),
      c = pageTimelineUpdates(timeline, b.nextOffset!);
    expect([...a.updates, ...b.updates, ...c.updates]).toEqual(updates); expect(c.nextOffset).toBeNull();
    expect(timeline.intervals.at(-1)?.priceCents).toBe(500);
    expect(() => pageTimelineUpdates(timeline, 0, 251)).toThrow();
  });
  it("uses calendar and coverage evidence only after it becomes known, without repricing", () => {
    const timeline = build({ calendar: [{ from: iso("2024-06-01"), to: iso("2024-10-22"),
      knownAt: iso("2024-08-01"), phase: "offseason", source: "fixture-announcement" }],
      coverage: { knownAt: iso("2024-08-01"), status: "partial", sourceRevision: "fixture", limitations: [] } });
    expect(valuationAt(timeline, iso("2024-07-15")).phase).toBe("unknown");
    expect(valuationAt(timeline, iso("2024-07-15")).coverage).toBeNull();
    expect(valuationAt(timeline, iso("2024-08-01")).phase).toBe("offseason");
    expect(valuationAt(timeline, iso("2024-08-01")).priceCents).toBe(10000);
  });
  it("rejects ambiguous updates or calendars and preserves legitimate zero values", () => {
    expect(() => build({ updates: [update("2024-06-15"), { ...update("2024-06-15"), id: "second" }] })).toThrow();
    expect(() => build({ calendar: [1, 2].map(() => ({ from: iso("2024-06-01"), to: iso("2024-10-01"),
      knownAt: iso("2024-05-01"), source: "fixture", phase: "offseason" })) })).toThrow();
    expect(valuationAt(build({ updates: [update("2024-06-15", 0)] }), iso("2024-10-01")).priceCents).toBe(0);
    expect(() => valuationAt(build(), iso("2025-01-01"))).toThrow();
  });
});
