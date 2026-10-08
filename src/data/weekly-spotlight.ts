import type { WeeklyEdition } from "../domain/weekly-spotlight";

/**
 * Sample editorial editions for the concept. Facts are verified; copy is a
 * proposed draft, not an assertion that Muse published these editions.
 * Add a new immutable entry weekly. Retain older entries for the archive.
 */
export const weeklyEditions: WeeklyEdition[] = [
  {
    id: "2026-W41", season: "2026", title: "The next chapter", dateLabel: "Oct 5–11, 2026",
    startsAt: "2026-10-05T00:00:00Z", endsAt: "2026-10-12T00:00:00Z",
    status: "draft", publishedAt: null,
    game: {
      title: "Reaves Dropper gets the champ.",
      note: "Opening-week watch",
      leagueWeek: 1, teamIds: ["1", "5"], state: "upcoming", scores: null,
      context: "A 16–5 season meets the defending champion. Sleeper lists Reaves Dropper against Josh Diddy’s Roster in the opener. New season, same target on the champ’s back.",
      selectionReason: "Proposed spotlight: the defending champion faces last season’s 16–5 Reaves Dropper. This is a real Week 1 pairing; the season has not started.",
    },
    playerSpotlights: [
      {
        role: "player-of-week", playerId: "1658", name: "Nikola Jokić", position: "C", teamId: "5",
        periodLabel: "Last season’s standard",
        headline: "Somebody unplug this man.",
        opinion: "Three columns. One headache. The champ gets to call it good management.",
        stats: [{ value: "27.7", label: "PPG" }, { value: "12.9", label: "RPG" }, { value: "10.7", label: "APG" }],
        statPeriod: "2025–26 NBA averages",
        selectionReason: "Opening-edition sample opinion, using last season’s NBA averages. This is not a played 2026 fantasy-week award. Current roster ownership is verified; the pick is editorial, not a computed MVP ranking.",
        source: { label: "NBA.com · Jokić", url: "https://www.nba.com/player/203999/nikola-jokic", checkedAt: "2026-10-08" },
      },
      {
        role: "underperformer", playerId: "1511", name: "Joel Embiid", position: "C", teamId: "1",
        periodLabel: "Last-season lookback",
        headline: "We wanted more on the glass.",
        opinion: "Points: accepted. Rebounds: the group chat has questions.",
        stats: [{ value: "26.9", label: "PPG" }, { value: "7.7", label: "RPG" }, { value: "3.9", label: "APG" }],
        statPeriod: "2025–26 NBA averages",
        selectionReason: "A sample last-season criticism of rebounding output, not a verified worst-player ranking, injury judgment or current-week result. The opinion is subjective. The ownership link is the current roster, not a claim about who held him throughout 2025.",
        source: { label: "NBA.com · Embiid", url: "https://www.nba.com/stats/player/203954/traditional", checkedAt: "2026-10-08" },
      },
      {
        role: "one-to-watch", playerId: "4866", name: "AJ Dybantsa", position: "PF", teamId: "8",
        periodLabel: "Next week · preseason",
        headline: "No. 1 pick. No free pass.",
        opinion: "NeuralNets took him first. We’re watching minutes, not the mixtape.",
        stats: [{ value: "25.5", label: "PPG" }, { value: "6.8", label: "RPG" }, { value: "3.7", label: "APG" }],
        statPeriod: "2025–26 college · BYU",
        selectionReason: "The league’s actual No. 1 rookie selection. This is a proposed next-week preseason watch, not a playing-time guarantee or forecast. The shown averages are college data, not NBA or fantasy points.",
        source: { label: "NBA.com · draft profile", url: "https://www.nba.com/draft/2026/prospects/aj-dybantsa", checkedAt: "2026-10-08" },
      },
    ],
    happenings: [
      { title: "Lonzo hits the wire", text: "Lebron Theme Team dropped Lonzo Ball.", href: "https://goathoopers.com/player/1798", dateLabel: "Oct 7" },
      { title: "Two moves from NeuralNets", text: "Malik Monk and Nikola Jović were dropped from the roster.", href: "https://goathoopers.com/teams/8", dateLabel: "Oct 6" },
      { title: "Risacher released", text: "T Halibooty dropped Zaccharie Risacher.", href: "https://goathoopers.com/player/2737", dateLabel: "Oct 6" },
    ],
    sources: [
      { label: "Sleeper · opening-week pairings", url: "https://api.sleeper.app/v1/league/1387473752807190528/matchups/1", checkedAt: "2026-10-08" },
      { label: "Sleeper · NBA preseason state", url: "https://api.sleeper.app/v1/state/nba", checkedAt: "2026-10-08" },
      { label: "Sleeper · our rookie draft", url: "https://api.sleeper.app/v1/draft/1387473752819785728/picks", checkedAt: "2026-10-08" },
      { label: "Sleeper · league moves", url: "https://api.sleeper.app/v1/league/1387473752807190528/transactions/1", checkedAt: "2026-10-08" },
      { label: "Verified 2025 league archive", url: "https://goathoopers.com/history", checkedAt: "2026-10-08" },
    ],
  },
  {
    id: "2026-W40", season: "2026", title: "The title everybody’s chasing", dateLabel: "Sep 28–Oct 4, 2026",
    startsAt: "2026-09-28T00:00:00Z", endsAt: "2026-10-05T00:00:00Z",
    status: "draft", publishedAt: null,
    game: {
      title: "The first crown belongs to vannweinkauf.", note: "A look back · 2025 final", leagueWeek: null,
      teamIds: ["5", "7"], state: "final", scores: [326, 251.5],
      context: "Josh Diddy’s Roster finished 17–4, then beat papichooter 326.0–251.5 in the inaugural final. That is the bar for the next season.",
      selectionReason: "Historical recap of the verified 2025 final. This sample archive entry demonstrates browsing older weekly editions; it was not published by Muse.",
    },
    playerSpotlights: [],
    happenings: [{ title: "A rebuild to follow", text: "Roster 8 changed hands after a 1–20 season: QBs Gremlins became NeuralNets.", href: "https://goathoopers.com/teams/8", dateLabel: "Franchise history" }],
    sources: [{ label: "Verified 2025 league archive", url: "https://goathoopers.com/history", checkedAt: "2026-10-08" }],
  },
];

/** Dated entries stay source-editable; callers pass a clock for deterministic selection. */
export function selectWeeklyEdition(editions: readonly WeeklyEdition[], now: Date): WeeklyEdition | null {
  return [...editions]
    .filter((edition) => Date.parse(edition.startsAt) <= now.getTime())
    .sort((a, b) => Date.parse(b.startsAt) - Date.parse(a.startsAt))[0] ?? null;
}

export function getWeeklyEdition(id: string): WeeklyEdition | null {
  return weeklyEditions.find((edition) => edition.id === id) ?? null;
}

export function getWeeklyArchive(): WeeklyEdition[] {
  return [...weeklyEditions].sort((a, b) => Date.parse(b.startsAt) - Date.parse(a.startsAt));
}
