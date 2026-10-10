import "server-only";
import type { AiDecidesData, AiWeeklySlate } from "@/domain/ai-decider";
import { getGameStore } from "../arcade";
import { loadAiLeagueRosterContext, loadAiPublicationState, loadAiWeekContext } from "../league";
import { createOpenAiDecisionsClient } from "./provider";
import { availability, type AiRuntime } from "./service";
import { getAiDeciderStore } from "./store";
import { cachedWeek, weekKey } from "./weekly";
import { aiDataDeadline } from "./deadline";
import { friendsAuthEnabled } from "../friends-auth/config";
import { uuidValid } from "./validation";

export function createAiRuntime(headers?: Headers): AiRuntime {
  const enabled = process.env.GOAT_AI_DECIDES_ENABLED === "true";
  const providerAuth = friendsAuthEnabled();
  const userId = process.env.GOAT_AI_WEEKLY_USER_ID;
  const weeklyOperator = userId && uuidValid(userId) ? { kind: "weekly_job" as const, userId, auth: providerAuth ? "friends" as const : "legacy" as const } : null;
  // Server-only env; absent credentials mean unavailable, with no network call.
  const key = process.env.OPENAI_API_KEY;
  let store: AiRuntime["store"] = null, sessions: AiRuntime["sessions"] = null;
  try { store = getAiDeciderStore(weeklyOperator ?? undefined); if (!providerAuth) sessions = getGameStore(); } catch { /* fail closed */ }
  // Lazy provider import keeps the default legacy path independent of provider configuration.
  const providerSession = providerAuth ? async () => headers
    ? (await import("../friends-auth/runtime")).getProviderIdentity(headers) : null : undefined;
  return { enabled, client: key ? createOpenAiDecisionsClient(key) : null, store, sessions, providerSession, weeklyOperator, now: Date.now, getLeagueContext: loadAiLeagueRosterContext, getSourceState: loadAiPublicationState, getWeekKey: async () => weekKey(await aiDataDeadline(loadAiWeekContext(), 3000)) };
}

export async function loadAiDecidesData(runtime = createAiRuntime(), context = loadAiWeekContext): Promise<AiDecidesData> {
  const state = await availability(runtime);
  let weekly: AiWeeklySlate = { leagueId: "1387473752807190528", season: "unknown", week: 0, status: "unavailable", message: "The current weekly matchups are unavailable.", generatedAt: null, matchups: [], snapshot: null };
  try {
    const current = await aiDataDeadline(context(), 3000);
    weekly = { ...weekly, leagueId: current.leagueId, season: current.season, week: current.week, message: current.phase === "pre" ? "Preseason: lineup previews have not been published for the five known pairings." : "Cached picks have not been prepared for this week.", matchups: current.matchups.map(m => ({ ...m, status: "unavailable", message: "A verified input snapshot and pre-generated result are not available.", result: null, evidence: [], baseline: null })) };
    const record = await runtime.store?.persistence.getWeek(weekKey(current));
    if (record) weekly = cachedWeek(record, runtime.now(), current.phase === "pre" ? 0 : current.week);
  } catch { /* Leave an honest unavailable slate; no generation fallback. */ }
  return { availability: state, weekly };
}
