import type { NewsArticle } from "@/domain";
import { NewsFeed } from "./NewsFeed";
import styles from "./Newsroom.module.css";

/**
 * news — the League News Network front page.
 *
 * Every article is generated from real league events (trades, waiver
 * moves, the rookie draft) and voiced by a fictional publication. Rumors
 * and hot takes are labeled as what they are — the fiction is honest.
 *
 * Contract:
 * - Receives fully-generated `NewsArticle[]` (see `src/data/league.ts`).
 * - Never fetches. Domain objects in, JSX out.
 * - Section filtering lives in the client component `NewsFeed`.
 */
export function Newsroom({ articles }: { articles: NewsArticle[] }) {
  return (
    <div className={styles.room}>
      <header className={styles.head}>
        <p className={styles.eyebrow}>League News Network</p>
        <h1 className={styles.title}>The Newsroom</h1>
        <p className={styles.lede}>
          Every move the league makes, covered five ways — from Shams
          breaking it to Skip Bayless losing his mind over it. Real events,
          loud opinions.
        </p>
      </header>
      <NewsFeed articles={articles} />
    </div>
  );
}
