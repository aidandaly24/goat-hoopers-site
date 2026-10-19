import { createRoot } from 'react-dom/client';
import { CourtsideHome } from '@/surfaces/season-hub/CourtsideHome';
import { SiteHeader } from '@/ui/SiteHeader';
import { SiteFooter } from '@/ui/SiteFooter';
import { personalizedFixture, playerGuideFixture } from '@/test/personalized-home-fixture';
import { buildPersonalizedHome } from '@/data/personalized-home';
import { getCourtsidePortraits, clubhouseAnchors } from '@/data/courtside-home';
import type { HomeViewer } from '@/domain/personalized-home';
import '@/ui/tokens.css';
import '@/app/globals.css';
import '../controls/fixture.css';

const { home, weekly, market, teams, news } = personalizedFixture();
// Populated composition fixture, with every number and editorial take synthetic.
home.edition = structuredClone(home.edition);
if (home.edition) {
  home.edition.endsAt = '2026-11-19T00:00:00Z';
  home.edition.game = { ...home.edition.game, title: 'Fixture Club 5 vs Fixture Club 6', teamIds: ['5', '6'], leagueWeek: 3, state: 'upcoming', context: 'Synthetic editorial pairing for layout review.', selectionReason: 'A synthetic rivalry takes the court. This is layout copy, not a real forecast.' };
  home.edition.playerSpotlights = (['player-of-week', 'underperformer', 'one-to-watch'] as const).map((role, index) => ({
    role, playerId: `${index + 2}-player-1`, name: `Synthetic ${index + 2} Player 2`, position: 'PG', teamId: String(index + 2),
    periodLabel: 'Synthetic Week 2', headline: ['A week to remember.', 'Time to find the rhythm.', 'Keep an eye on this one.'][index],
    opinion: ['The synthetic league leader kept the offense moving. A fixture take to test the full weekly composition.', 'A quiet synthetic week leaves room for a bounce back. This example is not an actual player assessment.', 'A bigger synthetic role could make next week interesting. Layout review only.'][index],
    stats: [{ label: 'Fixture FPTS', value: ['84.0', '24.0', '58.0'][index] }, { label: 'Games', value: '3' }],
    statPeriod: 'Synthetic Week 2 · no real performance', selectionReason: 'Synthetic visual fixture.', source: { label: 'Offline fixture', url: '/', checkedAt: '2026-11-12' }
  }));
  home.edition.happenings = ['The league finds its feet', 'A new face on the roster', 'The next matchup awaits'].map((title, index) => ({ title, text: 'Synthetic league wire copy for this offline layout review. No actual transaction or result is implied.', href: '/transactions', dateLabel: `Nov ${12-index}` }));
}
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
if (state === 'no-editorial-players' && home.edition) home.edition.playerSpotlights = [];
if (state === 'long-name') teams[0].name = 'The Very Long Synthetic Basketball Club Name With ALongUnbrokenSyntheticWordForReflow';
const guideSources = state === 'guide-unavailable' ? null : playerGuideFixture(id);
if (state === 'preseason') { guideSources!.completedWeek = null; guideSources!.formSeason = null; market.stocks[0].changePct = 5; market.stocks[0].price = 42; home.directory.forEach(entry => { if (entry.currentMatchup) entry.currentMatchup.week = 1; }); }
const personal = buildPersonalizedHome(viewer, home, weekly, state === 'missing-market' ? null : market, news, guideSources);
const approved = getCourtsidePortraits();
const portraits = Object.fromEntries(home.directory.flatMap(entry => entry.players.flatMap((player, index) => {
  const source = approved[clubhouseAnchors[entry.identity.id]?.[index]];
  return source ? [[player.id, source]] : [];
})));
createRoot(document.getElementById('root')!).render(<>
  <aside className="fixture-note">Offline personalized home review · all teams, values, scores and AI results are synthetic · no account actions</aside>
  <SiteHeader user={viewer.kind === 'member' ? { displayName: `Fixture manager ${id}`, teamId: id } : null} logoutAction={async () => { throw Error('No account action in fixture'); }} />
  <main id="main-content"><CourtsideHome data={home} archive={[]} portraits={portraits} aiWeekly={weekly} personal={personal} opening={{status:'date_only', season:'2026', week:1, date:'2026-10-20', startsAtMs:null, message:'Synthetic date-only source'}} viewerTeamId={viewer.kind === 'member' ? viewer.teamId : undefined} /></main>
  <SiteFooter season={home.hub?.season ?? null} />
</>);
