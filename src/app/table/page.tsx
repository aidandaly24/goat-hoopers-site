/**
 * /table — The Table: the league leaderboard (issue #184).
 *
 * Thin page: loads the board via the data layer and the signed-in
 * viewer's team id via the same session lookup the root layout uses
 * (null when signed out or the account store is unavailable — the board
 * renders plainly either way), then hands both to the surface.
 */
import type { Metadata } from "next";
import { getCurrentUser } from "@/app/actions";
import { getTableData } from "@/data/league";
import { TheTable } from "@/surfaces/the-table/TheTable";

export const metadata: Metadata = {
  title: "The Table | GOAT Hoopers",
  description:
    "The GOAT Hoopers leaderboard: league standings, roster value, power movement, and arcade points.",
  alternates: { canonical: "/table" },
};

export const revalidate = 300; // league data refreshes on the 5-minute cache

export default async function TablePage() {
  let viewerTeamId: string | null = null;
  try {
    const user = await getCurrentUser();
    viewerTeamId = user?.teamId ?? null;
  } catch {
    viewerTeamId = null;
  }
  const data = await getTableData();
  return <TheTable data={data} viewerTeamId={viewerTeamId} />;
}
