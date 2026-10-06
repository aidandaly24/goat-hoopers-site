/**
 * season-hub — the league's home surface.
 *
 * One coherent experience for "what's happening in the league right now":
 * the masthead, the stats strip, standings, and recent activity belong
 * together because they're all answers to that one question.
 *
 * Contract:
 * - Receives a fully-loaded `SeasonHubData` (see `src/data/league.ts`).
 * - Never fetches. Never touches Sleeper. Domain objects in, JSX out.
 * - Composes sections explicitly below — no registry, no magic.
 */
import type { SeasonHubData } from "@/data/league";
import { LeagueHero } from "./LeagueHero";
import { StatsStrip } from "./StatsStrip";
import { StandingsTable } from "./StandingsTable";
import { TransactionFeed } from "./TransactionFeed";
import styles from "./SeasonHub.module.css";

export function SeasonHub({ data }: { data: SeasonHubData }) {
  return (
    <div className={styles.surface}>
      <LeagueHero season={data.season} />
      <div className={styles.strip}>
        <StatsStrip stats={data.stats} />
      </div>
      <main className={styles.grid}>
        <section className={styles.standings}>
          <StandingsTable standings={data.standings} />
        </section>
        <div className={styles.side}>
          <TransactionFeed transactions={data.transactions} />
        </div>
      </main>
    </div>
  );
}
