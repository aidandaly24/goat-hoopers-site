import type { FranchiseHistory } from "@/domain";
import styles from "./FranchiseSection.module.css";

/**
 * A franchise's Wikipedia-style history, embedded on its team page:
 * founded, titles, finals, all-time record, and the timeline.
 * The numbers are real (2025 baked + current season live).
 */
export function FranchiseSection({
  history: h,
}: {
  history: FranchiseHistory;
}) {
  return (
    <section className={styles.franchise} aria-label="Franchise history">
      <h2 className={styles.heading}>Franchise history</h2>
      <dl className={styles.facts}>
        <div className={styles.fact}>
          <dt>Founded</dt>
          <dd>{h.founded}</dd>
        </div>
        <div className={styles.fact}>
          <dt>Championships</dt>
          <dd className={styles.titles}>
            {h.championships === 0 ? (
              "—"
            ) : (
              <>
                <span className={styles.star}>★</span>{" "}
                {h.titleSeasons.join(", ")}
              </>
            )}
          </dd>
        </div>
        <div className={styles.fact}>
          <dt>Finals appearances</dt>
          <dd>{h.finalsAppearances}</dd>
        </div>
        <div className={styles.fact}>
          <dt>All-time record</dt>
          <dd>
            {h.allTime.wins}–{h.allTime.losses}
          </dd>
        </div>
      </dl>
      {h.discontinuity && (
        <p className={styles.discontinuity}>{h.discontinuity}</p>
      )}
      <ol className={styles.timeline}>
        {h.timeline.map((t) => (
          <li key={`${t.year}-${t.title}`} className={styles.entry}>
            <span className={styles.year}>{t.year}</span>
            <div>
              <p className={styles.entryTitle}>{t.title}</p>
              {t.description && (
                <p className={styles.entryText}>{t.description}</p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
