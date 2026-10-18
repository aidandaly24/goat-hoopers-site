import type { Metadata } from "next";
import { DraftPreview } from "./DraftPreview";

export const metadata: Metadata = {
  title: "82–0 · Week 2 first look | GOAT Hoopers",
  description: "A local, unranked roster draft concept. Week 2 competition remains locked.",
  robots: { index: false, follow: false },
};

/** Public unranked preview. Read-only roster APIs; no account, score or reward writes. */
export default function WeekTwoPreviewPage() {
  return <DraftPreview />;
}
