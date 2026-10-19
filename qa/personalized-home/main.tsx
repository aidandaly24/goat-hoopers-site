import { createRoot } from 'react-dom/client';
import { CourtsideHome } from '@/surfaces/season-hub/CourtsideHome';
import { SiteHeader } from '@/ui/SiteHeader';
import { SiteFooter } from '@/ui/SiteFooter';
import { personalizedFixture, playerGuideFixture } from '@/test/personalized-home-fixture';
import { buildHomeFaces, buildPersonalizedHome } from '@/data/personalized-home';
import type { HomeViewer } from '@/domain/personalized-home';
import '@/ui/tokens.css';
import '@/app/globals.css';
import '../controls/fixture.css';

const { home, weekly, market, teams, news } = personalizedFixture();
const params = new URLSearchParams(location.search);
const state = params.get('state') ?? 'member';
const id = params.get('fixture-team') ?? '1';
const viewer: HomeViewer = state === 'signed_out' ? { kind: 'signed_out' } : state === 'unclaimed' ? { kind: 'unclaimed' } : state === 'unavailable' ? { kind: 'unavailable' } : { kind: 'member', teamId: id };
if (state === 'preseason') { home.hub!.season.status = 'pre_season'; home.hub!.standings.forEach(row => { row.wins = 0; row.losses = 0; row.team.wins = 0; row.team.losses = 0; }); weekly.matchups = []; }
if (state === 'offseason') home.hub!.season.status = 'off_season';
if (state === 'no-matchup') home.directory.forEach(entry => entry.currentMatchup = null);
if (state === 'ai-stale') weekly.status = 'stale';
if (state === 'ai-missing') weekly.matchups = [];
if (state === 'missing-edition') home.edition = null;
if (state === 'long-name') teams[0].name = 'The Very Long Synthetic Basketball Club Name With ALongUnbrokenSyntheticWordForReflow';
if (state === 'champion') { const entry = home.directory[0]; if (entry) entry.previousSeason = { season: '2025', wins: 17, losses: 4, finish: 1, ownerNote: null }; }
const guideSources = state === 'guide-unavailable' ? null : playerGuideFixture(id);
if (state === 'preseason') { guideSources!.completedWeek = null; guideSources!.formSeason = null; market.stocks[0].changePct = 5; market.stocks[0].price = 42; home.directory.forEach(entry => { if (entry.currentMatchup) entry.currentMatchup.week = 1; }); }
// Recorded-history fixture for the member's value trend: two earlier
// recorded stamps per roster player, derived from the fixture quotes so
// the panel's sparkline exercises its real rendering path (the production
// series comes from recorded stock snapshots, never from this fixture).
const snapshotHistory = viewer.kind === 'member' ? Object.fromEntries(
  (home.directory.find(entry => entry.identity.id === id)?.players ?? []).map(player => {
    const price = market.stocks.find(stock => stock.playerId === player.id)?.price ?? 0;
    return [player.id, [
      { date: '2026-11-05T12:00:00.000Z', price: Math.max(1, Math.round(price * 0.72)), source: 'live' as const },
      { date: '2026-11-09T12:00:00.000Z', price: Math.max(1, Math.round(price * 0.88)), source: 'live' as const },
    ]];
  })) : null;
const personal = buildPersonalizedHome(viewer, home, weekly, state === 'missing-market' ? null : market, news, guideSources, snapshotHistory);
createRoot(document.getElementById('root')!).render(<>
  <aside className="fixture-note">Offline personalized home review · all teams, values, scores and AI results are synthetic · no account actions</aside>
  <SiteHeader user={viewer.kind === 'member' ? { displayName: `Fixture manager ${id}`, teamId: id } : null} logoutAction={async () => { throw Error('No account action in fixture'); }} />
  <main id="main-content"><CourtsideHome data={home} archive={[]} portraits={{}} aiWeekly={weekly} viewerTeamId={viewer.kind === 'member' ? viewer.teamId : undefined} personal={personal} faces={buildHomeFaces(home, state === 'missing-market' ? null : market)} /></main>
  <SiteFooter season={home.hub?.season ?? null} />
</>);
