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
 * - Receives the four datasets (each `| null` when it has no data)
 *   plus `dataState`, the proven reason a dataset may be null —
 *   pre-tipoff, no week closed yet, or unavailable — which the
 *   empty-state copy must not confuse.
 * - Never fetches. Never touches Sleeper. Domain objects in, JSX out.
 * - Documented composite surface (ARCHITECTURE.md §3): composes the
 *   public entrypoints of preview, playoffs, power-rankings, and
 *   records. Does not import their private internals.
 */
import type {
  DataToolsState,
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
  championTeamId,
  dataState,
}: {
  previews: MatchupPreviewT[] | null;
  rankings: PowerRanking[] | null;
  odds: PlayoffOddsT[] | null;
  book: RecordBookT | null;
  /** Reigning champion's roster id — from reigningChampionRosterId (previous-season finish). */
  championTeamId?: string | null;
  /** From getDataToolsState(): the proven reason a tool may be null.
   * Threaded to every tool so no empty state claims a world the
   * loader did not prove. Omitted = "unavailable", the claim-free
   * default. */
  dataState?: DataToolsState;
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
          <MatchupPreview previews={previews} championTeamId={championTeamId} dataState={dataState} />
        </div>
        <PowerRankings rankings={rankings} championTeamId={championTeamId} dataState={dataState} />
        <PlayoffOdds odds={odds} championTeamId={championTeamId} dataState={dataState} />
        <div className={styles.span}>
          <RecordBook book={book} championTeamId={championTeamId} dataState={dataState} />
        </div>
      </div>
    </div>
  );
}
