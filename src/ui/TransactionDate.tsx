/** Transaction instants use the league zone in every participating surface. */
const dateFormat = new Intl.DateTimeFormat("en-US", {
  month: "short", day: "numeric", year: "numeric",
  timeZone: "America/New_York", timeZoneName: "short",
});

export function TransactionDate({ timestamp }: { timestamp: number }) {
  const date = new Date(timestamp);
  if (!Number.isFinite(timestamp) || Number.isNaN(date.getTime())) return <span>Date unavailable</span>;
  const iso = date.toISOString();
  return <time dateTime={iso} title={iso}>{dateFormat.format(date)}</time>;
}
