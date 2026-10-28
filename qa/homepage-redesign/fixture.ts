import { personalizedFixture } from "@/test/personalized-home-fixture";
import { clubhouseDirectory } from "@/data/clubhouse-directory";
import { weeklyEditions } from "@/data/weekly-spotlight";
import { buildHomeFaces, buildPersonalizedHome } from "@/data/personalized-home";
import type { PlayerGuideSources } from "@/domain/team-player-guide";

/** Dated approved identities/editorial; ALL current scores/prices/form are
 * synthetic. No production loader, session, fetch, database or saved AI run. */
export function homepageFixture(member: boolean, missingEdition: boolean, aiState: "ready" | "stale" | "missing" = "ready") {
  const fixture = personalizedFixture();
  const { home, market, weekly, news, teams } = fixture;
  for (const team of teams) {
    const source = clubhouseDirectory.find(entry => entry.identity.id === team.id)!;
    Object.assign(team, source.identity, { avatar: null });
    team.wins = 1;
    team.losses = 0;
    team.pointsFor = 32600 - Number(team.id) * 550;
  }
  home.directory.forEach(entry => {
    const source = clubhouseDirectory.find(row => row.identity.id === entry.identity.id)!;
    // Only already-approved local portrait bytes are used by this offline
    // fixture. Missing local photos retain the production initials fallback.
    entry.players = structuredClone(source.players).map(player => ({ ...player,
      espnId: portraits[player.id] ? player.espnId : null,
    }));
    entry.previousSeason = source.previousSeason;
    entry.featuredPlayerIds = [...source.featuredPlayerIds];
  });
  home.checkedAt = "2026-11-12T12:00:00Z";
  home.edition = missingEdition ? null : structuredClone(weeklyEditions[0]);
  // Keep this historical sample's dates and explicit stale/editorial labels.
  if (home.edition) home.edition.game.teamIds = ["1", "2"];
  market.stocks = home.directory.flatMap(entry => entry.players.map((player, index) => ({
    playerId: player.id, playerName: player.fullName, position: player.position, nbaTeam: player.nbaTeam,
    price: Math.max(4, 74 - index * 3.25) + (entry.featuredPlayerIds.includes(player.id) ? 70 : 0), prevPrice: Math.max(3, 71 - index * 3.25), change: 3,
    changePct: 4.2, trend: "up" as const, ownership: .1, rookiePick: null,
  })));
  home.hub!.standings.forEach(row => {
    row.pointsFor = row.team.pointsFor;
    row.wins = row.team.wins;
    row.losses = row.team.losses;
    row.ties = row.team.ties;
  });
  news.articles = home.directory[0].players.slice(0, 2).map((player, index) => ({
    id: `sample-news-${index}`, outlet: { id: "synthetic", name: "Sample team wire" },
    headline: `${player.fullName}: a roster update to follow`, url: `/player/${player.id}`,
    publishedAt: Date.parse(home.checkedAt), summary: "Synthetic layout example; no real news is asserted.",
    players: [{ playerId: player.id, name: player.fullName }], sections: ["latest", "league"],
  }));
  home.hub!.transactions.forEach(move => {
    move.summary = `${teams.find(team => team.id === move.teamIds[0])!.name} made a sample roster move.`;
  });
  const roster = home.directory[0].players;
  const sources: PlayerGuideSources = {
    checkedAt: home.checkedAt, formSeason: "2026",
    form: Object.fromEntries(roster.map((player, index) => [player.id, { fppg: 38 - index, games: 8 }])),
    injuries: {}, scheduledGames: null,
    completedWeek: { teamId: "1", season: "2026", week: 2, complete: true,
      startsAt: "2026-11-02T00:00:00Z", endsAt: "2026-11-09T00:00:00Z",
      players: roster.slice(0, 5).map((player, index) => ({ playerId: player.id,
        fantasyPoints: 45 - index * 6, gamesPlayed: 3, injuryNote: null })) },
  };
  if (aiState === "stale") weekly.status = "stale";
  const visibleWeekly = aiState === "missing" ? undefined : weekly;
  const personal = buildPersonalizedHome(member ? { kind: "member", teamId: "1" } : { kind: "signed_out" }, home, visibleWeekly, market, news, sources);
  return { home, weekly: visibleWeekly, personal, faces: buildHomeFaces(home, market), archive: structuredClone(weeklyEditions) };
}

export const portraits: Record<string, string> = Object.fromEntries(
  Object.entries(import.meta.glob("../../public/courtside/portraits/*.png", { eager: true, query: "?url", import: "default" }) as unknown as Record<string, string>)
    .map(([path, url]) => [path.match(/player-(\d+)\.png$/)![1], url]),
);
