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
  PRICED_IN_MIN_PRICE,
  PRICED_IN_ROUND_COUNT,
  pricedInCallIsCorrect,
  pricedInLine,
  samplePricedInRounds,
  scorePricedInCall,
  type PricedInCall,
  type PricedInCandidate,
  type PricedInRandom,
  type PricedInRound,
} from "./priced-in";
