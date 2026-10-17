import type { Metadata } from "next";
import { getWeekTwoDemo } from "@/data/week-two-demo";
import { WeekTwoDraft } from "@/surfaces/arcade/week-two/WeekTwoDraft";

export const metadata: Metadata = {
  title: "82–0 · Week 2 first look | GOAT Hoopers",
  description: "A local, unranked roster draft concept. Week 2 competition remains locked.",
  robots: { index: false, follow: false },
};

/** Isolated review route. No account, competition, score, reward or data-store access. */
export default function WeekTwoPreviewPage() {
  return <WeekTwoDraft demo={getWeekTwoDemo()} />;
}
