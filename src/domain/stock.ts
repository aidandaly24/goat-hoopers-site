/**
 * PlayerStock — a player's dynasty value expressed like a stock.
 *
 * The league runs its waiver wire on FAAB, so every player gets a modeled
 * price in FAAB dollars. Prices come from the valuation engine in
 * `src/data/transform.ts` (`computeStockMarket`), which blends real league
 * signals (ownership, FAAB spent, trades, add/drop velocity, rookie draft
 * capital) with fundamentals (age curve, injury status). Nothing here is
 * scraped from outside the league: the "market" is our ten managers.
 *
 * Price history comes from periodic snapshots persisted by the data layer.
 * Until the first snapshot exists, change fields are null and the UI shows
 * an honest "new listing" state instead of fake 0.0% moves.
 */

export type StockTrend = "up" | "down" | "flat";

/**
 * The inputs that move a player's price. `contract` is tracked as a kind
 * but always resolves neutral — Sleeper exposes no contract data, so the
 * engine refuses to invent it (see the valuation notes in transform.ts).
 */
export type StockFactorKind =
  | "age"
  | "production"
  | "injury"
  | "contract"
  | "dynasty"
  | "recent"
  | "trades"
  | "draft"
  | "faab";

export type StockFactor = {
  kind: StockFactorKind;
  /** Short label, e.g. "Age curve". */
  label: string;
  /** Contribution to the price in FAAB dollars (can be negative). */
  delta: number;
  /** One-line explanation, e.g. "27 — prime years". */
  note: string;
};

export type PlayerStock = {
  /** Sleeper player_id. */
  playerId: string;
  playerName: string;
  position: string | null;
  nbaTeam: string | null;
  /** Current modeled price in FAAB dollars. */
  price: number;
  /** Price at the previous snapshot; null when no history exists yet. */
  prevPrice: number | null;
  /** price - prevPrice; null when no history. */
  change: number | null;
  /** Percentage change vs prevPrice; null when no history. */
  changePct: number | null;
  trend: StockTrend;
  /** Recent price points for the sparkline, oldest → newest. */
  spark: number[];
  /** What moved the price, largest absolute delta first. */
  factors: StockFactor[];
  /** Total FAAB spent to acquire this player inside the window. */
  faabSpent: number;
  /** Times this player was traded inside the window. */
  tradeCount: number;
  /** Share of league teams rostering the player, 0–1. */
  ownership: number;
  /** Overall pick number in the latest rookie draft; null for non-rookies. */
  rookiePick: number | null;
};

export type PanicSignal = {
  stock: PlayerStock;
  /** Why this is alarming, e.g. "Traded 3 times in 14 days". */
  reason: string;
  /** 1 = keep an eye on it, 2 = spicy, 3 = full panic. */
  intensity: 1 | 2 | 3;
};

export type StockMarket = {
  /** Every priced player, sorted by price descending. */
  stocks: PlayerStock[];
  /** Biggest gainers with real price history. Empty until snapshots exist. */
  trending: PlayerStock[];
  /** Biggest losers with real price history. Empty until snapshots exist. */
  falling: PlayerStock[];
  /** Unusual trade/drop activity worth a second look. */
  panic: PanicSignal[];
  /** Unix ms of computation. */
  updatedAt: number;
  /** False on the very first snapshot — no change % yet. */
  hasHistory: boolean;
};
