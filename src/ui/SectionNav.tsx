import Link from "next/link";
import styles from "./SectionNav.module.css";

export type LeagueSection = "transactions" | "teams" | "intel";

const LINKS: { key: LeagueSection; href: string; label: string }[] = [
  { key: "transactions", href: "/transactions", label: "Transactions" },
  { key: "teams", href: "/teams", label: "Teams" },
  { key: "intel", href: "/intel", label: "Intel" },
];

type Props = {
  /** Which tab is active. Injected so the component stays pure (rule 11). */
  current: LeagueSection;
};

/**
 * SectionNav — secondary navigation for the league content pages.
 * The main header only carries Home / Arcade / My Team; this row lets a
 * visitor move between Transactions, Teams, and Intel
 * without going back to the home page first.
 */
export function SectionNav({ current }: Props) {
  return (
    <nav className={styles.nav} aria-label="League sections">
      {LINKS.map((l) => (
        <Link
          key={l.key}
          href={l.href}
          aria-current={l.key === current ? "page" : undefined}
          className={l.key === current ? styles.active : styles.link}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
