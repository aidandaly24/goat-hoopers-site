/** Display-only weekly board contract. No account IDs, run inputs or activation rules. */
export type WeeklyLeaderboardScope = "everyone" | "league";
export type WeeklyLeaderboardEntry = {
  rank: number;
  username: string;
  score: number;
  makes: number;
  attempts: number;
  accuracy: number | null;
  longestStreak: number;
  isCurrentUser: boolean;
};
export type WeeklyLeaderboardBoard = {
  scope: WeeklyLeaderboardScope;
  period: { week: string; startsAtMs: number; endsAtMs: number | null };
  calendar: { timeZone: string };
  entries: readonly WeeklyLeaderboardEntry[];
};
export type WeeklyLeaderboardState =
  | { status: "closed"; message?: string }
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; board: WeeklyLeaderboardBoard };
