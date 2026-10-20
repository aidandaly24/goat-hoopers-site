import type { PracticeCourt, PracticeVector } from "./free-throw";

/** The existing reachable practice zone; the court/colliders never move. */
const OFFSETS = [[0, 0], [0, -0.8], [-1.8, -0.4], [1.8, -0.4],
  [-2.2, 0.7], [2.2, 0.7], [-1.3, 1.4], [1.3, 1.4], [0, 1.8]] as const;

export function shootingPositions(court: PracticeCourt): PracticeVector[] {
  return OFFSETS.map(([x, z]) => ({ x: court.release.x + x, y: court.release.y, z: court.release.z + z }));
}

export function nextShootingPosition(court: PracticeCourt, current: PracticeVector, random: () => number = Math.random): PracticeVector {
  const candidates = shootingPositions(court).filter(position => Math.hypot(position.x - current.x, position.z - current.z) > 0.01);
  const value = random(), unit = Number.isFinite(value) ? Math.max(0, Math.min(1 - Number.EPSILON, value)) : 0;
  return { ...candidates[Math.floor(unit * candidates.length)] };
}

/** All accounts receive the same near/far/left/right cycle; no player-selected seed. */
export function rankedShootingPositions(court: PracticeCourt): PracticeVector[] {
  const spots = shootingPositions(court);
  return [0, 8, 2, 5, 1, 6, 3, 4, 7].map(index => ({ ...spots[index] }));
}
