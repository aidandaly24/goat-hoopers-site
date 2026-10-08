import Link from "next/link";
import type { ChampionBanner } from "@/domain";
import styles from "./ChampionBannerCard.module.css";

/**
 * One hanging championship banner: year, team, and the numbers that made
 * it permanent. Links to the franchise's team page.
 */
export function ChampionBannerCard({
  champion: c,
}: {
  champion: ChampionBanner;
}) {
  return (
    <Link href={`/teams/${c.teamId}`} className={styles.banner}>
      <span className={styles.inner}>
        <span className={styles.grommets} aria-hidden="true">
          <i />
          <i />
        </span>
        <span className={styles.year}>{c.season}</span>
        <span className={styles.champions}>Champions</span>
        <span className={styles.team}>{c.teamName}</span>
        <span className={styles.stats}>
          {c.regularSeason.wins}–{c.regularSeason.losses} regular season
          {" · "}
          {c.playoffRecord.wins}–{c.playoffRecord.losses} playoffs
        </span>
        <span className={styles.stats}>
          +{c.pointDifferential.toFixed(1)} differential
        </span>
        <span className={styles.final}>
          Final: {c.finalScore.champ.toFixed(1)}–
          {c.finalScore.runnerUp.toFixed(1)} over {c.runnerUpName}
        </span>
      </span>
    </Link>
  );
}
