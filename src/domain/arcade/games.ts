/**
 * Game registry — every playable game on the site is declared here.
 *
 * Adding a game is a two-step: declare it in GAMES (status "coming-soon"),
 * then build its play surface and flip it to "live". The arcade pages
 * render from this registry, so a new game appears in the list, gets a
 * detail page, and gets a leaderboard with no further wiring.
 */
import type { Game } from "./types";

export const GAMES: Game[] = [
  {
    id: "free-throw",
    name: "Free Throw Shootout",
    description:
      "Ten shots, one minute, pure touch. Highest score takes the week.",
    icon: "🎯",
    status: "coming-soon",
    howToPlay:
      "You get 10 free throws against the clock. Each make is 1 point, " +
      "streaks earn bonus multipliers. Your best score each week counts — " +
      "the weekly winner takes home 10 FAAB.",
    launchNote:
      "Not playable yet — the shooting engine is still in the workshop. " +
      "The leaderboard opens the moment it ships.",
  },
  {
    id: "82-0-predictions",
    name: "82-0 Predictions",
    description:
      "Call the season before it happens. Champion, win totals, and more.",
    icon: "🔮",
    status: "coming-soon",
    howToPlay:
      "Lock in your season predictions before opening night: champion, " +
      "finalists, and regular-season win totals. Scoring runs all season — " +
      "the most prophetic manager takes home 10 FAAB.",
    launchNote:
      "Not playable yet — the prediction ballot opens before opening night, " +
      "so nobody gets an edge from watching the first tip.",
  },
];

/** Look up a game by its slug. Null for unknown ids (bad URLs). */
export function getGame(gameId: string): Game | null {
  return GAMES.find((g) => g.id === gameId) ?? null;
}

/** Weekly FAAB prize for winning any game. */
export const WEEKLY_FAAB_PRIZE = 10;

/**
 * Current league-week label, e.g. "2026-W41". ISO week of year — simple,
 * deterministic, and good enough to scope leaderboards until games want
 * real NBA weeks.
 */
export function currentWeekLabel(now: Date = new Date()): string {
  const d = new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()),
  );
  const day = (d.getUTCDay() + 6) % 7; // Monday = 0
  d.setUTCDate(d.getUTCDate() - day + 3); // Thursday of this week
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const week =
    1 +
    Math.round(
      (d.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000),
    );
  const year = d.getUTCFullYear();
  return `${year}-W${String(week).padStart(2, "0")}`;
}
