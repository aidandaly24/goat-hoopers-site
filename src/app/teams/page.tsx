/**
 * /teams — the league's team directory.
 *
 * Thin page: loads the teams via the data layer, hands domain objects
 * to the teams surface.
 */
import { getTeams } from "@/data/league";
import { TeamDirectory } from "@/surfaces/teams/TeamDirectory";

export const revalidate = 300; // refresh league data every 5 minutes

export default async function TeamsPage() {
  const teams = await getTeams();
  return <TeamDirectory teams={teams} />;
}
