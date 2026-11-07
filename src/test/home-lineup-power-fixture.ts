import { buildLineupPowerSnapshot } from "@/data/lineup-power";
import type { HomeLineupPowerSource } from "@/domain/home-lineup-power";

/** Synthetic evidence only, shared by server-render fixtures and offline tests. */
export function homeLineupPowerFixture(allUnavailable = false): Extract<HomeLineupPowerSource, { status: "available" }> {
  const snapshot = buildLineupPowerSnapshot({
    asOf: "2026-10-27T12:00:00.000Z", week: 3,
    teams: Array.from({ length: 10 }, (_, index) => ({
      rosterId: String(index + 1),
      starters: Array.from({ length: allUnavailable || index === 2 ? 10 : 11 }, (_, slot) => ({
        playerId: `synthetic-power-${index}-${slot}`, lockedPoints: null, finalPoints: null,
        projectionPpg: index === 3 ? 20 : 20 + index,
        projectionBasis: index === 1 && slot === 0 ? "prior" as const : "current" as const,
      })),
    })),
  }, null);
  return { status: "available", snapshot, context: { season: "2026", priorStatsSeason: "2025", sourceLeg: 2 } };
}
