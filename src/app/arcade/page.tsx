/**
 * /arcade — the game room. Public: anyone can browse games and
 * leaderboards; playing requires claiming a team.
 *
 * Thin page: loads the enriched game summaries (registry + weekly
 * leader + the viewer's best score) via getArcadeHubData and hands them
 * to the ArcadeHub surface. If the database isn't provisioned yet, shows
 * the honest notice instead of crashing.
 */
import { currentWeekLabel } from "@/domain/arcade";
import { getCurrentUser } from "@/app/actions";
import { getArcadeHubData, getGameStore } from "@/data/arcade";
import { ArcadeHub } from "@/surfaces/arcade/ArcadeHub";
import { ProvisionNotice } from "@/surfaces/arcade/ProvisionNotice";

export const dynamic = "force-dynamic";

export default async function ArcadePage() {
  const week = currentWeekLabel();
  let user = null;
  try {
    user = await getCurrentUser();
    const summaries = await getArcadeHubData(getGameStore(), week, user);
    return <ArcadeHub summaries={summaries} user={user} week={week} />;
  } catch {
    return <ProvisionNotice />;
  }
}
