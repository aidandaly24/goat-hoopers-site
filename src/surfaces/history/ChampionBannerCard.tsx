import Link from "next/link";
import type { ChampionBanner } from "@/domain";
import styles from "./ChampionBannerCard.module.css";

/**
 * One verified title with approved embroidered artwork when available.
 * Year, team and results stay selectable outside the image. The whole
 * entry links to the franchise; unmatched titles retain their text.
 */
export function ChampionBannerCard({
  champion: c,
}: {
  champion: ChampionBanner;
}) {
  // This v4 render belongs only to the confirmed 2025 Josh title. Its
  // editable config/template and provenance live in blender/embroidered-banners-v4/.
  const hasApprovedArtwork =
    c.season === "2025" &&
    c.teamId === "5" &&
    c.teamName === "Josh Diddy's Roster";

  return (
    <Link href={`/teams/${c.teamId}`} className={styles.banner}>
      {hasApprovedArtwork && (
        // Pre-sized approved WebP: no optimizer or WebGL needed. Adjacent
        // text supplies the complete accessible identity without duplication.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className={styles.artwork}
          src="/courtside/banner-roster-5-josh-diddys-roster.webp"
          width={512}
          height={896}
          alt=""
          loading="lazy"
          decoding="async"
        />
      )}
      <span className={styles.details}>
        <span className={styles.year}>
          <span className="gh-num">{c.season}</span> Champions
        </span>
        <span className={styles.team}>{c.teamName}</span>
        <span className={`${styles.stats} gh-num`}>
          {c.regularSeason.wins}–{c.regularSeason.losses} regular season
          {" · "}
          {c.playoffRecord.wins}–{c.playoffRecord.losses} playoffs
        </span>
        <span className={`${styles.stats} gh-num`}>
          +{c.pointDifferential.toFixed(1)} differential
        </span>
        <span className={`${styles.final} gh-num`}>
          Final: {c.finalScore.champ.toFixed(1)}–
          {c.finalScore.runnerUp.toFixed(1)} over {c.runnerUpName}
        </span>
      </span>
    </Link>
  );
}
