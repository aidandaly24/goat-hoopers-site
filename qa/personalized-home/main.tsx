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
const viewer: HomeViewer = state === 'signed_out' || state === 'showcase-public' || state === 'team-avatars-public' ? { kind: 'signed_out' } : state === 'unclaimed' ? { kind: 'unclaimed' } : state === 'unavailable' ? { kind: 'unavailable' } : { kind: 'member', teamId: id };
if (state === 'preseason') { home.hub!.season.status = 'pre_season'; home.hub!.standings.forEach(row => { row.wins = 0; row.losses = 0; row.team.wins = 0; row.team.losses = 0; }); weekly.matchups = []; }
if (state === 'offseason') home.hub!.season.status = 'off_season';
if (state === 'no-matchup') home.directory.forEach(entry => entry.currentMatchup = null);
if (state === 'ai-stale') weekly.status = 'stale';
if (state === 'ai-missing') weekly.matchups = [];
if (state === 'missing-edition') home.edition = null;
if (state === 'long-name') teams[0].name = 'The Very Long Synthetic Basketball Club Name With ALongUnbrokenSyntheticWordForReflow';
if (state === 'champion') { const entry = home.directory[0]; if (entry) entry.previousSeason = { season: '2025', wins: 17, losses: 4, finish: 1, ownerNote: null }; }
if (state === 'team-avatars' || state === 'team-avatars-public') {
  // Real team-avatar images on every team (the default fixture renders
  // initials discs): the first featured club is the reigning champion, so
  // the faces section exercises the champion and non-champion avatar
  // paths with <img> avatars, not just initials.
  teams.forEach(team => { team.avatar = 'fixture-avatar'; });
  const entry = home.directory[0]; if (entry) entry.previousSeason = { season: '2025', wins: 17, losses: 4, finish: 1, ownerNote: null };
}
if (state === 'archived-edition') {
  // A historical edition (the Sep 28–Oct 4 sample window) rendered the
  // way /weekly/[editionId] renders it: archived, with a league check
  // from inside its own week — before the current opener's tip.
  home.checkedAt = '2026-10-02T12:00:00.000Z';
}
const guideSources = state === 'guide-unavailable' ? null : playerGuideFixture(id);
if (state === 'showcase' || state === 'showcase-public') {
  // The approved-design capture state: pre-tip (live countdown), preseason,
  // verified-style 2025 finishes for every desk (club 5 the 17–4 champion,
  // club 1 at 16–5 in fourth), a saved Week 1 preseason-preview AI slate,
  // and recorded price history inside October so the value chart renders
  // its genuine recorded series. All values remain synthetic fixture data.
  home.checkedAt = '2026-10-19T15:30:00.000Z';
  home.hub!.season.status = 'pre_season';
  home.hub!.standings.forEach(row => { row.wins = 0; row.losses = 0; row.team.wins = 0; row.team.losses = 0; });
  const finishes = [4, 3, 5, 2, 1, 6, 7, 8, 9, 10];
  const wins = [16, 15, 13, 16, 17, 11, 9, 8, 6, 4];
  home.directory.forEach((entry, index) => {
    entry.previousSeason = { season: '2025', wins: wins[index], losses: 21 - wins[index], finish: finishes[index], ownerNote: null };
    if (entry.currentMatchup) entry.currentMatchup.week = 1;
  });
  weekly.week = 1;
  weekly.snapshot = { hash: 'showcase', model: 'fixture-model', promptVersion: 'goat-lineup-preview-v2', comparison: 'preseason_lineup_preview', sourceLeg: 0, capturedAt: '2026-10-18T12:00:00Z', cutoffAt: '2026-10-18T12:00:00Z', startsAt: '2026-10-20T00:00:00Z', endsAt: null, statsSeason: '2025', scoringMode: 'unknown', baselineVersion: 'prior-observed-starter-ppg-v2' };
  market.updatedAt = Date.parse('2026-10-19T15:00:00.000Z');
  guideSources!.completedWeek = null; guideSources!.formSeason = null;
}
if (state === 'preseason') { guideSources!.completedWeek = null; guideSources!.formSeason = null; market.stocks[0].changePct = 5; market.stocks[0].price = 42; home.directory.forEach(entry => { if (entry.currentMatchup) entry.currentMatchup.week = 1; }); }
// Recorded-history fixture for the member's value trend: two earlier
// recorded stamps per roster player, derived from the fixture quotes so
// the value section's chart exercises its real rendering path (the
// production series comes from recorded stock snapshots, never from
// this fixture).
const snapshotHistory = viewer.kind === 'member' ? Object.fromEntries(
  (home.directory.find(entry => entry.identity.id === id)?.players ?? []).map(player => {
    const price = market.stocks.find(stock => stock.playerId === player.id)?.price ?? 0;
    const [first, second] = state === 'showcase'
      ? ['2026-10-12T12:00:00.000Z', '2026-10-16T12:00:00.000Z']
      : ['2026-11-05T12:00:00.000Z', '2026-11-09T12:00:00.000Z'];
    return [player.id, [
      { date: first, price: Math.max(1, Math.round(price * 0.72)), source: 'live' as const },
      { date: second, price: Math.max(1, Math.round(price * 0.88)), source: 'live' as const },
    ]];
  })) : null;
const personal = buildPersonalizedHome(viewer, home, weekly, state === 'missing-market' ? null : market, news, guideSources, snapshotHistory);
createRoot(document.getElementById('root')!).render(<>
  <aside className="fixture-note">Offline personalized home review · all teams, values, scores and AI results are synthetic · no account actions</aside>
  <SiteHeader user={viewer.kind === 'member' ? { displayName: `Fixture manager ${id}`, teamId: id, avatar: null } : null} logoutAction={async () => { throw Error('No account action in fixture'); }} />
  <main id="main-content"><CourtsideHome data={home} archive={[]} portraits={{}} aiWeekly={weekly} viewerTeamId={viewer.kind === 'member' ? viewer.teamId : undefined} personal={personal} faces={buildHomeFaces(home, state === 'missing-market' ? null : market)} archived={state === 'archived-edition'} /></main>
  <SiteFooter season={home.hub?.season ?? null} />
</>);
