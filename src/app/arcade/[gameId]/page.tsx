/**
 * /arcade/[gameId] — one game's detail page: rules, weekly leaderboard,
 * prize note, and the viewer's reward ledger.
 *
 * Thin page: resolves the game from the registry, loads the week's
 * leaderboard and the user's rewards through the GameStore contract,
 * and hands domain objects to the GameDetail surface. Unknown game ids
 * 404. Unprovisioned database shows the notice.
 */
import { notFound } from "next/navigation";
import {
  currentWeekLabel,
  getGame,
  type LeaderboardEntry,
  type Reward,
  type SiteUser,
} from "@/domain/arcade";
import { getCurrentUser } from "@/app/actions";
import { getGameStore } from "@/data/arcade";
import { GameDetail } from "@/surfaces/arcade/GameDetail";
import { ProvisionNotice } from "@/surfaces/arcade/ProvisionNotice";

export const dynamic = "force-dynamic";

export default async function GamePage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = await params;
  const game = getGame(gameId);
  if (!game) notFound();

  const week = currentWeekLabel();
  let user: SiteUser | null = null;
  let entries: LeaderboardEntry[] = [];
  let rewards: Reward[] = [];
  try {
    const store = getGameStore();
    user = await getCurrentUser();
    const raw = await store.getLeaderboard(game.id, week);
    const currentUser = user;
    entries = currentUser
      ? raw.map((e) => ({
          ...e,
          isCurrentUser: e.teamId === currentUser.teamId,
        }))
      : raw;
    if (user) rewards = await store.getRewards(user.id);
  } catch {
    return <ProvisionNotice />;
  }

  return (
    <GameDetail
      game={game}
      week={week}
      entries={entries}
      rewards={rewards}
      user={user}
    />
  );
}
