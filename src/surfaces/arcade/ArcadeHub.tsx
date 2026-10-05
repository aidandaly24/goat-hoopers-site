/**
 * arcade — the league's game room.
 *
 * One coherent experience for "play games, win FAAB": the game list,
 * per-game detail with weekly leaderboards, and the reward ledger.
 *
 * Contract:
 * - Receives domain objects as props (games, leaderboard entries,
 *   rewards, the current user). Never fetches. Never touches the
 *   database — it gets a GameStore's *output*, not the store itself.
 * - Game detail pages load their data in `src/app/arcade/` via the
 *   GameStore contract and hand the results here.
 * - Built from `@/ui` primitives and `--gh-*` tokens only.
 */
import type { Game, SiteUser } from "@/domain/arcade";
import { GameCard } from "./GameCard";
import { SectionHeading } from "@/ui/SectionHeading";
import styles from "./ArcadeHub.module.css";

export function ArcadeHub({
  games,
  user,
}: {
  games: Game[];
  user: SiteUser | null;
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
        <SectionHeading eyebrow="Game room" title="This week's games" />
        <div className={styles.grid}>
          {games.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      </section>
    </div>
  );
}
