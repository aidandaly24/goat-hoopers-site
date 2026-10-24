import { afterEach, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { rankedDatabaseBinding, rankedReadinessReceipt, recordRankedReadiness } from "../readiness";

afterEach(() => vi.restoreAllMocks());

it("attests the same database through pooled/direct hosts without binding credentials", () => {
  const direct = rankedDatabaseBinding("ep-synthetic.us-east-1.aws.neon.tech", "neondb");
  expect(direct).toBe(rankedDatabaseBinding("ep-synthetic-pooler.us-east-1.aws.neon.tech", "neondb"));
  expect(direct).not.toBe(rankedDatabaseBinding("ep-other.us-east-1.aws.neon.tech", "neondb"));
  expect(direct).not.toBe(rankedDatabaseBinding("ep-synthetic.us-east-1.aws.neon.tech", "other"));
});

it("emits only bounded readiness and fingerprints, never secrets or raw configuration", () => {
  const calendar = JSON.parse(readFileSync("docs/arcade-week-1-calendar.json", "utf8"));
  const env = {
    DATABASE_URL: "postgresql://private-role:private-password@ep-synthetic-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require",
    GOAT_ARCADE_CALENDAR: JSON.stringify(calendar), FRIENDS_AUTH_ENABLED: "1",
    GOAT_ARCADE_RECONCILE_TOKEN: "private-bearer-token",
  };
  const receipt = rankedReadinessReceipt(env, { status: "disabled" });
  expect(receipt).toMatchObject({ status: "disabled", gameplayEnabled: false, personalAuthEnabled: true,
    calendarStatus: "valid", periodCount: 1, fixtureCount: 43 });
  expect(receipt.databaseBinding).toBe(rankedDatabaseBinding("ep-synthetic.us-east-1.aws.neon.tech", "neondb"));
  expect(receipt.calendarBinding).toMatch(/^[0-9a-f]{64}$/);
  const text = JSON.stringify(receipt);
  for (const secret of ["private-role", "private-password", "private-bearer-token", "postgresql://", "ep-synthetic", calendar[0].fixtures[0].id]) {
    expect(text).not.toContain(secret);
  }
  const reordered = calendar.map((period: Record<string, unknown>) => Object.fromEntries(Object.entries(period).reverse()));
  expect(rankedReadinessReceipt({ ...env, GOAT_ARCADE_CALENDAR: JSON.stringify(reordered) }, { status: "disabled" }).calendarBinding)
    .toBe(receipt.calendarBinding);
});

it("does not certify missing/malformed targets or calendars", () => {
  expect(rankedReadinessReceipt({}, { status: "disabled" })).toMatchObject({ databaseBinding: null, calendarBinding: null, calendarStatus: "missing" });
  expect(rankedReadinessReceipt({ DATABASE_URL: "not-a-url", GOAT_ARCADE_CALENDAR: "[truncated]" }, { status: "invalid" }))
    .toMatchObject({ databaseBinding: null, calendarBinding: null, calendarStatus: "invalid" });
});

it("deduplicates receipts and ignores logger failures without throwing", () => {
  const info = vi.spyOn(console, "info").mockImplementation(() => {});
  recordRankedReadiness({}, { status: "disabled" });
  recordRankedReadiness({}, { status: "disabled" });
  expect(info).toHaveBeenCalledTimes(1);
  info.mockImplementation(() => { throw Error("synthetic log failure"); });
  expect(() => recordRankedReadiness({ GOAT_RANKED_FREE_THROW_ENABLED: "1" }, { status: "invalid" })).not.toThrow();
});
