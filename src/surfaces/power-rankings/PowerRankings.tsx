import Link from "next/link";
import type { DataToolsState, PowerRanking } from "@/domain";
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
 * no data, rendered as an honest empty state naming the proven
 * reason (`dataState`), never fake rows.
 */
export function PowerRankings({
  rankings,
  championTeamId,
  dataState,
}: {
  /** From getPowerRankings(). Null when it has no data — before
   * tip-off, before any week closes, or when its feed failed. */
  rankings: PowerRanking[] | null;
  /** Reigning champion's roster id — from reigningChampionRosterId (previous-season finish). */
  championTeamId?: string | null;
  /** From getDataToolsState(): the PROVEN reason rankings may be
   * null. The empty state describes only that world; omitted =
   * "unavailable", the claim-free default. */
  dataState?: DataToolsState;
}) {
  return (
    <Card>
      <SectionHeading eyebrow="The numbers" title="Power Rankings" />
      {rankings === null || rankings.length === 0 ? (
        <p className={styles.empty}>
          {dataState === "pre-tipoff"
            ? "Rankings drop when the season tips off — no games, no order."
            : dataState === "no-closed-week"
              ? "No order yet — rankings come from completed finals, and no week has closed yet. Live scores are not finals."
              : "Rankings are unavailable right now — the required data is unavailable, and an invented order is worse than none."}
        </p>
      ) : (
        <ol className={styles.list}>
          {rankings.map((r) => (
            <li key={r.team.id} className={styles.row}>
              <span className={styles.rank}>{r.rank}</span>
              <Movement movement={r.movement} />
              <TeamAvatar name={r.team.name} avatar={r.team.avatar} isChampion={r.team.id === championTeamId} />
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
