import { describe, expect, it, vi } from "vitest";
import { parseFreeThrowPolicy, PROVISIONAL_RANKED_CALENDAR, rankedPeriod, replayRankedFreeThrows } from "./ranked-free-throw";

const rules = { ruleSetId: "synthetic-only", engine: "fixed-line-makes-v1", shots: 2, durationMs: 30000, minShotIntervalMs: 1000, maxRunsPerWeek: 3 };
const policy = parseFreeThrowPolicy(rules)!;
const now = (date: string) => Date.parse(date);

describe("explicit ranked configuration, not adopted competition rules", () => {
  it("normalizes only the documented provisional calendar; gameplay has no defaults", () => {
    expect(policy.calendar).toEqual(PROVISIONAL_RANKED_CALENDAR);
    for (const key of ["ruleSetId", "engine", "shots", "durationMs", "minShotIntervalMs", "maxRunsPerWeek"]) {
      const partial: Record<string, unknown> = { ...rules }; delete partial[key];
      expect(parseFreeThrowPolicy(partial)).toBeNull();
    }
  });
  it.each([null, [], { ...rules, prizes: [10] }, { ...rules, shots: 0 }, { ...rules, shots: 101 },
    { ...rules, durationMs: 300001 }, { ...rules, minShotIntervalMs: 0 }, { ...rules, maxRunsPerWeek: 1001 },
    { ...rules, shots: 2, minShotIntervalMs: 30000 }, { ...rules, engine: "unreviewed" },
    { ...rules, calendar: { ...policy.calendar, timeZone: "Not/AZone" } },
    { ...rules, calendar: { ...policy.calendar, startsOn: 0 } }, { ...rules, calendar: { ...policy.calendar, hour: 24 } },
    { ...rules, calendar: { ...policy.calendar, minute: .5 } }, { ...rules, calendar: { ...policy.calendar, extra: true } },
  ].map(value => ({ value })))("rejects incomplete, unbounded or unknown configuration $value", ({ value }) => expect(parseFreeThrowPolicy(value)).toBeNull());
});

describe("provisional New York weekly periods", () => {
  it("uses exclusive Monday midnight boundaries independently of server-local time", () => {
    const previous = rankedPeriod(now("2026-10-19T03:59:59.999Z"), policy.calendar);
    expect(previous).toEqual({ week: "2026-W42", startsAtMs: now("2026-10-12T04:00:00Z"), endsAtMs: now("2026-10-19T04:00:00Z") });
    expect(rankedPeriod(previous.endsAtMs, policy.calendar)).toEqual({ week: "2026-W43", startsAtMs: previous.endsAtMs, endsAtMs: now("2026-10-26T04:00:00Z") });
    expect(rankedPeriod(now("2027-01-01T12:00:00Z"), policy.calendar).week).toBe("2026-W53");
  });
  it("retains calendar midnight across spring/fall DST without forcing 168-hour weeks", () => {
    const spring = rankedPeriod(now("2026-03-08T12:00:00Z"), policy.calendar);
    const fall = rankedPeriod(now("2026-11-01T12:00:00Z"), policy.calendar);
    expect(spring.startsAtMs).toBe(now("2026-03-02T05:00:00Z"));
    expect(spring.endsAtMs).toBe(now("2026-03-09T04:00:00Z"));
    expect((spring.endsAtMs - spring.startsAtMs) / 3600000).toBe(167);
    expect((fall.endsAtMs - fall.startsAtMs) / 3600000).toBe(169);
  });
  it("supports an explicit alternative day/time/zone", () => {
    const custom = { timeZone: "UTC", startsOn: 7, hour: 18, minute: 30 };
    expect(rankedPeriod(now("2026-10-19T12:00:00Z"), custom)).toEqual({ week: "2026-W42",
      startsAtMs: now("2026-10-18T18:30:00Z"), endsAtMs: now("2026-10-25T18:30:00Z") });
  });
  it("does not change period boundaries when the server's local timezone changes", () => {
    const instant = now("2026-10-19T03:59:59.999Z");
    const expected = rankedPeriod(instant, policy.calendar);
    try {
      for (const timeZone of ["UTC", "Pacific/Honolulu", "Asia/Tokyo"]) {
        vi.stubEnv("TZ", timeZone);
        expect(rankedPeriod(instant, policy.calendar)).toEqual(expected);
      }
    } finally { vi.unstubAllEnvs(); }
  });
  it("fails closed for ambiguous/nonexistent configured DST boundaries and invalid clocks", () => {
    expect(() => rankedPeriod(now("2026-03-08T12:00:00Z"), { ...policy.calendar, startsOn: 7, hour: 2, minute: 30 })).toThrow("unsupported_week_boundary");
    expect(() => rankedPeriod(now("2026-11-01T12:00:00Z"), { ...policy.calendar, startsOn: 7, hour: 1, minute: 30 })).toThrow("unsupported_week_boundary");
    for (const invalid of [NaN, Infinity, -1, .5]) expect(() => rankedPeriod(invalid, policy.calendar)).toThrow("invalid_clock");
  });
});

describe("real deterministic free-throw replay", () => {
  const shots = [{ atMs: 0, direction: 0, power: 50 }, { atMs: 7000, direction: 0, power: 50 }];
  it("replays the shared fixed-step engine reproducibly, without mutating evidence", () => {
    const snapshot = structuredClone(shots);
    expect(replayRankedFreeThrows(shots, 15000, policy)).toBe(2);
    expect(replayRankedFreeThrows(shots, 15000, policy)).toBe(2);
    expect(replayRankedFreeThrows(shots.map(shot => ({ ...shot, direction: 14 })), 15000, policy)).toBe(0);
    expect(shots).toEqual(snapshot);
  });
  it("rejects incomplete, overlapping, still-flying and post-deadline rounds", () => {
    expect(() => replayRankedFreeThrows(shots.slice(0, 1), 15000, policy)).toThrow("incomplete_round");
    expect(() => replayRankedFreeThrows([shots[0], { ...shots[1], atMs: 1000 }], 15000, policy)).toThrow("overlapping_shots");
    expect(() => replayRankedFreeThrows(shots, 7001, policy)).toThrow("unfinished_round");
    expect(() => replayRankedFreeThrows([shots[0], { ...shots[1], atMs: 29000 }], 40000, policy)).toThrow("unfinished_round");
  });
});
