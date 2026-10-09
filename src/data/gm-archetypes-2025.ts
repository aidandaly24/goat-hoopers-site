/**
 * 2025 GM archetype inputs, baked in.
 *
 * Source: Sleeper API, league 1282883196567977984 (the 2025 founding
 * season, status: complete). Verified against /league (settings), /users,
 * /rosters, /drafts + /draft/{id}/picks + /draft/{id}/traded_picks, and
 * /transactions/{week} for weeks 1-24 (400 transactions: 340 free_agent,
 * 41 waiver, 15 trades, 4 commissioner). Collected 2026-10-09.
 *
 * Metric definitions (see src/domain/manager-archetype.ts for the
 * decision table that turns these into archetypes):
 * - draftCapital: round-weighted net future rookie picks acquired via
 *   trade (2026+ seasons only; R1=3, R2=2, R3+=1). The 2025 STARTUP
 *   draft (20 rounds snake) saw only even pick swaps, so every manager
 *   controlled exactly 20 startup picks — draft capital for 2025 comes
 *   entirely from future-pick trades.
 * - trades: trades participated in (each side counted once).
 * - adds: players added via waivers + free agency. 2025 used rolling
 *   waivers (waiver_type 0); NO waiver_bid values exist in any
 *   transaction, so this is add VOLUME, not FAAB dollars.
 * - avgAgeYears: mean age of the final 2025 roster as of 2025-10-21
 *   (approx opening night), from Sleeper birth_date values.
 * - medianTenureDays: median days between a manager's add of a player
 *   and their drop of that same player. Null = no timed add->drop
 *   stints observed (treated as max observed tenure: no evidence of
 *   quick hooks).
 * - homerHerfindahl: Herfindahl index of NBA-team concentration on
 *   the final roster (1.0 = entire roster from one NBA team).
 * - fixhimAdds: adds within 14 days of another manager's drop of the
 *   same player (reclamation pickups).
 *
 * ROSTER 8 HONESTY NOTE: roster 8 changed managers between seasons.
 * In 2025 it was "QBs Gremlins", managed by slennox (1-20). It is now
 * managed by NeuralNets. The 2025 archetype describes slennox's
 * management, never the current manager's.
 *
 * The season is final, so this file never changes. Future seasons
 * append new files; the domain type carries per-season history.
 */

import type { RawGmMetrics2025 } from "@/domain/manager-archetype";

/** The raw per-manager metric shape (owned by the domain; re-exported here). */
export type { RawGmMetrics2025 };

/** Raw 2025 metrics by roster_id (as string, matching the Team domain). */
export const GM_METRICS_2025: Record<string, RawGmMetrics2025> = {
  "1": {
    managerName: "aidandaly20",
    teamName: null,
    draftCapital: 0,
    trades: 2,
    adds: 28,
    avgAgeYears: 25.62,
    medianTenureDays: 11.2,
    homerHerfindahl: 0.066,
    fixhimAdds: 3,
  },
  "2": {
    managerName: "Aedan23",
    teamName: null,
    draftCapital: 0,
    trades: 4,
    adds: 27,
    avgAgeYears: 23.35,
    medianTenureDays: 12.4,
    homerHerfindahl: 0.0764,
    fixhimAdds: 6,
  },
  "3": {
    managerName: "TommyDieselfuel",
    teamName: null,
    draftCapital: 15,
    trades: 9,
    adds: 25,
    avgAgeYears: 24.77,
    medianTenureDays: 6.0,
    homerHerfindahl: 0.0839,
    fixhimAdds: 7,
  },
  "4": {
    managerName: "philbiag",
    teamName: null,
    draftCapital: -3,
    trades: 2,
    adds: 25,
    avgAgeYears: 25.37,
    medianTenureDays: 16.5,
    homerHerfindahl: 0.0775,
    fixhimAdds: 8,
  },
  "5": {
    managerName: "vannweinkauf",
    teamName: "Josh Diddy's Roster",
    draftCapital: -6,
    trades: 3,
    adds: 56,
    avgAgeYears: 28.63,
    medianTenureDays: 7.5,
    homerHerfindahl: 0.0744,
    fixhimAdds: 9,
  },
  "6": {
    managerName: "GriffinHealy",
    teamName: null,
    draftCapital: -2,
    trades: 4,
    adds: 72,
    avgAgeYears: 26.23,
    medianTenureDays: 1.6,
    homerHerfindahl: 0.0775,
    fixhimAdds: 2,
  },
  "7": {
    managerName: "papichooter",
    teamName: null,
    draftCapital: 0,
    trades: 0,
    adds: 21,
    avgAgeYears: 25.44,
    medianTenureDays: 8.8,
    homerHerfindahl: 0.0699,
    fixhimAdds: 11,
  },
  "8": {
    managerName: "slennox",
    teamName: "QBs Gremlins",
    draftCapital: 5,
    trades: 4,
    adds: 4,
    avgAgeYears: 26.59,
    medianTenureDays: null,
    homerHerfindahl: 0.0775,
    fixhimAdds: 0,
  },
  "9": {
    managerName: "lordlx",
    teamName: null,
    draftCapital: -9,
    trades: 2,
    adds: 1,
    avgAgeYears: 26.54,
    medianTenureDays: null,
    homerHerfindahl: 0.0741,
    fixhimAdds: 1,
  },
  "10": {
    managerName: "TyreseHalibooty",
    teamName: null,
    draftCapital: 0,
    trades: 0,
    adds: 11,
    avgAgeYears: 25.69,
    medianTenureDays: 17.2,
    homerHerfindahl: 0.0909,
    fixhimAdds: 3,
  },
};
