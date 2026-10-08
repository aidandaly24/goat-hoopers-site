import Link from "next/link";
import type { LeagueHistory } from "@/domain";
import { ChampionBannerCard } from "./ChampionBannerCard";
import { HallOfFameList } from "./HallOfFameList";
import { RecordsGrid } from "./RecordsGrid";
import styles from "./TrophyRoom.module.css";

/**
 * history — the trophy room.
 *
 * The league's hall of history, styled like the old coach's office: dark
 * mahogany, brass, leather, a rationed crimson accent. Hub page composing
 * the champions' wall, the record plaques, and the hall of fame. Everything
 * rendered here is real history — no fabricated moments.
 */
export function TrophyRoom({ history }: { history: LeagueHistory }) {
  return (
    <div className={styles.room}>
      <header className={styles.hero}>
        <p className={styles.eyebrow}>Est. {history.founded}</p>
        <h1 className={styles.title}>The Trophy Room</h1>
        <p className={styles.subtitle}>
          Every champion. Every record. Every legend. Forever.
        </p>
      </header>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Champions&apos; Wall</h2>
          <Link href="/history/champions" className={styles.more}>
            View the wall →
          </Link>
        </div>
        <div className={styles.banners}>
          {history.champions.map((c) => (
            <ChampionBannerCard key={c.season} champion={c} />
          ))}
          <div className={styles.emptyBanner}>
            <span className={styles.emptyYear}>2026</span>
            <span className={styles.emptyText}>To be decided</span>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>League Records</h2>
        </div>
        <RecordsGrid records={history.records} />
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Hall of Fame</h2>
          <Link href="/history/hall-of-fame" className={styles.more}>
            All inductees →
          </Link>
        </div>
        <HallOfFameList entries={history.hallOfFame.slice(0, 3)} />
      </section>
    </div>
  );
}
