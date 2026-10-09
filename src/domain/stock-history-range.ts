/** Exact retained records. These are not a recalculated price series. */
export type StockHistoryKind = "observed" | "modeled";
export type StockHistoryRecord = {
  id: string;
  playerId: string;
  /** Six fractional digits; observed native time has no invented timezone. */
  date: string;
  priceCents: number;
  source: string;
  season: string | null;
};
export type StockHistoryCursor = {
  v: 1;
  playerId: string;
  from: string;
  to: string;
  kind: StockHistoryKind;
  generation: string | null;
  last: { date: string; source: string; id: string };
};
export type StockHistoryRangeRequest = {
  playerId: string;
  /** Inclusive/exclusive calendar days, YYYY-MM-DD. */
  from: string;
  to: string;
  kind: StockHistoryKind;
  limit: number;
  cursor: StockHistoryCursor | null;
};
export type HeldStoredEstimate = {
  from: string;
  toExclusive: string;
  priceCents: number | null;
  anchor: StockHistoryRecord | null;
  meaning: "held-reconstructed-estimate" | "before-first-estimate";
};
export type StockHistoryRangePage = {
  version: "stock-history-range-v1";
  playerId: string;
  requested: { from: string; to: string; kind: StockHistoryKind };
  readStatus: "ready" | "empty" | "unavailable" | "error";
  records: StockHistoryRecord[];
  precedingModelAnchor: StockHistoryRecord | null;
  nextCursor: string | null;
  hasMore: boolean;
  returnedBounds: { first: string; last: string } | null;
  provenance: {
    timestampBasis: "database-local-unverified" | "UTC";
    generation: string | null;
    declaredModelVersion: string | null;
    consistency: "best-effort-retained" | "publication-generation" | "unversioned";
    calibration: "observed-cents-unchanged" | "stored-model-scale-unvalidated";
    receiptTiming: "recorded-database-time" | "historical-receipt-unknown";
  };
  /** Exhausting retained pages never establishes daily/game completeness. */
  coverage: { status: "unknown"; retainedRangeExhausted: boolean; limitations: string[] };
  modeledWindow: {
    status: "available" | "not-applicable" | "unversioned" | "ambiguous" | "unavailable";
    from: string | null;
    toExclusive: string | null;
    intervals: HeldStoredEstimate[];
  };
};
