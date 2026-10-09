/* eslint-disable @next/next/no-img-element -- Approved, pre-sized local assets are served directly without image-optimizer quota. */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CSSProperties } from "react";
import { teamColorVar } from "./teamColors";
import { isCurrentRoute } from "./currentRoute";
import styles from "./SiteHeader.module.css";

export type SiteHeaderUser = {
  displayName: string;
  /** Sleeper roster id — colors the account avatar ring. */
  teamId: string;
} | null;

type Props = {
  /** The signed-in manager, if any. Null renders the logged-out state. */
  user: SiteHeaderUser;
  /**
   * Server action that ends the session. Injected (not imported) so this
   * primitive stays decoupled from the app layer — see repo rule 11.
   */
  logoutAction: () => Promise<void>;
};

/**
 * SiteHeader — the site-wide chrome. Wordmark, primary nav, account state.
 *
 * Nav rule (one destination, one button, always): logged in, the manager's
 * display name — ringed with their team color — is the SINGLE entry point
 * to /team, and "My Team" disappears. Logged out, "My Team" stays in the
 * nav as the login nudge (it bounces to /login).
 *
 * Rendered by the root layout, so it appears on every page. It reads the
 * session cookie, which opts the whole route tree into dynamic rendering
 * (deliberate: correct account state everywhere beats static caching for
 * a ten-manager league site). On phones the nav links hide — the bottom
 * tab bar (MobileNav) carries the same destinations and order instead.
 */
export function SiteHeader({ user, logoutAction }: Props) {
  const pathname = usePathname();
  const current = (href: string) => isCurrentRoute(pathname, href) ? "page" as const : undefined;
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.wordmark} aria-label="GOAT Hoopers home">
          <img src="/courtside/GOAT-HOOPERS-horizontal-black.svg" alt="GOAT Hoopers" width="208" height="55" />
        </Link>
        <nav className={styles.nav} aria-label="Primary">
          <Link href="/" aria-current={current("/")}>Home</Link>
          <Link href="/news" aria-current={current("/news")}>News</Link>
          <Link href="/stocks" aria-current={current("/stocks")}>Stocks</Link>
          <Link href="/history" aria-current={current("/history")}>History</Link>
          <Link href="/arcade" aria-current={current("/arcade")}>Arcade</Link>
          {!user && <Link href="/team" aria-current={current("/team")}>My Team</Link>}
        </nav>
        <div className={styles.account}>
          {user ? (
            <>
              <Link
                href="/team"
                className={styles.displayName}
                aria-current={current("/team")}
                style={{ "--gh-ring": teamColorVar(user.teamId) } as CSSProperties}
              >
                <span className={styles.ring} aria-hidden="true">
                  {initials(user.displayName)}
                </span>
                <span className={styles.name}>{user.displayName}</span>
              </Link>
              <form action={logoutAction} className={styles.logoutForm}>
                <button type="submit" className={styles.logout}>
                  Log out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/claim" className={styles.claim} aria-current={current("/claim")}>
                Claim team
              </Link>
              <Link href="/login" className={styles.login} aria-current={current("/login")}>
                Log in
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function initials(displayName: string): string {
  return displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}
