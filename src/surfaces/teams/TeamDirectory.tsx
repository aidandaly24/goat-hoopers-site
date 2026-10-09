import Link from "next/link";
import type { Team } from "@/domain";
import { SectionHeading } from "@/ui/SectionHeading";
import { TeamAvatar } from "@/ui/TeamAvatar";
import { teamColorVar } from "@/ui/teamColors";
import styles from "./TeamDirectory.module.css";

/**
 * teams — the league's team directory.
 *
 * One coherent experience for "who's in this league": every team's
 * identity row — avatar, full name, manager, record, points for. Each row
 * links to the team's public profile (/teams/[rosterId]).
 *
 * Contract:
 * - Receives `teams` as domain objects.
 * - Never fetches. Never touches Sleeper. Domain objects in, JSX out.
 */
export function TeamDirectory({ teams }: { teams: Team[] }) {
  return (
    <div className={styles.directory}>
      <SectionHeading eyebrow="The league" title="Teams" />
      {teams.length === 0 ? (
        <p className={styles.empty}>
          Couldn&apos;t load the teams right now. Try again in a bit.
        </p>
      ) : (
        <ul className={styles.list}>
          {teams.map((t) => (
            <li key={t.id}>
              <Link
                href={`/teams/${t.id}`}
                className={styles.teamRow}
                aria-label={`View ${t.name}`}
              >
                <TeamAvatar name={t.name} avatar={t.avatar} />
                <div className={styles.info}>
                  <span className={styles.name}>
                    <span
                      className={styles.teamColor}
                      style={{ backgroundColor: teamColorVar(t.id) }}
                      aria-hidden="true"
                    />
                    <span>{t.name}</span>
                  </span>
                  <span className={styles.manager}>{t.managerName}</span>
                </div>
                <dl className={styles.record}>
                  <div>
                    <dt><abbr title="Wins">W</abbr></dt>
                    <dd className="gh-num">{t.wins}</dd>
                  </div>
                  <div>
                    <dt><abbr title="Losses">L</abbr></dt>
                    <dd className="gh-num">{t.losses}</dd>
                  </div>
                  <div>
                    <dt>Points for</dt>
                    <dd className="gh-num">{(t.pointsFor / 100).toFixed(1)}</dd>
                  </div>
                </dl>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
