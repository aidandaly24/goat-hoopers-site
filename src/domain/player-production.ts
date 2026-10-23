/**
 * PlayerProduction — dated single-player production evidence for the player
 * page's "Season stats" card. (P4, issue #224.)
 *
 * Source: Sleeper `/stats/nba/regular/{season}` — recorded per-player season
 * stat lines for the given season, joined by Sleeper player_id (no name
 * matching). The lines are season TOTALS; per-game figures are total / gp.
 * GP and GS come from the source itself and are always shown.
 *
 * This is OBSERVED production evidence, not a modeled valuation:
 * - never fabricated per-game lines (every figure traces to the source line),
 * - never a relabel of a prior season (the season is on the card),
 * - missing evidence stays unavailable with a precise reason — never zero,
 *   never an em-dash where a number is expected.
 *
 * Pure projection: no fetching, no persistence, no inference.
 */

/**
 * Precise unavailable reasons — the page renders these, never invents data.
 *
 * `no-recorded-stats` means the source responded and carries no line for
 * this player + season. `source-unavailable` means the feed (or the season
 * lookup) could not be reached — a failed fetch cannot establish absence,
 * so the two are never conflated.
 */
export type ProductionUnavailableReason =
  | "no-recorded-stats"
  | "invalid-record" // line exists but fails validation (not finite, negative, gp <= 0)
  | "source-unavailable";

/** Per-game production, each figure = season total / gp. Percentages are null when there were no attempts. */
export type ProductionAverages = {
  /** Minutes per game. */
  min: number;
  /** Points per game. */
  pts: number;
  /** Rebounds per game. */
  reb: number;
  /** Assists per game. */
  ast: number;
  /** Steals per game. */
  stl: number;
  /** Blocks per game. */
  blk: number;
  /** Three-pointers made per game. */
  tpm: number;
  /** Field-goal percentage (0-100), null when fga is 0. */
  fgPct: number | null;
  /** Free-throw percentage (0-100), null when fta is 0. */
  ftPct: number | null;
};

/** Dated production evidence for one player + season. */
export type PlayerProduction = {
  version: 1;
  kind: "season-average";
  /** Sleeper season key, e.g. "2026". */
  season: string;
  source: "sleeper-stats";
  /** Games played — known from the source, always shown. */
  gp: number;
  /** Games started — known from the source, always shown. */
  gs: number;
  averages: ProductionAverages;
};

/**
 * The card's honest states: a dated evidence card, or a precise unavailable
 * reason. Unavailable results preserve the season context whenever it is
 * known (null only when the season lookup itself failed).
 */
export type ProductionSummary =
  | { state: "available"; production: PlayerProduction }
  | {
      state: "unavailable";
      reason: ProductionUnavailableReason;
      season: string | null;
    };

const num = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);
const nonNeg = (value: unknown): value is number => num(value) && value >= 0;

const round1 = (value: number): number => Math.round(value * 10) / 10;

function isProductionEvidence(value: unknown): value is PlayerProduction {
  if (!value || typeof value !== "object") return false;
  const p = value as PlayerProduction;
  if (
    p.version !== 1 ||
    p.kind !== "season-average" ||
    typeof p.season !== "string" ||
    p.season.length === 0 ||
    p.source !== "sleeper-stats"
  )
    return false;
  if (!Number.isSafeInteger(p.gp) || p.gp <= 0) return false;
  if (!Number.isSafeInteger(p.gs) || p.gs < 0 || p.gs > p.gp) return false;
  const a = p.averages;
  if (!a || typeof a !== "object") return false;
  for (const key of ["min", "pts", "reb", "ast", "stl", "blk", "tpm"] as const) {
    if (!nonNeg(a[key])) return false;
  }
  for (const key of ["fgPct", "ftPct"] as const) {
    const v = a[key];
    if (!(v === null || (num(v) && v >= 0 && v <= 100))) return false;
  }
  return true;
}

/**
 * Project one player's raw season stat line into the card's honest state.
 * The season is an explicit input — a line is never attributed to another season.
 * Empty/missing lines are "no-recorded-stats", never zeros.
 */
export function summarizeProduction(
  season: string,
  entry: Record<string, number> | null | undefined
): ProductionSummary {
  const absent = (reason: ProductionUnavailableReason): ProductionSummary => ({
    state: "unavailable",
    reason,
    season,
  });
  if (!entry || typeof entry !== "object" || Object.keys(entry).length === 0) {
    return absent("no-recorded-stats");
  }
  const gp = entry.gp;
  if (gp === undefined || gp === 0) {
    // The source responded: no games recorded for this player + season.
    return absent("no-recorded-stats");
  }
  if (!Number.isSafeInteger(gp) || gp < 0) {
    // A present-but-impossible gp is a malformed record, not absent data.
    return absent("invalid-record");
  }
  const gs = entry.gs ?? 0;
  if (!Number.isSafeInteger(gs) || gs < 0 || gs > gp) {
    return absent("invalid-record");
  }
  // Sleeper omits stat categories a player recorded zero in (no `blk` key =
  // 0 blocks), matching the repo's existing `line[stat] ?? 0` convention.
  // A missing ENTRY is "no recorded stats"; a missing FIELD inside a real
  // entry is a legitimate played zero — never the reverse.
  const fields = ["min", "pts", "reb", "ast", "stl", "blk", "tpm"] as const;
  const perGame: Record<string, number> = {};
  for (const field of fields) {
    const total = entry[field] ?? 0;
    if (!nonNeg(total)) return absent("invalid-record");
    perGame[field] = round1(total / gp);
  }
  const fga = entry.fga ?? 0;
  const fgm = entry.fgm ?? 0;
  const fta = entry.fta ?? 0;
  const ftm = entry.ftm ?? 0;
  if (!nonNeg(fga) || !nonNeg(fgm) || !nonNeg(fta) || !nonNeg(ftm)) {
    return absent("invalid-record");
  }
  const production: PlayerProduction = {
    version: 1,
    kind: "season-average",
    season,
    source: "sleeper-stats",
    gp,
    gs,
    averages: {
      min: perGame.min,
      pts: perGame.pts,
      reb: perGame.reb,
      ast: perGame.ast,
      stl: perGame.stl,
      blk: perGame.blk,
      tpm: perGame.tpm,
      fgPct: fga > 0 ? round1((fgm / fga) * 100) : null,
      ftPct: fta > 0 ? round1((ftm / fta) * 100) : null,
    },
  };
  if (!isProductionEvidence(production)) {
    return absent("invalid-record");
  }
  return { state: "available", production };
}
