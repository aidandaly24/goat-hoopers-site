/**
 * Public game hub. Receives implemented registry entries and renders real
 * previews plus direct play links. Question: what can I play? Primary action:
 * launch ranked Free Throw, local practice or a preview. No account/store gate
 * or invented competition data; the ranked route owns admission availability.
 */
import type { PlayableGame } from "@/domain/arcade";
import Link from "next/link";
import controls from "@/ui/controls.module.css";
import { CompetitionLeaderboard } from "./CompetitionLeaderboard";
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
            {games.map(game => <Link key={game.id} href={game.id === "free-throw" ? "/arcade/ranked-free-throw" : `/arcade/${game.id}`} prefetch={false} className={controls.secondary}>{game.id === "free-throw" ? "Ranked free throws" : `${game.play.mode === "preview" ? "Preview" : "Practice"} ${game.name}`}</Link>)}
            {games.some(game => game.id === "free-throw") && <Link href="/arcade/free-throw" prefetch={false} className={controls.secondary}>Local free-throw practice</Link>}
            <Link href="/arcade/leaderboard" prefetch={false} className={controls.secondary}>Weekly leaderboard</Link>
          </nav>
        </header>
        <CompetitionLeaderboard />
        <section className={styles.games} aria-label="Available games">
          {games.map(game => <GameCard key={game.id} game={game} />)}
          {games.length === 0 && <p>No games are available right now.</p>}
        </section>
      </div>
    </div>
  );
}
