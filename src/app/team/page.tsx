/**
 * /team — "My Team". The logged-in manager's home: identity + record,
 * full roster, roster value in modeled FAAB dollars, and arcade FAAB
 * winnings. Redirects to /login when logged out, and to /teams when the
 * account has no resolvable team.
 *
 * Thin page: loads the user via the session, the roster via the Sleeper
 * data layer, the roster value via the market join, and rewards via the
 * GameStore, then hands domain objects to the team surface.
 *
 * getTeamRosterValue calls getStockMarketData(), which is React
 * cache()-shared with the root-layout ticker — the same request, so no
 * extra provider calls and no extra snapshot writes.
 */
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Reward } from "@/domain/arcade";
import { getCurrentUser } from "@/app/actions";
import { getTeamDetail, getTeamRosterValue } from "@/data/league";
import { getGameStore } from "@/data/arcade";
import { TeamPage } from "@/surfaces/team/TeamPage";
import { friendsAuthEnabled } from "@/data/friends-auth/config";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Team | GOAT Hoopers",
  description:
    "Your GOAT Hoopers roster, record, roster value, and arcade winnings.",
  alternates: { canonical: "/team" },
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function TeamRoute() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?notice=team&next=%2Fteam");

  const [detail, rosterValue] = await Promise.all([
    getTeamDetail(user.teamId),
    getTeamRosterValue(user.teamId),
  ]);
  // No roster resolved for this account: fall back to the team directory.
  if (!detail) redirect("/teams");

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
      rosterValue={rosterValue}
      rewards={sorted}
      displayName={user.displayName}
    />
    </>
  );
}
