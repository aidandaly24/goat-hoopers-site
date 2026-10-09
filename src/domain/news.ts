/**
 * League News Network — real NBA articles from real outlets.
 *
 * The feed is built from the ESPN and CBS Sports NBA RSS feeds
 * (see src/data/real-news.ts): real headlines, real links, real
 * timestamps. Articles are classified into sections by who they
 * mention: league-rostered players, 2026 drafted rookies, or everyone
 * else (free agency / the wider NBA).
 *
 * Surfaces render the outlet masthead, the headline as an external
 * link to the real article, a short summary, and chips for mentioned
 * players (each linking to /player/[playerId]).
 */

/** A real news outlet we pull articles from. */
export type NewsOutlet = {
  /** Stable id, e.g. "espn". */
  id: string;
  /** Masthead name, e.g. "ESPN". */
  name: string;
};

/** The news page's sections. Every article is always in "latest". */
export type RealNewsSection = "latest" | "league" | "rookies" | "free-agency";

export const NEWS_SECTIONS: { id: RealNewsSection; label: string }[] = [
  { id: "latest", label: "Latest" },
  { id: "league", label: "League Players" },
  { id: "rookies", label: "Rookie Wire" },
  { id: "free-agency", label: "Free Agency" },
];

export type RealNewsArticle = {
  /** Stable id: a hash of the article URL. */
  id: string;
  outlet: NewsOutlet;
  headline: string;
  /** Link to the real article. Always external. */
  url: string;
  /** Unix ms. */
  publishedAt: number;
  /** 1–2 sentence plain-text summary from the RSS description. */
  summary: string;
  /** Players mentioned — names render as links to /player/[playerId]. */
  players: PlayerRef[];
  /**
   * Sections this article appears in. Always includes "latest".
   * "league" = mentions a rostered league player, "rookies" = mentions
   * a 2026 drafted rookie, "free-agency" = mentions an NBA player on no
   * league roster.
   */
  sections: RealNewsSection[];
};

/** A player reference for cross-linking. */
export type PlayerRef = {
  playerId: string;
  name: string;
};
