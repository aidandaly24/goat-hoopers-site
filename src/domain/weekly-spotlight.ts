/** A source-controlled weekly edition curated by Muse for the league homepage. */
export type WeeklyEdition = {
  /** Unique, immutable archive key; these are editorial weeks, not score periods. */
  id: string;
  season: string;
  title: string;
  dateLabel: string;
  startsAt: string;
  endsAt: string;
  /** Concept editions stay drafts and must not imply prior Muse publication. */
  status: "draft" | "published";
  publishedAt: string | null;
  game: {
    title: string;
    note: string;
    /** The season the game itself belongs to, when it differs from the
     * edition's (editorial) season — e.g. a look-back edition published
     * in 2026 whose game is the 2025 final. Labels about the game (the
     * historical-final badge, the final-score caption) name this
     * season, never the edition's. Absent = the edition's season. */
    season?: string;
    leagueWeek: number | null;
    teamIds: [string, string] | null;
    state: "upcoming" | "final" | "unavailable";
    scores: [number, number] | null;
    context: string;
    selectionReason: string;
  };
  /** Three editorial roles; period labels keep preseason lookbacks honest. */
  playerSpotlights: {
    role: "player-of-week" | "underperformer" | "one-to-watch";
    playerId: string;
    name: string;
    position: string;
    teamId: string;
    periodLabel: string;
    headline: string;
    opinion: string;
    stats: { value: string; label: string }[];
    statPeriod: string;
    selectionReason: string;
    source: { label: string; url: string; checkedAt: string };
  }[];
  happenings: {
    title: string;
    text: string;
    href: string;
    dateLabel: string;
  }[];
  sources: { label: string; url: string; checkedAt: string }[];
};
