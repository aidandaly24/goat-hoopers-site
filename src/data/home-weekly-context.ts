import type { CourtsideHomeData } from "./league";
import type { HomeWeeklyRecap, RecapPlayer, WeeklyRecapTeam } from "@/domain/home-weekly-recap";
import type { PlayerGuideSources } from "@/domain/team-player-guide";
import { getPreviousCompletedPlayerWeek, type WeeklyEvidenceReceipt } from "./weekly-player-evidence";

/** Pure assembly of already-loaded home context and injected, validated receipts.
 * No fetching, persistence, market execution or shared personalized cache. */
export function buildHomeWeeklyContext(
  home: CourtsideHomeData,
  receipts: readonly WeeklyEvidenceReceipt[],
  teamId: string | null = null,
  sources: PlayerGuideSources | null = null,
): { recap: HomeWeeklyRecap; guideSources: PlayerGuideSources | null } {
  // A loader-supplied completed week must never survive a failed context check.
  const guideSources = sources ? { ...sources, completedWeek: null } : null;
  const unavailable = (message: string) => ({
    recap: { status: "unavailable" as const, message }, guideSources,
  });
  if (!home.hub || home.hub.season.status !== "in_season") {
    return unavailable("No active completed-week recap is available for this season phase.");
  }
  // These matchups are already tagged by getCourtsideHomeData from NBA state.
  // Never select the newest receipt by date or infer a week from wall time.
  const weeks = new Set(home.directory.map(entry => entry.currentMatchup?.week));
  const currentWeek = [...weeks][0];
  if (weeks.size !== 1 || !Number.isSafeInteger(currentWeek) || currentWeek! < 1 || currentWeek! > 54) {
    return unavailable("The current scoring week is unavailable; a completed recap cannot be selected safely.");
  }
  if (currentWeek === 1) return unavailable("No completed previous fantasy week in this season.");
  const season = home.hub.season.seasonYear;
  const matching = receipts.filter(receipt => receipt.season === season && receipt.week === currentWeek! - 1);
  if (matching.length !== 1) return unavailable(`Verified Week ${currentWeek! - 1} evidence is not available yet.`);
  const receipt = matching[0];
  const now = Date.parse(home.checkedAt);
  const start = Date.parse(receipt.startsAt), end = Date.parse(receipt.endsAt), generated = Date.parse(receipt.generatedAt);
  if (![now, start, end, generated].every(Number.isFinite) || start >= end || end > now || generated > now) {
    return unavailable("The completed-week evidence is not available for this source check yet.");
  }
  const identities = new Map(home.hub.teams.map(team => [team.id, team]));
  const names = new Map(home.directory.flatMap(entry => entry.players.map(player => [player.id, player.fullName] as const)));
  const playerIdentity = (player: WeeklyEvidenceReceipt["teams"][number]["players"][number]): RecapPlayer => ({
    id: player.playerId, name: names.get(player.playerId) ?? `Player ${player.playerId}`,
    gamesPlayed: player.gamesPlayed, locked: player.locked, countedGameId: player.countedGameId,
  });
  const teams: WeeklyRecapTeam[] = receipt.teams.filter(team => identities.has(team.teamId)).map(team => {
    const identity = identities.get(team.teamId)!;
    // Preserve every counted starter, including explicit no-game/null rows.
    // Unknown teams' raw player evidence never reaches the surface.
    const players = [...team.players].sort((a, b) =>
      (b.countedPoints ?? -Infinity) - (a.countedPoints ?? -Infinity) || a.playerId.localeCompare(b.playerId));
    const breakdown: WeeklyRecapTeam["breakdown"] = team.status === "verified"
      ? { basis: "verified", players: players.map(player => ({ ...playerIdentity(player), fantasyPoints: player.countedPoints })) }
      : team.status === "estimated-foul-residual"
        ? { basis: "estimated", computedPoints: team.computedPoints, residual: team.residual,
            players: players.map(player => ({ ...playerIdentity(player), estimatedPoints: player.countedPoints })) }
        : { basis: "unavailable", players: [] };
    return { id: team.teamId, name: identity.name, avatar: identity.avatar, officialPoints: team.officialPoints, breakdown };
  }).sort((a, b) => b.officialPoints - a.officialPoints || a.id.localeCompare(b.id));
  if (teams.length === 0) return unavailable("No completed-week team totals match the current league.");
  const totalsComplete = teams.length === identities.size && receipt.teams.length === identities.size;
  const recap: HomeWeeklyRecap = {
    status: "available", season, week: receipt.week, startsAt: receipt.startsAt, endsAt: receipt.endsAt,
    generatedAt: receipt.generatedAt, source: receipt.source, totalsComplete, teams,
    studTeamIds: totalsComplete ? teams.filter(team => team.officialPoints === teams[0].officialPoints).map(team => team.id) : [],
    chudTeamIds: totalsComplete ? teams.filter(team => team.officialPoints === teams.at(-1)!.officialPoints).map(team => team.id) : [],
  };
  // The existing personal guide intersects weekly starters with today's roster
  // and excludes GP=0/null scores. Only the adapter's exact contract enters it.
  const member = teamId ? home.directory.find(entry => entry.identity.id === teamId) : null;
  const completedWeek = member && member.currentMatchup && [member.currentMatchup.home.id, member.currentMatchup.away.id].includes(teamId!)
    ? getPreviousCompletedPlayerWeek(receipts, { season, currentWeek: currentWeek!, teamId: teamId! }) : null;
  return { recap, guideSources: teamId ? {
    ...(guideSources ?? { checkedAt: home.checkedAt, formSeason: null, form: {}, injuries: {}, scheduledGames: null }),
    completedWeek,
  } : guideSources };
}
