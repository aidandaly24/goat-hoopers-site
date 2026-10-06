import type { Season } from "@/domain";
import { formatSeasonStatus } from "@/domain";
import { Badge } from "@/ui/Badge";
import { PropViewer } from "@/three/PropViewer";
import styles from "./LeagueHero.module.css";

/** League masthead: name, season, team count, status. */
export function LeagueHero({ season }: { season: Season }) {
  return (
    <header className={styles.hero}>
      <div className={styles.ballStage} aria-hidden={false}>
        <PropViewer
          prop="basketball"
          ariaLabel="Basketball. Activate to bounce it."
        />
      </div>
      <div className={styles.eyebrow}>Sleeper NBA Dynasty · {season.totalTeams} teams</div>
      <h1 className={styles.title}>
        GOAT <span className={styles.gold}>HOOPERS</span>
      </h1>
      <p className={styles.sub}>
        {season.seasonYear} season · {formatSeasonStatus(season.status)}
      </p>
      <div className={styles.badges}>
        <Badge tone="gold">{season.seasonYear}</Badge>
        <Badge>{season.totalTeams} managers</Badge>
      </div>
    </header>
  );
}
