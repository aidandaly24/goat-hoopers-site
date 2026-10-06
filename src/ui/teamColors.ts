/**
 * Team identity colors — the single mapping from Sleeper roster id to the
 * team's fixed color token (--gh-team-1 .. --gh-team-10 in tokens.css).
 *
 * Pure function, no imports: components call teamColorVar(team.id) and use
 * the returned `var(--gh-team-N)` reference in a style or CSS var. Colors
 * stay in tokens.css (rule 4); this module is only the roster-id lookup.
 * Unknown ids fall back to gold so nothing ever renders uncolored.
 */

const TEAM_COLOR_COUNT = 10;

export function teamColorVar(teamId: string | number): string {
  const n = Number(teamId);
  const slot =
    Number.isInteger(n) && n >= 1 && n <= TEAM_COLOR_COUNT ? n : 1;
  return `var(--gh-team-${slot})`;
}

/** All ten identity colors, in roster order — for legends and swatches. */
export function teamColorVars(): string[] {
  return Array.from(
    { length: TEAM_COLOR_COUNT },
    (_, i) => `var(--gh-team-${i + 1})`,
  );
}
