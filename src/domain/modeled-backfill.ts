import type { TeamHistoryPoint, TeamHistoryPriceProof } from "./team-value-history";

/**
 * Modeled backfill (#217 Stage 2): the offline producer that turns the
 * frozen reconstruction artifact's gamelog points into a team-value
 * series of MODELED estimates for the span the recorded lane cannot
 * cover. The recorded series stays canonical; this package is a
 * separate, explicitly labeled series and is never blended into it.
 *
 * Frozen carry/admission contract (issue #217, comment 6348385706):
 * - A gamelog point dated D is an end-of-day estimate for D: it prices
 *   day D at end-of-day and never any instant earlier on D, and it
 *   never prices trades.
 * - Annual ("backtest") points never enter the daily series.
 * - Anchors are same-NBA-season only; there is no cross-season carry.
 *   The latest point on or before the day carries to the season end,
 *   and every priced line records its anchor's date and age.
 * - Modeled points are admitted only on team-days where the recorded
 *   lane admits nothing; the two classes keep separate continuity ids
 *   and are never merged into one point.
 * - A roster with no priced players yields NO point: missing values
 *   are gaps, never zero-filled.
 */

/** The frozen carry policy this producer implements (issue #217 §6). */
export const MODELED_CARRY_POLICY_ID = "gamelog-carry-v1";

/** Producer identity; part of every emitted generation string. */
export const MODELED_BACKFILL_PRODUCER_VERSION = "modeled-backfill-v1";

/** Package format version for the offline runner's JSON output. */
export const MODELED_BACKFILL_PACKAGE_VERSION = "modeled-backfill-package-v1";

/** The reconstructed price proof a modeled line carries end-to-end. */
export type ModeledPriceProof = Extract<TeamHistoryPriceProof, { kind: "reconstructed" }>;

/** One rostered player's modeled line for one team-day. */
export type ModeledTeamPlayerLine = {
  playerId: string;
  /** Integer cents; null when the player is unpriced on the day. */
  priceCents: number | null;
  /** Why the player is unpriced; null exactly when priced. */
  missingReason: string | null;
  /** MODELED provenance for the priced value; null exactly when unpriced. */
  proof: ModeledPriceProof | null;
  /** The anchor gamelog point's calendar day; null exactly when unpriced. */
  anchorDate: string | null;
  /** Whole days between the anchor's day and this day; null exactly when unpriced. */
  anchorAgeDays: number | null;
};

/** One emitted team-day: the domain point plus its per-player evidence. */
export type ModeledTeamPointPackage = {
  teamId: number;
  point: TeamHistoryPoint;
  players: ModeledTeamPlayerLine[];
};

/** Diagnostics for a producer run: what was considered, kept, suppressed. */
export type ModeledBackfillDiagnostics = {
  /** Team-days with proven membership inside the requested range. */
  membershipTeamDays: number;
  /** Membership team-days suppressed because the recorded lane admits them. */
  suppressedRecordedTeamDays: number;
  /** Membership team-days that produced no point (no priced player). */
  unpricedTeamDays: number;
  /** Points emitted. */
  pointsEmitted: number;
};

/** The ready-to-run package the offline runner writes. Nothing in it is a
 *  database write: applying it to production is a separate decision. */
export type ModeledBackfillPackage = {
  packageVersion: typeof MODELED_BACKFILL_PACKAGE_VERSION;
  producerVersion: typeof MODELED_BACKFILL_PRODUCER_VERSION;
  policyId: typeof MODELED_CARRY_POLICY_ID;
  /** The exact reconstruction dataset the modeled points derive from. */
  datasetId: string;
  modelVersion: string;
  reconstructionVersion: string;
  /** Hash of the roster-replay evidence the membership came from. */
  rosterEvidenceHash: string;
  /** Hash of the dated membership snapshot the composition consumed:
   *  every team-day's player list, the window, and the season
   *  boundary — verified against the snapshot's content before the
   *  run, so a changed past membership cannot reuse this package's
   *  generation. */
  membershipHash: string;
  /** datasetId + policy + roster-evidence + membership binding for this series. */
  generation: string;
  range: { fromDay: string; throughDay: string };
  diagnostics: ModeledBackfillDiagnostics;
  points: ModeledTeamPointPackage[];
};
