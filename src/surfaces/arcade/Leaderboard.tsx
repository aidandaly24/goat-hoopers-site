import type { LeaderboardEntry } from "@/domain/arcade";
import { Card } from "@/ui/Card";
import { SectionHeading } from "@/ui/SectionHeading";
import styles from "./Leaderboard.module.css";

/**
 * Weekly leaderboard. Full table on desktop, compact cards on mobile —
 * the same responsive pattern as the standings table.
 */
export function Leaderboard({
  entries,
  week,
  highlightTeamId,
}: {
  entries: LeaderboardEntry[];
  week: string;
  /** Sleeper team id of the logged-in user, to highlight their row. */
  highlightTeamId: string | null;
}) {
  return (
    <Card>
      <SectionHeading eyebrow={`Week ${week}`} title="Leaderboard" />
      {entries.length === 0 ? (
        <p className={styles.empty}>
          No scores yet this week. Be the first — the weekly winner takes
          home 10 FAAB.
        </p>
      ) : (
        <>
          {/* Desktop: table */}
          <div
            className={styles.table}
            role="table"
            aria-label="Weekly leaderboard"
          >
            <div className={styles.head} role="row">
              <span role="columnheader">#</span>
              <span role="columnheader">Manager</span>
              <span role="columnheader" className={styles.num}>
                Score
              </span>
            </div>
            {entries.map((e) => (
              <Row key={`${e.teamId}-${e.rank}`} entry={e} highlightTeamId={highlightTeamId} />
            ))}
          </div>
          {/* Mobile: cards */}
          <div className={styles.cards}>
            {entries.map((e) => (
              <div
                key={`${e.teamId}-${e.rank}`}
                className={`${styles.cardRow} ${
                  highlightTeamId && e.teamId === highlightTeamId
                    ? styles.you
                    : ""
                }`}
              >
                <span className={styles.rank}>{medal(e.rank)}</span>
                <span className={styles.name}>{e.displayName}</span>
                <span className={styles.num}>{e.score}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}

function Row({
  entry,
  highlightTeamId,
}: {
  entry: LeaderboardEntry;
  highlightTeamId: string | null;
}) {
  const you = highlightTeamId !== null && entry.teamId === highlightTeamId;
  return (
    <div role="row" className={`${styles.row} ${you ? styles.you : ""}`}>
      <span className={styles.rank}>{medal(entry.rank)}</span>
      <span className={styles.name}>
        {entry.displayName}
        {you && <span className={styles.youTag}>you</span>}
      </span>
      <span className={styles.num}>{entry.score}</span>
    </div>
  );
}

function medal(rank: number): string {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return String(rank);
}
