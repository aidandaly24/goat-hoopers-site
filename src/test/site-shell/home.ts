import type { CourtsideHomeData } from "@/data/league";

export const syntheticHome: CourtsideHomeData = {
  hub: null, directory: [], checkedAt: "2026-10-08T00:00:00Z", rosterNamesAvailable: false,
  edition: {
    id: "shell-synthetic", season: "2026", title: "Synthetic shell edition", dateLabel: "Synthetic fixture",
    startsAt: "2026-10-08T00:00:00Z", endsAt: "2026-10-15T00:00:00Z", status: "draft", publishedAt: null,
    game: { title: "Synthetic home anchor fixture", note: "Layout checks only", leagueWeek: null,
      teamIds: null, state: "unavailable", scores: null, context: "No real league result or editorial pick is implied.", selectionReason: "Synthetic layout fixture" },
    playerSpotlights: [{ role: "player-of-week", playerId: "shell-synthetic", name: "Synthetic player", position: "PG",
      teamId: "synthetic", periodLabel: "Synthetic period", headline: "Synthetic anchor target", opinion: "Layout-only fixture.",
      stats: [], statPeriod: "Synthetic", selectionReason: "Layout-only fixture", source: { label: "Local fixture", url: "/", checkedAt: "2026-10-08" } }],
    happenings: [], sources: [],
  },
};
