import { expect, it } from "vitest";
import { formatServerRemaining, projectServerRemaining, reconcileServerClock } from "./server-clock";

it("has no deadline or duration fallback, and consumes the full round trip", () => {
  const result = reconcileServerClock(10000, { sequence: 1, sentAtMonoMs: 100, receivedAtMonoMs: 500 }, 1);
  if (result.status !== "accepted") throw new Error("anchor rejected");
  expect(projectServerRemaining(result.anchor, 20000, 1500)).toBe(8600);
  expect(projectServerRemaining(result.anchor, null, 1500)).toBeNull();
  expect(projectServerRemaining(null, 20000, 1500)).toBeNull();
  expect(projectServerRemaining(result.anchor, 20000, 1500, true)).toBeNull();
  expect(projectServerRemaining(result.anchor, 20000, 50000)).toBe(0);
});
it.each([NaN, Infinity, -1, 2.5])("withholds invalid server as-of %s", asOfMs => {
  expect(reconcileServerClock(asOfMs, { sequence: 1, sentAtMonoMs: 100, receivedAtMonoMs: 500 }, 1).status).toBe("uncertain");
});
it("ignores responses from requests superseded by the owner", () => {
  expect(reconcileServerClock(10000, { sequence: 1, sentAtMonoMs: 100, receivedAtMonoMs: 500 }, 2).status).toBe("ignored");
});
it("accepts overlapping newer requests while keeping the conservative upper clock", () => {
  const first = reconcileServerClock(10000, { sequence: 1, sentAtMonoMs: 100, receivedAtMonoMs: 500 }, 1);
  if (first.status !== "accepted") throw new Error("anchor rejected");
  const second = reconcileServerClock(10010, { sequence: 2, sentAtMonoMs: 400, receivedAtMonoMs: 600 }, 2, first.anchor);
  expect(second.status).toBe("accepted");
  if (second.status === "accepted") expect(second.anchor.upperServerNowAtReceiptMs).toBe(10500);
});
it("formats days and fractional final seconds without negative output", () => {
  expect(formatServerRemaining(86400000 + 3600000 + 61000)).toBe("1d 01:01:01");
  expect(formatServerRemaining(1)).toBe("00:01");
  expect(formatServerRemaining(-1)).toBe("00:00");
});
