/**
 * Root loading state — the broadcast "tuning in" skeleton.
 *
 * Rendered by Next.js while any route's server components load. Skeleton
 * cards in the broadcast style (not a spinner): the page should feel
 * like it's coming on air, not stalled.
 */
import styles from "./loading.module.css";

export default function Loading() {
  return (
    <div className={styles.surface} aria-busy="true" aria-label="Loading">
      <div className={styles.hero}>
        <div className={`${styles.bar} ${styles.eyebrow}`} />
        <div className={`${styles.bar} ${styles.title}`} />
        <div className={`${styles.bar} ${styles.blurb}`} />
      </div>
      <div className={styles.grid}>
        <div className={styles.card} />
        <div className={styles.card} />
        <div className={styles.card} />
        <div className={styles.card} />
      </div>
      <p className={styles.caption}>Tuning in…</p>
    </div>
  );
}
