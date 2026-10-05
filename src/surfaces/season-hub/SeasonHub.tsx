/**
 * season-hub — the league's home surface.
 *
 * One coherent experience for "what's happening in the league right now":
 * the masthead, standings, rookie draft board, and recent activity belong
 * together because they're all answers to that one question.
 *
 * Contract:
 * - Receives a fully-loaded `SeasonHubData` (see `src/data/league.ts`).
 * - Never fetches. Never touches Sleeper. Domain objects in, JSX out.
 * - Composes sections explicitly below — no registry, no magic.
 */
import type { SeasonHubData } from "@/data/league";
import { LeagueHero } from "./LeagueHero";
import { StandingsTable } from "./StandingsTable";
import { DraftBoard } from "./DraftBoard";
import { TransactionFeed } from "./TransactionFeed";
import styles from "./SeasonHub.module.css";

export function SeasonHub({ data }: { data: SeasonHubData }) {
  return (
    <div className={styles.surface}>
      <LeagueHero season={data.season} />
      <main className={styles.grid}>
        <section className={styles.standings}>
          <StandingsTable standings={data.standings} />
        </section>
        <div className={styles.side}>
          <TransactionFeed transactions={data.transactions} />
        </div>
        <section className={styles.draft}>
          <DraftBoard picks={data.draftPicks} />
        </section>
      </main>
    </div>
  );
}
