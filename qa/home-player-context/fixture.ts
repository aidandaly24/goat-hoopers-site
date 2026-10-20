import { personalizedFixture, playerGuideFixture } from '@/test/personalized-home-fixture';
import { buildHomeFaces, buildPersonalizedHome } from '@/data/personalized-home';
import { clubhouseAnchors, getCourtsidePortraits } from '@/data/courtside-home';

/** Offline synthetic input only; never imported by an application route. */
export function playerContextFixture(state = 'small-cohort', teamId = '1') {
  const { home, weekly, market, news } = personalizedFixture();
  const sources = playerGuideFixture(teamId);
  const roster = home.directory.find(entry => entry.identity.id === teamId)!.players;
  if (['small-cohort', 'six-participants', 'long-name', 'small-tie'].includes(state)) sources.completedWeek!.players[0].gamesPlayed = 2;
  if (state === 'six-participants' || state === 'tied-participants') {
    sources.completedWeek!.players[0].gamesPlayed = 2;
    for (const index of [4, 5]) {
      const id = `${teamId}-player-${index}`;
      roster.push({ id, fullName: `Synthetic added player ${index}`, espnId: null, position: 'C', nbaTeam: 'SYN' });
      sources.completedWeek!.players.push({ playerId: id, fantasyPoints: index * 12, gamesPlayed: 2, injuryNote: null });
    }
  }
  if (state === 'tied-participants' || state === 'small-tie') sources.completedWeek!.players.forEach(row => { row.fantasyPoints = 0; });
  if (['preseason', 'quiet-preseason', 'value-only'].includes(state)) {
    sources.formSeason = null; sources.completedWeek = null;
  }
  if (state === 'preseason' || state === 'quiet-preseason') {
    home.hub!.season.status = 'pre_season';
    home.checkedAt = '2026-10-19T12:00:00.000Z';
    sources.checkedAt = home.checkedAt;
    market.pricingBasis = 'preseason';
    market.updatedAt = Date.parse(home.checkedAt);
    weekly.week = 1; weekly.matchups = []; weekly.status = 'unavailable';
    home.hub!.teams.forEach(team => { team.wins = 0; team.losses = 0; team.ties = 0; });
    home.hub!.standings.forEach(row => { row.wins = 0; row.losses = 0; row.ties = 0; });
    home.directory.forEach(entry => { if (entry.currentMatchup) entry.currentMatchup.week = 1; });
    market.stocks.filter(row => row.playerId.startsWith(`${teamId}-`)).forEach((row, index) => { row.changePct = index < 3 ? (index + 1) * 5 : 0; });
  }
  if (state === 'quiet-preseason' || state === 'news-unavailable') {
    news.articles = []; home.hub!.transactions = [];
  }
  if (state === 'missing-edition') home.edition = null;
  if (state === 'long-name') {
    home.hub!.teams.find(team => team.id === teamId)!.name = 'Synthetic Franchise With ALongUnbrokenNameForNarrowLayoutVerification';
    roster.forEach(player => { player.fullName = `Synthetic ${player.id} ALongUnbrokenPlayerNameForNarrowLayoutVerification`; });
  }
  const viewer = state === 'signed-out' ? { kind: 'signed_out' as const } : { kind: 'member' as const, teamId };
  const personal = buildPersonalizedHome(viewer, home, weekly, market, state === 'news-unavailable' ? null : news, sources);
  const portraits = getCourtsidePortraits();
  for (const entry of home.directory) entry.players.forEach((player, index) => {
    const anchor = clubhouseAnchors[entry.identity.id]?.[index];
    if (anchor) portraits[player.id] = `/courtside/portraits/player-${anchor}.png`;
    if (state === 'failed-images') { player.espnId = null; portraits[player.id] = '/courtside/synthetic-missing-portrait.png'; }
  });
  return { home, weekly, viewer, personal, portraits, faces: buildHomeFaces(home, market) };
}
