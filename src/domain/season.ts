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
 * What the data layer can PROVE about the computed tools' evidence
 * (matchup previews, power rankings, playoff odds, record book — the
 * four tools assembled from the analytics inputs in `src/data`).
 *
 * Every tool returns null in more than one world, and the empty-state
 * copy may only describe a world the loader actually proved:
 * - "pre-tipoff": the NBA state fetch succeeded and says the season
 *   has not started (`season_type === "pre"`).
 * - "no-closed-week": the season is underway AND the analytics
 *   assembly loaded AND the current week is still the first — no week
 *   can have closed yet, so a null tool is missing completed finals,
 *   not data.
 * - "unavailable": everything else — the state fetch failed, the
 *   assembly failed, or weeks have already closed (so a null tool is
 *   a data gap: missing schedule, upstream outage). Copy for this
 *   world must stay neutral: it may not claim the season has not
 *   tipped off, and may not claim no week has closed.
 */
export type DataToolsState = "pre-tipoff" | "no-closed-week" | "unavailable";

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
