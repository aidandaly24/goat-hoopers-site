/**
 * /draft — the league's rookie draft board.
 *
 * Thin page: loads via the data loader, hands the domain object to the
 * surface.
 */
import { getDraftBoard } from "@/data/league";
import { DraftBoard } from "@/surfaces/draft/DraftBoard";

export default async function DraftPage() {
  const board = await getDraftBoard();
  return <DraftBoard picks={board.picks} teams={board.teams} />;
}
