/**
 * /teams/[rosterId] — one franchise's public profile.
 *
 * Thin page: loads the profile via the data layer, hands domain objects
 * to the teams surface. Unknown roster ids 404.
 */
import { notFound } from "next/navigation";
import { getTeamProfile, getTeams } from "@/data/league";
import { TeamProfile } from "@/surfaces/teams/TeamProfile";
import { SectionNav } from "@/ui/SectionNav";

export const revalidate = 300; // refresh league data every 5 minutes

export default async function TeamProfilePage({
  params,
}: {
  params: Promise<{ rosterId: string }>;
}) {
  const { rosterId } = await params;
  const [profile, teams] = await Promise.all([
    getTeamProfile(rosterId),
    getTeams(),
  ]);
  if (!profile) notFound();
  return (
    <>
      <SectionNav current="teams" />
      <TeamProfile profile={profile} teams={teams} />
    </>
  );
}
