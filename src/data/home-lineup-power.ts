import "server-only";
import { cache } from "react";
import type { CourtsideHomeData } from "./league";
import type { HomeLineupPower, HomeLineupPowerContext, HomeLineupPowerSource } from "@/domain/home-lineup-power";
import { isLineupPowerSnapshot } from "@/domain/lineup-power";
import { lineupPowerDeps, produceLineupPowerSnapshot, type LineupPowerDeps } from "./lineup-power";

type Dependencies = {
  inputs: LineupPowerDeps;
  produce: (priorSnapshotId: string | null, inputs: LineupPowerDeps) => Promise<unknown>;
};
const unavailable = (message: string): HomeLineupPowerSource => ({ status: "unavailable", message });

/** Read-only producer consumer. Captures provenance via the existing injected
 * state dependency, without extending or changing the producer's contract. */
export async function loadHomeLineupPowerSource(
  deps: Dependencies = { inputs: lineupPowerDeps, produce: produceLineupPowerSnapshot },
): Promise<HomeLineupPowerSource> {
  let context: HomeLineupPowerContext | null = null;
  try {
    const startedAt = deps.inputs.now();
    const inputs: LineupPowerDeps = { ...deps.inputs, state: async () => {
      const state = await deps.inputs.state();
      if (state.season_type === "regular" && /^20\d{2}$/.test(state.season)
        && typeof state.previous_season === "string" && /^20\d{2}$/.test(state.previous_season)
        && Number(state.previous_season) < Number(state.season)
        && Number.isSafeInteger(state.leg) && state.leg! >= 1 && state.leg! < 30) {
        context = { season: state.season, priorStatsSeason: state.previous_season, sourceLeg: state.leg! };
      }
      return state;
    } };
    // A new calculation is not a saved prior. No persistence or movement is invented.
    const snapshot = await deps.produce(null, inputs);
    const checkedAt = deps.inputs.now();
    if (!isLineupPowerSnapshot(snapshot) || snapshot.priorSnapshotId !== null) {
      return unavailable("Lineup Power evidence could not be verified. No ranks are shown.");
    }
    // TypeScript does not follow the dependency callback's assignment across await.
    const observed = context as HomeLineupPowerContext | null;
    const generatedAt = Date.parse(snapshot.asOf);
    if (!observed || snapshot.week !== observed.sourceLeg + 1
      || !Number.isFinite(startedAt) || !Number.isFinite(checkedAt) || checkedAt < startedAt
      || generatedAt < startedAt || generatedAt > checkedAt) {
      return unavailable("The projected scoring period is not verified. No ranks are shown.");
    }
    return { status: "available", snapshot, context: observed };
  } catch {
    return unavailable("Lineup Power source data is temporarily unavailable. No ranks are inferred.");
  }
}

/** Public sources only; reuse once per React request. Sleeper owns the source TTLs. */
export const getHomeLineupPowerSource = cache(() => loadHomeLineupPowerSource());

/** Join to already-loaded identities. Missing/foreign context never becomes a
 * plausible-looking rank under today's team labels. No I/O or formula here. */
export function buildHomeLineupPower(
  home: Pick<CourtsideHomeData, "hub">,
  source: HomeLineupPowerSource,
): HomeLineupPower {
  if (source.status === "unavailable") return source;
  const hub = home.hub;
  if (!hub || hub.season.status !== "in_season" || hub.season.seasonYear !== source.context.season) {
    return { status: "unavailable", message: "Lineup Power does not match the active league season. No ranks are shown." };
  }
  const ids = new Set(hub.teams.map(team => team.id));
  if (!isLineupPowerSnapshot(source.snapshot) || source.snapshot.week !== source.context.sourceLeg + 1
    || source.snapshot.priorSnapshotId !== null || ids.size !== 10 || hub.teams.length !== 10
    || source.snapshot.teams.some(team => !ids.has(team.rosterId))) {
    return { status: "unavailable", message: "Lineup Power team or period coverage is inconsistent. No ranks are shown." };
  }
  return { ...source, teams: hub.teams.map(({ id, name, avatar }) => ({ id, name, avatar })), prior: null };
}
