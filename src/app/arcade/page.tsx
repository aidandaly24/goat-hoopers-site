/**
 * Public Arcade catalogue: implemented games are discoverable without accounts
 * or a provisioned store. Competition persistence stays on its own routes.
 */
import { getPlayableGames } from "@/domain/arcade";
import { ArcadeHub } from "@/surfaces/arcade/ArcadeHub";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Arcade | GOAT Hoopers",
  description:
    "Mini-games for GOAT Hoopers managers.",
  alternates: { canonical: "/arcade" },
};

export default function ArcadePage() {
  return <ArcadeHub games={getPlayableGames()} />;
}
