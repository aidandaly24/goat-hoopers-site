import { test } from "vitest";
import assert from "node:assert/strict";
import { PRACTICE_COURT as court } from "../../../domain/arcade/free-throw";
import type { PracticeVector } from "../../../domain/arcade/free-throw";
import { launchBall, stepBall } from "./physics";
import { nextShootingPosition, shootingPositions } from "./positions";

const seedRandom = (seed: number) => () => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 2 ** 32;
};
function run(origin: PracticeVector, power: number) {
  const ball = launchBall(court, { direction: 0, power }, origin);
  let makes = 0;
  for (let step = 0; step < 1441 && !ball.finished; step++) {
    makes += stepBall(ball, court).filter(event => event === "basket").length;
  }
  assert.equal(ball.finished, true);
  return makes;
}

test("seeded selection repeats exactly and never repeats a consecutive spot", () => {
  const sequence = (seed: number) => {
    const random = seedRandom(seed);
    let current = court.release;
    return Array.from({ length: 100 }, () => {
      const next = nextShootingPosition(court, current, random);
      assert.notDeepEqual(next, current);
      current = next;
      return next;
    });
  };
  assert.deepEqual(sequence(42), sequence(42));
  assert.notDeepEqual(sequence(42), sequence(99));
  assert.equal(new Set(sequence(42).map(spot => JSON.stringify(spot))).size, 9);
});

test("all positions remain inside the court and malformed random draws stay bounded", () => {
  const positions = shootingPositions(court);
  for (const spot of positions) {
    assert.ok(Math.abs(spot.x) <= 2.2);
    assert.ok(spot.z >= court.release.z - 0.8 && spot.z <= court.release.z + 1.8);
    assert.equal(spot.y, court.release.y);
    assert.ok(spot.z > court.rim.center.z + court.ballRadius);
  }
  for (const value of [-1, 0, 0.5, 1, 2, NaN, Infinity]) {
    assert.ok(positions.some(spot => JSON.stringify(spot) === JSON.stringify(nextShootingPosition(court, court.release, () => value))));
  }
  const chosen = nextShootingPosition(court, court.release, () => 0);
  chosen.x = 999;
  assert.ok(shootingPositions(court).every(spot => spot.x !== 999));
});

test("every spot has a genuine reachable power while near and far require different releases", () => {
  const winningPowers = shootingPositions(court).map(origin => {
    const power = Array.from({ length: 101 }, (_, index) => index).find(value => run(origin, value) === 1);
    assert.notEqual(power, undefined, `Unreachable spot ${JSON.stringify(origin)}`);
    return power!;
  });
  assert.ok(winningPowers[1] < 50);
  assert.ok(winningPowers[8] > 50);
  // A strong near shot can bank in through real contact; do not forbid it.
  assert.equal(run(shootingPositions(court)[8], 50), 0);
});

test("moving does not grant a speed assist; centered aim points toward the same rim", () => {
  const baseline = launchBall(court, { direction: 0, power: 50 });
  const speed = (v: PracticeVector) => Math.hypot(v.x, v.y, v.z);
  for (const origin of shootingPositions(court)) {
    const ball = launchBall(court, { direction: 0, power: 50 }, origin);
    assert.ok(Math.abs(speed(ball.velocity) - speed(baseline.velocity)) < 1e-10);
    const t = (court.rim.center.z - origin.z) / ball.velocity.z;
    assert.ok(Math.abs(origin.x + ball.velocity.x * t - court.rim.center.x) < 1e-10);
    assert.deepEqual(ball.origin, origin);
  }
});
