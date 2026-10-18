import type { NbaRoster, NbaTeamDirectory } from "@/domain/arcade/nba-rosters";
import { isNbaRoster, isNbaTeamDirectory, isNbaTeamId } from "./nba-rosters-decode";

/** Same-origin, read-only, on-demand adapters; callers own in-session memoization. */
export async function fetchNbaTeams(fetcher: typeof fetch = fetch, signal?: AbortSignal): Promise<NbaTeamDirectory> {
  const response = await fetcher("/api/arcade/nba/teams", { signal });
  if (!response.ok) throw new Error("The NBA team directory is unavailable. Try again.");
  const value: unknown = await response.json();
  if (!isNbaTeamDirectory(value)) throw new Error("The NBA team directory is incomplete. Try again.");
  return value;
}

export async function fetchNbaRoster(teamId: string, fetcher: typeof fetch = fetch, signal?: AbortSignal): Promise<NbaRoster> {
  if (!isNbaTeamId(teamId)) throw new Error("Unknown NBA team");
  const response = await fetcher(`/api/arcade/nba/teams/${encodeURIComponent(teamId)}/roster`, { signal });
  if (!response.ok) throw new Error("This team's roster is unavailable. Retry to keep your drawn team.");
  const value: unknown = await response.json();
  if (!isNbaRoster(value, teamId)) throw new Error("This team's roster is incomplete. Retry to keep your drawn team.");
  return value;
}
