/**
 * /login — team + password. If already logged in, skip to the arcade.
 * The team list comes from the league loader; if Sleeper is unreachable
 * the page still renders (login needs the team id, which the manager
 * can also get from their invite).
 */
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/actions";
import { getSeasonHubData } from "@/data/league";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  let user = null;
  try {
    user = await getCurrentUser();
  } catch {
    // Not provisioned yet — render anyway; the action explains.
  }
  if (user) redirect("/arcade");

  let teams: { id: string; name: string }[] = [];
  try {
    const data = await getSeasonHubData();
    teams = data.standings.map((s) => ({ id: s.team.id, name: s.team.name }));
  } catch {
    teams = [];
  }

  const { notice } = await searchParams;
  return (
    <LoginForm
      teams={teams}
      notice={notice === "team" ? "Log in to see your team." : null}
    />
  );
}
