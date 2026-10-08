import { describe, expect, it } from "vitest";
import type { Standing, Team } from "@/domain";
import type { LiveClubhouseDirectoryEntry } from "@/domain/clubhouse-directory";
import { directoryInitialDirection, nextSort, sortDirectory, sortStandings, standingInitialDirection } from "./homepageSorting";

function team(id: string, name = `Team ${id}`): Team {
  return { id, name, managerName: `Manager ${id}`, avatar: null, wins: 0, losses: 0, ties: 0, pointsFor: 0, pointsAgainst: 0 };
}
function entry(id: string, overrides: Partial<LiveClubhouseDirectoryEntry> = {}): LiveClubhouseDirectoryEntry {
  return { identity: team(id), currentRecord: null, players: [], featuredPlayerIds: [], previousSeason: null,
    opener: null, recentMove: null, currentMatchup: null, latestMove: null, ...overrides };
}
function standing(id: string, rank: number, pointsFor: number, wins = 0, losses = 0): Standing {
  // Deliberately different: the display and comparator must use Standing.pointsFor.
  return { team: team(id), rank, pointsFor, wins, losses, ties: 0, gamesBack: 0 };
}
const ids = (rows: LiveClubhouseDirectoryEntry[]) => rows.map((row) => row.identity.id);
const standingIds = (rows: Standing[]) => rows.map((row) => row.team.id);

describe("homepage column orders", () => {
  it("toggles on repeated activation and uses a new column's natural direction", () => {
    const order = { key: "rank", direction: "asc" } as const;
    expect(nextSort(order, "rank", "asc")).toEqual({ key: "rank", direction: "desc" });
    let current = nextSort(order, "wins", standingInitialDirection("wins"));
    expect(current).toEqual({ key: "wins", direction: "desc" });
    for (const direction of ["asc", "desc", "asc", "desc"] as const) {
      current = nextSort(current, "wins", "desc");
      expect(current.direction).toBe(direction);
    }
    expect(nextSort(current, "losses", standingInitialDirection("losses"))).toEqual({ key: "losses", direction: "asc" });
    expect(directoryInitialDirection("players")).toBe("desc");
    expect(directoryInitialDirection("team")).toBe("asc");
  });

  it("compares numeric values rather than formatted text, keeps ties stable and never renumbers ranks", () => {
    const rows = [standing("a", 3, 900, 2), standing("b", 1, 10000, 10), standing("c", 2, 900, 2)];
    const before = structuredClone(rows);
    expect(standingIds(sortStandings(rows, { key: "points", direction: "desc" }))).toEqual(["b", "a", "c"]);
    expect(standingIds(sortStandings(rows, { key: "points", direction: "asc" }))).toEqual(["a", "c", "b"]);
    expect(standingIds(sortStandings(rows, { key: "wins", direction: "desc" }))).toEqual(["b", "a", "c"]);
    expect(sortStandings(rows, { key: "rank", direction: "asc" }).map((row) => row.rank)).toEqual([1, 2, 3]);
    expect(sortStandings(rows, { key: "points", direction: "asc" })[0]).toBe(rows[0]);
    expect(rows).toEqual(before);
  });

  it("preserves all-zero preseason ordering and sorts losses in both directions", () => {
    const rows = [standing("b", 1, 0, 0, 10), standing("a", 2, 0, 0, 2), standing("c", 3, 0, 0, 2)];
    expect(standingIds(sortStandings(rows, { key: "wins", direction: "desc" }))).toEqual(["b", "a", "c"]);
    expect(standingIds(sortStandings(rows, { key: "losses", direction: "asc" }))).toEqual(["a", "c", "b"]);
    expect(standingIds(sortStandings(rows, { key: "losses", direction: "desc" }))).toEqual(["b", "a", "c"]);
  });

  it("leaves NaN, infinity and missing points last even when descending; zero remains real", () => {
    const rows = [standing("nan", 1, NaN), standing("zero", 2, 0), standing("inf", 3, Infinity),
      standing("ten", 4, 1000), standing("missing", 5, undefined as unknown as number)];
    expect(standingIds(sortStandings(rows, { key: "points", direction: "asc" }))).toEqual(["zero", "ten", "nan", "inf", "missing"]);
    expect(standingIds(sortStandings(rows, { key: "points", direction: "desc" }))).toEqual(["ten", "zero", "nan", "inf", "missing"]);
  });

  it("orders names naturally, case-insensitively and consistently without sorting the input", () => {
    const rows = [entry("10"), entry("2"), entry("equal", { identity: team("equal", "team 2") }), entry("empty", { identity: team("empty", " ") })];
    expect(ids(sortDirectory(rows, { key: "team", direction: "asc" }, true))).toEqual(["2", "equal", "10", "empty"]);
    expect(ids(sortDirectory(rows, { key: "team", direction: "desc" }, true))).toEqual(["10", "2", "equal", "empty"]);
    expect(ids(sortDirectory(rows, { key: "league", direction: "asc" }, true))).toEqual(["10", "2", "equal", "empty"]);
    const standings = rows.map((row, index) => ({ ...standing(row.identity.id, index + 1, 0), team: team(row.identity.id, row.identity.name) }));
    expect(standingIds(sortStandings(standings, { key: "team", direction: "asc" }))).toEqual(["2", "equal", "10", "empty"]);
    expect(ids(rows)).toEqual(["10", "2", "equal", "empty"]);
  });

  it("orders historical finish numerically, missing histories last, and can return to league order", () => {
    const prior = (finish: number) => ({ season: "2025", wins: 0, losses: 0, finish, ownerNote: null });
    const rows = [entry("missing"), entry("ten", { previousSeason: prior(10) }), entry("two", { previousSeason: prior(2) }),
      entry("tied", { previousSeason: prior(2) }), entry("also-missing")];
    expect(ids(sortDirectory(rows, { key: "finish", direction: "asc" }, true))).toEqual(["two", "tied", "ten", "missing", "also-missing"]);
    expect(ids(sortDirectory(rows, { key: "finish", direction: "desc" }, true))).toEqual(["ten", "two", "tied", "missing", "also-missing"]);
    expect(ids(sortDirectory(rows, { key: "league", direction: "asc" }, true))).toEqual(ids(rows));
  });

  it("uses the record shown in the selected season, preserving missing and zero records", () => {
    const rows = [entry("prior", { previousSeason: { season: "2025", wins: 12, losses: 2, finish: 1, ownerNote: "Previous owner" }, currentRecord: { wins: 1, losses: 1, ties: 0 } }),
      entry("current", { currentRecord: { wins: 3, losses: 1, ties: 0 } }), entry("missing"),
      entry("zero", { currentRecord: { wins: 0, losses: 0, ties: 0 } })];
    expect(ids(sortDirectory(rows, { key: "wins", direction: "desc" }, true))).toEqual(["prior", "current", "zero", "missing"]);
    expect(ids(sortDirectory(rows, { key: "wins", direction: "desc" }, false))).toEqual(["current", "prior", "zero", "missing"]);
    expect(ids(sortDirectory(rows, { key: "wins", direction: "asc" }, true))).toEqual(["zero", "current", "prior", "missing"]);
  });

  it("sorts roster sizes and manager names, preserving full references and search subsets", () => {
    const player = (id: string) => ({ id, fullName: `Search Player ${id}`, position: "C", nbaTeam: "DEN" });
    const rows = [entry("a", { identity: { ...team("a"), managerName: "Zed" }, players: [player("1")] }),
      entry("b", { identity: { ...team("b"), managerName: "Amy" }, players: Array.from({ length: 10 }, (_, index) => player(String(index))) }), entry("c")];
    expect(ids(sortDirectory(rows, { key: "players", direction: "desc" }, true))).toEqual(["b", "a", "c"]);
    expect(ids(sortDirectory(rows, { key: "players", direction: "asc" }, true))).toEqual(["c", "a", "b"]);
    expect(ids(sortDirectory(rows, { key: "manager", direction: "asc" }, true))).toEqual(["b", "c", "a"]);
    const matches = rows.filter((row) => row.players.some((reference) => reference.fullName.includes("Search Player 1")));
    const result = sortDirectory(matches, { key: "players", direction: "desc" }, true);
    expect(ids(result)).toEqual(["b", "a"]);
    expect(result[0].players).toBe(rows[1].players);
    expect(result[0].players).toHaveLength(10);
  });

  it("sorts the actual other team for both sides of a matchup, with pending pairings last", () => {
    const pairing = { week: 4, home: team("a", "Alpha"), away: team("b", "Zulu"), homePoints: null, awayPoints: null };
    const rows = [entry("pending"), entry("a", { currentMatchup: pairing }), entry("b", { currentMatchup: pairing })];
    expect(ids(sortDirectory(rows, { key: "opponent", direction: "asc" }, false))).toEqual(["b", "a", "pending"]);
    expect(ids(sortDirectory(rows, { key: "opponent", direction: "desc" }, false))).toEqual(["a", "b", "pending"]);
    expect(sortDirectory([], { key: "opponent", direction: "desc" }, false)).toEqual([]);
    expect(sortStandings([], { key: "rank", direction: "asc" })).toEqual([]);
  });
});
