/**
 * arcade domain barrel — re-exports the bounded context's public types.
 */
export type {
  SiteUser,
  InviteCode,
  ClaimTeamInput,
  ClaimResult,
  GameSession,
  Game,
  PlayableGame,
  GameScore,
  LeaderboardEntry,
  GameHubSummary,
  Reward,
} from "./types";
export { GAMES, getGame, getPlayableGames, WEEKLY_FAAB_PRIZE, currentWeekLabel } from "./games";
export {
  PRICED_IN_CORRECT_POINTS,
  PRICED_IN_MAX_BONUS,
  PRICED_IN_MAX_SCORE,
  PRICED_IN_MIN_LINE_OFFSET,
  PRICED_IN_MIN_PRICE,
  PRICED_IN_ROUND_COUNT,
  advancePricedIn,
  callPricedIn,
  pricedInCallIsCorrect,
  pricedInDealIdentity,
  pricedInLine,
  receivePricedInDeal,
  requestPricedInRedeal,
  samplePricedInRounds,
  scorePricedInCall,
  startPricedInGame,
  type PricedInCall,
  type PricedInCandidate,
  type PricedInGameState,
  type PricedInRandom,
  type PricedInResult,
  type PricedInRound,
} from "./priced-in";
