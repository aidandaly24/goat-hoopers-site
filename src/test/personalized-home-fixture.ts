import type { Team, Matchup, StockMarket } from '@/domain';
import type { CourtsideHomeData } from '@/data/league';
import type { LeagueNewsEdition } from '@/domain/news';
import type { AiWeeklySlate } from '@/domain/ai-decider';
import { AI_PROBABILITY_LABEL } from '@/domain/ai-decider';
import { syntheticHome } from './site-shell/home';

/** Entirely synthetic, shared by offline tests and the local visual fixture. */
export function personalizedFixture() {
  const teams: Team[] = Array.from({ length: 10 }, (_, index) => ({ id: String(index + 1), name: `Fixture Club ${index + 1}`,
    managerName: `Fixture Manager ${index + 1}`, avatar: null, wins: 3, losses: index % 3, ties: 0, pointsFor: 123456, pointsAgainst: 100000 }));
  const pairs: Matchup[] = Array.from({ length: 5 }, (_, index) => ({ week: 3, home: teams[index * 2], away: teams[index * 2 + 1], homePoints: index === 0 ? 0 : 105.5, awayPoints: null }));
  const directory = teams.map(identity => ({ identity, currentRecord: identity, previousSeason: null, currentMatchup: pairs.find(pair => [pair.home.id, pair.away.id].includes(identity.id))!, latestMove: null,
    players: Array.from({ length: 4 }, (_, index) => ({ id: `${identity.id}-player-${index}`, fullName: `Synthetic ${identity.id} Player ${index + 1}`, position: 'PG', nbaTeam: 'SYN' })),
    featuredPlayerIds: [], opener: null, recentMove: null }));
  const home: CourtsideHomeData = { ...syntheticHome, directory, rosterNamesAvailable: true, checkedAt: '2026-11-12T12:00:00Z',
    hub: { season: { leagueName: 'Fixture League', seasonYear: '2026', status: 'in_season', totalTeams: 10, playoffTeams: 6, playoffWeekStart: 20 }, teams,
      standings: teams.map((team, index) => ({ team, rank: index + 1, wins: team.wins, losses: team.losses, ties: 0, pointsFor: team.pointsFor, gamesBack: 0 })),
      stats: { pointsForLeader: null, pointsAgainstLeader: null, longestWinStreak: null, mostActiveManager: null, biggestBlowout: null, closestGame: null }, transactions: [] } };
  const market: StockMarket = { stocks: directory.flatMap(entry => entry.players.map((player, index) => ({ playerId: player.id, playerName: player.fullName, position: player.position, nbaTeam: player.nbaTeam,
    price: [20, 40, 40, 10][index], prevPrice: null, change: null, changePct: null, trend: 'flat' as const, ownership: .1, rookiePick: null }))), trending: [], falling: [], panic: [], updatedAt: Date.parse(home.checkedAt), hasHistory: false, pricingBasis: 'in-season' };
  const weekly: AiWeeklySlate = { leagueId: '1387473752807190528', season: '2026', week: 3, status: 'ready', message: 'Synthetic saved slate', generatedAt: '2026-11-10T12:00:00Z', snapshot: null,
    matchups: pairs.map((pair, index) => ({ matchupId: String(index), teamIds: [pair.home.id, pair.away.id], status: 'ready', message: 'Synthetic pick', evidence: ['Synthetic input evidence; no real result.'], baseline: null,
      result: { model: 'fixture-model', promptVersion: 'fixture-prompt', choice: pair.away.id, confidence: .2,
        probabilities: [{ choice: pair.away.id, probability: .35 }, { choice: pair.home.id, probability: .65 }], evidence: [], probabilityLabel: AI_PROBABILITY_LABEL, snapshot: null } })) };
  const news: LeagueNewsEdition = { builtAt: Date.parse(home.checkedAt), coverage: { rosters: 'ok', directory: 'ok', draft: 'ok' },
    articles: ['1', '4', '9'].map(id => ({ id: `fixture-news-${id}`, outlet: { id: 'synthetic', name: 'Synthetic Wire' }, headline: `Synthetic roster ${id} player update`, url: `https://example.com/fixture-${id}`, publishedAt: Date.parse(home.checkedAt), summary: 'Offline fixture only.', players: [{ playerId: `${id}-player-1`, name: `Synthetic ${id} Player 2` }], sections: ['latest', 'league'] })) };
  home.hub!.transactions = ['1', '4', '9'].map(id => ({ id: `fixture-move-${id}`, type: 'free_agent', week: 3, createdAt: Date.parse(home.checkedAt), summary: `Fixture Club ${id} added a synthetic player.`, teamIds: [id], adds: [], drops: [] }));
  for (const quote of market.stocks) { quote.prevPrice = 40; quote.changePct = (quote.price - 40) / 40 * 100; }
  return { home, weekly, market, teams, news };
}
