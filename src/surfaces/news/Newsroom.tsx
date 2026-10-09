import type { LeagueNewsEdition } from "@/domain";
import { NewsFeed } from "./NewsFeed";
import styles from "./Newsroom.module.css";

/**
 * news — the League News Network front page.
 *
 * Real NBA articles from ESPN and CBS Sports (see src/data/real-news.ts),
 * sectioned by who they mention: league-rostered players, 2026 drafted
 * rookies, or free agents. Headlines link out to the real article.
 *
 * Contract:
 * - Receives a `LeagueNewsEdition` (articles + identity coverage —
 *   see `src/data/league.ts`). Sections whose identity input failed
 *   render as explicitly unavailable, never silently empty.
 * - Never fetches. Domain objects in, JSX out.
 * - Section filtering + the legacy-link contract live in the client
 *   component `NewsFeed` (see ./newsUrls.ts): `?section=` selects a
 *   section with working Back/Forward/refresh; `?story=`/`?revision=`
 *   from the retired fictional reader show an honest "retired" notice.
 */
export function Newsroom({ edition }: { edition: LeagueNewsEdition }) {
  return (
    <div className={styles.room}>
      <header className={styles.head}>
        <h1 className={styles.title}>The Newsroom<span className={styles.dot}>.</span></h1>
        <p className={styles.lede}>
          Real NBA headlines from ESPN and CBS Sports — sorted by who they
          mention: league players, rookies, or the open market.
        </p>
      </header>
      <NewsFeed edition={edition} />
    </div>
  );
}
