/** Frozen inputs for a current-model reconstruction, never observed quotes. */
export type ReconstructionInput = {
  directorySeason: number;
  currentSeasonStartYear: number;
  directory: Record<string, { birth_date?: string | null; years_exp?: number }>;
  players: Record<string, { games: Array<{
    date: string; season: string; fppg: number; minutes: number;
  }> }>;
  seasonHistory: Record<string, Array<{ season: string; fppg: number; games: number }>>;
  /** A pick can influence a historical date only once it was available. */
  draftPicks: Array<{ playerId: string; pick: number; availableOn: string }>;
};

export type ReconstructedPoint = {
  playerId: string;
  date: string;
  priceCents: number;
  source: "gamelog" | "backtest";
  season: string;
};

/** Auditable artifact published explicitly, outside application builds. */
export type PriceHistoryArtifact = {
  manifest: {
    modelVersion: "v2";
    reconstructionVersion: "2";
    modelCodeHash: string;
    inputHash: string;
    datasetId: string;
    pointsHash: string;
    source: { description: string; revision: string; scoring: Record<string, number>; limitations: string[] };
    directorySeason: number;
    currentSeasonStartYear: number;
    rows: number;
    players: number;
    assumptions: string[];
  };
  points: ReconstructedPoint[];
};

/** Read-only export of price_history; retain IDs for a reviewed rollback. */
export type ExistingHistoryPoint = {
  id: string; playerId: string; date: string; priceCents: number; source: string; season: string;
};

/** Approval scope binds the candidate to an exact retained backup. */
export type PriceHistoryPublicationPlan = {
  candidateDatasetId: string;
  backupHash: string;
  reconstructedFingerprint: string;
  replacedRows: number;
  candidateRows: number;
  preservedRows: number;
  added: number; removed: number; repriced: number; relabeled: number; unchanged: number;
  before: Record<string, number>;
  after: Record<string, number>;
};
