"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { teamColorVar } from "./teamColors";
import styles from "./MobileNav.module.css";

export type MobileNavUser = {
  displayName: string;
  /** Sleeper roster id — colors the team tab's avatar ring. */
  teamId: string;
} | null;

/**
 * MobileNav — the bottom tab bar for phones (<=40rem). Home / News /
 * Arcade / Team, thumb-zone, app-like. Rendered by the root layout on
 * every page; CSS hides it on larger screens. Client component: the
 * active tab comes from usePathname.
 *
 * The Team tab mirrors the header rule: logged in it goes to /team (the
 * display-name destination), logged out it still goes to /team, which
 * bounces to /login — one destination, always.
 */
export function MobileNav({ user }: { user: MobileNavUser }) {
  const pathname = usePathname();

  const tabs = [
    {
      href: "/",
      label: "Home",
      active: pathname === "/",
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 10.5 12 3l9 7.5" />
          <path d="M5 9.5V21h14V9.5" />
          <path d="M9.5 21v-6h5v6" />
        </svg>
      ),
    },
    {
      href: "/arcade",
      label: "Arcade",
      active: pathname === "/arcade" || pathname.startsWith("/arcade/"),
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="2.5" y="7" width="19" height="11" rx="5.5" />
          <path d="M8 11.5v3M6.5 13h3" />
          <circle cx="15.5" cy="12" r="1.1" />
          <circle cx="18" cy="14" r="1.1" />
        </svg>
      ),
    },
    {
      href: "/news",
      label: "News",
      active: pathname === "/news",
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 5.5h13v13H4z" />
          <path d="M17 8.5h2.5v10H17" />
          <path d="M7 9.5h7M7 12.5h7M7 15.5h4.5" />
        </svg>
      ),
    },
    {
      href: "/history",
      label: "History",
      active: pathname === "/history" || pathname.startsWith("/history/"),
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 3h12v18l-3-2.2L12 21l-3-2.2L6 21z" />
          <path d="M9 8h6M9 11.5h6" />
        </svg>
      ),
    },
    {
      href: "/team",
      label: "Team",
      active: pathname === "/team" || pathname.startsWith("/team/"),
      icon: user ? (
        <span
          className={styles.miniAvatar}
          style={{ borderColor: teamColorVar(user.teamId) }}
          aria-hidden="true"
        >
          {initials(user.displayName)}
        </span>
      ) : (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="8" r="4" />
          <path d="M4.5 20.5c1.4-3.6 4.2-5.5 7.5-5.5s6.1 1.9 7.5 5.5" />
        </svg>
      ),
    },
  ];

  return (
    <nav className={styles.tabbar} aria-label="Primary">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`${styles.tab} ${tab.active ? styles.active : ""}`}
          aria-current={tab.active ? "page" : undefined}
        >
          <span className={styles.icon}>{tab.icon}</span>
          <span className={styles.label}>{tab.label}</span>
        </Link>
      ))}
    </nav>
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
