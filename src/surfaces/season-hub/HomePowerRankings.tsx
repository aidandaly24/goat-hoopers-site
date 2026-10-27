import { SectionHeading } from "@/ui/SectionHeading";
import styles from "./WeeklyLeagueRecap.module.css";

/** Muse owns the prospective legal-lineup producer (#190, comment 6433681384).
 * No retrospective standing, asset value or fabricated movement fills this gap. */
export function HomePowerRankings() {
  return (
    <section className={styles.power} data-home-power="unavailable" aria-label="Lineup Power">
      <SectionHeading eyebrow="Next matchup week" title="Lineup Power" />
      <p>Rankings unavailable. Verified projections for all 11 legal starting slots are not ready yet.</p>
      <p className={styles.note}>One counted game per slot for the next matchup week. Rank movement will appear when a comparable prior snapshot exists.</p>
    </section>
  );
}
