/**
 * arcade — the league's game room.
 *
 * One coherent experience for "play games, win FAAB": the game list,
 * per-game detail with weekly leaderboards, and the reward ledger.
 *
 * Contract:
 * - Receives domain objects as props (game summaries, the current user).
 *   Never fetches. Never touches the database — it gets a GameStore's
 *   *output*, not the store itself.
 * - Game detail pages load their data in `src/app/arcade/` via the
 *   GameStore contract and hand the results here.
 * - Built from `@/ui` primitives and `--gh-*` tokens only.
 */
import type { GameHubSummary, SiteUser } from "@/domain/arcade";
import { GameCard } from "./GameCard";
import { SectionHeading } from "@/ui/SectionHeading";
import styles from "./ArcadeHub.module.css";

export function ArcadeHub({
  summaries,
  user,
  week,
}: {
  summaries: GameHubSummary[];
  user: SiteUser | null;
  /** League-week label, e.g. "2026-W41" — shown on the cards. */
  week: string;
}) {
  return (
    <div className={styles.surface}>
      <header className={styles.hero}>
        <p className={styles.eyebrow}>The Arcade</p>
        <h1 className={styles.title}>Play games. Win FAAB.</h1>
        <p className={styles.sub}>
          {user
            ? `Logged in as ${user.displayName}. Good luck.`
            : "Claim your team to play. Weekly winners take home 10 FAAB."}
        </p>
      </header>
      <section aria-label="Games">
        <SectionHeading
          eyebrow="Game room"
          title="This week's games"
          action={<span className={styles.week}>Week {week}</span>}
        />
        <div className={styles.grid}>
          {summaries.map((summary) => (
            <GameCard key={summary.game.id} summary={summary} user={user} />
          ))}
        </div>
      </section>
    </div>
  );
}
