import Link from "next/link";
import type { HallOfFameEntry } from "@/domain";
import styles from "./HallOfFameList.module.css";

const CATEGORY_LABEL: Record<HallOfFameEntry["category"], string> = {
  manager: "Manager",
  trade: "Trade",
  moment: "Moment",
  record: "Record",
};

/**
 * Framed Hall of Fame inductions — portrait frames on the office wall.
 */
export function HallOfFameList({
  entries,
}: {
  entries: HallOfFameEntry[];
}) {
  return (
    <ul className={styles.frames}>
      {entries.map((e) => (
        <li key={e.id} className={styles.frame}>
          <div className={styles.plate}>
            <span className={styles.year}>{e.year}</span>
            <span className={styles.category}>
              {CATEGORY_LABEL[e.category]}
            </span>
          </div>
          <h3 className={styles.title}>{e.title}</h3>
          <p className={styles.description}>{e.description}</p>
        </li>
      ))}
    </ul>
  );
}

/** Full-page Hall of Fame: every induction, newest first. */
export function HallOfFamePage({
  entries,
}: {
  entries: HallOfFameEntry[];
}) {
  const sorted = [...entries].sort((a, b) => b.year.localeCompare(a.year));
  return (
    <div className={styles.page}>
      <header className={styles.pageHead}>
        <p className={styles.eyebrow}>Immortality, voted by history itself</p>
        <h1 className={styles.pageTitle}>Hall of Fame</h1>
        <p className={styles.lede}>
          Managers, trades, and moments that changed GOAT Hoopers forever.
          Real inductees only — the fiction stays in the newsroom.
        </p>
      </header>
      <HallOfFameList entries={sorted} />
      <p className={styles.back}>
        <Link href="/history">← Back to the trophy room</Link>
      </p>
    </div>
  );
}
