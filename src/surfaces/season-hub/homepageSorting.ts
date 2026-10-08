import type { LiveClubhouseDirectoryEntry } from "@/domain/clubhouse-directory";
import type { Standing } from "@/domain";

export type SortDirection = "asc" | "desc";
export type SortOrder<Key extends string> = { key: Key; direction: SortDirection };
export type DirectorySortKey = "league" | "team" | "manager" | "finish" | "wins" | "opponent" | "players";
export type StandingSortKey = "rank" | "team" | "wins" | "losses" | "points";

/** A second activation reverses direction; changing columns uses its natural order. */
export function nextSort<Key extends string>(
  current: SortOrder<Key>, key: Key, initial: SortDirection,
): SortOrder<Key> {
  return { key, direction: current.key === key
    ? current.direction === "asc" ? "desc" : "asc"
    : initial };
}

const names = new Intl.Collator("en", { sensitivity: "base", numeric: true });
type SortValue = number | string | null | undefined;
const missing = (value: SortValue) => value == null ||
  (typeof value === "number" ? !Number.isFinite(value) : !value.trim());

/** Missing values stay last in either direction. Equal values keep input order. */
function sortedBy<Row>(rows: Row[], value: (row: Row) => SortValue, direction: SortDirection): Row[] {
  return rows.map((row, index) => ({ row, index })).sort((a, b) => {
    const left = value(a.row), right = value(b.row);
    const leftMissing = missing(left), rightMissing = missing(right);
    if (leftMissing || rightMissing) return Number(leftMissing) - Number(rightMissing) || a.index - b.index;
    const result = typeof left === "number" && typeof right === "number"
      ? left - right : names.compare(String(left), String(right));
    return (direction === "asc" ? result : -result) || a.index - b.index;
  }).map(({ row }) => row);
}

export const directoryInitialDirection = (key: DirectorySortKey): SortDirection =>
  key === "wins" || key === "players" ? "desc" : "asc";

export function sortDirectory(
  entries: LiveClubhouseDirectoryEntry[], order: SortOrder<DirectorySortKey>, preseason: boolean,
): LiveClubhouseDirectoryEntry[] {
  if (order.key === "league") return [...entries];
  return sortedBy(entries, (entry) => {
    switch (order.key) {
      case "team": return entry.identity.name;
      case "manager": return entry.identity.managerName;
      case "finish": return entry.previousSeason?.finish;
      case "wins": return (preseason && entry.previousSeason ? entry.previousSeason : entry.currentRecord)?.wins;
      case "players": return entry.players.length;
      case "opponent": {
        const matchup = entry.currentMatchup;
        return matchup ? (matchup.home.id === entry.identity.id ? matchup.away : matchup.home).name : null;
      }
    }
  }, order.direction);
}

export const standingInitialDirection = (key: StandingSortKey): SortDirection =>
  key === "wins" || key === "points" ? "desc" : "asc";

export function sortStandings(standings: Standing[], order: SortOrder<StandingSortKey>): Standing[] {
  return sortedBy(standings, (standing) => {
    switch (order.key) {
      case "rank": return standing.rank;
      case "team": return standing.team.name;
      case "wins": return standing.wins;
      case "losses": return standing.losses;
      case "points": return standing.pointsFor;
    }
  }, order.direction);
}
