import { describe, expect, it } from "vitest";
import {
  buildLiveClubhouseDirectory,
  getCourtsidePortraits,
} from "../courtside-home";
import {
  selectWeeklyEdition,
  weeklyEditions,
  getWeeklyArchive,
} from "../weekly-spotlight";
import { clubhouseDirectory } from "../clubhouse-directory";
import type { Team, Player, Transaction } from "@/domain";

const team = (id: string): Team => ({
  id,
  name: `Live team ${id}`,
  managerName: `New manager ${id}`,
  avatar: null,
  wins: 3,
  losses: 2,
  ties: 0,
  pointsFor: 400,
  pointsAgainst: 300,
});
const player = (id: string): Player => ({
  id,
  fullName: `Live player ${id}`,
  position: "C",
  nbaTeam: "DEN",
  espnId: null,
});
const move = (id: string, createdAt: number): Transaction => ({
  id,
  createdAt,
  type: "free_agent",
  week: 1,
  summary: id,
  teamIds: ["8"],
  adds: [],
  drops: [],
});

describe("live courtside directory", () => {
  it("uses current identities/records and keeps every roster reference, including new players", () => {
    const result = buildLiveClubhouseDirectory(
      [team("8")],
      { "8": [player("4866"), player("new-rookie")] },
      [],
      [],
    );
    expect(result[0].identity.managerName).toBe("New manager 8");
    expect(result[0].currentRecord).toEqual({ wins: 3, losses: 2, ties: 0 });
    expect(result[0].players.map((reference) => reference.id)).toEqual([
      "4866",
      "new-rookie",
    ]);
    expect(result[0].featuredPlayerIds).toEqual(["4866"]); // transferred anchors disappear
    expect(result[0].previousSeason).toMatchObject({
      wins: 1,
      losses: 20,
      finish: 10,
      ownerNote: "Under the previous manager as QBs Gremlins.",
    });
  });
  it("keeps current pairing and latest move separate from historical records", () => {
    const home = team("8"),
      away = team("2");
    const [entry] = buildLiveClubhouseDirectory(
      [home],
      {},
      [{ week: 7, home, away, homePoints: null, awayPoints: null }],
      [move("older", 1), move("latest", 2)],
    );
    expect(entry.currentMatchup?.away.id).toBe("2");
    expect(entry.opener).toBeNull();
    expect(entry.latestMove?.id).toBe("latest");
  });
  it("preserves all 228 review references and only serves approved portrait IDs", () => {
    const teams = clubhouseDirectory.map((entry) => ({
      ...team(entry.identity.id),
      ...entry.identity,
    }));
    const rosters = Object.fromEntries(
      clubhouseDirectory.map((entry) => [
        entry.identity.id,
        entry.players.map((reference) => ({ ...reference, espnId: null })),
      ]),
    );
    const result = buildLiveClubhouseDirectory(teams, rosters, [], []);
    expect(result.reduce((sum, entry) => sum + entry.players.length, 0)).toBe(
      228,
    );
    expect(Object.keys(getCourtsidePortraits())).toHaveLength(30);
  });
});

describe("weekly editorial calendar", () => {
  it("never shows a future edition and retains a stale last edition instead of inventing a new week", () => {
    expect(
      selectWeeklyEdition(weeklyEditions, new Date("2026-09-01")),
    ).toBeNull();
    expect(
      selectWeeklyEdition(weeklyEditions, new Date("2026-10-01"))?.id,
    ).toBe("2026-W40");
    expect(
      selectWeeklyEdition(weeklyEditions, new Date("2026-10-08"))?.id,
    ).toBe("2026-W41");
    expect(
      selectWeeklyEdition(weeklyEditions, new Date("2026-10-20"))?.id,
    ).toBe("2026-W41");
  });
  it("keeps proposed drafts, upcoming empty scores and verified historical finals distinct", () => {
    const archive = getWeeklyArchive();
    expect(archive.map((edition) => edition.id)).toEqual([
      "2026-W41",
      "2026-W40",
    ]);
    expect(archive[0]).toMatchObject({
      status: "draft",
      publishedAt: null,
      game: { state: "upcoming", scores: null },
    });
    expect(archive[1].game).toMatchObject({
      state: "final",
      scores: [326, 251.5],
    });
    expect(
      archive[0].playerSpotlights.find(
        (spotlight) => spotlight.playerId === "4866",
      )?.statPeriod,
    ).toContain("college");
  });
});

// Exercise the production loader with injectable offline dependencies.
import { getCourtsideHomeData, type SeasonHubData } from "../league";
import { emptyLeagueStats } from "../transform";
import type { RawRoster } from "../sleeper";

function dependencies() {
  const teams = [team("8"), team("2")];
  const hub: SeasonHubData = {
    season: {
      leagueName: "Test",
      seasonYear: "2026",
      status: "pre_season",
      totalTeams: 2,
      playoffTeams: 1,
      playoffWeekStart: 20,
    },
    teams,
    standings: [],
    transactions: [],
    stats: emptyLeagueStats(),
  };
  const roster = (id: number, players: string[]): RawRoster => ({
    roster_id: id,
    owner_id: `owner-${id}`,
    players,
    settings: {
      wins: 0,
      losses: 0,
      ties: 0,
      fpts: 0,
      fpts_decimal: 0,
      fpts_against: 0,
      fpts_against_decimal: 0,
    },
  });
  return {
    now: () => new Date("2026-10-08T00:00:00Z"),
    hub: async () => hub,
    rosters: async () => [roster(8, ["4866", "new"]), roster(2, ["2259"])],
    state: async () => ({ week: 0, season_type: "pre", season: "2026" }),
    references: async (ids: string[]) => ids.map(player),
    matchups: async () => [
      { roster_id: 8, matchup_id: 1, points: 0 },
      { roster_id: 2, matchup_id: 1, points: 0 },
    ],
  };
}

describe("courtside production loader", () => {
  it("normalizes preseason placeholder scores and retains live ownership", async () => {
    const result = await getCourtsideHomeData(undefined, dependencies());
    expect(result.edition?.id).toBe("2026-W41");
    expect(
      result.directory[0].players.map((reference) => reference.id),
    ).toEqual(["4866", "new"]);
    expect(result.directory[0].currentMatchup).toMatchObject({
      week: 1,
      homePoints: null,
      awayPoints: null,
    });
  });
  it("keeps all player IDs accessible if name resolution fails", async () => {
    const deps = dependencies();
    deps.references = async () => {
      throw new Error("Offline");
    };
    const result = await getCourtsideHomeData(undefined, deps);
    expect(result.rosterNamesAvailable).toBe(false);
    expect(
      result.directory[0].players.map((reference) => reference.fullName),
    ).toEqual(["Player 4866", "Player new"]);
  });
  it("renders a truthful unavailable directory when the live league fails", async () => {
    const deps = dependencies();
    deps.hub = async () => {
      throw new Error("Offline");
    };
    const result = await getCourtsideHomeData(undefined, deps);
    expect(result.hub).toBeNull();
    expect(result.directory).toEqual([]);
    expect(result.edition?.id).toBe("2026-W41");
  });
});

describe("courtside archive mode (issue #224 P1)", () => {
  // The 2026-W40 edition is the frozen 2025 final: teams "5" and "7",
  // recorded score 326–251.5. The live league below is mid–Week 1 with
  // team 5 playing team 2 — before the fix, the loader fed those live
  // matchups into the archived edition's directory, so the archive
  // narrated a live Week 1 game as its own.
  function archiveDependencies(liveHomePoints: number, liveAwayPoints: number) {
    const teams = [team("5"), team("7"), team("2")];
    const hub: SeasonHubData = {
      season: {
        leagueName: "Test",
        seasonYear: "2026",
        status: "in_season",
        totalTeams: 3,
        playoffTeams: 1,
        playoffWeekStart: 20,
      },
      teams,
      standings: [],
      transactions: [],
      stats: emptyLeagueStats(),
    };
    const roster = (id: number): RawRoster => ({
      roster_id: id,
      owner_id: `owner-${id}`,
      players: [],
      settings: {
        wins: 0,
        losses: 0,
        ties: 0,
        fpts: 0,
        fpts_decimal: 0,
        fpts_against: 0,
        fpts_against_decimal: 0,
      },
    });
    return {
      now: () => new Date("2026-10-21T00:00:00Z"),
      hub: async () => hub,
      rosters: async () => [roster(5), roster(7), roster(2)],
      state: async () => ({ week: 1, season_type: "regular", season: "2026" }),
      references: async (ids: string[]) => ids.map(player),
      matchups: async () => [
        { roster_id: 5, matchup_id: 1, points: liveHomePoints },
        { roster_id: 2, matchup_id: 1, points: liveAwayPoints },
        { roster_id: 7, matchup_id: 2, points: 12 },
      ],
    };
  }

  it("sources an explicitly archived edition from its own game record, not the live week", async () => {
    const result = await getCourtsideHomeData("2026-W40", archiveDependencies(111, 99));
    expect(result.edition?.id).toBe("2026-W40");
    // The game record stays on the edition, where the archived feature
    // reads it: teams 5 and 7, recorded 326–251.5 final.
    expect(result.edition?.game.teamIds).toEqual(["5", "7"]);
    expect(result.edition?.game.scores).toEqual([326, 251.5]);
    // The directory is live data. The frozen game is nobody's current
    // matchup, and the live week's points (111/99) appear nowhere in
    // an archived render.
    for (const entry of result.directory) {
      expect(entry.currentMatchup).toBeNull();
    }
  });

  it("keeps the archived game out of the live directory — no fabricated current opponent", async () => {
    // Regression (PR #247 review): the loader used to pass the frozen
    // matchup into buildLiveClubhouseDirectory as `currentMatchup`, so
    // /weekly/2026-W40's directory labelled roster 7 roster 5's
    // "Current opponent / Week 0" — W40 has no leagueWeek, so the week
    // was fabricated as 0, and even a real historical week would still
    // be a historical opponent presented as current.
    const result = await getCourtsideHomeData("2026-W40", archiveDependencies(111, 99));
    const five = result.directory.find((entry) => entry.identity.id === "5");
    const seven = result.directory.find((entry) => entry.identity.id === "7");
    expect(five?.currentMatchup).toBeNull();
    expect(seven?.currentMatchup).toBeNull();
    expect(five?.opener).toBeNull();
    expect(seven?.opener).toBeNull();
  });

  it("leaves the archived directory identical when the live week advances", async () => {
    const before = await getCourtsideHomeData("2026-W40", archiveDependencies(111, 99));
    const after = await getCourtsideHomeData("2026-W40", archiveDependencies(240, 3));
    expect(after.directory).toEqual(before.directory);
  });

  it("still serves the live week when no edition is requested", async () => {
    const result = await getCourtsideHomeData(undefined, archiveDependencies(111, 99));
    const five = result.directory.find((entry) => entry.identity.id === "5");
    // toMatchups orders a pair by roster id: team 2 is home (99),
    // team 5 away (111) — the live points, not the archive's 326.
    expect(five?.currentMatchup).toMatchObject({
      week: 1,
      homePoints: 99,
      awayPoints: 111,
    });
    expect(five?.currentMatchup?.away.id).toBe("5");
  });
});
