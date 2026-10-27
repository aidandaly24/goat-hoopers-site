import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import weekOneCandidate from "../../../../docs/arcade-week-1-calendar.json";
import candidate from "../../../../docs/arcade-week-2-calendar.json";
import { canFinalize, parseCompetitionCalendar, periodPhase, type PeriodRecord } from "@/domain/arcade/competition-period";
import { MAX_RECONCILE_WINDOW_MS, parseReconcileAuthorizationWindow, reconcileAuthorizedAt } from "@/domain/arcade/reconcile-window";
import { readCompetitionCalendar } from "../config";
import { readFinality } from "../finality";
import { authorizeReconcile } from "../reconcile-auth";

// Fresh cloud reconstruction/checks, not recovered Mac tests or production evidence.
// Fixture identity digest comes from the bounded publisher reads documented with the candidate.
const sha256 = (text: string) => createHash("sha256").update(text).digest("hex");
const [weekOne, weekTwo] = parseCompetitionCalendar(candidate)!;
const nextOpening = Date.parse("2026-11-02T05:00:00Z");
const hour = 60 * 60 * 1000;
const counts = { "20261026": 9, "20261027": 4, "20261028": 12, "20261029": 3, "20261030": 10, "20261031": 7, "20261101": 4 };
const allFinishedAt = nextOpening + hour;
const syntheticReceipt = (at = allFinishedAt) => ({ checkedAtMs: at, source: "synthetic offline finality; not a publisher observation",
  states: Object.fromEntries(weekTwo.fixtures.map(f => [f.id, "final" as const])) });
const record = (): PeriodRecord => ({ ...weekTwo, closedAtMs: null, finalizedAtMs: null, receipt: syntheticReceipt() });

describe("fresh sourced Week 2 calendar candidate", () => {
  it("preserves the original Week 1 bytes and definition as the complete chain prefix", () => {
    expect(sha256(readFileSync("docs/arcade-week-1-calendar.json", "utf8")))
      .toBe("bf55ed669ffb599d1b802bd6e2d354ec4b0cfbabf22aa33324f1b56b7329ffc5");
    expect(candidate.slice(0, 1)).toEqual(weekOneCandidate);
    expect(readCompetitionCalendar({ GOAT_ARCADE_CALENDAR: JSON.stringify(candidate) })).toEqual([weekOne, weekTwo]);
    expect(weekTwo).toMatchObject({ id: "free-throw-2026-week-2", gameId: "free-throw", week: "2026-W02", order: 2,
      predecessorId: weekOne.id, opensAtMs: Date.parse("2026-10-26T04:00:00Z") });
    expect(parseCompetitionCalendar([candidate[1]])).toBeNull(); // Never replace the predecessor with a standalone Week 2.
  });

  it("retains all 49 observed IDs, original dates and tip instants without duplicating Week 1", () => {
    expect(weekOne.fixtures).toHaveLength(43);
    expect(weekTwo.fixtures).toHaveLength(49);
    expect(sha256(JSON.stringify(weekTwo.fixtures))).toBe("fc8527b901ebb41d463ad31586d3553c9d2de896156f4ba4b8361c8dbb5ee565");
    expect(new Set(candidate.flatMap(p => p.fixtures.map(f => f.id))).size).toBe(92);
    expect(weekTwo.fixtures[0]).toEqual({ id: "401909868", date: "20261026", startsAtMs: Date.parse("2026-10-26T23:00:00Z") });
    expect(weekTwo.fixtures.at(-1)).toEqual({ id: "401909906", date: "20261101", startsAtMs: Date.parse("2026-11-02T02:00:00Z") });
  });

  it.each(Object.entries(counts))("assigns all %s fixtures to their observed New York date", (date, count) => {
    const fixtures = weekTwo.fixtures.filter(f => f.date === date);
    const localDate = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" });
    expect(fixtures).toHaveLength(count);
    for (const fixture of fixtures) {
      const parts = Object.fromEntries(localDate.formatToParts(fixture.startsAtMs).map(p => [p.type, p.value]));
      expect(`${parts.year}${parts.month}${parts.day}`).toBe(date);
      expect(fixture.startsAtMs).toBeGreaterThanOrEqual(weekTwo.opensAtMs);
      expect(fixture.startsAtMs).toBeLessThan(nextOpening);
    }
  });

  it("rejects an overlapping assignment or a broken predecessor", () => {
    expect(parseCompetitionCalendar([candidate[0], { ...candidate[1], fixtures: [...candidate[1].fixtures, candidate[0].fixtures[0]] }])).toBeNull();
    expect(parseCompetitionCalendar([candidate[0], { ...candidate[1], predecessorId: null }])).toBeNull();
  });

  it("keeps the 169-hour local calendar span distinct from the 168-hour authorization ceiling", () => {
    expect(nextOpening - weekTwo.opensAtMs).toBe(169 * hour);
    expect(MAX_RECONCILE_WINDOW_MS).toBe(168 * hour);
    expect(parseReconcileAuthorizationWindow("2026-10-26T04:00:00Z", "2026-11-02T05:00:00Z")).toBeNull();
    const maximum = parseReconcileAuthorizationWindow("2026-10-26T04:00:00Z", "2026-11-02T04:00:00Z")!;
    expect(reconcileAuthorizedAt(maximum, maximum.expiresAtMs - 1)).toBe(true);
    expect(reconcileAuthorizedAt(maximum, maximum.expiresAtMs)).toBe(false);
    expect(nextOpening - maximum.expiresAtMs).toBe(hour); // A calendar is never implicit renewal authority.
  });

  it("keeps the expired Week 1 authority expired despite a valid two-period candidate", () => {
    const expired = parseReconcileAuthorizationWindow("2026-10-20T18:50:00Z", "2026-10-27T04:00:00Z")!;
    const token = "a".repeat(64); // Synthetic fixture only.
    const env = { GOAT_ARCADE_CALENDAR: JSON.stringify(candidate), GOAT_ARCADE_RECONCILE_ENABLED: "1", GOAT_ARCADE_RECONCILE_TOKEN: token,
      GOAT_ARCADE_RECONCILE_NOT_BEFORE: "2026-10-20T18:50:00Z", GOAT_ARCADE_RECONCILE_EXPIRES_AT: "2026-10-27T04:00:00Z" };
    expect(authorizeReconcile(new Headers({ authorization: `Bearer ${token}` }), env, expired.expiresAtMs)).toEqual({ status: "unauthorized" });
    expect(authorizeReconcile(new Headers(), { GOAT_ARCADE_CALENDAR: JSON.stringify(candidate) }, weekTwo.opensAtMs)).toEqual({ status: "disabled" });
  });

  it("holds the candidate at opening without receipts and until the predecessor is final", () => {
    const opening = { ...record(), receipt: { ...syntheticReceipt(weekTwo.opensAtMs), states: Object.fromEntries(weekTwo.fixtures.map(f => [f.id, "scheduled" as const])) } };
    expect(periodPhase(opening, weekTwo.opensAtMs - 1, true)).toBe("upcoming");
    expect(periodPhase({ ...opening, receipt: null }, weekTwo.opensAtMs, true)).toBe("blocked");
    expect(periodPhase(opening, weekTwo.opensAtMs, false)).toBe("blocked");
    expect(periodPhase(opening, weekTwo.opensAtMs, true)).toBe("open"); // Synthetic domain state only, never publication.
  });

  it.each(["live", "missing", "postponed"] as const)("cannot close at the next midnight with one %s fixture", state => {
    const receipt = { ...syntheticReceipt(nextOpening), states: { ...syntheticReceipt().states, [weekTwo.fixtures.at(-1)!.id]: state } };
    expect(canFinalize(record(), receipt, nextOpening)).toBe(false);
    expect(canFinalize(record(), syntheticReceipt(nextOpening - 600001), nextOpening)).toBe(false);
  });

  it("requires every genuine final after every tip and never fabricates a close deadline", () => {
    expect(canFinalize(record(), syntheticReceipt(weekTwo.opensAtMs), weekTwo.opensAtMs)).toBe(false);
    expect(canFinalize(record(), syntheticReceipt(), allFinishedAt)).toBe(true);
    expect(weekTwo).not.toHaveProperty("closedAtMs");
    expect(weekTwo).not.toHaveProperty("endsAtMs");
    expect(periodPhase({ ...record(), closedAtMs: allFinishedAt, finalizedAtMs: allFinishedAt }, allFinishedAt + hour, true)).toBe("final");
  });

  it("uses original scoreboard dates through the real reader and fails closed for a vanished final fixture", async () => {
    const fetch = vi.fn(async (url: string) => {
      const date = new URL(url).searchParams.get("dates");
      const events = weekTwo.fixtures.filter(f => f.date === date && f.id !== weekTwo.fixtures.at(-1)!.id)
        .map(f => ({ id: f.id, status: { type: { state: "post", completed: true, name: "STATUS_FINAL" } } }));
      return Response.json({ events });
    });
    const receipt = await readFinality(weekTwo, { fetch, now: () => allFinishedAt });
    expect(fetch).toHaveBeenCalledTimes(7);
    expect(fetch.mock.calls.map(([url]) => new URL(url).searchParams.get("dates")).sort()).toEqual(Object.keys(counts));
    expect(receipt.states[weekTwo.fixtures.at(-1)!.id]).toBe("missing");
    expect(canFinalize(record(), receipt, allFinishedAt)).toBe(false);
  });
});

const runtimeIO = vi.hoisted(() => ({ getDb: vi.fn(() => { throw Error("Unexpected DB access in calendar-only fixture"); }) }));
vi.mock("../../friends-auth/db", () => ({ getFriendsDb: runtimeIO.getDb }));
import { createRankedRuntime } from "../../ranked-free-throw/runtime";

describe("candidate runtime rollout stays explicit", () => {
  beforeEach(() => {
    vi.stubEnv("GOAT_ARCADE_CALENDAR", "");
    vi.stubEnv("GOAT_RANKED_FREE_THROW_ENABLED", "");
    vi.stubEnv("GOAT_RANKED_FREE_THROW_RULES", "");
    vi.stubEnv("FRIENDS_AUTH_ENABLED", "");
    vi.stubEnv("FRIENDS_AUTH_ENROLLMENT", "");
    vi.spyOn(console, "info").mockImplementation(() => {});
    runtimeIO.getDb.mockClear();
  });
  afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

  it("does not auto-install the checked-in candidate or enable gameplay from a valid calendar", () => {
    expect(readCompetitionCalendar({})).toBeNull();
    expect(createRankedRuntime().configuration.status).toBe("disabled");
    vi.stubEnv("GOAT_ARCADE_CALENDAR", JSON.stringify(candidate));
    expect(createRankedRuntime().configuration.status).toBe("disabled");
    expect(runtimeIO.getDb).not.toHaveBeenCalled();
  });

  it("requires explicit runtime flag, personal auth and full candidate chain without constructing a DB", () => {
    vi.stubEnv("GOAT_RANKED_FREE_THROW_ENABLED", "1");
    expect(createRankedRuntime().configuration.status).toBe("invalid");
    vi.stubEnv("GOAT_ARCADE_CALENDAR", JSON.stringify(candidate));
    expect(createRankedRuntime().configuration.status).toBe("invalid");
    vi.stubEnv("FRIENDS_AUTH_ENROLLMENT", "1");
    expect(createRankedRuntime().configuration.status).toBe("ready"); // Configuration readiness, not an open/published period.
    expect(runtimeIO.getDb).not.toHaveBeenCalled();
  });
});
