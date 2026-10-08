/**
 * League News Network — NBA 2K MyLeague-style auto-generated coverage.
 *
 * Every major league event (trades, waiver splashes, rookie draft picks)
 * automatically becomes a set of articles, each voiced by a fictional
 * publication. The articles are honest fiction: real events, templated
 * prose, deterministic from the inputs — no AI, no invented facts beyond
 * the color commentary. Rumors and hot takes are clearly labeled as such.
 */

export type PublicationId =
  | "espn"
  | "athletic"
  | "bleacher"
  | "shams"
  | "bayless";

export type Publication = {
  id: PublicationId;
  /** Masthead name, e.g. "ESPN". */
  name: string;
  /** One-line voice description, e.g. "Serious analysis." */
  tagline: string;
};

export const PUBLICATIONS: Record<PublicationId, Publication> = {
  espn: {
    id: "espn",
    name: "ESPN",
    tagline: "Serious analysis.",
  },
  athletic: {
    id: "athletic",
    name: "The Athletic",
    tagline: "Extremely detailed nerd shit.",
  },
  bleacher: {
    id: "bleacher",
    name: "Bleacher Report",
    tagline: "DRAMATIC.",
  },
  shams: {
    id: "shams",
    name: "Shams",
    tagline: "Trade breaking.",
  },
  bayless: {
    id: "bayless",
    name: "Skip Bayless",
    tagline: "Completely insane opinions.",
  },
};

/** What kind of event (or fiction) an article covers. */
export type NewsKind = "trade" | "waiver" | "rookie" | "rumor" | "take";

/** The news page's sections. */
export type NewsSection = "latest" | "rookies" | "rumors" | "takes";

export const NEWS_SECTIONS: { id: NewsSection; label: string }[] = [
  { id: "latest", label: "Latest" },
  { id: "rookies", label: "Rookie Wire" },
  { id: "rumors", label: "Rumor Mill" },
  { id: "takes", label: "Hot Takes" },
];

export type NewsArticle = {
  /** Stable id: `${kind}-${eventKey}-${publication}`. */
  id: string;
  publication: PublicationId;
  kind: NewsKind;
  section: NewsSection;
  headline: string;
  /** 2–4 short paragraphs. */
  body: string[];
  /** Unix ms. */
  publishedAt: number;
  /** Player names involved — feeds the ticker and cross-links. */
  playerNames: string[];
};
