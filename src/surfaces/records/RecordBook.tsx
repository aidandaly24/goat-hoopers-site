import Link from "next/link";
import type { MatchupHighlight, RecordBook, TeamWeekScore } from "@/domain";
import { winner } from "@/domain";
import { Badge } from "@/ui/Badge";
import { Card } from "@/ui/Card";
import { SectionHeading } from "@/ui/SectionHeading";
import { TeamAvatar } from "@/ui/TeamAvatar";
import styles from "./RecordBook.module.css";

function fmtPts(p: number): string {
  return p.toFixed(1);
}

function GameLine({ h }: { h: MatchupHighlight }) {
  const w = winner(h.matchup);
  const loser =
    w?.id === h.matchup.home.id ? h.matchup.away : h.matchup.home;
  return (
    <li className={styles.game}>
      <TeamAvatar name={w?.name ?? "?"} avatar={w?.avatar ?? null} />
      <span className={styles.teams}>
        {w && (
          <Link href={`/teams/${w.id}`} className={styles.teamLink}>
            {w.name}
          </Link>
        )}
        <span className={styles.vs}> def. </span>
        <Link href={`/teams/${loser.id}`} className={styles.teamLink}>
          {loser.name}
        </Link>
      </span>
      <span className={styles.margin}>
        {h.margin.toFixed(1)}
      </span>
      <span className={styles.week}>Wk {h.matchup.week}</span>
    </li>
  );
}

function ScoreLine({ s }: { s: TeamWeekScore }) {
  return (
    <li className={styles.game}>
      <TeamAvatar name={s.team.name} avatar={s.team.avatar} />
      <Link href={`/teams/${s.team.id}`} className={styles.teamLink}>
        {s.team.name}
      </Link>
      <span className={styles.margin}>{fmtPts(s.points)}</span>
      <span className={styles.week}>Wk {s.week}</span>
    </li>
  );
}

/**
 * records — the league's all-time lists.
 *
 * Self-contained for homepage embedding: receives `book`
 * (RecordBook | null) and renders. Computed from every final in
 * src/data/analytics.ts. Null = no games yet, honest empty state.
 */
export function RecordBook({ book }: { book: RecordBook | null }) {
  return (
    <Card>
      <SectionHeading eyebrow="Immortality" title="Record Book" />
      {book === null ? (
        <p className={styles.empty}>
          No records yet — history starts when the first whistle blows.
        </p>
      ) : (
        <div className={styles.columns}>
          <section>
            <h3 className={styles.subhead}>
              <Badge tone="gold">Biggest blowouts</Badge>
            </h3>
            <ul className={styles.list}>
              {book.biggestBlowouts.map((h) => (
                <GameLine key={`${h.matchup.week}-${h.matchup.home.id}`} h={h} />
              ))}
            </ul>
          </section>
          <section>
            <h3 className={styles.subhead}>
              <Badge tone="gold">Closest games</Badge>
            </h3>
            <ul className={styles.list}>
              {book.closestGames.map((h) => (
                <GameLine key={`${h.matchup.week}-${h.matchup.home.id}`} h={h} />
              ))}
            </ul>
          </section>
          <section>
            <h3 className={styles.subhead}>
              <Badge tone="gold">Highest scores</Badge>
            </h3>
            <ul className={styles.list}>
              {book.highestScores.map((s) => (
                <ScoreLine key={`${s.week}-${s.team.id}`} s={s} />
              ))}
            </ul>
          </section>
        </div>
      )}
    </Card>
  );
}
