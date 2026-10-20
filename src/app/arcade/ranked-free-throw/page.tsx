import type { Metadata } from "next";
import { headers } from "next/headers";
import { loadRankedAvailability } from "@/data/ranked-free-throw/runtime";
import { rankedId } from "@/domain/arcade/ranked-free-throw";
import { RankedFreeThrow } from "@/surfaces/arcade/RankedFreeThrow";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Ranked free throws | GOAT Hoopers", robots: { index: false, follow: false } };

export default async function RankedFreeThrowPage({ searchParams }: { searchParams: Promise<{ run?: string | string[] }> }) {
  const availability = await loadRankedAvailability(headers);
  const run = availability.status === "available" ? (await searchParams).run : undefined;
  return <RankedFreeThrow availability={availability} initialRunId={rankedId(run) ? run : undefined} />;
}
