import type { Team } from "./team";
import type { Season } from "./season";
import type { Standing } from "./standing";
import type { Matchup } from "./matchup";
import type { AiWeeklyPick, AiWeeklySlate } from "./ai-decider";
import type { RealNewsArticle } from "./news";
import type { Transaction } from "./transaction";
import type { TeamPlayerGuide } from "./team-player-guide";
import type { RosterValuation, RosterValueTrend } from "./roster-value";

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
  playerGuide: TeamPlayerGuide;
  valuation: RosterValuation & { rank: { rank: number; teams: number; tied: boolean } | null };
  /** Recorded roster-value trend (see rosterValueTrend); null whenever
   * fewer than two recorded instants exist — the panel then shows the
   * value with no line rather than an invented one. */
  valueTrend: RosterValueTrend | null;
  rosterValues: { id: string; name: string; position: string | null; value: number | null }[];
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

/**
 * One team's face for the homepage: its top player by current modeled value.
 * `player` is null when no roster player has a usable quote — the strip omits
 * the team rather than inventing a face. `champion` derives from the clubhouse
 * directory's previous-season finish (finish === 1), the same source that
 * prints the "2025 champion" label — never a hardcoded team.
 */
export type HomeTeamFace = {
  team: Pick<Team, "id" | "name" | "managerName" | "avatar">;
  champion: boolean;
  player: {
    id: string;
    name: string;
    position: string | null;
    value: number;
    espnId: string | null;
  } | null;
};
