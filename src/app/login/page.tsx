/**
 * /login — team + password. If already logged in, skip to the arcade.
 * The team list comes from the league loader; if Sleeper is unreachable
 * the page still renders (login needs the team id, which the manager
 * can also get from their invite).
 */
import { redirect } from "next/navigation";
import { getCurrentUser, getLegacyCurrentUser } from "@/app/actions";
import { getSeasonHubData } from "@/data/league";
import { LoginForm } from "./LoginForm";
import { friendsAuthEnabled, friendsEnrollmentEnabled } from "@/data/friends-auth/config";
import { AccountForm } from "@/surfaces/accounts/AccountForm";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; legacy?: string }>;
}) {
  const { notice, legacy } = await searchParams;
  const enrollment = legacy === "1" && friendsEnrollmentEnabled();
  let user = null;
  try {
    user = enrollment ? await getLegacyCurrentUser() : await getCurrentUser();
  } catch {
    // Not provisioned yet — render anyway; the action explains.
  }
  if (user && !enrollment && notice !== "reverify" && !friendsEnrollmentEnabled()) redirect("/arcade");
  if (friendsAuthEnabled() && !enrollment) return <AccountForm mode="login" notice={notice === "verified" ? "Email verified. You can log in now." : notice === "team" ? "Log in to see your team." : notice === "reverify" ? "Sign in again to confirm account changes." : null} />;

  let teams: { id: string; name: string }[] = [];
  try {
    const data = await getSeasonHubData();
    teams = data.standings.map((s) => ({ id: s.team.id, name: s.team.name }));
  } catch {
    teams = [];
  }

  return (
    <LoginForm
      teams={teams}
      enrollment={enrollment}
      accountsAvailable={friendsEnrollmentEnabled()}
      initialTeamId={enrollment ? user?.teamId : undefined}
      notice={notice === "team" ? "Log in to see your team." : null}
    />
  );
}
