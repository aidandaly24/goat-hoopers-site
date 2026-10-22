/** Actual PR244 producer/helpers over injected, explicitly synthetic sources. No network or DB. */
import { chainWorld, replayDepsFrom, CHAIN_NOW } from "@/data/__tests__/history-chain-fixture";
import { loadChainRosterReplay } from "@/data/roster-replay";
import { getTeamValueHistory, mergeHistoryMoveSets, teamHistoryDetailResponse, teamHistorySummaryResponse, toHistoryMoves,
  type TeamHistoryDeps } from "@/data/team-value-history";
import { LEAGUE_ID, type RawPlayerEntry } from "@/data/sleeper";

export function integratedDeps(revised = false, laterClock = false): TeamHistoryDeps {
  const world = chainWorld(), names: Record<string, RawPlayerEntry> = {};
  for (const picks of Object.values(world.picks)) for (const pick of picks) names[pick.player_id] = {
    full_name: `Synthetic historical player ${pick.player_id} with a readable long identity`,
  };
  names["104"] = { full_name: "Synthetic historical-only player104" };
  const dates = ["2026-10-08T04:00:00.000000", "2026-10-09T04:00:00.000000", "2026-10-19T04:00:00.123456"];
  const quotes = dates.flatMap((nativeTimestamp, day) => ["101", "102", "103"].map((playerId, index) => ({
    quoteId: `synthetic-observation-${day}-${playerId}`, playerId, nativeTimestamp,
    priceCents: (index + 1) * 10000 + day * 1000 + (revised ? 250 : 0),
  })));
  return {
    quotes: { readWindow: async request => ({ quotes: quotes.filter(q => request.playerIds.includes(q.playerId)), truncated: false }) },
    fetchAnchor: async () => ({ observedAt: CHAIN_NOW.toISOString(), teams: world.rosters[LEAGUE_ID].map(roster => ({
      id: String(roster.roster_id), name: `Fixture Club ${roster.roster_id}`, players: roster.players,
    })) }),
    fetchMoves: async () => mergeHistoryMoveSets(...Object.entries(world.tx).map(([leagueId, tx]) => toHistoryMoves(tx, leagueId))),
    fetchChain: () => loadChainRosterReplay(replayDepsFrom(world)),
    fetchNames: async () => names,
    // The later clock exercises the real child helper's pinned-token injection.
    // The injected chain world remains captured at the envelope's original cutoff.
    now: () => laterClock ? new Date(CHAIN_NOW.getTime() + 3600000) : CHAIN_NOW,
  };
}

export const integratedEnvelope = (revised = false) => getTeamValueHistory("1", integratedDeps(revised));
export const integratedDetail = (url: URL, revised = false, laterClock = false) => teamHistoryDetailResponse(url, integratedDeps(revised, laterClock));
export const integratedSummary = (url: URL, revised = false, laterClock = false) => teamHistorySummaryResponse(url, integratedDeps(revised, laterClock));
