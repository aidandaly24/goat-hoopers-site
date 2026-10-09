import type { RealNewsSection } from "@/domain/news";
import { NEWS_SECTIONS } from "@/domain/news";

/**
 * newsUrls — the Newsroom's URL contract (pure helpers, no window).
 *
 * - `?section=<id>` selects a section (Latest / League Players /
 *   Rookie Wire / Free Agency). Missing or unknown values fall back to
 *   "latest". Section changes push history entries, so Back / Forward /
 *   refresh all work; the values are lowercase section ids.
 * - `?story=` / `?revision=` are legacy params from the retired
 *   fictional story reader (removed with the real-article feed). They no
 *   longer resolve to anything: the feed surfaces an honest "retired"
 *   notice with a path back to the current headlines instead of a
 *   broken reader or a silently ignored param. They are never
 *   interpreted as article selectors — real headlines link out to the
 *   outlet's site, never to an in-app reader.
 */

/** Section named by the URL search string; unknown/missing → "latest". */
export function parseSectionParam(search: string): RealNewsSection {
  const raw = new URLSearchParams(search).get("section");
  const found = NEWS_SECTIONS.find((s) => s.id === raw);
  return found ? found.id : "latest";
}

/** True when the URL carries retired fictional-reader params. */
export function hasLegacyStoryParams(search: string): boolean {
  const params = new URLSearchParams(search);
  return params.has("story") || params.has("revision");
}

/** Href selecting a section ("latest" is the bare /news). */
export function sectionHref(section: RealNewsSection): string {
  return section === "latest" ? "/news" : `/news?section=${section}`;
}

/**
 * Href with the legacy story params stripped, keeping everything else
 * (e.g. `?section=rookies&story=abc` → `/news?section=rookies`).
 * The intentional path back to the current feed.
 */
export function clearLegacyParamsHref(search: string): string {
  const params = new URLSearchParams(search);
  params.delete("story");
  params.delete("revision");
  const rest = params.toString();
  return rest ? `/news?${rest}` : "/news";
}
