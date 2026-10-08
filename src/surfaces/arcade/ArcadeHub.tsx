/**
 * Public game hub. Receives implemented registry entries and renders real
 * previews plus direct play links. No account, leaderboard or store dependency.
 */
import type { PlayableGame } from "@/domain/arcade";
import { GameCard } from "./GameCard";
import styles from "./ArcadeHub.module.css";

export function ArcadeHub({ games }: { games: readonly PlayableGame[] }) {
  return (
    <main className={`gh-arcade-canvas ${styles.surface}`} data-arcade-page>
      <div className={styles.inner}>
        <header className={styles.hero}>
          <p className={styles.eyebrow}>GOAT Hoopers · Game room</p>
          <h1 className={styles.title}>The Arcade</h1>
          <p className={styles.sub}>The games you can play right now.</p>
        </header>
        <section className={styles.games} aria-label="Available games">
          {games.map(game => <GameCard key={game.id} game={game} />)}
          {games.length === 0 && <p>No games are available right now.</p>}
        </section>
      </div>
    </main>
  );
}
