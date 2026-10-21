/**
 * /intel — League Intel: the computed data hub.
 *
 * Thin page: loads the four data tools in parallel via the data layer
 * (every loader is null-safe and never throws), hands them to the intel
 * surface. Each tool renders its honest empty state when it has no
 * completed-week evidence — the page also loads `seasonStarted` so the
 * empty states can tell "not tipped off yet" apart from "underway, no
 * week closed yet" (issue #224 follow-through).
 */
import {
  getMatchupPreviews,
  getPlayoffOdds,
  getPowerRankings,
  getRecordBook,
  getSeasonStarted,
} from "@/data/league";
import { IntelHub } from "@/surfaces/intel/IntelHub";
import { reigningChampionRosterId } from "@/data/history-2025";
import { SectionNav } from "@/ui/SectionNav";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "League Intel | GOAT Hoopers",
  description:
    "Power rankings, playoff odds, records, and matchup previews for GOAT Hoopers.",
  alternates: { canonical: "/intel" },
};

export const revalidate = 300; // refresh league data every 5 minutes

export default async function IntelPage() {
  const [previews, rankings, odds, book, seasonStarted] = await Promise.all([
    getMatchupPreviews(),
    getPowerRankings(),
    getPlayoffOdds(),
    getRecordBook(),
    getSeasonStarted(),
  ]);
  return (
    <>
      <SectionNav current="intel" />
      <IntelHub previews={previews} rankings={rankings} odds={odds} book={book} championTeamId={reigningChampionRosterId()} seasonStarted={seasonStarted} />
    </>
  );
}
