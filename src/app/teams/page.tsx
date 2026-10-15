/**
 * /teams — the league's team directory.
 *
 * Thin page: loads the teams via the data layer, hands domain objects
 * to the teams surface.
 */
import { getTeams } from "@/data/league";
import { TeamDirectory } from "@/surfaces/teams/TeamDirectory";
import { SectionNav } from "@/ui/SectionNav";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Teams | GOAT Hoopers",
  description:
    "Every franchise in the GOAT Hoopers dynasty league: managers, records, and rosters.",
  alternates: { canonical: "/teams" },
};

export const revalidate = 300; // refresh league data every 5 minutes

export default async function TeamsPage() {
  const teams = await getTeams();
  return (
    <>
      <h1 className="visually-hidden">Teams</h1>
      <SectionNav current="teams" />
      <TeamDirectory teams={teams} />
    </>
  );
}
