import { test } from "vitest";
import assert from "node:assert/strict";
import { PRACTICE_COURT as court } from "../../../domain/arcade/free-throw";
import { boundAim, DEFAULT_AIM, launchBall, readyBall, stepBall } from "./physics";

function run(direction = 0, power = 50) {
  const ball = launchBall(court, { direction, power });
  const events: string[] = [];
  for (let i = 0; i < 1441 && !ball.finished; i++) events.push(...stepBall(ball, court));
  return { ball, events };
}

test("centered 50% shot makes exactly once, then finishes", () => {
  const { ball, events } = run();
  assert.equal(events.filter(e => e === "basket").length, 1);
  assert.equal(ball.scored, true);
  assert.equal(ball.hitRim, false);
  // The supplied board extends below the rim; the ball may touch its
  // underside after the basket. It must enter cleanly before any board hit.
  assert.ok(!events.includes("backboard") || events.indexOf("basket") < events.indexOf("backboard"));
  assert.equal(ball.finished, true);
  for (let i = 0; i < 1000; i++) assert.deepEqual(stepBall(ball, court), []);
});

test("wide left/right and weak/strong shots miss deterministically", () => {
  for (const [direction, power] of [[-14, 50], [14, 50], [0, 0], [0, 100]]) {
    const first = run(direction, power);
    assert.equal(first.ball.scored, false);
    assert.equal(first.ball.finished, true);
    assert.deepEqual(run(direction, power), first);
  }
});

test("rim contact reverses an incoming vertical velocity and dissipates energy", () => {
  const ball = readyBall(court);
  ball.position = { x: court.rim.radius, y: court.rim.center.y + 0.15, z: 0 };
  ball.velocity.y = -2;
  let contact = false;
  for (let i = 0; i < 12; i++) {
    if (stepBall(ball, court).includes("rim")) { contact = true; break; }
  }
  assert.equal(contact, true);
  assert.ok(ball.velocity.y > 0 && ball.velocity.y < 2);
  assert.equal(ball.scored, false);
});

test("backboard front and side edges resolve sphere contacts", () => {
  const ball = readyBall(court);
  ball.position = { x: 0, y: 3.4, z: court.backboard.center.z + court.backboard.halfSize.z + court.ballRadius + 0.005 };
  ball.velocity.z = -4;
  assert.ok(stepBall(ball, court).includes("backboard"));
  assert.ok(ball.velocity.z > 0 && ball.velocity.z < 4);
  const edge = readyBall(court);
  edge.position = { x: court.backboard.halfSize.x + court.ballRadius + 0.005, y: 3.4, z: court.backboard.center.z };
  edge.velocity.x = -4;
  assert.ok(stepBall(edge, court).includes("backboard"));
  assert.ok(edge.velocity.x > 0);
});

test("ascending rim-plane crossing and floor rebounds cannot score", () => {
  const ascending = readyBall(court);
  ascending.position = { x: 0, y: 3.045, z: 0 };
  ascending.velocity.y = 3;
  assert.ok(!stepBall(ascending, court).includes("basket"));
  const rebound = readyBall(court);
  rebound.hitFloor = true;
  rebound.position = { x: 0, y: 3.055, z: 0 };
  rebound.velocity.y = -3;
  assert.ok(!stepBall(rebound, court).includes("basket"));
});

test("whole ball must clear the rim, not only its center", () => {
  const ball = readyBall(court);
  ball.position = { x: 0.16, y: 3.055, z: 0 };
  ball.velocity.y = -3;
  assert.ok(!stepBall(ball, court).includes("basket"));
  assert.equal(ball.scored, false);
});

test("repeated reset/launch uses independent state and bounded inputs", () => {
  const original = structuredClone(court);
  for (let i = 0; i < 250; i++) {
    const ball = launchBall(court, DEFAULT_AIM);
    for (let j = 0; j < 100; j++) stepBall(ball, court);
    assert.deepEqual(readyBall(court).position, original.release);
    assert.deepEqual(readyBall(court).velocity, { x: 0, y: 0, z: 0 });
  }
  assert.deepEqual(court, original);
  assert.deepEqual(boundAim({ direction: 999, power: -10 }), { direction: 14, power: 0 });
  const invalid = run(NaN, Infinity);
  assert.ok(Object.values(invalid.ball.position).every(Number.isFinite));
  assert.equal(invalid.ball.finished, true);
});

test("all bounded control combinations finish with finite state", () => {
  for (let direction = -14; direction <= 14; direction += 2) {
    for (let power = 0; power <= 100; power += 5) {
      const { ball, events } = run(direction, power);
      assert.equal(ball.finished, true, `${direction}/${power}`);
      assert.ok(Object.values(ball.position).every(Number.isFinite));
      assert.ok(Object.values(ball.velocity).every(Number.isFinite));
      assert.ok(events.filter(e => e === "basket").length <= 1);
      assert.ok(ball.time <= 6.01);
    }
  }
});
