import type { Player } from "@/domain";
import { playerNameMatches } from "@/domain/player-search";

/** Local roster filters. They do not select or fetch a different data set. */
export type RosterFilters = { search: string; position: string };

const POSITIONS = ["PG", "SG", "SF", "PF", "C"];

export function rosterPositions(players: readonly Player[]): string[] {
  const supplied = players.flatMap((player) => player.position ? [player.position] : []);
  return [...new Set([...POSITIONS, ...supplied])];
}

export function readRosterFilters(
  params: Pick<URLSearchParams, "get">,
  positions: readonly string[],
): RosterFilters {
  const position = params.get("position") ?? "All";
  return {
    search: params.get("rosterSearch") ?? "",
    position: positions.includes(position) ? position : "All",
  };
}

export function filterRoster(players: readonly Player[], filters: RosterFilters): Player[] {
  return players.filter((player) =>
    (filters.position === "All" || player.position === filters.position) &&
    playerNameMatches(player.fullName, filters.search),
  );
}

/** Keep unrelated query entries/hash and the current route when filters change. */
export function rosterFiltersUrl(
  pathname: string,
  search: string,
  hash: string,
  filters: RosterFilters,
): string {
  const params = new URLSearchParams(search);
  if (filters.search) params.set("rosterSearch", filters.search);
  else params.delete("rosterSearch");
  if (filters.position !== "All") params.set("position", filters.position);
  else params.delete("position");
  const query = params.toString();
  return `${pathname}${query ? `?${query}` : ""}${hash}`;
}
