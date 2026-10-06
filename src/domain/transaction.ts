/**
 * Transaction — a waiver claim, free-agent add/drop, or trade.
 *
 * The data layer builds the human-readable `summary` at transform time
 * ("NeuralNets added Player X"), so surfaces render transactions without
 * knowing anything about Sleeper's transaction payload shape.
 */
export type TransactionType = "waiver" | "free_agent" | "trade";

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
};
