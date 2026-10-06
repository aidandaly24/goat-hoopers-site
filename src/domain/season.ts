/**
 * Season — league-level metadata for the current season.
 */
export type Season = {
  leagueName: string;
  seasonYear: string;
  /** League status. Sleeper values like "in_season"/"pre_draft", or the
   *  derived "pre_season" when Sleeper says in_season but the NBA hasn't
   *  tipped off yet (see toSeason). */
  status: string;
  totalTeams: number;
  /** Playoff spots (Sleeper league settings: playoff_teams). */
  playoffTeams: number;
  /** First playoff week (Sleeper: playoff_week_start). */
  playoffWeekStart: number;
};

/**
 * Human display for a raw season status. "pre_season" renders as the
 * single word "Preseason" (not "Pre Season") — the league's own voice.
 * Unknown values get a best-effort title-case.
 */
export function formatSeasonStatus(status: string): string {
  switch (status) {
    case "pre_season":
      return "Preseason";
    case "in_season":
      return "In Season";
    case "pre_draft":
      return "Pre-Draft";
    case "off_season":
      return "Offseason";
    case "complete":
      return "Complete";
    default:
      return status
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
  }
}
