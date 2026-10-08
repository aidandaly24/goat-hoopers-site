/**
 * /news — the League News Network.
 *
 * Thin page: loads via the data loader, hands the domain objects to the
 * surface. Articles are generated from real league events (see
 * `src/data/news.ts`) — honest fiction with clearly labeled rumors.
 */
import { getLeagueNews } from "@/data/league";
import { Newsroom } from "@/surfaces/news/Newsroom";

export const revalidate = 300; // refresh the feed every 5 minutes

export default async function NewsPage() {
  const articles = await getLeagueNews();
  return <Newsroom articles={articles} />;
}
