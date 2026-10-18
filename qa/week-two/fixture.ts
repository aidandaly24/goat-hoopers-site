import type { DraftRosterClient, NbaRoster, NbaSource, NbaTeam } from "@/domain/arcade/nba-rosters";

/** Explicitly synthetic, offline browser-test data. Never imported by the product. */
const source: NbaSource = { provider: "ESPN", sourceUrl: "https://www.espn.com/nba/", observedAt: "2026-10-18T12:00:00Z", sourceUpdatedAt: "2026-10-18T12:00:00Z", seasonLabel: "Synthetic QA fixture" };
const teams: NbaTeam[] = Array.from({ length: 30 }, (_, index) => ({ id: String(index + 1), city: `Fixture city ${index + 1}`, name: `Team ${index + 1}`, abbreviation: `T${index + 1}`, logo: null }));
const roster = (team: NbaTeam): NbaRoster => ({ team, source, players: Array.from({ length: 19 }, (_, index) => ({
  id: `${team.id}-${index + 1}`, firstName: index === 18 ? "Final" : "Fixture", lastName: index === 18 ? "Roster Player" : `Player ${index + 1}`,
  position: index % 3 === 0 ? "Forward" : index % 3 === 1 ? "Guard" : "Center", jersey: String(index), status: index === 18 ? "Two-way" : "Active", portrait: "/courtside/portraits/player-1362.png",
})) });
export const fixtureControl = { teamsCalls: 0, rosterCalls: [] as string[], failTeams: 0, failRoster: 0, delayMs: 30 };
export const fixtureClient: DraftRosterClient = {
  teams: async signal => {
    fixtureControl.teamsCalls += 1;
    await new Promise(resolve => setTimeout(resolve, fixtureControl.delayMs));
    if (signal?.aborted) throw new Error("aborted");
    if (fixtureControl.failTeams > 0) { fixtureControl.failTeams -= 1; throw new Error("fixture directory outage"); }
    return { teams, source };
  },
  roster: async (teamId, signal) => {
    fixtureControl.rosterCalls.push(teamId);
    await new Promise(resolve => setTimeout(resolve, fixtureControl.delayMs));
    if (signal?.aborted) throw new Error("aborted");
    if (fixtureControl.failRoster > 0) { fixtureControl.failRoster -= 1; throw new Error("fixture roster outage"); }
    const team = teams.find(team => team.id === teamId);
    if (!team) throw new Error("unknown fixture team");
    return roster(team);
  },
};
