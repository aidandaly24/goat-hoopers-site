import type { AiWeeklySlate } from "@/domain/ai-decider";
import type { HomeViewer, HomeTeamSummary, HomeTeamFace, PersonalizedHomeData } from "@/domain/personalized-home";
import { isHomePreseasonPreview } from "@/domain/personalized-home";
import type { StockMarket } from "@/domain/stock";
import type { CourtsideHomeData } from "./league";
import { LEAGUE_ID } from "./sleeper";
import type { LeagueNewsEdition } from "@/domain/news";
import { buildTeamPlayerGuide, type PlayerGuideSources } from "@/domain/team-player-guide";
import { rosterValueRank, summarizeRosterValue } from "@/domain/roster-value";

/** Pure projection of public data after private membership resolution. No I/O/cache. */
export function buildPersonalizedHome(viewer: HomeViewer, home: CourtsideHomeData,
  weekly: AiWeeklySlate | undefined, market: StockMarket | null, news: LeagueNewsEdition | null = null,
  guideSources: PlayerGuideSources | null = null): PersonalizedHomeData {
  if (viewer.kind !== "member") return viewer;
  const hub = home.hub;
  const team = hub?.teams.find(team => team.id === viewer.teamId);
  if (!hub || !team) return { kind: "member", summary: null };
  const entry = home.directory.find(entry => entry.identity.id === team.id);
  const roster = entry?.players ?? [];
  const rosterIds = new Set(roster.map(player => player.id));
  const valuation = summarizeRosterValue(entry ? [...rosterIds] : null, market?.stocks ?? []);
  const leagueValues = home.directory.length === hub.teams.length
    ? hub.teams.map(club => summarizeRosterValue(home.directory.find(entry => entry.identity.id === club.id)?.players.map(player => player.id) ?? null, market?.stocks ?? [])) : [];
  const valued = new Map(valuation.players.map(player => [player.id, player.value]));
  const rosterValues = roster.map(player => ({ id: player.id, name: player.fullName, position: player.position, value: valued.get(player.id) ?? null }));
  const quotes = new Map((market?.stocks ?? []).filter(quote => Number.isFinite(quote.price) && quote.price >= 0)
    .map(quote => [quote.playerId, quote]));
  const priced = roster.filter(player => quotes.has(player.id));
  const players = priced.map(player => {
    const quote = quotes.get(player.id)!;
    // Faces resolve from the directory identity — the same Player.espnId every
    // other surface renders — never from the market quote's own id field.
    return { id: player.id, name: player.fullName, position: player.position, value: quote.price,
      espnId: player.espnId ?? quote.espnId ?? null, changePct: quote.prevPrice !== null && quote.changePct !== null && Number.isFinite(quote.changePct) ? quote.changePct : null };
  })
    .sort((a, b) => b.value - a.value || a.id.localeCompare(b.id)).slice(0, 3);
  // Offseason/completed seasons must not relabel a retained old pairing as this week.
  const activeSeason = ["pre_season", "pre_draft", "in_season"].includes(hub.season.status);
  const candidate = entry?.currentMatchup;
  const matchup = activeSeason && candidate && [candidate.home.id, candidate.away.id].includes(team.id) ? candidate : null;
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
    valuation: { ...valuation, rank: rosterValueRank(valuation, leagueValues) }, rosterValues,
    newsAvailable: !!news && news.builtAt > 0 && news.coverage.directory === "ok" && news.coverage.rosters === "ok" && home.rosterNamesAvailable,
    news: news && news.builtAt > 0 && news.coverage.directory === "ok" && news.coverage.rosters === "ok" && home.rosterNamesAvailable
      ? news.articles.filter(article => article.players.some(player => rosterIds.has(player.playerId)))
        .sort((a, b) => b.publishedAt - a.publishedAt || a.id.localeCompare(b.id)).slice(0, 2)
        .map(({ id, headline, url, outlet, publishedAt }) => ({ id, headline, url, outlet, publishedAt })) : [],
    moves: hub.transactions.filter(move => move.teamIds.includes(team.id)).sort((a, b) => b.createdAt - a.createdAt || a.id.localeCompare(b.id)).slice(0, 2),
    playerGuide: buildTeamPlayerGuide({ teamId: team.id, season: hub.season.seasonYear, phase: hub.season.status,
      currentWeek: matchup?.week ?? null, now: home.checkedAt, sources: guideSources,
      roster: roster.map(player => ({ id: player.id, name: player.fullName, espnId: player.espnId ?? quotes.get(player.id)?.espnId ?? null })),
      market: market?.stocks ?? [] }),
    market: market && Number.isFinite(market.updatedAt) ? { updatedAt: market.updatedAt, pricingBasis: market.pricingBasis } : null, ai } };
}

/**
 * Pure projection: each clubhouse team's top player by current modeled value,
 * for the homepage faces strip and the hero face-off. No I/O — the caller is
 * the force-dynamic home page, so faces never enter a shared cache. A team
 * with no priced roster player gets `player: null` and is omitted by the UI
 * rather than given an invented face.
 */
export function buildHomeFaces(home: CourtsideHomeData, market: StockMarket | null): HomeTeamFace[] {
  const quotes = new Map((market?.stocks ?? [])
    .filter(quote => Number.isFinite(quote.price) && quote.price >= 0)
    .map(quote => [quote.playerId, quote]));
  return home.directory.map(entry => {
    let best: HomeTeamFace["player"] = null;
    for (const player of entry.players) {
      const quote = quotes.get(player.id);
      if (!quote) continue;
      if (!best || quote.price > best.value || (quote.price === best.value && player.id < best.id)) {
        best = {
          id: player.id, name: player.fullName, position: player.position, value: quote.price,
          espnId: player.espnId ?? quote.espnId ?? null,
        };
      }
    }
    return { team: entry.identity, champion: entry.previousSeason?.finish === 1, player: best };
  });
}
