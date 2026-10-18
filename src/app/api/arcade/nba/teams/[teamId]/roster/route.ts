import { getNbaTeamRoster } from "@/data/nba-rosters";
import { nbaTeamRosterResponse } from "@/data/nba-rosters-http";

export async function GET(_request: Request, { params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  return nbaTeamRosterResponse(teamId, getNbaTeamRoster);
}
