/**
 * Public Arcade catalogue: implemented games are discoverable without accounts
 * or a provisioned store. Competition persistence stays on its own routes.
 */
import { getPlayableGames } from "@/domain/arcade";
import { ArcadeHub } from "@/surfaces/arcade/ArcadeHub";

export default function ArcadePage() {
  return <ArcadeHub games={getPlayableGames()} />;
}
