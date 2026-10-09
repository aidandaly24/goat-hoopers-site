/**
 * Display-name search keys for the player board.
 *
 * The board is a substring search over display names. This module supplies one
 * tiny, pure, dependency-free normalization so an ordinary unaccented query
 * finds the intended accented name: `jokic` -> Nikola Jokic (accented),
 * `doncic` -> Luka Doncic (accented), `sengun` -> Alperen Sengun (accented),
 * `dayron` -> Day'Ron Sharpe.
 *
 * Narrow, deterministic policy - applied identically to query and candidate:
 * - Case-insensitive via `toLowerCase` (no locale).
 * - Accent-insensitive: NFKD decomposition, then strip combining diacritical
 *   marks (U+0300-U+036F). Composed and decomposed spellings share one key.
 *   Letters with no Unicode decomposition (e.g. U+0142, U+00F8, U+00DF) pass
 *   through unchanged: this is a display-search aid, not a transliteration
 *   service.
 * - Apostrophes are REMOVED: U+0027, U+2019, U+2018, U+0060 and U+02BC all
 *   delete, so Day'Ron (straight), Day'Ron (curly) and Dayron collide.
 * - Periods are REMOVED ("J.R." -> "jr"), not turned into spaces.
 * - Hyphens become word separators: U+002D, U+2010, U+2011, U+2012, U+2013,
 *   U+2014 and U+2212 map to a single space, so "Jean-Charles" matches both
 *   "jean charles" and "jean-charles".
 * - All whitespace runs collapse to one space; the key is trimmed.
 *
 * Blank or whitespace-only input normalizes to the empty key, preserving the
 * board's existing "no query means no name filtering" semantics. A nonblank
 * query whose normalized key is empty anyway (punctuation or combining marks
 * only) must NOT match every player - `playerNameMatches` guards that case
 * and returns false. Non-Latin input passes through untouched and never
 * throws.
 *
 * This key is for display-name search only. It must never be used as evidence
 * that two provider identities are the same person.
 */

/** Combining diacritical marks (U+0300-U+036F) stripped after NFKD. */
const COMBINING_MARKS = /[\u0300-\u036f]/g;

/** Apostrophe variants (U+0027 U+2019 U+2018 U+0060 U+02BC): removed. */
const APOSTROPHES = /[\u0027\u2019\u2018\u0060\u02bc]/g;

/** Hyphen/dash variants (U+002D U+2010 U+2011 U+2012 U+2013 U+2014 U+2212). */
const HYPHENS = /[\u002d\u2010\u2011\u2012\u2013\u2014\u2212]/g;

/**
 * Normalize one display name or search query to its deterministic search key.
 * Pure and total: never throws, returns "" for blank input.
 */
export function playerSearchKey(value: string): string {
  return value
    .normalize("NFKD")
    .replace(COMBINING_MARKS, "")
    .toLowerCase()
    .replace(APOSTROPHES, "")
    .replace(/\./g, "")
    .replace(HYPHENS, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Substring display-name match with the board's existing query semantics:
 * a blank/whitespace-only query matches everything (no name filtering), while
 * a nonblank query that normalizes to an empty key (punctuation or combining
 * marks only) matches nothing - never every player.
 */
export function playerNameMatches(candidateName: string, query: string): boolean {
  if (query.trim().length === 0) return true;
  const key = playerSearchKey(query);
  if (key.length === 0) return false;
  return playerSearchKey(candidateName).includes(key);
}
