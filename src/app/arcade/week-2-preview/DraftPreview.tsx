"use client";

import { fetchNbaTeams, fetchNbaRoster } from "@/data/nba-rosters-client";
import type { DraftRosterClient } from "@/domain/arcade/nba-rosters";
import { WeekTwoDraft } from "@/surfaces/arcade/week-two/WeekTwoDraft";

const client: DraftRosterClient = {
  teams: signal => fetchNbaTeams(fetch, signal),
  roster: (teamId, signal) => fetchNbaRoster(teamId, fetch, signal),
};

/** Browser composition seam; no upstream data, credentials or game services in the surface. */
export function DraftPreview() { return <WeekTwoDraft client={client} />; }
