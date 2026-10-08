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
