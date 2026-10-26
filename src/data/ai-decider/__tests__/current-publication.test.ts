import { describe, expect, it, vi } from "vitest";
import type { AiPublicationContext, AiWeeklyInput } from "@/domain/ai-decider";
import { loadAiCurrentLineupPreview, loadAiPublicationContext, loadAiPublicationSelection } from "../../league";
import type { RawLeague, RawNbaState, RawRoster } from "../../sleeper";
import { handleAiWeeklyCron, handleAiWeeklyPost, publishWeeklyPreview, type AiPublicationSources } from "../publication";
import { generateWeeklyPicksAsIdentity } from "../service";
import { aiWeekCalendarWindow } from "../week-calendar";
import { cachedWeek, validWeeklyInput, weekKey, weeklyReadiness } from "../weekly";
import { harness, identity, providerAnswer, TOKEN, USER, weeklyInput } from "./fixtures";

/**
 * Issue #149: the current-week operator selection. Sleeper leg 2 is the live
 * Week 2; the planning context targets Week 3 (leg+1) while the current
 * selection targets Week 2 itself, bounded by the reviewed calendar window
 * whose first tip is 2026-10-26T23:00:00Z. All source reads are synthetic.
 */
const FIRST_TIP = "2026-10-26T23:00:00.000Z";
const BEFORE = Date.parse("2026-10-26T12:00:00Z");
const league: RawLeague = { name: "Synthetic", season: "2026", status: "in_season", total_rosters: 10, settings: { game_mode: 1, playoff_teams: 6, playoff_week_start: 19, divisions: 0 }, roster_positions: [...weeklyInput().starterSlots, ...Array(10).fill("BN")], scoring_settings: { pts: 0.5 } };
const liveState: RawNbaState = { season: "2026", season_type: "regular", leg: 2, week: 2, season_start_date: "2026-10-20", previous_season: "2025" };
const version = aiWeekCalendarWindow("2026", 2)!.calendarVersion;

function currentInput(capturedMs = BEFORE): AiWeeklyInput {
  const input: AiWeeklyInput = { ...weeklyInput(), week: 2, capturedAt: new Date(capturedMs).toISOString(), statsAvailableAt: new Date(capturedMs).toISOString(), cutoffAt: "2026-10-26T22:59:59.999Z", startsAt: FIRST_TIP, endsAt: null, preview: { kind: "lineup_strength", sourceLeg: 2, seasonStartDate: "2026-10-20", gameModeCode: 1, calendarVersion: version } };
  input.teams.forEach((t, n) => { if (n < 7) { t.players[0].priorFantasyPpg = null; t.players[0].priorGames = null; } });
  return input;
}
function currentHarness(capturedMs = BEFORE) {
  const h = harness(); h.setTime(capturedMs);
  h.runtime.getSourceState = vi.fn(async () => ({ season: "2026", leg: 2, phase: "regular" as const }));
  h.getSessionUser.mockImplementation(async () => ({ user: { id: USER, teamId: "1", displayName: "Synthetic manager", createdAt: new Date(capturedMs) }, expiresAt: new Date(Date.parse(FIRST_TIP) + 86_400_000) }));
  const context: AiPublicationContext = { leagueId: "1387473752807190528", season: "2026", phase: "regular", leg: 2, week: 2, seasonStartDate: "2026-10-20", statsSeason: "2025", gameModeCode: 1 };
  const sources: AiPublicationSources = { context: vi.fn(async () => context), input: vi.fn(async () => currentInput(capturedMs)) };
  return { ...h, sources };
}
const post = (body: unknown = {}) => new Request("https://synthetic.invalid/api/ai-decides/weekly", { method: "POST", headers: { origin: "https://synthetic.invalid", "Content-Type": "application/json" }, body: JSON.stringify(body) });
const SECRET = "synthetic-scheduler-secret-not-a-credential";
const cron = () => new Request("https://synthetic.invalid/api/ai-decides/weekly", { headers: { Authorization: `Bearer ${SECRET}` } });

describe("current-week selection (loaders)", () => {
  it("targets week == source leg for the current selection while planning stays leg+1", async () => {
    const deps = { league: async () => league, state: async () => liveState };
    expect((await loadAiPublicationContext(deps)).week).toBe(3);
    const selected = await loadAiPublicationSelection("current", deps);
    expect(selected.context).toMatchObject({ leg: 2, week: 2, phase: "regular" });
    expect(selected.window).toMatchObject({ season: "2026", week: 2, firstTipAt: FIRST_TIP, calendarVersion: version });
    expect((await loadAiPublicationSelection("next", deps)).window).toBeNull();
    expect((await loadAiPublicationSelection(undefined, deps)).context.week).toBe(3);
  });
  it("fails closed without a reviewed calendar window or outside the regular phase", async () => {
    await expect(loadAiPublicationSelection("current", { league: async () => league, state: async () => liveState, calendar: () => null })).rejects.toThrow("weekly_context");
    await expect(loadAiPublicationSelection("current", { league: async () => league, state: async () => ({ ...liveState, season_type: "pre", leg: 0 }) })).rejects.toThrow("weekly_context");
  });
  it("builds a calendar-bounded input from the live week's own matchups", async () => {
    const { context, window } = await loadAiPublicationSelection("current", { league: async () => league, state: async () => liveState });
    const raw = weeklyInput();
    const rosters = raw.teams.map(t => ({ roster_id: Number(t.teamId), players: t.starters, reserve: [], taxi: [] })) as unknown as RawRoster[];
    const matchups = raw.matchups.flatMap(m => m.teamIds.map(id => ({ roster_id: Number(id), matchup_id: Number(m.matchupId), points: 9999, starters: raw.teams.find(t => t.teamId === id)!.starters })));
    const stats = Object.fromEntries(raw.teams.flatMap(t => t.starters.map(id => [id, { pts: 2000, gp: 50 }])));
    const seenWeeks: number[] = [];
    const input = await loadAiCurrentLineupPreview(context, window!, { league: async () => league, state: async () => liveState, rosters: async () => rosters, matchups: async (week: number) => { seenWeeks.push(week); return matchups; }, stats: async () => stats, now: () => BEFORE });
    expect(seenWeeks).toEqual([2]);
    expect(input.week).toBe(2); expect(input.startsAt).toBe(FIRST_TIP); expect(input.endsAt).toBeNull();
    expect(input.cutoffAt).toBe("2026-10-26T22:59:59.999Z");
    expect(input.preview).toMatchObject({ sourceLeg: 2, calendarVersion: version });
    expect(validWeeklyInput(input)).toBe(true);
    expect(weeklyReadiness(input, BEFORE)).toBeNull();
  });
});

describe("current-week readiness and cache bounds", () => {
  it("accepts one millisecond before first tip and fails closed at and after it", () => {
    const input = currentInput();
    expect(weeklyReadiness(input, Date.parse(FIRST_TIP) - 1)).toBeNull();
    expect(weeklyReadiness(input, Date.parse(FIRST_TIP))).toMatch(/first tip/);
    expect(weeklyReadiness(input, Date.parse(FIRST_TIP) + 1)).toMatch(/first tip/);
  });
  it("fails closed on calendar drift or a missing window", () => {
    const drifted = currentInput(); drifted.preview!.calendarVersion = "espn-scoreboard-observed-19990101/ai-week-v0";
    expect(weeklyReadiness(drifted, BEFORE)).toMatch(/calendar window/);
    const unversioned = currentInput(); delete unversioned.preview!.calendarVersion;
    expect(weeklyReadiness(unversioned, BEFORE)).toMatch(/source leg/);
    const wrongBounds = currentInput(); wrongBounds.startsAt = null;
    expect(weeklyReadiness(wrongBounds, BEFORE)).toMatch(/calendar window/);
  });
  it("serves the saved slate before the tip and marks it stale from the tip on", async () => {
    const h = currentHarness();
    expect((await publishWeeklyPreview(identity(), h.runtime, h.sources)).status).toBe("ready");
    const record = h.persistence.weeks.get(weekKey(currentInput()))!;
    // The public read for a live week passes sourceLeg == week; the record
    // must NOT be poisoned stale by the next-leg rule while its window runs.
    expect(cachedWeek(record, BEFORE + 60_000, 2).status).toBe("ready");
    expect(cachedWeek(record, Date.parse(FIRST_TIP), 2).status).toBe("stale");
    expect(cachedWeek(record, Date.parse(FIRST_TIP) + 3_600_000).status).toBe("stale");
  });
});

describe("current-week publication", () => {
  it("publishes Week 2 once; the repeat is a record read with no new provider work", async () => {
    const h = currentHarness();
    const response = await publishWeeklyPreview(identity(), h.runtime, h.sources);
    expect(response.status).toBe("ready"); if (response.status !== "ready") throw new Error("fixture");
    expect(response.weekly.week).toBe(2); expect(response.weekly.status).toBe("ready");
    expect(response.weekly.message).toContain("Current-week");
    expect(response.weekly.snapshot).toMatchObject({ comparison: "weekly_lineup_preview", sourceLeg: 2, startsAt: FIRST_TIP, endsAt: null });
    expect(response.weekly.matchups[0].evidence.join(" ")).toContain("Current-week lineup-strength preview");
    expect(response.weekly.matchups[0].evidence.join(" ")).toContain(version);
    expect(await publishWeeklyPreview(identity(), h.runtime, h.sources)).toEqual(response);
    expect(h.sources.input).toHaveBeenCalledTimes(1); expect(h.create).toHaveBeenCalledTimes(1);
  });
  it("a first run at or after first tip fails closed with no seal and no provider call", async () => {
    const h = currentHarness(Date.parse(FIRST_TIP));
    expect(await publishWeeklyPreview(identity(), h.runtime, h.sources)).toMatchObject({ status: "unavailable", code: "weekly_closed" });
    expect(h.persistence.weeks.size).toBe(0); expect(h.create).not.toHaveBeenCalled();
  });
  it("rechecks the deadline immediately before the provider call when generation is slow", async () => {
    const h = currentHarness(Date.parse(FIRST_TIP) - 1);
    h.sources.input = async () => { h.setTime(Date.parse(FIRST_TIP) + 1); return currentInput(Date.parse(FIRST_TIP) - 1); };
    expect(await publishWeeklyPreview(identity(), h.runtime, h.sources)).toMatchObject({ status: "unavailable", code: "weekly_closed" });
    expect(h.persistence.weeks.size).toBe(0); expect(h.create).not.toHaveBeenCalled();
  });
  it("fails closed when the source lookup itself crosses first tip", async () => {
    const h = currentHarness(Date.parse(FIRST_TIP) - 1);
    h.runtime.getSourceState = vi.fn(async () => { h.setTime(Date.parse(FIRST_TIP) + 1); return { season: "2026", leg: 2, phase: "regular" as const }; });
    expect(await publishWeeklyPreview(identity(), h.runtime, h.sources)).toMatchObject({ status: "unavailable", code: "weekly_closed" });
    expect(h.persistence.weeks.size).toBe(0); expect(h.create).not.toHaveBeenCalled();
  });
  it("makes no provider call when sealing itself crosses first tip, and keeps the sealed attempt explicitly incomplete", async () => {
    const h = currentHarness();
    const seal = h.persistence.sealWeek.bind(h.persistence);
    vi.spyOn(h.persistence, "sealWeek").mockImplementation(async record => { const sealed = await seal(record); h.setTime(Date.parse(FIRST_TIP) + 1); return sealed; });
    expect(await publishWeeklyPreview(identity(), h.runtime, h.sources)).toMatchObject({ status: "unavailable", code: "weekly_closed" });
    expect(h.create).not.toHaveBeenCalled();
    // The attempt was already sealed when the deadline passed: it is
    // retained incomplete (never completed after expiry) and blocks any
    // later paid attempt instead of being silently retried.
    const record = h.persistence.weeks.get(weekKey(currentInput()))!;
    expect(record.result).toBeNull();
    expect(await publishWeeklyPreview(identity(), h.runtime, h.sources)).toMatchObject({ status: "unavailable", code: "publication_incomplete" });
    expect(h.create).not.toHaveBeenCalled();
  });
  it("makes no provider call when the budget reservation crosses first tip", async () => {
    const h = currentHarness();
    const store = h.runtime.store!;
    const reserve = store.reserve.bind(store);
    vi.spyOn(store, "reserve").mockImplementation(async (...args: Parameters<typeof reserve>) => { const result = await reserve(...args); h.setTime(Date.parse(FIRST_TIP) + 1); return result; });
    expect(await publishWeeklyPreview(identity(), h.runtime, h.sources)).toMatchObject({ status: "unavailable", code: "weekly_closed" });
    expect(h.create).not.toHaveBeenCalled();
    expect(h.persistence.weeks.get(weekKey(currentInput()))?.result).toBeNull();
    // Conservative accounting: the reservation stays counted and its lease
    // is settled (completed), never refunded and never left active.
    expect(h.persistence.control!.state.requests).toBe(1);
    expect(h.persistence.control!.state.leases).toHaveLength(1);
    expect(h.persistence.control!.state.leases[0].completed).toBe(true);
  });
  it("withholds completion when the provider finishes after first tip", async () => {
    const h = currentHarness();
    h.create.mockImplementationOnce(async p => { h.setTime(Date.parse(FIRST_TIP) + 1); return providerAnswer(p); });
    expect(await generateWeeklyPicksAsIdentity(currentInput(), identity(), h.runtime)).toMatchObject({ code: "weekly_closed" });
    expect(h.persistence.weeks.get(weekKey(currentInput()))?.result).toBeNull();
    expect(h.persistence.control!.state.requests).toBe(1);
  });
  it("withholds completion when the completion recheck's source lookup crosses first tip", async () => {
    const h = currentHarness();
    let lookups = 0;
    // Lookups 1–2 are the pre-seal check and the pre-provider guard; the
    // third is the completion recheck, and it resolves after first tip.
    h.runtime.getSourceState = vi.fn(async () => { lookups++; if (lookups >= 3) h.setTime(Date.parse(FIRST_TIP) + 1); return { season: "2026", leg: 2, phase: "regular" as const }; });
    expect(await generateWeeklyPicksAsIdentity(currentInput(), identity(), h.runtime)).toMatchObject({ code: "weekly_closed" });
    expect(h.create).toHaveBeenCalledTimes(1);
    expect(h.persistence.weeks.get(weekKey(currentInput()))?.result).toBeNull();
  });
  it("closes when the source leg advances past the target week mid-run", async () => {
    const h = currentHarness();
    h.runtime.getSourceState = async () => ({ season: "2026", leg: 3, phase: "regular" });
    expect(await publishWeeklyPreview(identity(), h.runtime, h.sources)).toMatchObject({ code: "weekly_closed" });
    expect(h.create).not.toHaveBeenCalled(); expect(h.persistence.weeks.size).toBe(0);
  });
  it("manual POST and scheduler GET both publish through the current-week sources", async () => {
    const h = currentHarness();
    const manual = await handleAiWeeklyPost(post(), TOKEN, h.runtime, h.sources);
    expect(manual.status).toBe(200); expect(h.create).toHaveBeenCalledTimes(1);
    const h2 = currentHarness(); h2.runtime.weeklyOperator = { kind: "weekly_job", userId: USER, auth: "legacy" };
    const scheduled = await handleAiWeeklyCron(cron(), SECRET, h2.runtime, h2.sources);
    expect(scheduled.status).toBe(200); expect(h2.create).toHaveBeenCalledTimes(1);
  });
});
