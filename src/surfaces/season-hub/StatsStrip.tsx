import type { ReactNode } from "react";
import Link from "next/link";
import type { LeagueStats, MatchupHighlight, Team } from "@/domain";
import { Card } from "@/ui/Card";
import { SectionHeading } from "@/ui/SectionHeading";
import styles from "./StatsStrip.module.css";

type StatCell = {
  key: string;
  label: string;
  value: string;
  detail: ReactNode;
};

function fmtScore(p: number): string {
  return p.toFixed(1);
}

/** One linked team name inside a stat detail line. */
function teamLink(team: Team) {
  return (
    <Link href={`/teams/${team.id}`} className={styles.detailLink}>
      {team.name}
    </Link>
  );
}

/** "Winner 142.5 – 98.2 Loser" — winner first, ties keep home/away order. */
function matchupLine(h: MatchupHighlight): ReactNode {
  const { matchup: m } = h;
  const hp = m.homePoints as number;
  const ap = m.awayPoints as number;
  const [w, wPts, l, lPts]: [Team, number, Team, number] =
    hp >= ap ? [m.home, hp, m.away, ap] : [m.away, ap, m.home, hp];
  return (
    <>
      {teamLink(w)} {fmtScore(wPts)} – {fmtScore(lPts)} {teamLink(l)}
    </>
  );
}

/**
 * League stats strip: points leaders, streaks, wire activity, and the
 * week's most extreme games. Every stat is nullable upstream — nulls are
 * skipped, and when nothing is live yet the strip shows one honest empty
 * state instead of fake zeros.
 */
export function StatsStrip({ stats }: { stats: LeagueStats }) {
  const cells: StatCell[] = [];

  if (stats.pointsForLeader) {
    cells.push({
      key: "pf",
      label: "Points leader",
      value: stats.pointsForLeader.displayValue,
      detail: teamLink(stats.pointsForLeader.team),
    });
  }
  if (stats.pointsAgainstLeader) {
    cells.push({
      key: "pa",
      label: "Most scored on",
      value: stats.pointsAgainstLeader.displayValue,
      detail: teamLink(stats.pointsAgainstLeader.team),
    });
  }
  if (stats.longestWinStreak) {
    cells.push({
      key: "streak",
      label: "Hottest team",
      value: `${stats.longestWinStreak.wins}W streak`,
      detail: teamLink(stats.longestWinStreak.team),
    });
  }
  if (stats.mostActiveManager) {
    const n = stats.mostActiveManager.transactionCount;
    cells.push({
      key: "active",
      label: "Busiest wire",
      value: `${n} move${n === 1 ? "" : "s"}`,
      detail: teamLink(stats.mostActiveManager.team),
    });
  }
  if (stats.biggestBlowout) {
    cells.push({
      key: "blowout",
      label: "Biggest blowout",
      value: `+${stats.biggestBlowout.margin.toFixed(1)}`,
      detail: matchupLine(stats.biggestBlowout),
    });
  }
  if (stats.closestGame) {
    cells.push({
      key: "close",
      label: "Closest game",
      value: stats.closestGame.margin.toFixed(1),
      detail: matchupLine(stats.closestGame),
    });
  }

  return (
    <Card>
      <SectionHeading eyebrow="By the numbers" title="League Stats" />
      {cells.length === 0 ? (
        <p className={styles.empty}>
          Team stats go live when the season tips off.
        </p>
      ) : (
        <div className={styles.grid}>
          {cells.map((c) => (
            <div key={c.key} className={styles.cell}>
              <div className={styles.label}>{c.label}</div>
              <div className={styles.value}>{c.value}</div>
              <div className={styles.detail}>{c.detail}</div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
