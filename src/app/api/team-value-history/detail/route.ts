import { teamHistoryDetailResponse } from "@/data/team-value-history";

/** Read-only roster/move evidence for one UTC day (issue #217 v1 detail). */
export async function GET(request: Request) {
  return teamHistoryDetailResponse(new URL(request.url));
}
