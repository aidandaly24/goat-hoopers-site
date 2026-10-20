import { expect, it } from "vitest";
import { RankedRoundRecorder } from "./ranked-round";
import { replayRankedRound, simulateRankedShot, type RankedAdmission } from "./ranked-free-throw";
import { policy, replayContext, run } from "@/data/ranked-free-throw/__tests__/fixtures";

const admission: RankedAdmission = { run, rules: policy, replayContext };
const aim = { direction: 0, power: 50 };
const flight = simulateRankedShot(aim).durationMs;

it("records input evidence only, caps attempts, and waits for visual and real-time settlement", () => {
  const recorder = new RankedRoundRecorder(admission, 0, 100);
  expect(recorder.status(100).canShoot).toBe(true);
  expect(recorder.shoot(aim, 100)).toBe(true);
  expect(recorder.shoot(aim, 101)).toBe(false);
  recorder.settle(); // Reduced motion can settle visually before physics time has elapsed.
  expect(recorder.status(101).canShoot).toBe(false);
  expect(recorder.shoot({ ...aim, direction: 14 }, 100 + flight)).toBe(true);
  const missFlight = simulateRankedShot({ ...aim, direction: 14 }, replayContext, 1).durationMs;
  expect(recorder.submission(100 + flight + missFlight)).toBeNull();
  recorder.settle();
  const payload = recorder.submission(100 + flight + missFlight)!;
  expect(payload).toEqual({ runId: run.id, shots: [{ atMs: 0, ...aim }, { atMs: flight, direction: 14, power: 50 }] });
  expect(replayRankedRound(payload.shots, 100 + flight + missFlight, policy).outcomes).toEqual([1, 0]);
  expect(recorder.shoot(aim, 100 + flight + missFlight)).toBe(false);
  payload.shots[0].power = 0;
  expect(recorder.submission(100 + flight + missFlight)!.shots[0].power).toBe(50);
});

it("respects minimum intervals and conservative expiry without trusting browser wall-clock dates", () => {
  const slow = { ...admission, rules: { ...policy, minShotIntervalMs: 10000 } };
  const recorder = new RankedRoundRecorder(slow, 0, 100);
  recorder.shoot(aim, 100); recorder.settle();
  expect(recorder.status(100 + flight).canShoot).toBe(false);
  expect(recorder.status(10100).canShoot).toBe(true);
  expect(recorder.status(30000)).toMatchObject({ expired: true, canShoot: false, canSubmit: false });
});

it("rejects invalid clocks/aims and launches that cannot finish before the deadline", () => {
  expect(() => new RankedRoundRecorder(admission, 2, 1)).toThrow("invalid_round_clock");
  expect(() => new RankedRoundRecorder(admission, NaN, 1)).toThrow("invalid_round_clock");
  const recorder = new RankedRoundRecorder(admission, 0, 100);
  for (const invalid of [{ direction: NaN, power: 50 }, { direction: 15, power: 50 }, { direction: 0, power: -1 }]) expect(recorder.shoot(invalid, 100)).toBe(false);
  expect(recorder.shoot(aim, 29999)).toBe(false);
  expect(recorder.shoot(aim, 200)).toBe(false); // Monotonic input clock cannot move backwards.
  expect(recorder.status(30000).attempts).toBe(0);
});
