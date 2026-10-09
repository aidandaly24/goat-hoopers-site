/* eslint-disable @next/next/no-img-element -- Approved, pre-sized local assets are served directly without image-optimizer quota. */
import Link from "next/link";
import type { Season } from "@/domain";
import { formatSeasonStatus } from "@/domain";
import styles from "./SiteFooter.module.css";
import { SITE_DESTINATIONS, type SiteDestination } from "./siteDestinations";

const footerDestinations = SITE_DESTINATIONS.filter(d => d.footer);

/**
 * SiteFooter — site-wide footer, rendered by the root layout under every
 * page. League identity, season line, the core nav, and the honest
 * unaffiliated-with-the-NBA-or-Sleeper disclaimer.
 *
 * The season is a prop (dependency inversion): the layout loads it via
 * getSeasonMeta(). Null renders the footer without the season line
 * rather than guessing.
 */
export function SiteFooter({ season, destinations = footerDestinations }: { season: Season | null; destinations?: readonly SiteDestination[] }) {
  const year = new Date().getFullYear();
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <p className={styles.wordmark}>
            <img src="/courtside/GOAT-HOOPERS-horizontal-black.svg" alt="GOAT Hoopers" width="208" height="55" />
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
          {destinations.map(d => <Link key={d.href} href={d.href}>{d.label}</Link>)}
        </nav>
        <p className={styles.copy}>© {year} GOAT Hoopers. Built for the league, by the league.</p>
      </div>
    </footer>
  );
}
