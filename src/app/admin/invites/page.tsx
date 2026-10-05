/**
 * /admin/invites — commissioner-only invite code management.
 *
 * The page itself is public; the actions behind it require
 * COMMISSIONER_KEY, verified server-side on every call. Teams come from
 * the league loader so codes map 1:1 to Sleeper rosters.
 */
import { getSeasonHubData } from "@/data/league";
import { AdminInvites } from "./AdminInvites";
import { ProvisionNotice } from "@/surfaces/arcade/ProvisionNotice";

export const dynamic = "force-dynamic";

export default async function AdminInvitesPage() {
  let teams: { id: string; name: string }[] = [];
  try {
    const data = await getSeasonHubData();
    teams = data.standings.map((s) => ({ id: s.team.id, name: s.team.name }));
  } catch {
    return <ProvisionNotice />;
  }
  if (teams.length === 0) return <ProvisionNotice />;
  return <AdminInvites teams={teams} />;
}
