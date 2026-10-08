import Link from "next/link";
import type { ChampionBanner } from "@/domain";
import { ChampionBannerCard } from "./ChampionBannerCard";
import styles from "./TrophyRoom.module.css";

/**
 * The full Champions' Wall — every completed title the league has hung.
 */
export function ChampionsWall({
  champions,
}: {
  champions: ChampionBanner[];
}) {
  const sorted = [...champions].sort((a, b) =>
    b.season.localeCompare(a.season)
  );
  return (
    <div className={styles.room}>
      <header className={styles.hero}>
        <p className={styles.eyebrow}>Permanent. Non-negotiable.</p>
        <h1 className={styles.title}>Champions&apos; Wall</h1>
        <p className={styles.subtitle}>
          Win the league and you hang here forever.
        </p>
      </header>
      <div className={styles.banners}>
        {sorted.map((c) => (
          <ChampionBannerCard key={c.season} champion={c} />
        ))}
      </div>
      <p className={styles.back}>
        <Link href="/history" className={styles.more}>
          ← Back to the trophy room
        </Link>
      </p>
    </div>
  );
}
