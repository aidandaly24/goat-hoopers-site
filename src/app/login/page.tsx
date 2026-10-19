/**
 * /login — team or email login. Ordinary sign-in returns to home.
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
import { safeLoginDestination } from "@/domain/login-navigation";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; legacy?: string; next?: string | string[] }>;
}) {
  const { notice, legacy, next } = await searchParams;
  const returnTo = safeLoginDestination(next ?? (notice === "team" ? "/team" : "/"));
  const enrollment = legacy === "1" && friendsEnrollmentEnabled();
  let user = null;
  try {
    user = enrollment ? await getLegacyCurrentUser() : await getCurrentUser();
  } catch {
    // Not provisioned yet — render anyway; the action explains.
  }
  if (user && !enrollment && notice !== "reverify") redirect(returnTo);
  if (friendsAuthEnabled() && !enrollment) return <AccountForm mode="login" returnTo={returnTo} notice={notice === "verified" ? "Email verified. You can log in now." : notice === "team" ? "Log in to see your team." : notice === "reverify" ? "Sign in again to confirm account changes." : null} />;

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
      returnTo={returnTo}
      initialTeamId={enrollment ? user?.teamId : undefined}
      notice={notice === "team" ? "Log in to see your team." : null}
    />
  );
}
