import { expect, it } from "vitest";
import { MAX_RECONCILE_WINDOW_MS, parseReconcileWindow, reconcileWindowOpen } from "./reconcile-window";
const start = "2026-10-20T18:50:00Z", end = "2026-10-27T04:00:00Z";
it("accepts the explicit proposed UTC window with inclusive start/exclusive expiry", () => {
  const w = parseReconcileWindow(start, end)!;
  expect(w).toEqual({ notBeforeMs: Date.parse(start), expiresAtMs: Date.parse(end) });
  expect(reconcileWindowOpen(w, w.notBeforeMs - 1)).toBe(false);
  expect(reconcileWindowOpen(w, w.notBeforeMs)).toBe(true);
  expect(reconcileWindowOpen(w, w.expiresAtMs - 1)).toBe(true);
  expect(reconcileWindowOpen(w, w.expiresAtMs)).toBe(false);
  for (const clock of [NaN, Infinity, -1, w.notBeforeMs + .5]) expect(reconcileWindowOpen(w, clock)).toBe(false);
});
it.each([undefined, "", "2026-10-20", "2026-10-20T18:50Z", "2026-10-20T18:50:00.000Z", "2026-10-20T18:50:00+00:00", "2026-10-20T18:50:00z", "2026-02-30T18:50:00Z", "2026-10-20T18:50:60Z", `${start}\n`])("rejects noncanonical/missing instant %s", value => {
  expect(parseReconcileWindow(value, end)).toBeNull(); expect(parseReconcileWindow(start, value)).toBeNull();
});
it("requires ordered bounds and caps a single reviewed window at seven days", () => {
  expect(parseReconcileWindow(start, start)).toBeNull(); expect(parseReconcileWindow(end, start)).toBeNull();
  expect(parseReconcileWindow(start, "2026-10-27T18:50:00Z")).not.toBeNull();
  expect(parseReconcileWindow(start, "2026-10-27T18:50:01Z")).toBeNull();
  expect(reconcileWindowOpen({ notBeforeMs: 0, expiresAtMs: MAX_RECONCILE_WINDOW_MS + 1 }, 1)).toBe(false);
});
