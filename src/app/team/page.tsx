/**
 * /team — "My Team". The logged-in manager's home: identity + record,
 * full roster, and arcade FAAB winnings. Redirects to /login when logged
 * out.
 *
 * Thin page: loads the user via the session, the roster via the Sleeper
 * data layer, and rewards via the GameStore, then hands domain objects
 * to the team surface.
 */
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Reward } from "@/domain/arcade";
import { getCurrentUser } from "@/app/actions";
import { getTeamDetail } from "@/data/league";
import { getGameStore } from "@/data/arcade";
import { TeamPage } from "@/surfaces/team/TeamPage";
import { friendsAuthEnabled } from "@/data/friends-auth/config";

export const dynamic = "force-dynamic";

export default async function TeamRoute() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?notice=team");

  const detail = await getTeamDetail(user.teamId);
  if (!detail) redirect("/");

  // Rewards are best-effort: a store hiccup shouldn't blank the page.
  let rewards: Reward[] = [];
  try {
    rewards = await getGameStore().getRewards(user.id);
  } catch {
    rewards = [];
  }
  const sorted = [...rewards].sort(
    (a, b) => Number(a.settled) - Number(b.settled),
  );

  return (
    <>
    {friendsAuthEnabled() && <p><Link href="/account">Account settings</Link></p>}
    <TeamPage
      team={detail.team}
      players={detail.players}
      rewards={sorted}
      displayName={user.displayName}
    />
    </>
  );
}
