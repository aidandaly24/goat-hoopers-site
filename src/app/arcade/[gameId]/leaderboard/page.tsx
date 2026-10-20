import { notFound } from "next/navigation";
import { getGame } from "@/domain/arcade/games";
import { CompetitionLeaderboard } from "@/surfaces/arcade/CompetitionLeaderboard";
export default async function GameLeaderboardPage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  if (!getGame(gameId)) notFound();
  return <CompetitionLeaderboard gameId={gameId} kind="all-time" titleLevel={1} />;
}
