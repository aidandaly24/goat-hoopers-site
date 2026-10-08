/**
 * DraftPick — one pick in a Sleeper rookie draft.
 *
 * Player identity comes from the pick's own metadata (Sleeper embeds the
 * drafted player's name/position/team on the pick), so the data layer
 * doesn't need the player directory to build a draft board.
 */
export type DraftPick = {
  /** Overall pick number, 1-based. */
  pickNo: number;
  /** Draft round, 1-based. */
  round: number;
  /** Original draft slot that made the pick. */
  draftSlot: number;
  /** Sleeper player_id of the drafted player. */
  playerId: string;
  /** Full name from the pick metadata. */
  playerName: string;
  /** e.g. "PG", "C". Null when Sleeper has none. */
  position: string | null;
  /** NBA team abbreviation, e.g. "WAS". Null when unsigned/unknown. */
  nbaTeam: string | null;
  /**
   * ESPN athlete id (null until resolved). DraftPick carries its own copy
   * because it doesn't go through the player directory — same rule-11 seam
   * (src/data/espn.ts) resolves it at the membrane in toDraftPicks.
   */
  espnId: string | null;
  /** Sleeper roster_id that ended up with the player, as a string. */
  teamId: string;
};
