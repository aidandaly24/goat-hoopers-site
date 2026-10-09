import { createRoot } from "react-dom/client";
import type { CourtsideHomeData } from "@/data/league";
import type { Team, TeamProfile as Profile, Season, LeagueStats } from "@/domain";
import { clubhouseDirectory } from "@/data/clubhouse-directory";
import { weeklyEditions } from "@/data/weekly-spotlight";
import snapshot from "../../courtside-preview/league-snapshot.json";
import { CourtsideHome } from "@/surfaces/season-hub/CourtsideHome";
import { TeamProfile } from "@/surfaces/teams/TeamProfile";
import { SiteHeader } from "@/ui/SiteHeader";
import { SiteFooter } from "@/ui/SiteFooter";
import { MobileNav } from "@/ui/MobileNav";
import "@/ui/tokens.css";
import "@/app/globals.css";
import "../paper-slate/fixture.css";

// Existing dated fixtures only. Null avatars/ESPN IDs use production initials
// without requesting a provider. This is not live account or loader QA.
const teams: Team[] = snapshot.teams.map(team => ({
  ...team, avatar: null, pointsAgainst: team.pointsAgainst ?? 0,
}));
const season: Season = {
  leagueName: "GOAT Hoopers", seasonYear: snapshot.season, status: "pre_season",
  totalTeams: 10, playoffTeams: 6, playoffWeekStart: 20,
};
const stats: LeagueStats = {
  pointsForLeader: null, pointsAgainstLeader: null, longestWinStreak: null,
  mostActiveManager: null, biggestBlowout: null, closestGame: null,
};
const directory: CourtsideHomeData["directory"] = clubhouseDirectory.map(entry => {
  const home = teams.find(team => team.id === entry.identity.id);
  const away = teams.find(team => team.id === entry.opener?.opponentId);
  return {
    ...entry, identity: { ...entry.identity, avatar: null }, latestMove: null,
    currentMatchup: home && away ? { home, away, week: 1, homePoints: null, awayPoints: null } : null,
  };
});
const home: CourtsideHomeData = {
  hub: {
    teams, season, stats, transactions: [],
    standings: teams.map((team, index) => ({
      team, rank: index + 1, wins: team.wins, losses: team.losses,
      ties: team.ties, gamesBack: 0, pointsFor: team.pointsFor,
    })),
  },
  directory, edition: weeklyEditions[0], checkedAt: "2026-10-08T12:00:00Z",
  rosterNamesAvailable: true,
};
const empty = new URLSearchParams(location.search).get("state") === "empty";
const teamId = location.pathname.match(/^\/teams\/(\d+)$/)?.[1];
const selected = teams.find(team => team.id === teamId);
const entry = directory.find(item => item.identity.id === teamId);
const profile: Profile | null = selected && entry ? {
  team: selected,
  players: empty ? [] : entry.players.map(player => ({ ...player, espnId: null })),
  matchups: empty || !entry.currentMatchup ? [] : [entry.currentMatchup],
  draftPicks: [], transactions: [], streak: 0,
} : null;

(window as unknown as { removalExpected: unknown }).removalExpected = {
  teams: directory.map(item => ({
    id: item.identity.id, name: item.identity.name, manager: item.identity.managerName,
    players: item.players.map(player => ({ id: player.id, name: player.fullName })),
  })),
  rosterCount: directory.reduce((count, item) => count + item.players.length, 0),
};

createRoot(document.getElementById("root")!).render(<>
  <aside className="fixture-note">Live-base removal QA · dated fixture data · no provider, DB or account calls</aside>
  <SiteHeader user={null} logoutAction={async () => {}} />
  {profile ? <main id="content" className="fixture-wrap"><TeamProfile profile={profile} teams={teams} /></main>
    : <CourtsideHome data={home} archive={weeklyEditions} portraits={{}} />}
  <SiteFooter season={season} /><MobileNav user={null} />
</>);
