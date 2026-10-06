/**
 * /player/[playerId] — one NBA player's league page.
 *
 * Thin page: loads the player detail via the data layer, hands domain
 * objects to the player surface. Unknown ids degrade to a stub player,
 * never a 404 — the directory doesn't know every id.
 */
import { notFound } from "next/navigation";
import { getPlayerDetail, getTeams } from "@/data/league";
import { PlayerPage } from "@/surfaces/player/PlayerPage";

export const revalidate = 300; // refresh league data every 5 minutes

export default async function PlayerDetailPage({
  params,
}: {
  params: Promise<{ playerId: string }>;
}) {
  const { playerId } = await params;
  const [detail, teams] = await Promise.all([
    getPlayerDetail(playerId),
    getTeams(),
  ]);
  if (!detail) notFound();
  return <PlayerPage detail={detail} teams={teams} />;
}
