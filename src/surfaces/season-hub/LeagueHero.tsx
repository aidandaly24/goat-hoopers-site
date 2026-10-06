import type { Season } from "@/domain";
import { formatSeasonStatus } from "@/domain";
import { PropViewer } from "@/three/PropViewer";
import styles from "./LeagueHero.module.css";

/** League masthead — the paper's nameplate.
 *
 * Editorial, not centered-hero: dateline in mono, the name set HUGE
 * in condensed type, a serif-italic editorial line. The basketball
 * sits in the layout like a spot illustration, not a floating widget.
 */
export function LeagueHero({ season }: { season: Season }) {
  return (
    <header className={styles.masthead}>
      <div className={styles.dateline}>
        <span>Sleeper NBA Dynasty</span>
        <span aria-hidden="true">·</span>
        <span>{season.totalTeams} teams</span>
        <span aria-hidden="true">·</span>
        <span>
          {season.seasonYear} · {formatSeasonStatus(season.status)}
        </span>
      </div>
      <div className={styles.nameplate}>
        <h1 className={styles.title}>
          Goat
          <br />
          Hoopers
        </h1>
        <div className={styles.ballStage}>
          <PropViewer
            prop="basketball"
            ariaLabel="Basketball. Activate to bounce it."
          />
        </div>
      </div>
      <p className={styles.tagline}>
        The league&apos;s morning paper — standings, wire moves, and
        numbers with opinions.
      </p>
    </header>
  );
}
