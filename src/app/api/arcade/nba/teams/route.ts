import { getNbaTeamDirectory } from "@/data/nba-rosters";
import { nbaTeamDirectoryResponse } from "@/data/nba-rosters-http";

export const dynamic = "force-dynamic";
export async function GET() { return nbaTeamDirectoryResponse(getNbaTeamDirectory); }
