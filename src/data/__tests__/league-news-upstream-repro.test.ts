/** Transferable regression: use the REAL default news loader, fake fetch only. */
import { afterEach, describe, expect, it, vi } from "vitest";
import { rawTrade, playerDirectory } from "./fixtures";

// This read-only path must never reach database/market dependencies.
const boundaries = vi.hoisted(() => ({ calls: 0 }));
const forbidden = () => { boundaries.calls++; throw new Error("Unexpected database/market access"); };
vi.mock("@/data/db", () => ({ getDb: forbidden }));
vi.mock("@/data/stocks", () => ({ getStockStore: forbidden }));
vi.mock("@/data/nba-stats", () => ({ getStatProfiles: forbidden, getSeasonHistory: forbidden }));

const failures = ["transactions", "drafts", "picks"] as const;
type Failure = (typeof failures)[number];
type FixtureOptions = { transactions?: boolean; draft?: boolean };

async function fixture({ transactions = true, draft = false }: FixtureOptions = {}) {
  vi.resetModules(); // New module-local directory/news caches for every test.
  let time = 1000;
  let fail: Failure | null = null;
  let hasTransactions = transactions;
  const calls: { path: string; status: number }[] = [];
  const unexpected: string[] = [];
  vi.spyOn(Date, "now").mockImplementation(() => time);
  const settings = { wins: 0, losses: 0, ties: 0, fpts: 0, fpts_decimal: 0,
    fpts_against: 0, fpts_against_decimal: 0 };
  const rosters = [1, 2].map(id => ({ roster_id: id, owner_id: `u${id}`, settings, players: [] }));
  const users = [1, 2].map(id => ({ user_id: `u${id}`, display_name: `Manager ${id}`,
    avatar: null, metadata: { team_name: id === 1 ? "Alpha" : "Beta" } }));
  vi.stubGlobal("fetch", vi.fn(async (input: string | URL | Request) => {
    // Never calls the original fetch, including for unexpected requests.
    const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
    const path = url.pathname;
    let data: unknown;
    let resource: Failure | null = null;
    if (url.origin !== "https://api.sleeper.app") {
      unexpected.push(url.href);
      throw new Error("Unexpected fake-client URL");
    }
    if (path.endsWith("/rosters")) data = rosters;
    else if (path.endsWith("/users")) data = users;
    else if (path === "/v1/state/nba") data = { week: 1, season_type: "pre", season: "2026" };
    else if (path.endsWith("/transactions/1")) {
      resource = "transactions"; data = hasTransactions ? [rawTrade({ leg: 1 })] : [];
    } else if (path.endsWith("/drafts")) {
      resource = "drafts";
      data = draft ? [{ draft_id: "fixture", season: "2026", status: "complete", type: "linear" }] : [];
    } else if (path === "/v1/draft/fixture/picks") {
      resource = "picks";
      data = [{ pick_no: 1, round: 1, draft_slot: 1, player_id: "p3", picked_by: "u1",
        roster_id: 1, metadata: { full_name: "Player Three", position: "PG", team: "BKN" } }];
    } else if (path === "/v1/players/nba") data = playerDirectory();
    else { unexpected.push(url.href); throw new Error("Unexpected fake-client path"); }
    const status = fail !== null && fail === resource ? 503 : 200;
    calls.push({ path, status });
    return Response.json(status === 503 ? { error: "synthetic upstream outage" } : data, { status });
  }));
  const { createLeagueNewsCache, LEAGUE_NEWS_TTL_MS } = await import("@/data/league");
  // Crucially: do NOT supply deps.load; exercise loadLeagueNews/sleeperFetch.
  const cache = createLeagueNewsCache({ now: () => time });
  return { cache, calls, unexpected, ttl: LEAGUE_NEWS_TTL_MS,
    fail: (resource: Failure | null) => { fail = resource; },
    setTransactions: (value: boolean) => { hasTransactions = value; },
    advance: () => { time += LEAGUE_NEWS_TTL_MS; } };
}

afterEach(() => {
  expect(boundaries.calls, "no database/market calls").toBe(0);
  vi.unstubAllGlobals(); vi.restoreAllMocks();
});

describe("PR60 default news loader upstream failure regression", () => {
  it.each(failures)("warm %s 503 preserves last-good reference/articles/fetchedAt", async resource => {
    const f = await fixture({ draft: resource !== "transactions" });
    const first = await f.cache.get();
    const before = f.cache.peek()!;
    expect(first.length).toBeGreaterThan(0);
    expect(f.ttl).toBe(300000);
    f.advance(); f.fail(resource);
    const refreshed = await f.cache.get();
    const after = f.cache.peek()!;
    expect(f.unexpected).toEqual([]);
    expect(f.calls.some(c => c.status === 503)).toBe(true);
    expect.soft(refreshed === first, "last-good array reference").toBe(true);
    expect.soft(refreshed.map(a => a.id), "last-good article IDs").toEqual(first.map(a => a.id));
    expect.soft(after.fetchedAt, "failed refresh must not restart TTL").toBe(before.fetchedAt);
  });

  it.each(failures)("cold %s 503 is not cached and immediate recovery retries", async resource => {
    const f = await fixture({ transactions: resource === "transactions", draft: resource !== "transactions" });
    f.fail(resource);
    const result = await f.cache.get().then(value => ({ rejected: false, count: value.length }),
      () => ({ rejected: true, count: null }));
    const coldPeek = f.cache.peek();
    const callsBefore = f.calls.length;
    f.fail(null); // No clock advance: recovery should retry immediately.
    const recovered = await f.cache.get();
    expect(f.unexpected).toEqual([]);
    expect.soft(result.rejected, "cache rejects; getLeagueNews owns empty UI fallback").toBe(true);
    expect.soft(coldPeek, "failed cold load is not a successful empty feed").toBeNull();
    expect.soft(recovered.length, "immediate healthy recovery produces news").toBeGreaterThan(0);
    expect.soft(f.calls.length, "immediate healthy recovery issues requests").toBeGreaterThan(callsBefore);
  });

  it("a genuine successful empty feed is cached and reused", async () => {
    const f = await fixture({ transactions: false, draft: false });
    const empty = await f.cache.get();
    const count = f.calls.length;
    expect(empty).toEqual([]);
    expect(f.cache.peek()?.fetchedAt).toBe(1000);
    expect(await f.cache.get()).toBe(empty);
    expect(f.calls).toHaveLength(count);
    expect(f.calls.every(c => c.status === 200)).toBe(true);
    expect(f.unexpected).toEqual([]);
  });
});
