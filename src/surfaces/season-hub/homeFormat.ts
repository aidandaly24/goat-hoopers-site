/**
 * Humanized stamps for the homepage ("Oct 6 · 1:02 PM"). The timezone is
 * pinned to America/New_York — the league's timezone — so server markup and
 * client hydration always agree, and no raw ISO string ever reaches the UI.
 */
const stampFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/New_York",
});

export function formatHomeStamp(value: string | number | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const ms = typeof value === "number" ? value : Date.parse(value);
  if (!Number.isFinite(ms)) return null;
  return stampFormat.format(new Date(ms)).replace(", ", " · ");
}
