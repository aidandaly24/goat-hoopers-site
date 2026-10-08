import type { PracticeCourt, PracticeVector } from "../../../domain/arcade/free-throw";

/** A small, reachable practice zone within the authored court. No assets
 * or colliders move, and every new attempt uses the same speed model. */
const OFFSETS = [[0, 0], [0, -0.8], [-1.8, -0.4], [1.8, -0.4],
  [-2.2, 0.7], [2.2, 0.7], [-1.3, 1.4], [1.3, 1.4], [0, 1.8]] as const;

export function shootingPositions(court: PracticeCourt): PracticeVector[] {
  return OFFSETS.map(([x, z]) => ({ x: court.release.x + x, y: court.release.y, z: court.release.z + z }));
}

export function nextShootingPosition(
  court: PracticeCourt, current: PracticeVector, random: () => number = Math.random,
): PracticeVector {
  const candidates = shootingPositions(court).filter(position =>
    Math.hypot(position.x - current.x, position.z - current.z) > 0.01);
  const value = random();
  const unit = Number.isFinite(value) ? Math.max(0, Math.min(1 - Number.EPSILON, value)) : 0;
  return { ...candidates[Math.floor(unit * candidates.length)] };
}
