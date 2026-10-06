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
};
