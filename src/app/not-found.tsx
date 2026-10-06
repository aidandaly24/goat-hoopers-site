/**
 * 404 — the "dead air" page.
 *
 * Someone typed a bad URL or followed a stale link. Keep the voice:
 * this is a broadcast that missed its slot, not a server error.
 */
import Link from "next/link";
import styles from "./error.module.css";

export default function NotFound() {
  return (
    <div className={styles.surface}>
      <div className={styles.card}>
        <p className={styles.eyebrow}>Dead air</p>
        <h1 className={styles.title}>Nothing on this channel</h1>
        <p className={styles.blurb}>
          That page doesn&apos;t exist — bad link, old bookmark, or a typo.
          The good stuff is one click away.
        </p>
        <div className={styles.actions}>
          <Link href="/" className={styles.retry}>
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
