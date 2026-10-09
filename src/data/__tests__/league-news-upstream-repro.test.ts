/** Transferable regression: use the REAL default news loader, fake fetch only. */
import { afterEach, describe, expect, it, vi } from "vitest";
import { playerDirectory } from "./fixtures";

// This read-only path must never reach database/market dependencies.
const boundaries = vi.hoisted(() => ({ calls: 0 }));
const forbidden = () => { boundaries.calls++; throw new Error("Unexpected database/market access"); };
vi.mock("@/data/db", () => ({ getDb: forbidden }));
vi.mock("@/data/stocks", () => ({ getStockStore: forbidden }));
vi.mock("@/data/nba-stats", () => ({ getStatProfiles: forbidden, getSeasonHistory: forbidden }));

const RSS_XML = (outlet: string) => `<?xml version="1.0"?><rss version="2.0"><channel>
<item><title>${outlet} headline</title><link>https://${outlet}.example/1</link>
<description>A big night.</description><pubDate>Thu, 08 Oct 2026 19:21:47 +0000</pubDate></item>
</channel></rss>`;

const failures = ["espn", "cbs", "both"] as const;
type Failure = (typeof failures)[number];

async function fixture() {
  vi.resetModules(); // New module-local directory/news caches for every test.
  let time = 1000;
  let fail: Failure | null = null;
  const calls: { url: string; status: number }[] = [];
  const unexpected: string[] = [];
  vi.spyOn(Date, "now").mockImplementation(() => time);
  const settings = { wins: 0, losses: 0, ties: 0, fpts: 0, fpts_decimal: 0,
    fpts_against: 0, fpts_against_decimal: 0 };
  const rosters = [1, 2].map(id => ({ roster_id: id, owner_id: `u${id}`, settings,
    players: ["101"] }));
  const users = [1, 2].map(id => ({ user_id: `u${id}`, display_name: `Manager ${id}`,
    avatar: null, metadata: { team_name: id === 1 ? "Alpha" : "Beta" } }));
  const drafts = [{ draft_id: "fixture", season: "2026", status: "complete", type: "linear" }];
  const down = (resource: "espn" | "cbs") =>
    fail === "both" || fail === resource;
  vi.stubGlobal("fetch", vi.fn(async (input: string | URL | Request) => {
    // Never calls the original fetch, including for unexpected requests.
    const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
    const href = url.href;
    let data: unknown = null;
    let text: string | null = null;
    let resource: "espn" | "cbs" | null = null;
    if (href.startsWith("https://www.espn.com/espn/rss/nba/news")) {
      resource = "espn"; text = RSS_XML("espn");
    } else if (href.startsWith("https://www.cbssports.com/rss/headlines/nba/")) {
      resource = "cbs"; text = RSS_XML("cbs");
    } else if (url.origin === "https://api.sleeper.app") {
      const path = url.pathname;
      if (path.endsWith("/rosters")) data = rosters;
      else if (path.endsWith("/users")) data = users;
      else if (path.endsWith("/drafts")) data = drafts;
      else if (path === "/v1/draft/fixture/picks") data = [{
        pick_no: 1, round: 1, draft_slot: 1, player_id: "101", picked_by: "u1",
        roster_id: 1, metadata: { full_name: "Player One", position: "PG", team: "BKN" },
      }];
      else if (path === "/v1/players/nba") data = playerDirectory();
      else { unexpected.push(href); throw new Error("Unexpected fake-client path"); }
    } else { unexpected.push(href); throw new Error("Unexpected fake-client URL"); }
    const status = resource !== null && down(resource) ? 503 : 200;
    calls.push({ url: href, status });
    if (status === 503) return new Response("outage", { status });
    return text !== null
      ? new Response(text, { status, headers: { "content-type": "application/rss+xml" } })
      : Response.json(data, { status });
  }));
  const { createLeagueNewsCache, LEAGUE_NEWS_TTL_MS } = await import("@/data/league");
  // Crucially: do NOT supply deps.load; exercise loadLeagueNews/RSS fetch.
  const cache = createLeagueNewsCache({ now: () => time });
  return { cache, calls, unexpected, ttl: LEAGUE_NEWS_TTL_MS,
    fail: (resource: Failure | null) => { fail = resource; },
    advance: () => { time += LEAGUE_NEWS_TTL_MS; } };
}

afterEach(() => {
  expect(boundaries.calls, "no database/market calls").toBe(0);
  vi.unstubAllGlobals(); vi.restoreAllMocks();
});

describe("real news loader upstream failure regression", () => {
  it("warm: one feed 503 still refreshes from the other", async () => {
    const f = await fixture();
    const first = await f.cache.get();
    expect(first.length).toBe(2);
    f.advance(); f.fail("espn");
    const partial = await f.cache.get();
    // Not last-good: a genuine refresh from the surviving feed.
    expect(partial).not.toBe(first);
    expect(partial).toHaveLength(1);
    expect(partial[0].outlet.id).toBe("cbs");
    expect(f.unexpected).toEqual([]);
    expect(f.calls.some(c => c.status === 503)).toBe(true);
  });

  it("warm: both feeds 503 preserves last-good reference/articles/fetchedAt", async () => {
    const f = await fixture();
    const first = await f.cache.get();
    const before = f.cache.peek()!;
    expect(first.length).toBe(2);
    expect(f.ttl).toBe(300000);
    f.advance(); f.fail("both");
    const refreshed = await f.cache.get();
    const after = f.cache.peek()!;
    expect(f.unexpected).toEqual([]);
    expect(f.calls.some(c => c.status === 503)).toBe(true);
    expect.soft(refreshed === first, "last-good array reference").toBe(true);
    expect.soft(refreshed.map(a => a.id), "last-good article IDs").toEqual(first.map(a => a.id));
    expect.soft(after.fetchedAt, "failed refresh must not restart TTL").toBe(before.fetchedAt);
  });

  it("cold: both feeds 503 rejects and immediate recovery retries", async () => {
    const f = await fixture();
    f.fail("both");
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
});
