/// <reference types="vite/client" />
import { createRoot } from 'react-dom/client';
import type { CourtsideHomeData } from '@/data/league';
import type { Team, Season, LeagueStats, StockQuote, StockMarket as Market, LeagueHistory } from '@/domain';
import type { WeeklyEdition } from '@/domain/weekly-spotlight';
import type { ClubhouseDirectoryEntry } from '@/domain/clubhouse-directory';
import { getPlayableGames } from '@/domain/arcade';
import { PRACTICE_ASSETS, PRACTICE_COURT } from '@/domain/arcade/free-throw';
import { CourtsideHome } from '@/surfaces/season-hub/CourtsideHome';
import { StockMarket } from '@/surfaces/stock-market/StockMarket';
import { TeamDirectory } from '@/surfaces/teams/TeamDirectory';
import { ArcadeHub } from '@/surfaces/arcade/ArcadeHub';
import { FreeThrowPractice } from '@/surfaces/arcade/free-throw/FreeThrowPractice';
import { TradeAnalyzer } from '@/surfaces/trade-analyzer/TradeAnalyzer';
import { TrophyRoom } from '@/surfaces/history/TrophyRoom';
import { ProvisionNotice } from '@/surfaces/arcade/ProvisionNotice';
import NotFound from '@/app/not-found';
import { SiteHeader } from '@/ui/SiteHeader';
import { SiteFooter } from '@/ui/SiteFooter';
import { MobileNav } from '@/ui/MobileNav';
import { SEASON_2025_CHAMPION, LEAGUE_RECORDS_2025, HALL_OF_FAME } from '@/data/history-2025';
import '../../courtside-preview/data.js';
import '@/ui/tokens.css';
import '@/app/globals.css';
import './fixture.css';

type Fixture = {
  weeklyEditions: WeeklyEdition[]; clubhouseDirectory: ClubhouseDirectoryEntry[];
  snapshot: { season: string; seasonStatus: string; teams: (Omit<Team, 'pointsAgainst'> & { pointsAgainst: number | null })[] };
};
const frozen = (window as unknown as { CLUBHOUSE_DATA: Fixture }).CLUBHOUSE_DATA;
const teams: Team[] = frozen.snapshot.teams.map(t => ({ ...t, avatar: null, pointsAgainst: t.pointsAgainst ?? 0 }));
const season: Season = { leagueName: 'GOAT Hoopers', seasonYear: frozen.snapshot.season, status: frozen.snapshot.seasonStatus, totalTeams: 10, playoffTeams: 6, playoffWeekStart: 20 };
const stats: LeagueStats = { pointsForLeader: null, pointsAgainstLeader: null, longestWinStreak: null, mostActiveManager: null, biggestBlowout: null, closestGame: null };
const home: CourtsideHomeData = {
  hub: { teams, season, standings: [], transactions: [], stats },
  directory: frozen.clubhouseDirectory.map(entry => {
    const home = teams.find(t => t.id === entry.identity.id), away = teams.find(t => t.id === entry.opener?.opponentId);
    return { ...entry, identity: { ...entry.identity, avatar: null }, currentMatchup: home && away ? { home, away, week: 1, homePoints: null, awayPoints: null } : null, latestMove: null };
  }),
  edition: frozen.weeklyEditions[0], checkedAt: '2026-10-08T12:00:00Z', rosterNamesAvailable: true,
};
const portraits = Object.fromEntries(Object.keys(import.meta.glob('../../public/courtside/portraits/*.png')).map(file => [file.split('player-')[1].replace('.png', ''), file.replace('../../public', '')]));
const quotes: StockQuote[] = ['Alpha', 'Beta', 'Gamma', 'Delta'].map((name, i) => ({
  playerId: `fixture-${name.toLowerCase()}`, playerName: `Synthetic ${name}`, position: ['PG','SG','SF','C'][i], nbaTeam: null,
  price: 32 - i * 4, prevPrice: i === 3 ? null : 28, change: i === 3 ? null : 4 - i * 4,
  changePct: i === 3 ? null : (4 - i * 4) / 28 * 100, trend: i === 0 ? 'up' : i === 2 ? 'down' : 'flat', ownership: i === 0 ? 0.1 : 0, rookiePick: i === 3 ? 1 : null,
}));
const state = new URLSearchParams(location.search).get('state');
const market: Market = { stocks: state === 'empty' ? [] : quotes, trending: [], falling: [], panic: [], updatedAt: Date.parse('2026-10-08T12:00:00Z'), hasHistory: true, pricingBasis: 'preseason' };
const history: LeagueHistory = { founded: '2025', champions: [SEASON_2025_CHAMPION], records: LEAGUE_RECORDS_2025, hallOfFame: HALL_OF_FAME };
const route = location.pathname;
const content = route === '/stocks' ? <StockMarket market={market} />
  : route === '/teams' ? <main className="fixture-wrap"><TeamDirectory teams={state === 'empty' ? [] : teams} /></main>
  : route === '/arcade' ? <ArcadeHub games={state === 'empty' ? [] : getPlayableGames()} />
  : route.startsWith('/arcade/') ? <FreeThrowPractice court={PRACTICE_COURT} assets={PRACTICE_ASSETS} />
  : route === '/trade-analyzer' ? <main className="fixture-wrap"><TradeAnalyzer stocks={quotes} /></main>
  : route === '/history' ? <main className="fixture-wrap"><TrophyRoom history={history} /></main>
  : route === '/unavailable' ? <main className="fixture-wrap"><ProvisionNotice /></main>
  : route === '/missing' ? <NotFound />
  : <CourtsideHome data={state === 'empty' ? { ...home, edition: null } : home} archive={frozen.weeklyEditions} portraits={portraits} />;

createRoot(document.getElementById('root')!).render(<>
  <aside className="fixture-note">Private component QA · frozen home/history + synthetic quotes · no live data or account</aside>
  <SiteHeader user={null} logoutAction={async () => {}} />
  {content}
  <SiteFooter season={season} /><MobileNav user={null} />
</>);
