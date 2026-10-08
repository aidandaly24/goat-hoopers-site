/**
 * Player — an NBA player, as resolved from Sleeper's player directory.
 *
 * Players are reference data, not league data: they exist independent of any
 * roster. The data layer resolves player_ids to Player objects once (cached
 * daily) so surfaces never touch the raw player directory.
 */
export type Player = {
  /** Sleeper player_id. */
  id: string;
  fullName: string;
  /** e.g. "PG", "SF", "C". Null for picks/unknowns. */
  position: string | null;
  /** NBA team abbreviation, e.g. "LAL". Null for free agents/rookies unsigned. */
  nbaTeam: string | null;
  /**
   * ESPN athlete id, e.g. "5142718". Null until resolved — resolution lives
   * in the data layer (src/data/espn.ts); components never look this up.
   * Feeds the PlayerHeadshot ESPN CDN URL; null renders the initials
   * fallback.
   */
  espnId: string | null;
};
