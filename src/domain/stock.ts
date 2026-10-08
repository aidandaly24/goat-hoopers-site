/**
 * PlayerStock — a player's dynasty value expressed like a stock.
 *
 * The league runs its waiver wire on FAAB, so every player gets a modeled
 * price in FAAB dollars. Prices come from the valuation engine in
 * `src/data/transform.ts` (`computeStockMarket`), which blends fundamentals
 * (trailing NBA production in our scoring, prospect pedigree, age curve)
 * with bounded league sentiment (ownership, FAAB spent, trades, add/drop
 * velocity). Trailing production comes from Sleeper's own stats feed —
 * real box-score totals, not vibes.
 *
 * Price history comes from periodic snapshots persisted by the data layer.
 * Until the first snapshot exists, change fields are null and the UI shows
 * an honest "new listing" state instead of fake 0.0% moves.
 */

export type StockTrend = "up" | "down" | "flat";

/**
 * Where a price point came from.
 * - `gamelog`: reconstructed from real per-game logs (Hugging Face backfill).
 * - `backtest`: yearly v2 re-pricing for seasons without game-log coverage.
 * - `live`: real daily snapshots from the running site.
 *
 * Reconstructed points are honest model output from real inputs — never
 * invented games. The UI renders backtest segments dashed so the eye can
 * tell reconstruction from dense history.
 */
export type PriceSource = "gamelog" | "backtest" | "live";

/** One point on a player's price path, oldest → newest. */
export type PriceHistoryPoint = {
  /** ISO date of the game (gamelog), season end (backtest), or snapshot (live). */
  date: string;
  price: number;
  source: PriceSource;
};

/**
 * A player's fundamentals for valuation v2. Built by `src/data/nba-stats.ts`
 * from Sleeper's stats feed (trailing production) and the league's rookie
 * drafts (pedigree), cached in `player_stat_cache` and refreshed daily.
 */
export type PlayerStatProfile = {
  /**
   * Trailing fantasy PPG in our league's scoring
   * (0.65 × last season + 0.35 × season before). Null when the player has
   * no NBA stat line — the engine then prices pure pedigree.
   */
  fppg: number | null;
  /** Estimated career NBA minutes (sums the seasons on record). */
  careerMinutes: number;
  /** In-season EMA of game fppg; null until games are played. */
  emaFppg: number | null;
  /** Games folded into emaFppg. */
  emaGames: number;
  /** Earliest league rookie-draft overall pick; null if never drafted. */
  leaguePick: number | null;
  /**
   * Per-season production, newest first (up to 5 seasons). Empty for
   * players with no NBA stat lines.
   */
  seasonHistory: Array<{ season: string; fppg: number; games: number }>;
};

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
  /**
   * Price path for the sparkline, oldest → newest. Merges reconstructed
   * history (gamelog/backtest from `price_history`) with live snapshots,
   * sampled to a sparkline-friendly length. Backtest segments render
   * dashed — see the Sparkline component.
   */
  spark: PriceHistoryPoint[];
  /** What moved the price, largest absolute delta first. */
  factors: StockFactor[];
  /** Total FAAB spent to acquire this player inside the window. */
  faabSpent: number;
  /** Times this player was traded inside the window. */
  tradeCount: number;
  /** Share of league teams rostering the player, 0–1. */
  ownership: number;
  /** Earliest overall pick in a league rookie draft; null for non-rookies. */
  rookiePick: number | null;
  /**
   * Per-season production, newest first (up to 5 seasons). Powers the
   * "last 5 seasons" view in the expanded row.
   */
  seasonHistory: Array<{ season: string; fppg: number; games: number }>;
};

export type PanicSignal = {
  stock: StockQuote;
  /** Why this is alarming, e.g. "Traded 3 times in 14 days". */
  reason: string;
  /** 1 = keep an eye on it, 2 = spicy, 3 = full panic. */
  intensity: 1 | 2 | 3;
};

/**
 * The slim quote every list view gets: everything a row shows, nothing it
 * doesn't. Per Rule 14, deep per-player data (factors, season history,
 * sparkline) is NOT here — it loads on expand via `getStockDetail` /
 * `GET /api/stocks/[playerId]`.
 */
export type StockQuote = {
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
  /** Share of league teams rostering the player, 0–1. */
  ownership: number;
  /** Earliest overall pick in a league rookie draft; null for non-rookies. */
  rookiePick: number | null;
};

/**
 * One player's deep data, fetched on expand. Never ships in list HTML.
 */
export type StockDetail = {
  playerId: string;
  /** What moved the price, largest absolute delta first. */
  factors: StockFactor[];
  /**
   * Per-season production, newest first (up to 5 seasons). Powers the
   * history chart in the expanded row.
   */
  seasonHistory: Array<{ season: string; fppg: number; games: number }>;
  /** Recent price points for the sparkline, oldest → newest. */
  spark: number[];
};

export type StockMarket = {
  /** Every priced player, sorted by price descending. Slim quotes only. */
  stocks: StockQuote[];
  /** Biggest gainers with real price history. Empty until snapshots exist. */
  trending: StockQuote[];
  /** Biggest losers with real price history. Empty until snapshots exist. */
  falling: StockQuote[];
  /** Unusual trade/drop activity worth a second look. */
  panic: PanicSignal[];
  /** Unix ms of computation. */
  updatedAt: number;
  /** False on the very first snapshot — no change % yet. */
  hasHistory: boolean;
  /**
   * "preseason" until any player has in-season EMA games; the surface shows
   * an honest "preseason pricing" badge in that state.
   */
  pricingBasis: "preseason" | "in-season";
};
