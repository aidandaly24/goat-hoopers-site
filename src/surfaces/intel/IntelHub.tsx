/**
 * intel — "what do the numbers say?": the league's computed data tools.
 *
 * One coherent experience for the data pillar: matchup previews,
 * power rankings, playoff odds, and the record book live together
 * because they're all answers to the same question. Each tool is a
 * self-contained surface (see their own docs); this hub composes them
 * and gives the page its broadcast-desk framing.
 *
 * Contract:
 * - Receives the four datasets (each `| null` in the preseason).
 * - Never fetches. Never touches Sleeper. Domain objects in, JSX out.
 * - Documented composite surface (ARCHITECTURE.md §3): composes the
 *   public entrypoints of preview, playoffs, power-rankings, and
 *   records. Does not import their private internals.
 */
import type {
  MatchupPreview as MatchupPreviewT,
  PlayoffOdds as PlayoffOddsT,
  PowerRanking,
  RecordBook as RecordBookT,
} from "@/domain";
import { MatchupPreview } from "@/surfaces/preview/MatchupPreview";
import { PlayoffOdds } from "@/surfaces/playoffs/PlayoffOdds";
import { PowerRankings } from "@/surfaces/power-rankings/PowerRankings";
import { RecordBook } from "@/surfaces/records/RecordBook";
import styles from "./IntelHub.module.css";

export function IntelHub({
  previews,
  rankings,
  odds,
  book,
}: {
  previews: MatchupPreviewT[] | null;
  rankings: PowerRanking[] | null;
  odds: PlayoffOddsT[] | null;
  book: RecordBookT | null;
}) {
  return (
    <div className={styles.surface}>
      <header className={styles.hero}>
        <p className={styles.eyebrow}>The numbers</p>
        <h1 className={styles.title}>League Intel</h1>
        <p className={styles.blurb}>
          Computed from live league data — projections, power order, title
          odds, and the season&apos;s record lists. No vibes, just math.
        </p>
      </header>
      <div className={styles.grid}>
        <div className={styles.span}>
          <MatchupPreview previews={previews} />
        </div>
        <PowerRankings rankings={rankings} />
        <PlayoffOdds odds={odds} />
        <div className={styles.span}>
          <RecordBook book={book} />
        </div>
      </div>
    </div>
  );
}
