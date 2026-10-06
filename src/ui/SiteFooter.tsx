import Link from "next/link";
import type { Season } from "@/domain";
import { formatSeasonStatus } from "@/domain";
import styles from "./SiteFooter.module.css";

/**
 * SiteFooter — site-wide footer, rendered by the root layout under every
 * page. League identity, season line, the core nav, and the honest
 * unaffiliated-with-the-NBA-or-Sleeper disclaimer.
 *
 * The season is a prop (dependency inversion): the layout loads it via
 * getSeasonMeta(). Null renders the footer without the season line
 * rather than guessing.
 */
export function SiteFooter({ season }: { season: Season | null }) {
  const year = new Date().getFullYear();
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <p className={styles.wordmark}>
            GOAT <span>HOOPERS</span>
          </p>
          {season && (
            <p className={styles.season}>
              {season.seasonYear} season · {formatSeasonStatus(season.status)}
            </p>
          )}
          <p className={styles.disclaimer}>
            A fan-made league hub. Not affiliated with the NBA or Sleeper.
          </p>
        </div>
        <nav className={styles.nav} aria-label="Footer">
          <Link href="/">Home</Link>
          <Link href="/arcade">Arcade</Link>
          <Link href="/teams">Teams</Link>
          <Link href="/transactions">Transactions</Link>
        </nav>
        <p className={styles.copy}>© {year} GOAT Hoopers. Built for the league, by the league.</p>
      </div>
    </footer>
  );
}
