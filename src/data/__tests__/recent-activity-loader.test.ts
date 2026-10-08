/** Real league loaders + real Sleeper client, with an offline HTTP transport. */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getSeasonHubData, getTransactionHistory } from "@/data/league";
import type {
  RawLeague,
  RawMatchupEntry,
  RawNbaState,
  RawRoster,
  RawTransaction,
  RawUser,
} from "@/data/sleeper";
import { playerDirectory, rawTransaction } from "./fixtures";

type WeekResult<T> = T[] | Error;
const league: RawLeague = {
  name: "Fixture League", season: "2026", status: "in_season", total_rosters: 2,
  settings: { playoff_teams: 2, playoff_week_start: 20, divisions: 1 },
  scoring_settings: { pts: 1 },
};
const rosters: RawRoster[] = [1, 2].map((id) => ({
  roster_id: id, owner_id: `owner-${id}`, players: [`p${id}`],
  settings: { wins: 0, losses: 0, ties: 0, fpts: 100, fpts_decimal: 0,
    fpts_against: 90, fpts_against_decimal: 0 },
}));
const users: RawUser[] = [1, 2].map((id) => ({
  user_id: `owner-${id}`, display_name: `Manager ${id}`, avatar: null,
  metadata: { team_name: `Team ${id}` },
}));
const tx = (id: string, week: number, timestamp = week): RawTransaction =>
  rawTransaction({ transaction_id: id, leg: week, created: timestamp });

const fakeFetch = vi.fn<typeof fetch>();
let state: RawNbaState | Error;
let transactions: Map<number, WeekResult<RawTransaction>>;
let matchups: Map<number, WeekResult<RawMatchupEntry>>;

function requestedWeeks(resource: "matchups" | "transactions"): number[] {
  return fakeFetch.mock.calls.flatMap(([input]) => {
    const path = new URL(input instanceof Request ? input.url : String(input)).pathname;
    const match = path.match(new RegExp(`/league/[^/]+/${resource}/(\\d+)$`));
    return match ? [Number(match[1])] : [];
  });
}

beforeEach(() => {
  state = { season: "2026", season_type: "regular", week: 3 };
  transactions = new Map();
  matchups = new Map();
  fakeFetch.mockReset().mockImplementation(async (input) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    let payload: unknown;
    const weekly = url.pathname.match(/\/league\/[^/]+\/(matchups|transactions)\/(\d+)$/);
    if (weekly) {
      const week = Number(weekly[2]);
      payload = (weekly[1] === "transactions" ? transactions : matchups).get(week) ?? [];
    } else if (url.pathname === "/v1/state/nba") {
      payload = state;
    } else if (url.pathname === "/v1/players/nba") {
      payload = playerDirectory();
    } else if (/\/league\/[^/]+\/rosters$/.test(url.pathname)) {
      payload = rosters;
    } else if (/\/league\/[^/]+\/users$/.test(url.pathname)) {
      payload = users;
    } else if (/\/league\/[^/]+$/.test(url.pathname)) {
      payload = league;
    } else {
      throw new Error(`Unexpected offline provider request: ${url.pathname}`);
    }
    if (payload instanceof Error) throw payload;
    return new Response(JSON.stringify(payload), {
      status: 200, headers: { "Content-Type": "application/json" },
    });
  });
  // No real provider, database, or Next fetch-cache deduplication is used.
  vi.stubGlobal("fetch", fakeFetch);
});
afterEach(() => vi.unstubAllGlobals());

describe("recent activity through the real loader path", () => {
  it.each([55, 100000, Number.MAX_SAFE_INTEGER])(
    "rejects oversized regular-season week %s before request fan-out",
    async (week) => {
      state = { season: "2026", season_type: "regular", week };
      transactions.set(1, [tx("bounded-fallback", 1)]);
      const hub = await getSeasonHubData();
      expect(requestedWeeks("matchups")).toEqual([]);
      expect(requestedWeeks("transactions")).toEqual([1]);
      expect(hub.transactions.map((move) => move.id)).toEqual(["bounded-fallback"]);
      expect(hub.stats.mostActiveManager).toBeNull();
      fakeFetch.mockClear();
      const history = await getTransactionHistory();
      expect(requestedWeeks("matchups")).toEqual([]);
      expect(requestedWeeks("transactions")).toEqual([1]);
      expect(history.transactions.map((move) => move.id)).toEqual(["bounded-fallback"]);
    },
  );

  it("fetches weeks 1–3 for stats and the homepage, including current-week moves", async () => {
    for (const week of [1, 2, 3]) transactions.set(week, [tx(`week-${week}`, week)]);
    const hub = await getSeasonHubData();
    expect(requestedWeeks("matchups")).toEqual([1, 2, 3]);
    // Stats and feed each call the real client; Next deduplicates outside this test.
    expect(requestedWeeks("transactions")).toEqual([1, 2, 3, 1, 2, 3]);
    expect(hub.transactions.map((move) => move.id)).toEqual(["week-3", "week-2", "week-1"]);
    expect(hub.stats.mostActiveManager?.transactionCount).toBe(3);
  });

  it.each([0, 3, 100000])("keeps preseason week %s to a single week-1 transaction request", async (week) => {
    state = { season: "2026", season_type: "pre", week };
    transactions.set(1, [tx("preseason", 1)]);
    const hub = await getSeasonHubData();
    expect(requestedWeeks("matchups")).toEqual([]);
    expect(requestedWeeks("transactions")).toEqual([1]);
    expect(hub.stats.pointsForLeader).toBeNull();
    expect(hub.transactions.map((move) => move.id)).toEqual(["preseason"]);
    fakeFetch.mockClear();
    await getTransactionHistory();
    expect(requestedWeeks("transactions")).toEqual([1]);
  });

  it("uses the bounded week-1 fallback when the actual state request rejects", async () => {
    state = new Error("state unavailable");
    transactions.set(1, [tx("available", 1)]);
    const hub = await getSeasonHubData();
    expect(requestedWeeks("matchups")).toEqual([]);
    expect(requestedWeeks("transactions")).toEqual([1]);
    expect(hub.transactions.map((move) => move.id)).toEqual(["available"]);
    expect(hub.stats.pointsForLeader).toBeNull();
    fakeFetch.mockClear();
    const history = await getTransactionHistory();
    expect(requestedWeeks("transactions")).toEqual([1]);
    expect(history.transactions.map((move) => move.id)).toEqual(["available"]);
  });

  it("keeps surviving activity and stats when weekly HTTP requests reject", async () => {
    transactions.set(1, [tx("earlier", 1)]);
    transactions.set(2, new Error("week 2 failed"));
    transactions.set(3, [tx("current", 3)]);
    matchups.set(1, [
      { roster_id: 1, matchup_id: 1, points: 100 },
      { roster_id: 2, matchup_id: 1, points: 90 },
    ]);
    matchups.set(3, new Error("matchup week 3 failed"));
    const hub = await getSeasonHubData();
    expect(requestedWeeks("matchups")).toEqual([1, 2, 3]);
    expect(requestedWeeks("transactions")).toEqual([1, 2, 3, 1, 2, 3]);
    expect(hub.transactions.map((move) => move.id)).toEqual(["current", "earlier"]);
    expect(hub.stats.mostActiveManager?.transactionCount).toBe(2);
    expect(hub.stats.biggestBlowout).not.toBeNull();
    fakeFetch.mockClear();
    const history = await getTransactionHistory();
    expect(requestedWeeks("transactions")).toEqual([1, 2, 3]);
    expect(history.transactions.map((move) => move.id)).toEqual(["current", "earlier"]);
  });

  it("keeps earlier moves when the current week is quiet", async () => {
    transactions.set(1, [tx("first", 1)]);
    transactions.set(2, [tx("second", 2)]);
    const hub = await getSeasonHubData();
    expect(hub.transactions.map((move) => move.id)).toEqual(["second", "first"]);
  });

  it("shows only the newest ten unique moves while history retains the full season", async () => {
    for (const week of [1, 2, 3]) {
      const moves = Array.from({ length: 5 }, (_, index) => {
        const order = (week - 1) * 5 + index;
        return tx(`tx-${order}`, week, order);
      });
      transactions.set(week, week === 3 ? [...moves, tx("tx-12", 3, 12)] : moves);
    }
    const hub = await getSeasonHubData();
    expect(hub.transactions.map((move) => move.id)).toEqual([
      "tx-14", "tx-13", "tx-12", "tx-11", "tx-10", "tx-9", "tx-8", "tx-7", "tx-6", "tx-5",
    ]);
    fakeFetch.mockClear();
    const history = await getTransactionHistory();
    expect(requestedWeeks("transactions")).toEqual([1, 2, 3]);
    expect(history.transactions).toHaveLength(16);
    expect(history.transactions[0].id).toBe("tx-14");
    expect(history.transactions.at(-1)?.id).toBe("tx-0");
  });
});
