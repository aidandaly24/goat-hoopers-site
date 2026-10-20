import { expect, it, vi } from "vitest";
import { readFinality } from "./finality";
import { DEFAULT_COMPETITION_POLICY, scoreFormatVersion } from "./config";
import type { CompetitionPeriod } from "@/domain/arcade/competition-period";
const period: CompetitionPeriod = { id: "synthetic-period", gameId: "free-throw", week: "2026-W01", label: "Synthetic", order: 1,
  opensAtMs: 0, predecessorId: null, calendarSource: "https://example.test/calendar", calendarVersion: "test",
  fixtures: [{ id: "123456789", date: "20261020", startsAtMs: 10 }, { id: "123456790", date: "20261021", startsAtMs: 1000 }] };
it("fetches only due dates/expected IDs and requires both completed=true and genuine post state", async () => {
  const fetcher = vi.fn<(url: string, init: RequestInit) => Promise<Response>>(async () => Response.json({ events: [{ id: "123456789", status: { type: { completed: true, state: "post", name: "STATUS_FINAL" } } }] }));
  const receipt = await readFinality(period, { fetch: fetcher, now: () => 500 });
  expect(receipt.states).toEqual({ "123456789": "final", "123456790": "scheduled" }); expect(fetcher).toHaveBeenCalledTimes(1);
  expect(fetcher.mock.calls[0][0]).toContain("dates=20261020");
});
it("fails blocked on network, missing IDs, postponements or ambiguous final status", async () => {
  for (const type of [undefined, { completed: true, state: "in" }, { completed: true, state: "post", name: "STATUS_POSTPONED" }]) {
    const receipt = await readFinality(period, { fetch: async () => Response.json({ events: [{ id: "123456789", status: { type } }] }), now: () => 500 });
    expect(receipt.states["123456789"]).not.toBe("final");
  }
  expect((await readFinality(period, { fetch: async () => { throw new Error("offline"); }, now: () => 500 })).states["123456789"]).toBe("missing");
});
it("documents 9/120/unlimited defaults and isolates incompatible scores without resetting all-time for calendar changes", () => {
  expect(DEFAULT_COMPETITION_POLICY).toMatchObject({ shots: 9, durationMs: 120000, maxRunsPerWeek: null });
  expect(scoreFormatVersion({ ...DEFAULT_COMPETITION_POLICY, ruleSetId: "another-period", calendar: { ...DEFAULT_COMPETITION_POLICY.calendar, hour: 1 } })).toBe(scoreFormatVersion());
  expect(scoreFormatVersion({ ...DEFAULT_COMPETITION_POLICY, shots: 8 })).not.toBe(scoreFormatVersion());
});
