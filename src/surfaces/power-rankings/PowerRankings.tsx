import Link from "next/link";
import type { PowerRanking } from "@/domain";
import { Card } from "@/ui/Card";
import { SectionHeading } from "@/ui/SectionHeading";
import { TeamAvatar } from "@/ui/TeamAvatar";
import styles from "./PowerRankings.module.css";

function Movement({ movement }: { movement: number }) {
  if (movement > 0)
    return (
      <span className={`${styles.move} ${styles.up}`} aria-label={`up ${movement}`}>
        ▲{movement}
      </span>
    );
  if (movement < 0)
    return (
      <span className={`${styles.move} ${styles.down}`} aria-label={`down ${Math.abs(movement)}`}>
        ▼{Math.abs(movement)}
      </span>
    );
  return (
    <span className={`${styles.move} ${styles.flat}`} aria-label="no movement">
      –
    </span>
  );
}

/**
 * power-rankings — the league's computed power order.
 *
 * Self-contained for homepage embedding: receives `rankings`
 * (PowerRanking[] | null) and renders. Formula lives in
 * src/domain/power.ts; the math in src/data/analytics.ts. Null =
 * preseason, rendered as an honest empty state, never fake rows.
 */
export function PowerRankings({
  rankings,
}: {
  /** From getPowerRankings(). Null before the season tips off. */
  rankings: PowerRanking[] | null;
}) {
  return (
    <Card>
      <SectionHeading eyebrow="The column" title="Power rankings" />
      {rankings === null || rankings.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>No order yet.</p>
          <p className={styles.emptyNote}>
            The column starts when the games do — power rankings drop after
            Week 1, with opinions.
          </p>
        </div>
      ) : (
        <ol className={styles.list}>
          {rankings.map((r) => (
            <li key={r.team.id} className={styles.row}>
              <span className={styles.rank}>{r.rank}</span>
              <Movement movement={r.movement} />
              <TeamAvatar name={r.team.name} avatar={r.team.avatar} />
              <Link href={`/teams/${r.team.id}`} className={styles.name}>
                {r.team.name}
              </Link>
              <span className={styles.record}>
                {r.team.wins}–{r.team.losses}
              </span>
              <span
                className={styles.bar}
                role="img"
                aria-label={`power score ${(r.score * 100).toFixed(0)}`}
              >
                <span
                  className={styles.fill}
                  style={{ width: `${Math.round(r.score * 100)}%` }}
                />
              </span>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
