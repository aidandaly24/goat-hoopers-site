import Link from "next/link";
import type { Standing } from "@/domain";
import { Card } from "@/ui/Card";
import { SectionHeading } from "@/ui/SectionHeading";
import { TeamAvatar } from "@/ui/TeamAvatar";
import styles from "./StandingsTable.module.css";

function fmtPoints(p: number): string {
  return (p / 100).toFixed(1);
}

/** League table, ranked. Handles the preseason all-zero state naturally. */
export function StandingsTable({ standings }: { standings: Standing[] }) {
  return (
    <Card>
      <SectionHeading eyebrow="League table" title="Standings" />
      <div className={styles.table} role="table" aria-label="League standings">
        <div className={styles.head} role="row">
          <span role="columnheader">#</span>
          <span role="columnheader">Team</span>
          <span role="columnheader" className={styles.num}>W</span>
          <span role="columnheader" className={styles.num}>L</span>
          <span role="columnheader" className={styles.num}>PF</span>
        </div>
        {standings.map((s) => (
          <Link
            key={s.team.id}
            href={`/teams/${s.team.id}`}
            className={styles.row}
            role="row"
            aria-label={`View ${s.team.name}`}
          >
            <span className={styles.rank}>{s.rank}</span>
            <span className={styles.team}>
              <TeamAvatar name={s.team.name} avatar={s.team.avatar} />
              <span>
                <span className={styles.name}>{s.team.name}</span>
                <span className={styles.manager}>{s.team.managerName}</span>
              </span>
            </span>
            <span className={`${styles.num} ${styles.w}`} data-label="W">{s.wins}</span>
            <span className={`${styles.num} ${styles.l}`} data-label="L">{s.losses}</span>
            <span className={`${styles.num} ${styles.pf}`} data-label="PF">{fmtPoints(s.team.pointsFor)}</span>
          </Link>
        ))}
      </div>
    </Card>
  );
}
