/**
 * Home page — composes surfaces explicitly.
 *
 * Pages are thin: load data via `src/data` loaders, hand domain objects to
 * surfaces. If this page grows a second surface, it gets composed here in the
 * open, not registered anywhere.
 */
import { getSeasonHubData } from "@/data/league";
import { SeasonHub } from "@/surfaces/season-hub/SeasonHub";

export const revalidate = 300; // refresh league data every 5 minutes

export default async function Home() {
  const data = await getSeasonHubData();
  return <SeasonHub data={data} />;
}
