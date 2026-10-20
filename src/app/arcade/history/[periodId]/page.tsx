import { CompetitionLeaderboard } from "@/surfaces/arcade/CompetitionLeaderboard";
import { notFound } from "next/navigation";
export default async function WeeklyFinalPage({ params }: { params: Promise<{ periodId: string }> }) {
  const { periodId } = await params;
  if (!/^[a-z0-9-]{3,80}$/.test(periodId)) notFound();
  return <CompetitionLeaderboard kind="archive" periodId={periodId} titleLevel={1} />;
}
