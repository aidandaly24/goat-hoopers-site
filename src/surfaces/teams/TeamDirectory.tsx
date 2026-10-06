import type { Team } from "@/domain";
import { Card } from "@/ui/Card";
import { SectionHeading } from "@/ui/SectionHeading";
import { TeamAvatar } from "@/ui/TeamAvatar";
import styles from "./TeamDirectory.module.css";

/**
 * teams — the league's team directory.
 *
 * One coherent experience for "who's in this league": every team's
 * identity card — avatar, name, manager, record, points for.
 *
 * Contract:
 * - Receives `teams` as domain objects.
 * - Never fetches. Never touches Sleeper. Domain objects in, JSX out.
 */
export function TeamDirectory({ teams }: { teams: Team[] }) {
  return (
    <Card>
      <SectionHeading eyebrow="The league" title="Teams" />
      {teams.length === 0 ? (
        <p className={styles.empty}>
          Couldn&apos;t load the teams right now. Try again in a bit.
        </p>
      ) : (
        <ul className={styles.grid}>
          {teams.map((t) => (
            <li key={t.id} className={styles.teamCard}>
              <TeamAvatar name={t.name} avatar={t.avatar} />
              <div className={styles.info}>
                <span className={styles.name}>{t.name}</span>
                <span className={styles.manager}>{t.managerName}</span>
              </div>
              <dl className={styles.record}>
                <div>
                  <dt>W</dt>
                  <dd>{t.wins}</dd>
                </div>
                <div>
                  <dt>L</dt>
                  <dd>{t.losses}</dd>
                </div>
                <div>
                  <dt>PF</dt>
                  <dd>{(t.pointsFor / 100).toFixed(1)}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
