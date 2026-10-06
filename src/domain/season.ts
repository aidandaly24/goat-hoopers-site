/**
 * Season — league-level metadata for the current season.
 */
export type Season = {
  leagueName: string;
  seasonYear: string;
  /** Sleeper league status, e.g. "in_season", "pre_draft". */
  status: string;
  totalTeams: number;
};
