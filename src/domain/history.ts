/**
 * League history — the trophy room.
 *
 * The 2025 founding season is baked into src/data/history-2025.ts (immutable,
 * verified against the Sleeper API). The 2026 season is live and unfinished —
 * no champion yet. Everything here is real: no fabricated moments.
 */

/** Sleeper roster_id, as a string — stable across seasons. */
export type FranchiseId = string;

/** One engraved record on the wall. */
export type LeagueRecord = {
  id: string;
  /** e.g. "Most points in a season". */
  label: string;
  /** e.g. "6,038.0". */
  value: string;
  holder: { teamId: FranchiseId; teamName: string } | null;
  /** e.g. "Week 7, 2025 — 364.0 vs QBs Gremlins". */
  detail: string;
  season: string;
};

/** One hanging championship banner. */
export type ChampionBanner = {
  season: string;
  teamId: FranchiseId;
  teamName: string;
  managerName: string;
  regularSeason: { wins: number; losses: number };
  playoffRecord: { wins: number; losses: number };
  /** Regular-season points for minus points against. */
  pointDifferential: number;
  finalScore: { champ: number; runnerUp: number };
  runnerUpName: string;
};

/** One Hall of Fame induction — real people, trades, and moments only. */
export type HallOfFameEntry = {
  id: string;
  year: string;
  category: "manager" | "trade" | "moment" | "record";
  title: string;
  description: string;
};

/** One line on a franchise's timeline. */
export type TimelineEntry = {
  year: string;
  title: string;
  description: string;
};

/** A franchise's Wikipedia-style history, shown on its team page. */
export type FranchiseHistory = {
  teamId: FranchiseId;
  /** Current team name (2026). */
  teamName: string;
  founded: string;
  championships: number;
  finalsAppearances: number;
  allTime: { wins: number; losses: number };
  /** Seasons won, e.g. ["2025"]. */
  titleSeasons: string[];
  timeline: TimelineEntry[];
  /** True when the franchise changed hands (roster 8: QBs Gremlins → NeuralNets). */
  discontinuity?: string;
};

/** The whole trophy room. */
export type LeagueHistory = {
  founded: string;
  /** Newest first. 2026 has no champion yet — the banner is "to be decided". */
  champions: ChampionBanner[];
  records: LeagueRecord[];
  hallOfFame: HallOfFameEntry[];
};
