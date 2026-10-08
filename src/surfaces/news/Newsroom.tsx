import type { NewsArticle } from "@/domain";
import { NewsFeed } from "./NewsFeed";
import styles from "./Newsroom.module.css";

/**
 * news — the League News Network front page.
 *
 * Open editorial front page and a compact, section-filtered headline feed.
 * Generated articles retain their original parody voices, prose and links.
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
        <h1 className={styles.title}>The Newsroom<span className={styles.dot}>.</span></h1>
        <p className={styles.lede}>
          Real moves. Loud opinions.
        </p>
        <p className={styles.disclosure}>Generated league reactions · parody voices, unaffiliated with the named outlets.</p>
      </header>
      <NewsFeed articles={articles} />
    </div>
  );
}
