/**
 * real-news.ts — real NBA articles from real outlets.
 *
 * The League News Network used to generate fictional coverage; now it
 * pulls real headlines from the ESPN and CBS Sports NBA RSS feeds.
 * (The Athletic is paywalled and Bleacher Report's feed endpoint is
 * dead, so those two are out.)
 *
 * Rule-11 split, like the rest of src/data:
 * - PURE: parseRssItems, matchPlayersToArticle, buildRealNewsFeed,
 *   plus the small text helpers. Inputs in, domain objects out —
 *   trivially testable with fixtures, no network.
 * - Impure shell: fetchRssFeed takes its fetch as a parameter.
 */
import type {
  NewsOutlet,
  PlayerRef,
  RealNewsArticle,
  RealNewsSection,
} from "@/domain/news";

export const ESPN_RSS_URL = "https://www.espn.com/espn/rss/nba/news";
export const CBS_RSS_URL = "https://www.cbssports.com/rss/headlines/nba/";

export const OUTLETS: Record<"espn" | "cbs", NewsOutlet> = {
  espn: { id: "espn", name: "ESPN" },
  cbs: { id: "cbs", name: "CBS Sports" },
};

/** One parsed RSS <item>. */
export type RssItem = {
  title: string;
  link: string;
  /** Unix ms. 0 when the feed gave no parseable date. */
  pubDateMs: number;
  /** Raw description text (may contain HTML/entities). */
  description: string;
};

/** A feed item tagged with the outlet it came from. */
export type SourcedRssItem = {
  outlet: NewsOutlet;
  item: RssItem;
};

const CDATA_RE = /<!\[CDATA\[([\s\S]*?)\]\]>/g;

/** Decode the HTML entities RSS feeds actually emit. */
function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) =>
      String.fromCharCode(parseInt(n, 16))
    )
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

/** Strip tags, decode entities, collapse whitespace. */
export function plainText(s: string): string {
  return decodeEntities(s.replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

const TZ_OFFSETS: Record<string, string> = {
  EST: "-0500",
  EDT: "-0400",
  CST: "-0600",
  CDT: "-0500",
  MST: "-0700",
  MDT: "-0600",
  PST: "-0800",
  PDT: "-0700",
};

/**
 * Tolerant RSS pubDate parser. Date.parse handles numeric offsets and
 * GMT/UTC, but ESPN emits US abbreviations ("EST"), so those are
 * normalized to numeric offsets first. Unparseable → 0 (the article is
 * still real; it just sorts last).
 */
export function parseRssDate(s: string): number {
  const normalized = s
    .trim()
    .replace(/\b([A-Z]{3,4})$/, (abbr) => TZ_OFFSETS[abbr] ?? abbr);
  const t = Date.parse(normalized);
  return Number.isNaN(t) ? 0 : t;
}

function tagContent(block: string, tag: string): string | null {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  if (!m) return null;
  // CDATA first (content inside is literal), then entities.
  const inner = m[1].replace(CDATA_RE, "$1").trim();
  return inner.length > 0 ? inner : null;
}

/**
 * Parse an RSS 2.0 document into items. PURE — regex-based, no
 * DOMParser (there isn't one server-side). Only <item> blocks are
 * read, so channel-level title/link/description never leak in.
 * Items missing a title or link are skipped; a missing/unparseable
 * pubDate degrades to 0 rather than dropping a real headline.
 */
export function parseRssItems(xml: string): RssItem[] {
  const items: RssItem[] = [];
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) ?? [];
  for (const block of blocks) {
    const title = tagContent(block, "title");
    const link = tagContent(block, "link");
    if (!title || !link) continue;
    const pubDate = tagContent(block, "pubDate");
    const description = tagContent(block, "description") ?? "";
    items.push({
      title: decodeEntities(title),
      link: decodeEntities(link),
      pubDateMs: pubDate ? parseRssDate(pubDate) : 0,
      description,
    });
  }
  return items;
}

/**
 * Fetch + parse one RSS feed. Impure shell: the fetch implementation
 * is injected (rule 11). Throws on HTTP failure or empty body — the
 * caller (league.ts) treats a throw as "this feed is down".
 */
export async function fetchRssFeed(
  fetchFn: typeof fetch,
  url: string
): Promise<RssItem[]> {
  const res = await fetchFn(url, {
    headers: { "User-Agent": "GOATHoopers/1.0 (league news feed)" },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    throw new Error(`RSS ${res.status} on ${url}`);
  }
  const xml = await res.text();
  if (!xml.trim()) throw new Error(`RSS empty body on ${url}`);
  return parseRssItems(xml);
}

/** Normalize a name for matching: lowercase, periods dropped. */
function normName(s: string): string {
  return s.toLowerCase().replace(/\./g, "").replace(/\s+/g, " ").trim();
}

/**
 * Find which players an article mentions. PURE.
 *
 * Matches full names only (never single words — "Brown" must not match
 * "Mikel Brown Jr."), case-insensitively, on whole-word boundaries.
 * Suffixes ("Jr", "II", "III") are part of the name. Candidate names
 * are tried longest-first and matched spans are blanked out, so a
 * shorter name can't false-positive inside a longer one ("Mikel Brown"
 * never matches inside "Mikel Brown Jr.").
 *
 * @param text article title + description to search
 * @param players candidate {playerId, name} list
 */
export function matchPlayersToArticle(
  text: string,
  players: { playerId: string; name: string }[]
): PlayerRef[] {
  const haystack = normName(text);
  const candidates = players
    .filter((p) => p.name.trim().split(/\s+/).length >= 2)
    .map((p) => ({ ...p, norm: normName(p.name) }))
    .filter((p) => p.norm.length > 0)
    .sort((a, b) => b.norm.length - a.norm.length);

  const matched: PlayerRef[] = [];
  let remaining = ` ${haystack} `;
  for (const c of candidates) {
    const escaped = c.norm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`\\b${escaped}\\b`);
    if (re.test(remaining)) {
      matched.push({ playerId: c.playerId, name: c.name });
      // Blank matched spans so shorter names can't re-match inside them.
      remaining = remaining.replace(
        new RegExp(`\\b${escaped}\\b`, "g"),
        (m) => " ".repeat(m.length)
      );
    }
  }
  return matched;
}

/** FNV-1a hex — a stable, dependency-free id for an article URL. */
export function hashUrl(url: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < url.length; i++) {
    h ^= url.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

const SUMMARY_CHARS = 200;

/** Trim a summary to ~200 chars at a word boundary. */
function summarize(description: string): string {
  const text = plainText(description);
  if (text.length <= SUMMARY_CHARS) return text;
  const cut = text.slice(0, SUMMARY_CHARS);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : SUMMARY_CHARS)}…`;
}

export type NewsIdentityInput = {
  /** Every NBA player the feed may mention: id → full name. */
  players: { playerId: string; name: string }[];
  /** Sleeper player_ids on a league roster (starters + bench + taxi + IR). */
  rosteredPlayerIds: Set<string>;
  /** Sleeper player_ids drafted in the 2026 rookie draft. */
  rookiePlayerIds: Set<string>;
};

/**
 * Build the article feed from parsed RSS items. PURE.
 *
 * - Dedupes by URL (same story appearing twice in one feed).
 * - Sorts newest-first (undated items last, stable by id).
 * - Sections: every article is in "latest"; a mention of a rostered
 *   league player adds "league"; a mention of a 2026 drafted rookie
 *   adds "rookies"; a mention of an NBA player on no league roster
 *   adds "free-agency".
 */
export function buildRealNewsFeed(
  sources: SourcedRssItem[],
  identity: NewsIdentityInput
): RealNewsArticle[] {
  const seen = new Set<string>();
  const articles: RealNewsArticle[] = [];

  for (const { outlet, item } of sources) {
    if (seen.has(item.link)) continue;
    seen.add(item.link);

    const matched = matchPlayersToArticle(
      `${item.title} ${plainText(item.description)}`,
      identity.players
    );
    const sections: RealNewsSection[] = ["latest"];
    const matchedIds = new Set(matched.map((p) => p.playerId));
    const hasRostered = [...matchedIds].some((id) =>
      identity.rosteredPlayerIds.has(id)
    );
    const hasRookie = [...matchedIds].some((id) =>
      identity.rookiePlayerIds.has(id)
    );
    const hasFreeAgent = [...matchedIds].some(
      (id) =>
        !identity.rosteredPlayerIds.has(id) && !identity.rookiePlayerIds.has(id)
    );
    if (hasRostered) sections.push("league");
    if (hasRookie) sections.push("rookies");
    if (hasFreeAgent) sections.push("free-agency");

    articles.push({
      id: hashUrl(item.link),
      outlet,
      headline: item.title,
      url: item.link,
      publishedAt: item.pubDateMs,
      summary: summarize(item.description),
      players: matched,
      sections,
    });
  }

  articles.sort(
    (a, b) => b.publishedAt - a.publishedAt || a.id.localeCompare(b.id)
  );
  return articles;
}
