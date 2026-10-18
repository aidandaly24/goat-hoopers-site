import "server-only";
import { unstable_cache } from "next/cache";
import type { NbaRoster, NbaTeam, NbaTeamDirectory } from "@/domain/arcade/nba-rosters";
import { decodeNbaRoster, decodeNbaTeamDirectory, isNbaTeamId, NBA_TEAMS_SOURCE_URL, nbaRosterSourceUrl } from "./nba-rosters-decode";

export type NbaRosterDependencies = { fetcher: typeof fetch; now: () => Date };
const SOURCE_TIMEOUT_MS = 8_000;
const DIRECTORY_LIMIT_BYTES = 256 * 1024;
const ROSTER_LIMIT_BYTES = 512 * 1024;

/** Bound both download and parsing; an upstream timeout/error never becomes fake data. */
async function sourceJson(url: string, maxBytes: number, deps: NbaRosterDependencies): Promise<unknown> {
  const aborter = new AbortController();
  const timer = setTimeout(() => aborter.abort(), SOURCE_TIMEOUT_MS);
  try {
    const response = await deps.fetcher(url, { signal: aborter.signal, cache: "no-store", redirect: "error", headers: { Accept: "application/json" } });
    if (!response.ok || !response.body || !response.headers.get("content-type")?.includes("application/json")) throw new Error("NBA roster source is unavailable");
    const contentLength = response.headers.get("content-length");
    if (contentLength && Number(contentLength) > maxBytes) { await response.body.cancel(); throw new Error("NBA source payload is too large"); }
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let length = 0;
    try {
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        length += chunk.value.byteLength;
        if (length > maxBytes) { await reader.cancel(); throw new Error("NBA source payload is too large"); }
        chunks.push(chunk.value);
      }
    } finally { reader.releaseLock(); }
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } finally { clearTimeout(timer); }
}

export async function loadNbaTeamDirectory(deps: NbaRosterDependencies): Promise<NbaTeamDirectory> {
  const raw = await sourceJson(NBA_TEAMS_SOURCE_URL, DIRECTORY_LIMIT_BYTES, deps);
  return decodeNbaTeamDirectory(raw, deps.now().toISOString());
}
export async function loadNbaTeamRoster(team: NbaTeam, deps: NbaRosterDependencies): Promise<NbaRoster> {
  if (!isNbaTeamId(team.id)) throw new Error("Unknown NBA team");
  const raw = await sourceJson(nbaRosterSourceUrl(team.id), ROSTER_LIMIT_BYTES, deps);
  return decodeNbaRoster(raw, team, deps.now().toISOString());
}

// Only the slim projections enter persistent cache; raw contracts, salaries and bio do not.
// Stale-while-revalidate may return an older observation during a provider failure.
// Its original observation and provider timestamps are preserved for honest UI labels.
export const getNbaTeamDirectory = unstable_cache(
  () => loadNbaTeamDirectory({ fetcher: fetch, now: () => new Date() }),
  ["arcade-nba-team-directory-v1"], { revalidate: 86400 },
);
const getCachedRoster = unstable_cache(
  (team: NbaTeam) => loadNbaTeamRoster(team, { fetcher: fetch, now: () => new Date() }),
  ["arcade-nba-team-roster-v1"], { revalidate: 86400 },
);

/** Only directory members can cause a selected-team upstream fetch. */
export async function getNbaTeamRoster(teamId: string): Promise<NbaRoster> {
  if (!isNbaTeamId(teamId)) throw new Error("Unknown NBA team");
  const directory = await getNbaTeamDirectory();
  const team = directory.teams.find(candidate => candidate.id === teamId);
  if (!team) throw new Error("Unknown NBA team");
  return getCachedRoster(team);
}
