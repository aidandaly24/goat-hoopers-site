/**
 * Transaction — a waiver claim, free-agent add/drop, or trade.
 *
 * The data layer builds the human-readable `summary` at transform time
 * ("NeuralNets added Player X"), so surfaces render transactions without
 * knowing anything about Sleeper's transaction payload shape. The structured
 * `adds` / `drops` carry the player ids that make names clickable — every
 * player name site-wide links to /player/[sleeperId].
 */
export type TransactionType = "waiver" | "free_agent" | "trade";

/** One player movement inside a transaction. */
export type PlayerMove = {
  /** Sleeper player_id — the /player/[sleeperId] route key. */
  playerId: string;
  /** Display name, resolved from the player directory at load time. */
  name: string;
};

export type Transaction = {
  id: string;
  type: TransactionType;
  /** League week the transaction belongs to. 0 = preseason. */
  week: number;
  /** Unix ms timestamp. */
  createdAt: number;
  /** Human-readable one-line summary. */
  summary: string;
  /** Sleeper roster_ids involved, as strings. Powers the team filter. */
  teamIds: string[];
  /** Players added by this transaction (structured, for player links). */
  adds: PlayerMove[];
  /** Players dropped by this transaction (structured, for player links). */
  drops: PlayerMove[];
};
