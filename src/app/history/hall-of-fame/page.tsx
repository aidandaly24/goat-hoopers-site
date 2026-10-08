/**
 * /history/hall-of-fame — the Hall of Fame.
 *
 * Real inductees only: managers, trades, and moments that changed the
 * league. New entries are curated in src/data/history-2025.ts.
 */
import { getLeagueHistory } from "@/data/history";
import { HallOfFamePage } from "@/surfaces/history/HallOfFameList";

export const revalidate = 3600;

export const metadata = {
  title: "Hall of Fame | GOAT Hoopers",
  description:
    "The managers, trades, and moments that changed GOAT Hoopers forever.",
};

export default async function HallOfFameRoute() {
  const history = await getLeagueHistory();
  return <HallOfFamePage entries={history.hallOfFame} />;
}
