/** Completed-week homepage evidence. Current identities do not assert past ownership. */
export type RecapPlayer = {
  id: string;
  name: string;
  gamesPlayed: number;
  locked: boolean;
  countedGameId: string | null;
};

export type RecapBreakdown =
  | { basis: "verified"; players: (RecapPlayer & { fantasyPoints: number | null })[] }
  | { basis: "estimated"; computedPoints: number; residual: number;
      players: (RecapPlayer & { estimatedPoints: number | null })[] }
  | { basis: "unavailable"; players: [] };

export type WeeklyRecapTeam = {
  id: string;
  name: string;
  avatar: string | null;
  officialPoints: number;
  breakdown: RecapBreakdown;
};

export type HomeWeeklyRecap =
  | { status: "unavailable"; message: string }
  | {
      status: "available";
      season: string;
      week: number;
      startsAt: string;
      endsAt: string;
      generatedAt: string;
      source: string;
      /** Official totals must cover the whole league before awarding extremes. */
      totalsComplete: boolean;
      teams: WeeklyRecapTeam[];
      studTeamIds: string[];
      chudTeamIds: string[];
    };
