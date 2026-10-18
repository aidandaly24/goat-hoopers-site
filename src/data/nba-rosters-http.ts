import type { NbaRoster, NbaTeamDirectory } from "@/domain/arcade/nba-rosters";
import { isNbaTeamId } from "./nba-rosters-decode";

// The persistent data cache owns freshness. Avoid a second CDN lifetime hiding its dates.
const headers = { "Cache-Control": "no-store" };
export async function nbaTeamDirectoryResponse(load: () => Promise<NbaTeamDirectory>): Promise<Response> {
  try { return Response.json(await load(), { headers }); }
  catch { return Response.json({ error: "NBA team directory is unavailable. Try again." }, { status: 503, headers }); }
}
export async function nbaTeamRosterResponse(teamId: string, load: (id: string) => Promise<NbaRoster>): Promise<Response> {
  if (!isNbaTeamId(teamId)) return Response.json({ error: "Unknown NBA team" }, { status: 400, headers });
  try { return Response.json(await load(teamId), { headers }); }
  catch { return Response.json({ error: "NBA roster is unavailable. Try again." }, { status: 503, headers }); }
}
