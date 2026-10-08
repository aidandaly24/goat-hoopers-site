/**
 * Domain model — the shared language of the GOAT Hoopers site.
 *
 * These types are the ONLY vocabulary surfaces are allowed to use when talking
 * about league concepts. Raw Sleeper API shapes never leave `src/data/`.
 *
 * Concepts:
 * - Team: a fantasy roster (identity object — everything references this)
 * - TeamProfile: everything the public team page shows about one franchise
 * - Standing: a team's ranked position in the league table
 * - Matchup: a head-to-head pairing for a week (points null = not played)
 * - MatchupPreview: one matchup's projection, win probability, and pick
 * - Player: an NBA player from Sleeper's directory (reference data)
 * - PlayerDetail: one player's page — owner, wire history, draft pick
 * - PlayerMove: one player movement inside a Transaction (clickable names)
 * - Transaction: waiver / free-agent / trade activity, pre-summarized
 * - DraftPick: one rookie-draft pick (player identity from pick metadata)
 * - PlayerStock / StockMarket: the dynasty stock market — every player's
 *   value modeled like a stock in FAAB dollars, with movers and panic signals
 * - Season: league metadata for the current season
 * - PowerRanking: the computed power order (formula in the type's doc)
 * - PlayoffOdds: simulated postseason chances (model in the type's doc)
 * - RecordBook: all-time biggest blowouts, closest games, top scores
 * - LeagueStats: home-page numbers — points leaders, streaks, activity,
 *   weekly matchup highlights (all nullable; null = nothing to show yet)
 *
 * Rule: if a new league concept is needed, add the type here first, then teach
 * the data layer how to build it. Never invent a parallel shape in a surface.
 */
export type { Team } from "./team";
export type { ReconstructionInput, ReconstructedPoint, PriceHistoryArtifact } from "./price-history-import";
export type { Standing } from "./standing";
export type { Matchup, } from "./matchup";
export { isFinal, signedStreak, winner } from "./matchup";
export type { Player } from "./player";
export type { PlayerDetail } from "./player-detail";
export type { TeamProfile } from "./team-profile";
export type { PowerRanking } from "./power";
export type { PlayoffOdds } from "./playoff-odds";
export type { RecordBook, TeamWeekScore } from "./record-book";
export type { MatchupPreview } from "./matchup-preview";
export type { Transaction, TransactionType, PlayerMove } from "./transaction";
export type { DraftPick } from "./draft";
export type {
  NewsArticle,
  NewsKind,
  NewsSection,
  PlayerRef,
  TeamRef,
  Publication,
  PublicationId,
} from "./news";
export type {
  ChampionBanner,
  FranchiseHistory,
  FranchiseId,
  HallOfFameEntry,
  LeagueHistory,
  LeagueRecord,
  TimelineEntry,
} from "./history";
export { PUBLICATIONS, NEWS_SECTIONS } from "./news";
export type {
  PlayerStock,
  PlayerStatProfile,
  StockMarket,
  StockFactor,
  StockFactorKind,
  StockTrend,
  StockQuote,
  StockDetail,
  PanicSignal,
  PriceSource,
  PriceHistoryPoint,
} from "./stock";
export type { TradeSide, TradeVerdict } from "./trade";
export { analyzeTrade, tradeTotal } from "./trade";
export type { LiveGame, LiveGameStatus } from "./live-game";
export { isGameDay } from "./live-game";
export type { Season } from "./season";
export { formatSeasonStatus } from "./season";
export type {
  LeagueStats,
  StatLeader,
  StreakInfo,
  ManagerActivity,
  MatchupHighlight,
} from "./stats";
