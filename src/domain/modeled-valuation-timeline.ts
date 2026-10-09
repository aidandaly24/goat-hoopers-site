/** Read-only modeled state, separate from prices recorded by the running site. */
export const MODELED_TIMELINE_VERSION = "modeled-valuation-timeline-v1" as const;
export type ModelValuationUpdate = {
  id: string;
  effectiveAt: string;
  evidenceAsOf: string;
  priceCents: number;
  reason: "game" | "annual" | "assumption";
  modelVersion: string;
  calibrationVersion: string;
};
export type RetainedStockSnapshot = { id: string; date: string; priceCents: number };
export type ValuationCalendarPeriod = {
  from: string; to: string; knownAt: string;
  phase: "offseason" | "in-season";
  source: string;
};
export type TimelineCoverage = {
  knownAt: string;
  status: "complete" | "partial" | "unknown";
  sourceRevision: string;
  limitations: readonly string[];
};
export type ModeledTimelineInput = {
  playerId: string;
  from: string;
  asOf: string;
  modelVersion: string;
  calibrationVersion: string;
  updates: readonly ModelValuationUpdate[];
  recordedSnapshots: readonly RetainedStockSnapshot[];
  calendar: readonly ValuationCalendarPeriod[];
  coverage?: TimelineCoverage;
};
export type HeldValuationInterval = {
  /** Half-open interval. A query at asOf is supported separately. */
  from: string; to: string;
  anchorId: string | null;
  priceCents: number | null;
  evidenceAsOf: string | null;
  source: "carried-model-estimate" | "unavailable";
  phase: "offseason" | "in-season" | "unknown";
  phaseSource: string | null;
  meaning: "held-offseason-estimate" | "held-without-new-evidence" | "before-first-estimate";
};
export type ModeledValuationTimeline = {
  version: typeof MODELED_TIMELINE_VERSION;
  /** This contract never approves a valuation model or publishes store rows. */
  publishable: false;
  playerId: string;
  from: string;
  asOf: string;
  modelVersion: string;
  calibrationVersion: string;
  updates: readonly ModelValuationUpdate[];
  recordedSnapshots: readonly RetainedStockSnapshot[];
  calendar: readonly ValuationCalendarPeriod[];
  coverage: TimelineCoverage | null;
  intervals: HeldValuationInterval[];
};
export type ValuationAtTime = {
  date: string;
  source: "model-update" | "carried-model-estimate" | "unavailable";
  anchor: ModelValuationUpdate | null;
  priceCents: number | null;
  evidenceAgeDays: number | null;
  phase: HeldValuationInterval["phase"];
  phaseSource: string | null;
  coverage: TimelineCoverage | null;
  /** Exact retained records; these are never interpolated or converted to model events. */
  recordedSnapshots: readonly RetainedStockSnapshot[];
};
