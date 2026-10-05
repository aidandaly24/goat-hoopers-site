/**
 * /arcade — the game room. Public: anyone can browse games and
 * leaderboards; playing requires claiming a team.
 *
 * Thin page: loads the game registry (static) and the current user
 * (via the session cookie), hands both to the ArcadeHub surface.
 * If the database isn't provisioned yet, shows the honest notice
 * instead of crashing.
 */
import { GAMES } from "@/domain/arcade";
import { getCurrentUser } from "@/app/actions";
import { ArcadeHub } from "@/surfaces/arcade/ArcadeHub";
import { ProvisionNotice } from "@/surfaces/arcade/ProvisionNotice";

export const dynamic = "force-dynamic";

export default async function ArcadePage() {
  let user = null;
  try {
    user = await getCurrentUser();
  } catch {
    return <ProvisionNotice />;
  }
  return <ArcadeHub games={GAMES} user={user} />;
}
