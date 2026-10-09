/**
 * GM IQ loaders — manager archetypes from the baked 2025 season metrics.
 *
 * Pure reads of GM_METRICS_2025 (src/data/gm-archetypes-2025.ts) through
 * the domain's buildArchetypeProfiles. No Sleeper calls, no database, no
 * cache: the season is final, so the input never changes. The raw map is
 * an injectable parameter (rule 11) so tests can run fixtures.
 */
import {
  buildArchetypeProfiles,
  type ManagerArchetype,
  type RawGmMetrics2025,
} from "@/domain/manager-archetype";
import { GM_METRICS_2025 } from "./gm-archetypes-2025";

/** All managers' archetype histories, sorted by roster id. */
export function getManagerArchetypes(
  raw: Record<string, RawGmMetrics2025> = GM_METRICS_2025,
): ManagerArchetype[] {
  return buildArchetypeProfiles(raw);
}

/** One roster's archetype history, or null when the roster has no profile. */
export function getManagerArchetype(
  rosterId: string,
): ManagerArchetype | null {
  return getManagerArchetypes().find((p) => p.rosterId === rosterId) ?? null;
}
