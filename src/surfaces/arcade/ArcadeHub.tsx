/**
 * Public game hub. Receives implemented registry entries and renders real
 * previews plus direct play links. Question: what can I play? Primary action:
 * launch practice or preview. Narrow screens retain both direct launch links;
 * competition stays closed. No account/store gate or invented competition data.
 */
import type { PlayableGame } from "@/domain/arcade";
import { GameCard } from "./GameCard";
import styles from "./ArcadeHub.module.css";

export function ArcadeHub({ games }: { games: readonly PlayableGame[] }) {
  return (
    <div className={`gh-arcade-canvas ${styles.surface}`} data-arcade-page>
      <div className={styles.inner}>
        <header className={styles.hero}>
          <p className={styles.eyebrow}>GOAT Hoopers · Game room</p>
          <h1 className={styles.title}>The Arcade</h1>
          <p className={styles.sub}>Find your touch. Build your five. Make your next play.</p>
          <nav className={styles.shortcuts} aria-label="Jump into a game">
            {games.map(game => <a key={game.id} href={`/arcade/${game.id}`}>{game.name} <span aria-hidden="true">↗</span></a>)}
          </nav>
        </header>
        <section className={styles.games} aria-label="Available games">
          {games.map(game => <GameCard key={game.id} game={game} />)}
          {games.length === 0 && <p>No games are available right now.</p>}
        </section>
      </div>
    </div>
  );
}
