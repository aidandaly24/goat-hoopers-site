import "server-only";
import type { AiDecidesData, AiWeeklySlate } from "@/domain/ai-decider";
import { getGameStore } from "../arcade";
import { loadAiWeekContext } from "../league";
import { createOpenAiDecisionsClient } from "./provider";
import { availability, type AiRuntime } from "./service";
import { getAiDeciderStore } from "./store";
import { cachedWeek, weekKey } from "./weekly";
import { aiDataDeadline } from "./deadline";
import { friendsAuthEnabled } from "../friends-auth/config";

export function createAiRuntime(headers?: Headers): AiRuntime {
  const enabled = process.env.GOAT_AI_DECIDES_ENABLED === "true";
  const providerAuth = friendsAuthEnabled();
  // Server-only env; absent credentials mean unavailable, with no network call.
  const key = process.env.OPENAI_API_KEY;
  let store: AiRuntime["store"] = null, sessions: AiRuntime["sessions"] = null;
  try { store = getAiDeciderStore(); if (!providerAuth) sessions = getGameStore(); } catch { /* fail closed */ }
  // Lazy provider import keeps the default legacy path independent of provider configuration.
  const providerSession = providerAuth ? async () => headers
    ? (await import("../friends-auth/runtime")).getProviderIdentity(headers) : null : undefined;
  return { enabled, client: key ? createOpenAiDecisionsClient(key) : null, store, sessions, providerSession, now: Date.now, getWeekKey: async () => weekKey(await aiDataDeadline(loadAiWeekContext(), 3000)) };
}

export async function loadAiDecidesData(runtime = createAiRuntime(), context = loadAiWeekContext): Promise<AiDecidesData> {
  const state = await availability(runtime);
  let weekly: AiWeeklySlate = { leagueId: "1387473752807190528", season: "unknown", week: 0, status: "unavailable", message: "The current weekly matchups are unavailable.", generatedAt: null, matchups: [], snapshot: null };
  try {
    const current = await aiDataDeadline(context(), 3000);
    weekly = { ...weekly, leagueId: current.leagueId, season: current.season, week: current.week, message: current.phase === "pre" ? "Preseason: five pairings are known, but ready lineups and the scoring mode must be confirmed." : "Cached picks have not been prepared for this week.", matchups: current.matchups.map(m => ({ ...m, status: "unavailable", message: "A verified input snapshot and pre-generated result are not available.", result: null, evidence: [], baseline: null })) };
    const record = await runtime.store?.persistence.getWeek(weekKey(current));
    if (record) weekly = cachedWeek(record, runtime.now());
  } catch { /* Leave an honest unavailable slate; no generation fallback. */ }
  return { availability: state, weekly };
}
