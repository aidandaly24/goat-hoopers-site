import type { AiWeeklySlate } from "@/domain/ai-decider";
import type { HomeViewer, HomeTeamSummary, PersonalizedHomeData } from "@/domain/personalized-home";
import { isHomePreseasonPreview } from "@/domain/personalized-home";
import type { StockMarket } from "@/domain/stock";
import type { CourtsideHomeData } from "./league";
import { LEAGUE_ID } from "./sleeper";
import type { LeagueNewsEdition } from "@/domain/news";

/** Pure projection of public data after private membership resolution. No I/O/cache. */
export function buildPersonalizedHome(viewer: HomeViewer, home: CourtsideHomeData,
  weekly: AiWeeklySlate | undefined, market: StockMarket | null, news: LeagueNewsEdition | null = null): PersonalizedHomeData {
  if (viewer.kind !== "member") return viewer;
  const hub = home.hub;
  const team = hub?.teams.find(team => team.id === viewer.teamId);
  if (!hub || !team) return { kind: "member", summary: null };
  const entry = home.directory.find(entry => entry.identity.id === team.id);
  const roster = entry?.players ?? [];
  const rosterIds = new Set(roster.map(player => player.id));
  const quotes = new Map((market?.stocks ?? []).filter(quote => Number.isFinite(quote.price) && quote.price >= 0)
    .map(quote => [quote.playerId, quote]));
  const priced = roster.filter(player => quotes.has(player.id));
  const players = priced.map(player => {
    const quote = quotes.get(player.id)!;
    return { id: player.id, name: player.fullName, position: player.position, value: quote.price,
      espnId: quote.espnId ?? null, changePct: quote.prevPrice !== null && quote.changePct !== null && Number.isFinite(quote.changePct) ? quote.changePct : null };
  })
    .sort((a, b) => b.value - a.value || a.id.localeCompare(b.id)).slice(0, 3);
  // Offseason/completed seasons must not relabel a retained old pairing as this week.
  const activeSeason = ["pre_season", "pre_draft", "in_season"].includes(hub.season.status);
  const matchup = activeSeason ? entry?.currentMatchup ?? null : null;
  let ai: HomeTeamSummary["ai"] = null;
  const preview = isHomePreseasonPreview(weekly, hub.season.seasonYear);
  if (activeSeason && weekly && weekly.status !== "unavailable" && weekly.leagueId === LEAGUE_ID && weekly.season === hub.season.seasonYear) {
    const pick = weekly.matchups.find(pick => pick.teamIds.includes(team.id)
      && pick.teamIds[0] !== pick.teamIds[1]
      && (preview || (matchup && weekly.week === matchup.week
        && pick.teamIds.includes(matchup.home.id) && pick.teamIds.includes(matchup.away.id))));
    const result = pick?.status === "ready" ? pick.result : null;
    const opponent = pick && hub.teams.find(other => other.id !== team.id && pick.teamIds.includes(other.id));
    if (pick && result && opponent && pick.teamIds.includes(result.choice)
      && (!weekly.snapshot || !result.snapshot || weekly.snapshot.hash === result.snapshot.hash)
      && Number.isFinite(result.confidence) && result.confidence >= 0 && result.confidence <= 1
      && result.probabilities.length === 2
      && new Set(result.probabilities.map(row => row.choice)).size === 2
      && result.probabilities.every(row => pick.teamIds.includes(row.choice) && Number.isFinite(row.probability)
        && row.probability >= 0 && row.probability <= 1)
      && Math.abs(result.probabilities.reduce((sum, row) => sum + row.probability, 0) - 1) <= .001) {
      ai = { status: weekly.status, label: weekly.snapshot?.comparison === "preseason_lineup_preview" ? "Preseason lineup preview"
        : weekly.snapshot?.comparison === "weekly_lineup_preview" ? "Weekly lineup preview" : "Saved model pick",
        week: weekly.week, opponent, pick, generatedAt: weekly.generatedAt };
    }
  }
  return { kind: "member", summary: { team, season: hub.season,
    standing: hub.standings.find(standing => standing.team.id === team.id) ?? null,
    matchup, checkedAt: home.checkedAt, standingsAvailable: !!home.edition, players, coverage: { priced: priced.length, roster: rosterIds.size },
    newsAvailable: !!news && news.builtAt > 0 && news.coverage.directory === "ok" && news.coverage.rosters === "ok" && home.rosterNamesAvailable,
    news: news && news.builtAt > 0 && news.coverage.directory === "ok" && news.coverage.rosters === "ok" && home.rosterNamesAvailable
      ? news.articles.filter(article => article.players.some(player => rosterIds.has(player.playerId)))
        .sort((a, b) => b.publishedAt - a.publishedAt || a.id.localeCompare(b.id)).slice(0, 2)
        .map(({ id, headline, url, outlet, publishedAt }) => ({ id, headline, url, outlet, publishedAt })) : [],
    moves: hub.transactions.filter(move => move.teamIds.includes(team.id)).sort((a, b) => b.createdAt - a.createdAt || a.id.localeCompare(b.id)).slice(0, 2),
    market: market && Number.isFinite(market.updatedAt) ? { updatedAt: market.updatedAt, pricingBasis: market.pricingBasis } : null, ai } };
}
