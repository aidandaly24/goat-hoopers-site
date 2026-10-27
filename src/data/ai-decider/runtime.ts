import "server-only";
import type { AiDecidesData, AiForecastState, AiSourceConfiguration, AiWeeklyInput, AiWeeklySlate } from "@/domain/ai-decider";
import { getGameStore } from "../arcade";
import { loadAiLeagueRosterContext, loadAiPublicationState, loadAiWeekContext } from "../league";
import { createOpenAiDecisionsClient } from "./provider";
import { loadAiForecastState } from "./forecast-service";
import { availability, type AiRuntime } from "./service";
import { getAiDeciderStore } from "./store";
import { cachedWeek, weekKey, withSourceCompatibility } from "./weekly";
import { aiDataDeadline } from "./deadline";
import { friendsAuthEnabled } from "../friends-auth/config";
import { uuidValid } from "./validation";
import { WEEK1_ORIGINAL_HASH, WEEK1_REFRESH_KEY } from "./refresh-policy";

export function createAiRuntime(headers?: Headers): AiRuntime {
  const enabled = process.env.GOAT_AI_DECIDES_ENABLED === "true";
  // Operator current-week selection; only the exact value "current" switches
  // the publication target from next-leg planning to the live week.
  const publicationTarget = process.env.GOAT_AI_PUBLICATION_TARGET === "current" ? "current" as const : undefined;
  const week1Refresh = process.env.GOAT_AI_WEEK1_REFRESH_ENABLED === "1" ? { originalHash: WEEK1_ORIGINAL_HASH } : undefined;
  const providerAuth = friendsAuthEnabled();
  const userId = process.env.GOAT_AI_WEEKLY_USER_ID;
  const weeklyOperator = userId && uuidValid(userId) ? { kind: "weekly_job" as const, userId, auth: providerAuth ? "friends" as const : "legacy" as const } : null;
  // Server-only env; absent credentials mean unavailable, with no network call.
  const key = process.env.OPENAI_API_KEY;
  let store: AiRuntime["store"] = null, sessions: AiRuntime["sessions"] = null;
  try { store = getAiDeciderStore(weeklyOperator ?? undefined, week1Refresh); if (!providerAuth) sessions = getGameStore(); } catch { /* fail closed */ }
  // Lazy provider import keeps the default legacy path independent of provider configuration.
  const providerSession = providerAuth ? async () => headers
    ? (await import("../friends-auth/runtime")).getProviderIdentity(headers) : null : undefined;
  return { enabled, client: key ? createOpenAiDecisionsClient(key) : null, store, sessions, providerSession, weeklyOperator, week1Refresh, ...(publicationTarget ? { publicationTarget } : {}), now: Date.now, getLeagueContext: loadAiLeagueRosterContext, getSourceState: loadAiPublicationState, getWeekKey: async () => weekKey(await aiDataDeadline(loadAiWeekContext(), 3000)) };
}

export async function loadAiDecidesData(runtime = createAiRuntime(), context: () => Promise<Pick<AiWeeklyInput, "leagueId" | "season" | "week" | "matchups" | "phase"> & { configuration?: AiSourceConfiguration }> = loadAiWeekContext): Promise<AiDecidesData> {
  const state = await availability(runtime);
  let week1Refresh: AiDecidesData["week1Refresh"];
  let forecast: AiForecastState | undefined;
  let weekly: AiWeeklySlate = { leagueId: "1387473752807190528", season: "unknown", week: 0, status: "unavailable", message: "The current weekly matchups are unavailable.", generatedAt: null, matchups: [], snapshot: null };
  try {
    const current = await aiDataDeadline(context(), 3000);
    // In-season forecast read (issue #149): the latest immutable revision
    // for the current week, beside the pregame slate — never a generation
    // path, and a forecast failure never disturbs the slate read.
    try { const loaded = await loadAiForecastState(runtime, weekKey(current)); if (loaded.status === "ready") forecast = loaded; } catch { /* Forecast stays absent. */ }
    weekly = { ...weekly, leagueId: current.leagueId, season: current.season, week: current.week, message: current.phase === "pre" ? "Preseason: lineup previews have not been published for the five known pairings." : "Cached picks have not been prepared for this week.", matchups: current.matchups.map(m => ({ ...m, status: "unavailable", message: "A verified input snapshot and pre-generated result are not available.", result: null, evidence: [], baseline: null })) };
    const record = await runtime.store?.persistence.getWeek(weekKey(current));
    if (record) weekly = cachedWeek(record, runtime.now(), record.input.preview?.calendarVersion !== undefined ? undefined : current.phase === "pre" ? 0 : current.week);
    if (runtime.week1Refresh && weekKey(current) === WEEK1_REFRESH_KEY && runtime.store) {
      week1Refresh = !record?.result || current.phase !== "pre" || weekly.status !== "ready" || (!record.refreshed && record.hash !== runtime.week1Refresh.originalHash)
        ? { status: "unavailable", message: "The reviewed one-time preseason refresh is unavailable." }
        : record.refreshed ? { status: "published", message: "The one-time replacement is saved; its original snapshot and picks remain archived." }
        : await runtime.store.persistence.hasWeekRefresh() ? { status: "sealed", message: "The one-time attempt is sealed. Original picks remain public; no automatic retry is allowed." }
        : { status: "available", message: "One explicit manager refresh is available. Original picks remain public until all five replacements are saved." };
    }
    // Label current-source compatibility only after validating the frozen record
    // and the independent refresh control. Neither archived fact is rewritten.
    if (record) weekly = withSourceCompatibility(weekly, record.input, current.configuration);
  } catch { /* Leave an honest unavailable slate; no generation fallback. */ }
  return { availability: state, weekly, ...(week1Refresh ? { week1Refresh } : {}), ...(forecast ? { forecast } : {}) };
}
