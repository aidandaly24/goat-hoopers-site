/**
 * /draft — the league's rookie draft board.
 *
 * Thin page: loads the completed draft via the data layer, hands domain
 * objects to the draft surface.
 */
import { getDraftBoard } from "@/data/league";
import { DraftBoard } from "@/surfaces/draft/DraftBoard";
import { SectionNav } from "@/ui/SectionNav";

export const revalidate = 300; // refresh league data every 5 minutes

export default async function DraftPage() {
  const { picks, teams } = await getDraftBoard();
  return (
    <>
      <SectionNav current="draft" />
      <DraftBoard picks={picks} teams={teams} />
    </>
  );
}
