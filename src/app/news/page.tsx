/**
 * /news — the League News Network.
 *
 * Thin page: loads via the data loader, hands the domain objects to the
 * surface. Articles are real NBA headlines from the ESPN and CBS Sports
 * RSS feeds (see `src/data/real-news.ts`), refreshed every 10 minutes.
 */
import { getLeagueNews } from "@/data/league";
import { Newsroom } from "@/surfaces/news/Newsroom";

export const revalidate = 600; // refresh the feed every 10 minutes

export default async function NewsPage() {
  const articles = await getLeagueNews();
  return <Newsroom articles={articles} />;
}
