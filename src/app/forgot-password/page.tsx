import { redirect } from "next/navigation";
import { friendsEnrollmentEnabled } from "@/data/friends-auth/config";
import { AccountForm } from "@/surfaces/accounts/AccountForm";
import { getTeams } from "@/data/league";
export const dynamic = "force-dynamic";
export default async function ForgotPage({ searchParams }: { searchParams: Promise<{ team?: string; account?: string }> }) {
  if (!friendsEnrollmentEnabled()) redirect("/login");
  const query = await searchParams;
  if (query.account === "1") return <AccountForm mode="forgot" />;
  let teams: { id: string; name: string }[] = [];
  try { teams = (await getTeams()).map((team) => ({ id: team.id, name: team.name })); } catch { /* Keep email recovery available if league data is unavailable. */ }
  const initialTeamId = teams.some((team) => team.id === query.team) ? query.team : undefined;
  return <AccountForm mode="team-recovery" teams={teams} initialTeamId={initialTeamId} />;
}
