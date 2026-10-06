/**
 * /intel — League Intel: the computed data hub.
 *
 * Thin page: loads the four data tools in parallel via the data layer
 * (every loader is null-safe and never throws), hands them to the intel
 * surface. In the preseason each tool renders its honest empty state.
 */
import {
  getMatchupPreviews,
  getPlayoffOdds,
  getPowerRankings,
  getRecordBook,
} from "@/data/league";
import { IntelHub } from "@/surfaces/intel/IntelHub";
import { SectionNav } from "@/ui/SectionNav";

export const revalidate = 300; // refresh league data every 5 minutes

export default async function IntelPage() {
  const [previews, rankings, odds, book] = await Promise.all([
    getMatchupPreviews(),
    getPowerRankings(),
    getPlayoffOdds(),
    getRecordBook(),
  ]);
  return (
    <>
      <SectionNav current="intel" />
      <IntelHub previews={previews} rankings={rankings} odds={odds} book={book} />
    </>
  );
}
