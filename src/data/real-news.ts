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
import { playerSearchKey } from "@/domain/player-search";

export const ESPN_RSS_URL = "https://www.espn.com/espn/rss/nba/news";
export const CBS_RSS_URL = "https://www.cbssports.com/rss/headlines/nba/";

export const OUTLETS: Record<"espn" | "cbs", NewsOutlet> = {
  espn: { id: "espn", name: "ESPN" },
  cbs: { id: "cbs", name: "CBS Sports" },
};

/**
 * Source-host policy for article destinations.
 *
 * The two configured feeds are expected to link within their own outlet
 * domains (subdomains allowed): ESPN_RSS_URL serves espn.com links,
 * CBS_RSS_URL serves cbssports.com links. Destinations are validated in
 * two layers:
 * 1. parseRssItems ALWAYS requires an absolute http(s) URL — relative
 *    links and non-http(s) schemes (javascript:, data:, ftp:, ...) are
 *    rejected outright, because the parser previously accepted them.
 * 2. fetchRssFeed additionally enforces the per-outlet host allowlist
 *    below, so a compromised feed can't smuggle off-domain destinations
 *    into the feed.
 * Items failing either check are skipped, never fatal to the feed.
 */
export const OUTLET_HOSTS: Record<"espn" | "cbs", string[]> = {
  espn: ["espn.com"],
  cbs: ["cbssports.com"],
};

/**
 * Absolute http(s) URL, optionally restricted to the given hosts (apex
 * or subdomain). PURE. Relative links, malformed URLs, and non-http(s)
 * schemes (javascript:, data:, ftp:, ...) always fail; when allowedHosts
 * is provided the host must also match the outlet's allowlist.
 */
export function isAllowedArticleUrl(
  link: string,
  allowedHosts?: string[]
): boolean {
  let url: URL;
  try {
    url = new URL(link);
  } catch {
    return false; // relative or malformed — not an absolute URL
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return false;
  if (!allowedHosts) return true;
  const host = url.hostname.toLowerCase();
  return allowedHosts.some((h) => host === h || host.endsWith(`.${h}`));
}

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

/** U+FFFD — what the HTML spec decodes invalid code points to. */
const REPLACEMENT = "�";

/** Decode one numeric character reference; out-of-range → U+FFFD. */
function decodeCodePoint(n: number): string {
  if (!Number.isFinite(n) || n <= 0 || n > 0x10ffff) return REPLACEMENT;
  if (n >= 0xd800 && n <= 0xdfff) return REPLACEMENT; // lone surrogates
  // fromCodePoint (not fromCharCode) so astral-plane entities like
  // &#x1F600; decode to the real character instead of mojibake.
  return String.fromCodePoint(n);
}

/** Decode the HTML entities RSS feeds actually emit. Single pass — a
 *  decoded "&amp;" is never re-scanned, so "&amp;lt;" stays "&lt;". */
function decodeEntities(s: string): string {
  const NAMED: Record<string, string> = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
  };
  return s.replace(
    /&#(\d+);|&#x([0-9a-fA-F]+);|&(amp|lt|gt|quot|apos);/g,
    (m, dec: string | undefined, hex: string | undefined, named: string | undefined) => {
      if (dec !== undefined) return decodeCodePoint(Number(dec));
      if (hex !== undefined) return decodeCodePoint(parseInt(hex, 16));
      return NAMED[named as string];
    }
  );
}

/** A tag-shaped run: `<`, optional `/`, a letter (or `!` for comments). */
const TAG_RE = /<\/?[a-zA-Z!][^>]*>/g;

/**
 * Strip tags, decode entities, collapse whitespace.
 *
 * Entities are decoded BEFORE tag stripping, so an encoded tag
 * ("&lt;script&gt;") is stripped like a real tag instead of being
 * displayed as article text. Doubly-encoded text ("&amp;lt;") still
 * displays literally, as written. The tag pattern requires a letter
 * after `<`, so a bare comparison ("a < b > c") survives intact.
 */
export function plainText(s: string): string {
  return decodeEntities(s)
    .replace(TAG_RE, " ")
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
 * Items missing a title or link are skipped, as are items whose link
 * is not an absolute http(s) URL (relative links and javascript:/
 * data:/ftp: schemes are rejected — never rendered as destinations).
 * Pass allowedHosts to additionally enforce the outlet's source-host
 * policy. A missing/unparseable pubDate degrades to 0 rather than
 * dropping a real headline.
 */
export function parseRssItems(
  xml: string,
  allowedHosts?: string[]
): RssItem[] {
  const items: RssItem[] = [];
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) ?? [];
  for (const block of blocks) {
    const title = tagContent(block, "title");
    const link = tagContent(block, "link");
    if (!title || !link) continue;
    const decodedLink = decodeEntities(link);
    if (!isAllowedArticleUrl(decodedLink, allowedHosts)) continue;
    const pubDate = tagContent(block, "pubDate");
    const description = tagContent(block, "description") ?? "";
    items.push({
      title: plainText(title),
      link: decodedLink,
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
 * allowedHosts enforces the outlet's source-host policy (see above).
 */
export async function fetchRssFeed(
  fetchFn: typeof fetch,
  url: string,
  allowedHosts?: string[]
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
  return parseRssItems(xml, allowedHosts);
}

/** A possessive "'s" (straight or curly) — stripped before matching. */
const POSSESSIVE_RE = /['\u2019]\s*s\b/gi;

const LETTER_RE = /\p{L}/u;
function isLetter(ch: string): boolean {
  return ch !== "" && LETTER_RE.test(ch);
}

/**
 * Index of `needle` in `haystack` where the characters on both sides
 * are non-letters (Unicode-aware whole-word boundaries). -1 when no
 * such occurrence exists. ASCII `\b` is blind on non-decomposable
 * letters, so boundaries are checked explicitly instead.
 */
function findWholeWord(haystack: string, needle: string): number {
  let from = 0;
  for (;;) {
    const i = haystack.indexOf(needle, from);
    if (i < 0) return -1;
    const before = i === 0 ? "" : haystack[i - 1];
    const after =
      i + needle.length >= haystack.length ? "" : haystack[i + needle.length];
    if (!isLetter(before) && !isLetter(after)) return i;
    from = i + 1;
  }
}

/**
 * Find which players an article mentions. PURE.
 *
 * Both the article text and candidate names go through the shared
 * playerSearchKey (@/domain/player-search, delivered with #116), so an
 * unaccented "jokic" finds "Nikola Jokić" and "Day’Ron" (curly
 * apostrophe) finds "Day'Ron Sharpe" — the exact cases the old
 * ASCII matcher lost, including an accented name at the very end of a
 * headline (where `\b` failed on the trailing diacritic).
 *
 * Safeguards, retained from the original matcher:
 * - Full names only (never bare surnames — "Brown" alone matches nothing).
 * - Suffixes ("Jr", "II", "III") are part of the name; candidates are
 *   tried longest-first and matched spans are blanked, so "Mikel Brown"
 *   never steals "Mikel Brown Jr." (and a lone "Mikel Brown" directory
 *   entry still matches "Mikel Brown Jr." in text — Sleeper itself
 *   stores the name without the suffix, so that IS the same player).
 * - Possessive "'s" is stripped before matching ("Sharpe's big night").
 * - Ambiguity: one normalized name shared by two different playerIds
 *   yields NO chip — never a wrong chip.
 *
 * @param text article title + description to search
 * @param players candidate {playerId, name} list
 */
export function matchPlayersToArticle(
  text: string,
  players: { playerId: string; name: string }[]
): PlayerRef[] {
  const haystack = playerSearchKey(text.replace(POSSESSIVE_RE, ""));

  // Group by normalized name to detect ambiguity.
  const byNorm = new Map<string, { playerId: string; name: string }[]>();
  for (const p of players) {
    const trimmed = p.name.trim();
    if (trimmed.split(/\s+/).length < 2) continue; // full names only
    const norm = playerSearchKey(trimmed);
    if (!norm) continue;
    const list = byNorm.get(norm) ?? [];
    list.push({ playerId: p.playerId, name: trimmed });
    byNorm.set(norm, list);
  }
  const candidates = [...byNorm.entries()]
    .filter(([, list]) => new Set(list.map((p) => p.playerId)).size === 1)
    .map(([norm, list]) => ({
      norm,
      playerId: list[0].playerId,
      name: list[0].name,
    }))
    .sort((a, b) => b.norm.length - a.norm.length);

  const matched: PlayerRef[] = [];
  let remaining = haystack;
  for (const c of candidates) {
    const idx = findWholeWord(remaining, c.norm);
    if (idx >= 0) {
      matched.push({ playerId: c.playerId, name: c.name });
      // Blank the matched span so shorter names can't re-match inside it.
      remaining =
        remaining.slice(0, idx) +
        " ".repeat(c.norm.length) +
        remaining.slice(idx + c.norm.length);
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
  /**
   * False when the roster fetch failed. Player classification is then
   * UNKNOWN: no article may be labeled "league" or "free-agency" — a
   * failed roster fetch must never look like an empty real roster.
   */
  rostersKnown: boolean;
  /**
   * False when the draft-board fetch failed. "rookies" is then
   * unavailable rather than silently empty.
   */
  draftKnown: boolean;
};

/**
 * Build the article feed from parsed RSS items. PURE.
 *
 * - Dedupes by URL (same story appearing twice in one feed).
 * - Sorts newest-first (undated items last, stable by id).
 * - Sections: every article is in "latest". Classification beyond that
 *   requires the identity inputs to be KNOWN: without rosters nobody
 *   can be called a league player or a free agent (those sections stay
 *   unavailable, never invented from a failed fetch); without the draft
 *   board there is no Rookie Wire (unavailable, never silently empty).
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
    if (identity.rostersKnown) {
      if ([...matchedIds].some((id) => identity.rosteredPlayerIds.has(id))) {
        sections.push("league");
      }
      if ([...matchedIds].some((id) => !identity.rosteredPlayerIds.has(id))) {
        sections.push("free-agency");
      }
    }
    if (
      identity.draftKnown &&
      [...matchedIds].some((id) => identity.rookiePlayerIds.has(id))
    ) {
      sections.push("rookies");
    }

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
