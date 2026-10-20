import { getCourtsidePortraits, clubhouseAnchors } from '@/data/courtside-home';
import { personalizedFixture, playerGuideFixture } from '@/test/personalized-home-fixture';
import { buildHomeFaces, buildPersonalizedHome } from '@/data/personalized-home';
import type { HomeViewer } from '@/domain/personalized-home';

/** Isolated synthetic projections; never imported by production application code. */
export function homeReviewFixture(state = 'member', id = '1', reference = false) {
const { home, weekly, market, teams, news } = personalizedFixture();
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
// Approved public portraits illustrate synthetic identities in this offline fixture.
const portraits = getCourtsidePortraits();
for (const entry of home.directory) {
  const sourceIds = clubhouseAnchors[entry.identity.id] ?? [];
  entry.players.forEach((player, i) => { if (sourceIds[i]) portraits[player.id] = `/courtside/portraits/player-${sourceIds[i]}.png`; });
}
if (reference) {
  teams[0].name = 'Reaves Dropper';
  const names = ['Alperen Şengün', 'Joel Embiid', 'Anthony Edwards'];
  const images = ['2308', '1511', '2133'];
  home.directory[0].players.slice(0, 3).forEach((player, index) => {
    player.fullName = names[index];
    player.position = index === 2 ? 'SG' : 'C';
    portraits[player.id] = `/courtside/portraits/player-${images[index]}.png`;
  });
  // Show both compact editorial roles with real checked-in transparent art,
  // retaining explicitly synthetic source facts rather than implying awards.
  home.edition = structuredClone(home.edition!);
  home.edition.playerSpotlights[0].name = 'Joel Embiid (fixture)';
  portraits[home.edition.playerSpotlights[0].playerId] = '/courtside/portraits/player-1511.png';
  home.edition.playerSpotlights.push({ ...home.edition.playerSpotlights[0],
    role: 'underperformer', playerId: 'synthetic-chud', name: 'Anthony Edwards (fixture)',
    headline: 'Synthetic rough-week editorial',
  });
  portraits['synthetic-chud'] = '/courtside/portraits/player-2133.png';
}
if (state === 'image-failure') for (const id of Object.keys(portraits)) portraits[id] = '/missing-fixture-image.png';
if (state === 'identity-updated') {
  teams[0].name = 'Renamed Current Club';
  teams[0].avatar = 'updated-fixture-avatar';
  teams[1].name = 'Renamed Opponent';
  const moved = home.directory[0].players.shift()!;
  home.directory[1].players.push(moved);
  home.directory[0].players.push({ id: 'incoming-player', fullName: 'Incoming Current Player', position: 'C', nbaTeam: 'SYN', espnId: null });
  market.stocks.push({ ...market.stocks[0], playerId: 'incoming-player', playerName: 'Incoming Current Player', price: 500 });
  portraits['incoming-player'] = '/courtside/portraits/player-2133.png';
}
if (state === 'unplayed') {
  home.directory.forEach(entry => { if (entry.currentMatchup) { entry.currentMatchup.homePoints = 0; entry.currentMatchup.awayPoints = 0; } });
}
if (state === 'stats-populated') {
  const matchup = { ...home.directory[0].currentMatchup!, week: 1, homePoints: 140.5, awayPoints: 100.25 };
  home.hub!.stats = {
    pointsForLeader: { team: teams[0], displayValue: '1,234.6' },
    pointsAgainstLeader: { team: teams[1], displayValue: '1,145.2' },
    longestWinStreak: { team: teams[0], wins: 4 },
    mostActiveManager: { team: teams[2], transactionCount: 12 },
    biggestBlowout: { matchup, margin: 40.25 },
    closestGame: { matchup: { ...matchup, awayPoints: 139 }, margin: 1.5 },
  };
}
const personal = buildPersonalizedHome(viewer, home, weekly, state === 'missing-market' ? null : market, news, guideSources, snapshotHistory);
return { home, weekly, viewer, personal, portraits, faces: buildHomeFaces(home, state === 'missing-market' ? null : market) };
}
