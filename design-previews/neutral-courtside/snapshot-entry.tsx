/* Review entry only: render the existing layout with its dated local fixtures. */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { CourtsideHome } from '../../src/surfaces/season-hub/CourtsideHome';
import { SiteHeader } from '../../src/ui/SiteHeader';
import { SiteFooter } from '../../src/ui/SiteFooter';
import { MobileNav } from '../../src/ui/MobileNav';
import { CombinedTicker } from '../../src/surfaces/stock-market/CombinedTicker';
import type { Team, Season, LeagueStats } from '../../src/domain';
import type { WeeklyEdition } from '../../src/domain/weekly-spotlight';
import type { ClubhouseDirectoryEntry, LiveClubhouseDirectoryEntry } from '../../src/domain/clubhouse-directory';
import type { CourtsideHomeData } from '../../src/data/league';

type ReviewFixture = {
  snapshot: { season: string; seasonStatus: string; teams: (Omit<Team, 'pointsAgainst'> & { pointsAgainst: number | null })[] };
  weeklyEditions: WeeklyEdition[];
  clubhouseDirectory: ClubhouseDirectoryEntry[];
};

export function render() {
  const context = { window: {} as { CLUBHOUSE_DATA: ReviewFixture } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../../courtside-preview/data.js'), 'utf8'), context);
  const { snapshot, weeklyEditions, clubhouseDirectory } = context.window.CLUBHOUSE_DATA;
  const season: Season = { leagueName: 'GOAT Hoopers', seasonYear: snapshot.season, status: snapshot.seasonStatus, totalTeams: 10, playoffTeams: 6, playoffWeekStart: 20 };
  // This unused preseason aggregate is required by Team; no result is rendered.
  const teams: Team[] = snapshot.teams.map(team => ({ ...team, pointsAgainst: team.pointsAgainst ?? 0 }));
  const directory: LiveClubhouseDirectoryEntry[] = clubhouseDirectory.map(entry => {
    const home = teams.find(team => team.id === entry.identity.id);
    const away = teams.find(team => team.id === entry.opener?.opponentId);
    return { ...entry, currentMatchup: home && away ? { home, away, week: 1, homePoints: null, awayPoints: null } : null, latestMove: null };
  });
  const portraits = Object.fromEntries(fs.readdirSync(path.join(__dirname, '../../public/courtside/portraits')).map(file => [file.replace('player-', '').replace('.png', ''), '/courtside/portraits/' + file]));
  const stats: LeagueStats = { pointsForLeader: null, pointsAgainstLeader: null, longestWinStreak: null, mostActiveManager: null, biggestBlowout: null, closestGame: null };
  const data: CourtsideHomeData = { hub: { teams, season, standings: [], transactions: [], stats }, directory, edition: weeklyEditions[0], checkedAt: '2026-10-08T12:00:00Z', rosterNamesAvailable: true };
  return renderToStaticMarkup(<>
    <CombinedTicker stocks={[]} headlines={weeklyEditions[0].happenings.map(item => ({ text: item.text, publication: 'Sample wire' }))} />
    <SiteHeader user={null} logoutAction={async () => {}} />
    <CourtsideHome data={data} archive={weeklyEditions} portraits={portraits} />
    <SiteFooter season={season} />
    <MobileNav user={null} />
  </>);
}
