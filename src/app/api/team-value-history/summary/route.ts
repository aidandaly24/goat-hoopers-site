import { teamHistorySummaryResponse } from "@/data/team-value-history";

/** Read-only daily summary points for one team and range (issue #217 v1). */
export async function GET(request: Request) {
  return teamHistorySummaryResponse(new URL(request.url));
}
