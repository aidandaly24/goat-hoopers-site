import { afterEach, describe, expect, it, vi } from "vitest";
import type { NbaTeam } from "@/domain/arcade/nba-rosters";
import { isNbaSourceStale } from "@/domain/arcade/nba-rosters";
import { decodeNbaRoster, decodeNbaTeamDirectory, isNbaRoster, isNbaTeamDirectory, NBA_TEAMS_SOURCE_URL, nbaRosterSourceUrl } from "../nba-rosters-decode";
import { loadNbaTeamDirectory, loadNbaTeamRoster } from "../nba-rosters";
import { fetchNbaRoster, fetchNbaTeams } from "../nba-rosters-client";
import { nbaTeamDirectoryResponse, nbaTeamRosterResponse } from "../nba-rosters-http";

const observedAt = "2026-10-18T19:20:00.000Z";
const sourceUpdatedAt = "2026-10-18T19:17:31Z";
const now = () => new Date(observedAt);
const team: NbaTeam = { id: "13", city: "Los Angeles", name: "Lakers", abbreviation: "LAL", logo: null };
function directoryRaw() {
  return { sports: [{ slug: "basketball", leagues: [{ slug: "nba", season: { year: 2027, displayName: "2026-27" }, teams:
    Array.from({ length: 30 }, (_, index) => ({ team: { id: String(index + 1), location: `City ${index}`, name: `Team ${index}`, abbreviation: `T${index}`, logos: [{ href: `https://a.espncdn.com/i/teamlogos/nba/500/${index}.png` }] } })) }] }] };
}
function rosterRaw() {
  return { status: "success", timestamp: sourceUpdatedAt, season: { displayName: "2026-27" }, team: { id: "13" }, athletes:
    Array.from({ length: 19 }, (_, index) => ({ id: String(1000 + index), firstName: `Player ${index}`, lastName: "Fixture", position: { displayName: "Guard" }, headshot: { href: `https://a.espncdn.com/i/headshots/nba/players/full/${1000 + index}.png` }, jersey: String(index), status: { name: index === 18 ? "Inactive" : "Active" }, salary: 10_000_000 })) };
}
const response = (value: unknown) => Response.json(value);
afterEach(() => vi.useRealTimers());

describe("full source-listed NBA projection", () => {
  it("keeps all 30 franchises and only slim identities/provenance", () => {
    const directory = decodeNbaTeamDirectory(directoryRaw(), observedAt);
    expect(directory.teams).toHaveLength(30);
    expect(directory.teams[0]).toEqual({ id: "1", city: "City 0", name: "Team 0", abbreviation: "T0", logo: "https://a.espncdn.com/i/teamlogos/nba/500/0.png" });
    expect(directory.source).toEqual({ provider: "ESPN", sourceUrl: NBA_TEAMS_SOURCE_URL, observedAt, sourceUpdatedAt: null, seasonLabel: "2026-27" });
    expect(isNbaTeamDirectory(directory)).toBe(true);
  });
  it("rejects partial directories and duplicate identities instead of skewing the draw", () => {
    const partial = directoryRaw(); partial.sports[0].leagues[0].teams.pop();
    expect(() => decodeNbaTeamDirectory(partial, observedAt)).toThrow("incomplete");
    const duplicate = directoryRaw(); duplicate.sports[0].leagues[0].teams[29].team.id = "1";
    expect(() => decodeNbaTeamDirectory(duplicate, observedAt)).toThrow("incomplete");
  });
  it("rejects unrelated leagues and malformed identities", () => {
    const raw = directoryRaw(); raw.sports[0].leagues[0].slug = "wnba";
    expect(() => decodeNbaTeamDirectory(raw, observedAt)).toThrow("incomplete");
    const invalid = directoryRaw(); invalid.sports[0].leagues[0].teams[0].team.id = "../roster";
    expect(() => decodeNbaTeamDirectory(invalid, observedAt)).toThrow("incomplete");
  });
  it("preserves every listed athlete, including inactive players, without stats/salaries", () => {
    const roster = decodeNbaRoster(rosterRaw(), team, observedAt);
    expect(roster.players).toHaveLength(19);
    expect(roster.players.at(-1)?.status).toBe("Inactive");
    expect(roster.players[0]).toEqual({ id: "1000", firstName: "Player 0", lastName: "Fixture", position: "Guard", portrait: "https://a.espncdn.com/i/headshots/nba/players/full/1000.png", jersey: "0", status: "Active" });
    expect(roster.source).toEqual({ provider: "ESPN", sourceUrl: nbaRosterSourceUrl("13"), observedAt, sourceUpdatedAt: "2026-10-18T19:17:31.000Z", seasonLabel: "2026-27" });
    expect(isNbaRoster(roster, "13")).toBe(true);
  });
  it("keeps players missing optional metadata and drops unsafe image URLs", () => {
    const raw = rosterRaw();
    Object.assign(raw.athletes[0], { position: null, headshot: { href: "https://attacker.invalid/photo.png" }, status: null, jersey: null });
    const roster = decodeNbaRoster(raw, team, observedAt);
    expect(roster.players[0]).toMatchObject({ position: "Position unlisted", portrait: "", status: null, jersey: null });
    expect(roster.players).toHaveLength(19);
  });
  it.each(["empty", "duplicate", "malformed", "wrong team", "failed status"])("rejects a %s source rather than claiming a full roster", kind => {
    const raw = rosterRaw();
    if (kind === "empty") raw.athletes = [];
    if (kind === "duplicate") raw.athletes[18].id = raw.athletes[0].id;
    if (kind === "malformed") raw.athletes[18].firstName = "";
    if (kind === "wrong team") raw.team.id = "25";
    if (kind === "failed status") raw.status = "failure";
    expect(() => decodeNbaRoster(raw, team, observedAt)).toThrow();
  });
  it("does not substitute the current date when provider timestamps are missing", () => {
    const raw = rosterRaw(); raw.timestamp = "invalid";
    expect(decodeNbaRoster(raw, team, observedAt).source.sourceUpdatedAt).toBeNull();
  });
  it("detects an old cache observation, stale provider data and future dates", () => {
    const source = decodeNbaRoster(rosterRaw(), team, observedAt).source;
    expect(isNbaSourceStale(source, now().getTime())).toBe(false);
    expect(isNbaSourceStale(source, now().getTime() + 86_400_001)).toBe(true);
    expect(isNbaSourceStale({ ...source, sourceUpdatedAt: "2026-10-15T00:00:00Z" }, now().getTime())).toBe(true);
    expect(isNbaSourceStale({ ...source, observedAt: "2026-10-19T00:00:00Z" }, now().getTime())).toBe(true);
  });
});

describe("bounded source reads", () => {
  it("loads the directory once without requesting a player roster", async () => {
    const fetcher = vi.fn<typeof fetch>(async () => response(directoryRaw()));
    const directory = await loadNbaTeamDirectory({ fetcher, now });
    expect(directory.teams).toHaveLength(30);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[0][0]).toBe(NBA_TEAMS_SOURCE_URL);
    expect(fetcher.mock.calls[0][1]).toMatchObject({ cache: "no-store", redirect: "error" });
  });
  it("requests only the selected team's complete roster", async () => {
    const fetcher = vi.fn<typeof fetch>(async () => response(rosterRaw()));
    expect((await loadNbaTeamRoster(team, { fetcher, now })).players).toHaveLength(19);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[0][0]).toBe(nbaRosterSourceUrl("13"));
  });
  it("rejects a traversal ID before source access", async () => {
    const fetcher = vi.fn<typeof fetch>();
    await expect(loadNbaTeamRoster({ ...team, id: "13/../../" }, { fetcher, now })).rejects.toThrow("Unknown NBA team");
    expect(fetcher).not.toHaveBeenCalled();
  });
  it.each([503, 404])("rejects source HTTP %s", async status => {
    await expect(loadNbaTeamDirectory({ fetcher: async () => new Response("error", { status }), now })).rejects.toThrow("unavailable");
  });
  it("rejects non-JSON and malformed JSON", async () => {
    await expect(loadNbaTeamDirectory({ fetcher: async () => new Response("<html>provider unavailable</html>"), now })).rejects.toThrow("unavailable");
    await expect(loadNbaTeamDirectory({ fetcher: async () => new Response("{", { headers: { "content-type": "application/json" } }), now })).rejects.toThrow();
  });
  it("rejects an oversized declared payload before reading it", async () => {
    const cancel = vi.fn();
    const body = new ReadableStream({ cancel });
    await expect(loadNbaTeamDirectory({ fetcher: async () => new Response(body, { headers: { "content-type": "application/json", "content-length": "300000" } }), now })).rejects.toThrow("too large");
    expect(cancel).toHaveBeenCalledTimes(1);
  });
  it("rejects streamed overflow even without a content-length", async () => {
    const cancel = vi.fn();
    const body = new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(512 * 1024 + 1)); }, cancel });
    await expect(loadNbaTeamRoster(team, { fetcher: async () => new Response(body, { headers: { "content-type": "application/json" } }), now })).rejects.toThrow("too large");
    expect(cancel).toHaveBeenCalledTimes(1);
  });
  it("aborts a stalled source after eight seconds", async () => {
    vi.useFakeTimers();
    const fetcher: typeof fetch = async (_url, init) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(new Error("aborted")), { once: true });
    });
    const result = loadNbaTeamDirectory({ fetcher, now });
    const rejected = expect(result).rejects.toThrow("aborted");
    await vi.advanceTimersByTimeAsync(8_000);
    await rejected;
  });
});

describe("public read-only boundary", () => {
  it("returns honest unavailable responses without internal errors or caching failures", async () => {
    const response = await nbaTeamDirectoryResponse(async () => { throw new Error("private transport details"); });
    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(JSON.stringify(await response.json())).not.toContain("private");
  });
  it("does not load invalid route IDs", async () => {
    const load = vi.fn();
    expect((await nbaTeamRosterResponse("__proto__", load)).status).toBe(400);
    expect(load).not.toHaveBeenCalled();
  });
  it("returns the actual complete roster through the HTTP and browser seams", async () => {
    const roster = decodeNbaRoster(rosterRaw(), team, observedAt);
    const aborter = new AbortController();
    const fetcher = vi.fn<typeof fetch>(async () => nbaTeamRosterResponse("13", async () => roster));
    expect(await fetchNbaRoster("13", fetcher, aborter.signal)).toEqual(roster);
    expect(fetcher.mock.calls[0]).toEqual(["/api/arcade/nba/teams/13/roster", { signal: aborter.signal }]);
  });
  it("validates the 30-team endpoint before drawing", async () => {
    const directory = decodeNbaTeamDirectory(directoryRaw(), observedAt);
    expect(await fetchNbaTeams(async () => nbaTeamDirectoryResponse(async () => directory))).toEqual(directory);
    await expect(fetchNbaTeams(async () => response({ ...directory, teams: directory.teams.slice(0, 5) }))).rejects.toThrow("incomplete");
  });
  it("rejects mismatched teams, unsafe images and duplicate athletes from the app endpoint", async () => {
    const roster = decodeNbaRoster(rosterRaw(), team, observedAt);
    expect(isNbaRoster(roster, "25")).toBe(false);
    const duplicate = { ...roster, players: [...roster.players, roster.players[0]] };
    await expect(fetchNbaRoster("13", async () => response(duplicate))).rejects.toThrow("incomplete");
    const unsafe = { ...roster, players: [{ ...roster.players[0], portrait: "javascript:bad" }] };
    await expect(fetchNbaRoster("13", async () => response(unsafe))).rejects.toThrow("incomplete");
  });
  it("propagates abort rather than substituting a sample roster", async () => {
    const error = new DOMException("Aborted", "AbortError");
    await expect(fetchNbaRoster("13", async () => { throw error; })).rejects.toBe(error);
    await expect(fetchNbaRoster("13", async () => new Response("unavailable", { status: 503 }))).rejects.toThrow("Retry to keep your drawn team");
  });
});
