/**
 * /news — the League News Network.
 *
 * Thin page: loads via the data loader, hands the domain objects to the
 * surface. Articles are real NBA headlines from the ESPN and CBS Sports
 * RSS feeds (see `src/data/real-news.ts`).
 *
 * Freshness, honestly: the root layout is force-dynamic (session cookie),
 * so this page renders per request and `revalidate` below is inert — the
 * effective freshness is the shared per-instance 5-minute TTL cache in
 * `src/data/league.ts` (createLeagueNewsCache), which also preserves
 * last-good across feed outages. Open pages do not auto-poll; a reload
 * fetches the current cached edition. (Deliberately no client polling —
 * the free tier is a hard budget.)
 */
import { getLeagueNewsEdition } from "@/data/league";
import { Newsroom } from "@/surfaces/news/Newsroom";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "News | GOAT Hoopers",
  description:
    "League headlines and NBA news for the GOAT Hoopers dynasty league.",
  alternates: { canonical: "/news" },
};

export const revalidate = 600;

export default async function NewsPage() {
  const edition = await getLeagueNewsEdition();
  return <Newsroom edition={edition} />;
}
