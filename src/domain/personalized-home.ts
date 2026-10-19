import type { Team } from "./team";
import type { Season } from "./season";
import type { Standing } from "./standing";
import type { Matchup } from "./matchup";
import type { AiWeeklyPick, AiWeeklySlate } from "./ai-decider";
import type { RealNewsArticle } from "./news";
import type { Transaction } from "./transaction";

/** Shared with the existing matchup sidebar so its Week 1 exception cannot drift. */
export function isHomePreseasonPreview(weekly: AiWeeklySlate | undefined, season: string | null): boolean {
  return weekly?.status === "ready" && weekly.season === season && weekly.week === 1
    && weekly.snapshot?.comparison === "preseason_lineup_preview"
    && (weekly.snapshot.sourceLeg === 0 || weekly.snapshot.sourceLeg === 1);
}

/** Server-resolved membership only; never constructed from URL/client input. */
export type HomeViewer =
  | { kind: "signed_out" }
  | { kind: "unclaimed" }
  | { kind: "unavailable" }
  | { kind: "member"; teamId: string };

export type HomeTeamSummary = {
  team: Team;
  season: Season;
  standing: Standing | null;
  matchup: Matchup | null;
  checkedAt: string;
  standingsAvailable: boolean;
  players: { id: string; name: string; position: string | null; value: number; espnId: string | null; changePct: number | null }[];
  coverage: { priced: number; roster: number };
  market: { updatedAt: number; pricingBasis: "preseason" | "in-season" } | null;
  news: Pick<RealNewsArticle, "id" | "headline" | "url" | "outlet" | "publishedAt">[];
  newsAvailable: boolean;
  moves: Transaction[];
  ai: {
    status: "ready" | "stale";
    label: string;
    week: number;
    opponent: Pick<Team, "id" | "name">;
    pick: AiWeeklyPick;
    generatedAt: AiWeeklySlate["generatedAt"];
  } | null;
};

export type PersonalizedHomeData =
  | { kind: "signed_out" | "unclaimed" | "unavailable" }
  | { kind: "member"; summary: HomeTeamSummary | null };
