/**
 * getDataToolsState — the Intel tools' empty-state copy may only
 * describe a world the loader PROVED (issue #224 follow-through,
 * dot P2 on PR #248).
 *
 * Null tools are not evidence: a tool is null before tip-off, in
 * Week 1 with nothing closed, AND whenever its data failed — the
 * previous boolean ("season started") let a Week 3 previews outage
 * (completed finals on file, current schedule missing) render "no
 * week has closed yet", and let an NBA-state fetch failure render
 * as not-tipped-off. These cases drive the real loader with fake
 * Sleeper fetchers (rule 11) and pin each world to its proof:
 * - pre-tipoff: the state fetch succeeded and says "pre";
 * - no-closed-week: underway + assembly loaded + still Week 1;
 * - unavailable: everything else, however suggestive the nulls look.
 */
import { describe, expect, it } from "vitest";
import { getDataToolsState, type AnalyticsFetchers } from "../league";
import type {
  RawLeague,
  RawMatchupEntry,
  RawNbaState,
  RawRoster,
  RawUser,
} from "../sleeper";

const LEAGUE: RawLeague = {
  name: "GOAT Hoopers",
  season: "2026",
  status: "in_season",
  total_rosters: 2,
  settings: { playoff_teams: 6, playoff_week_start: 15, divisions: 0 },
  scoring_settings: {},
};

const ROSTERS: RawRoster[] = [1, 2].map((id) => ({
  roster_id: id,
  owner_id: `user-${id}`,
  settings: {
    wins: 0,
    losses: 0,
    ties: 0,
    fpts: 0,
    fpts_decimal: 0,
    fpts_against: 0,
    fpts_against_decimal: 0,
  },
  players: [],
}));

const USERS: RawUser[] = [1, 2].map((id) => ({
  user_id: `user-${id}`,
  display_name: `Manager ${id}`,
  avatar: null,
  metadata: { team_name: `Team ${id}` },
}));

/** A completed final between the two fixture rosters. */
const FINAL: RawMatchupEntry[] = [
  { roster_id: 1, matchup_id: 1, points: 100 },
  { roster_id: 2, matchup_id: 1, points: 90 },
];

const state = (season_type: string, week: number): RawNbaState => ({
  week,
  season_type,
  season: "2026",
});

const healthy = (nba: RawNbaState): AnalyticsFetchers => ({
  fetchLeague: async () => LEAGUE,
  fetchRosters: async () => ROSTERS,
  fetchUsers: async () => USERS,
  fetchNbaState: async () => nba,
  fetchMatchups: async () => [],
});

describe("getDataToolsState", () => {
  it("proves pre-tipoff only when the state fetch succeeds and says pre", async () => {
    await expect(getDataToolsState(healthy(state("pre", 1)))).resolves.toBe(
      "pre-tipoff"
    );
  });

  it("proves no-closed-week in a healthy Week 1", async () => {
    await expect(
      getDataToolsState(healthy(state("regular", 1)))
    ).resolves.toBe("no-closed-week");
  });

  it("NBA-state failure is unavailable — uncertainty is not 'not tipped off'", async () => {
    const fetchers: AnalyticsFetchers = {
      ...healthy(state("regular", 1)),
      fetchNbaState: async () => {
        throw new Error("state feed down");
      },
    };
    await expect(getDataToolsState(fetchers)).resolves.toBe("unavailable");
  });

  it("upstream data failure is unavailable even in Week 1 — a dead assembly proves nothing", async () => {
    const fetchers: AnalyticsFetchers = {
      ...healthy(state("regular", 1)),
      fetchLeague: async () => {
        throw new Error("league feed down");
      },
    };
    await expect(getDataToolsState(fetchers)).resolves.toBe("unavailable");
  });

  it("Week 3 with completed Weeks 1–2 but the current schedule missing is unavailable, not 'no week has closed'", async () => {
    // The dot's case: previews return null here (finals exist, but no
    // current/upcoming week was supplied). Weeks HAVE closed, so the
    // null is a data gap and the copy must stay neutral.
    const fetchers: AnalyticsFetchers = {
      ...healthy(state("regular", 3)),
      fetchMatchups: async (week: number) => (week < 3 ? FINAL : []),
    };
    await expect(getDataToolsState(fetchers)).resolves.toBe("unavailable");
  });

  it("a later week is unavailable even when every feed answers", async () => {
    const fetchers: AnalyticsFetchers = {
      ...healthy(state("regular", 3)),
      fetchMatchups: async () => FINAL,
    };
    await expect(getDataToolsState(fetchers)).resolves.toBe("unavailable");
  });
});
