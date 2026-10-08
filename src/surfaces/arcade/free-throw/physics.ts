import type {
  PracticeAim, PracticeBall, PracticeCourt, PracticeEvent, PracticeVector,
} from "../../../domain/arcade/free-throw";

export const FIXED_STEP = 1 / 240;
const GRAVITY = 9.81;
const ANGLE = 58 * Math.PI / 180;
export const DEFAULT_AIM: PracticeAim = { direction: 0, power: 50 };
export const clamp = (value: number, low: number, high: number) =>
  Math.min(high, Math.max(low, Number.isFinite(value) ? value : low));

export function boundAim(aim: PracticeAim): PracticeAim {
  return { direction: clamp(aim.direction, -14, 14), power: clamp(aim.power, 0, 100) };
}

export function readyBall(court: PracticeCourt, origin = court.release): PracticeBall {
  return {
    origin: { ...origin }, position: { ...origin }, velocity: { x: 0, y: 0, z: 0 },
    time: 0, scored: false, hitRim: false, hitBackboard: false,
    hitFloor: false, finished: false,
  };
}

export function launchBall(court: PracticeCourt, input: PracticeAim, origin = court.release): PracticeBall {
  const aim = boundAim(input);
  const distance = court.release.z - court.rim.center.z;
  const rise = court.rim.scoringHeight - court.release.y;
  // One launch-speed calibration for every spot. Distance never grants
  // a hidden speed boost: 50% fits only the original free-throw line.
  const ideal = Math.sqrt(GRAVITY * distance * distance /
    (2 * Math.cos(ANGLE) ** 2 * (distance * Math.tan(ANGLE) - rise)));
  const speed = ideal + (aim.power - 50) * 0.035;
  const yaw = Math.atan2(court.rim.center.x - origin.x, origin.z - court.rim.center.z)
    + aim.direction * Math.PI / 180;
  return {
    ...readyBall(court, origin),
    velocity: {
      x: speed * Math.cos(ANGLE) * Math.sin(yaw),
      y: speed * Math.sin(ANGLE),
      z: -speed * Math.cos(ANGLE) * Math.cos(yaw),
    },
  };
}

/** Ballistic aim guide. No physics state is mutated. */
export function trajectory(court: PracticeCourt, aim: PracticeAim, origin = court.release): PracticeVector[] {
  const ball = launchBall(court, aim, origin);
  const landingTime = (ball.velocity.y + Math.sqrt(ball.velocity.y ** 2 +
    2 * GRAVITY * (origin.y - court.ballRadius))) / GRAVITY;
  return Array.from({ length: 33 }, (_, index) => {
    const t = index / 32 * landingTime;
    return {
      x: ball.position.x + ball.velocity.x * t,
      y: ball.position.y + ball.velocity.y * t - GRAVITY * t * t / 2,
      z: ball.position.z + ball.velocity.z * t,
    };
  });
}

function bounce(ball: PracticeBall, normal: PracticeVector, restitution: number): boolean {
  const v = ball.velocity;
  const incoming = v.x * normal.x + v.y * normal.y + v.z * normal.z;
  if (incoming >= 0) return false;
  v.x -= (1 + restitution) * incoming * normal.x;
  v.y -= (1 + restitution) * incoming * normal.y;
  v.z -= (1 + restitution) * incoming * normal.z;
  // Contact dissipates energy; there is no hidden assist or randomness.
  v.x *= 0.985; v.y *= 0.985; v.z *= 0.985;
  return incoming < -0.15;
}

function collideBoard(ball: PracticeBall, court: PracticeCourt): boolean {
  const { center, halfSize } = court.backboard;
  const p = ball.position;
  const closest = {
    x: clamp(p.x, center.x - halfSize.x, center.x + halfSize.x),
    y: clamp(p.y, center.y - halfSize.y, center.y + halfSize.y),
    z: clamp(p.z, center.z - halfSize.z, center.z + halfSize.z),
  };
  const delta = { x: p.x - closest.x, y: p.y - closest.y, z: p.z - closest.z };
  const distance = Math.hypot(delta.x, delta.y, delta.z);
  if (distance >= court.ballRadius) return false;
  // Fixed substeps prevent normal shots tunnelling. Handle an embedded
  // sphere too (e.g. a future asset collider changed while developing).
  if (distance < 1e-8) {
    const faces = (["x", "y", "z"] as const).map((axis) => ({
      axis, depth: halfSize[axis] - Math.abs(p[axis] - center[axis]),
    })).sort((a, b) => a.depth - b.depth);
    const axis = faces[0].axis;
    const normal = { x: 0, y: 0, z: 0 };
    normal[axis] = p[axis] >= center[axis] ? 1 : -1;
    p[axis] = center[axis] + normal[axis] * (halfSize[axis] + court.ballRadius);
    return bounce(ball, normal, 0.7);
  }
  const normal = { x: delta.x / distance, y: delta.y / distance, z: delta.z / distance };
  const penetration = court.ballRadius - distance;
  p.x += normal.x * penetration; p.y += normal.y * penetration; p.z += normal.z * penetration;
  return bounce(ball, normal, 0.7);
}

function collideRim(ball: PracticeBall, court: PracticeCourt): boolean {
  const { center, radius, tubeRadius } = court.rim;
  const p = ball.position;
  const dx = p.x - center.x, dz = p.z - center.z;
  const radial = Math.hypot(dx, dz);
  const closest = {
    x: center.x + (radial > 1e-8 ? dx / radial : 1) * radius,
    y: center.y,
    z: center.z + (radial > 1e-8 ? dz / radial : 0) * radius,
  };
  const delta = { x: p.x - closest.x, y: p.y - closest.y, z: p.z - closest.z };
  const distance = Math.hypot(delta.x, delta.y, delta.z);
  const contact = court.ballRadius + tubeRadius;
  if (distance >= contact) return false;
  const normal = distance > 1e-8
    ? { x: delta.x / distance, y: delta.y / distance, z: delta.z / distance }
    : { x: 0, y: 1, z: 0 };
  const penetration = contact - distance;
  p.x += normal.x * penetration; p.y += normal.y * penetration; p.z += normal.z * penetration;
  return bounce(ball, normal, 0.62);
}

/** One fixed substep. Callers cannot advance with unbounded wall-clock deltas. */
export function stepBall(ball: PracticeBall, court: PracticeCourt): PracticeEvent[] {
  if (ball.finished) return [];
  const events: PracticeEvent[] = [];
  const previous = { ...ball.position };
  const p = ball.position, v = ball.velocity;
  ball.time += FIXED_STEP;
  p.x += v.x * FIXED_STEP;
  p.y += v.y * FIXED_STEP - GRAVITY * FIXED_STEP ** 2 / 2;
  p.z += v.z * FIXED_STEP;
  v.y -= GRAVITY * FIXED_STEP;

  if (collideBoard(ball, court)) { ball.hitBackboard = true; events.push("backboard"); }
  if (collideRim(ball, court)) { ball.hitRim = true; events.push("rim"); }

  const hoop = court.rim;
  if (!ball.scored && !ball.hitFloor && v.y < 0 &&
      previous.y > hoop.scoringHeight && p.y <= hoop.scoringHeight) {
    const fraction = (previous.y - hoop.scoringHeight) / (previous.y - p.y);
    const x = previous.x + (p.x - previous.x) * fraction - hoop.center.x;
    const z = previous.z + (p.z - previous.z) * fraction - hoop.center.z;
    // Whole sphere must clear the inner lip on a downward crossing.
    if (Math.hypot(x, z) <= hoop.radius - hoop.tubeRadius - court.ballRadius) {
      ball.scored = true;
      events.push("basket");
    }
  }

  if (p.y < court.ballRadius) {
    p.y = court.ballRadius;
    if (!ball.hitFloor) { ball.hitFloor = true; events.push("floor"); }
    if (v.y < 0) v.y *= -0.48;
    v.x *= 0.8; v.z *= 0.8;
  }
  if (ball.time >= 6 || Math.abs(p.x) > 10 || Math.abs(p.z) > 12 || p.y > 15 ||
      (ball.hitFloor && ball.time > 3)) {
    ball.finished = true;
    events.push("finished");
  }
  return events;
}
