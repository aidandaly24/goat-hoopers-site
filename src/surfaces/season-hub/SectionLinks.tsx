import Link from "next/link";
import { Card } from "@/ui/Card";
import { SectionHeading } from "@/ui/SectionHeading";
import styles from "./SectionLinks.module.css";

const SECTIONS = [
  {
    href: "/transactions",
    title: "Transactions",
    blurb: "Every wire move this season — trades, waivers, free agents.",
  },
  {
    href: "/teams",
    title: "Teams",
    blurb: "All ten teams, managers, and records.",
  },
  {
    href: "/intel",
    title: "League Intel",
    blurb: "Power rankings, projections, title odds, record book.",
  },
  {
    href: "/stocks",
    title: "Stock Market",
    blurb: "Every player's FAAB price — trending, falling, panic meter.",
  },
  {
    href: "/trade-analyzer",
    title: "Trade Analyzer",
    blurb: "Price a hypothetical trade: fair deal or fleece?",
  },
];

/**
 * Entry points to the league's deeper pages. Rendered on the home
 * surface so the new sections are discoverable without hunting the URL.
 */
export function SectionLinks() {
  return (
    <Card>
      <SectionHeading eyebrow="Dig deeper" title="Explore the league" />
      <ul className={styles.links}>
        {SECTIONS.map((s) => (
          <li key={s.href}>
            <Link href={s.href} className={styles.link}>
              <span className={styles.title}>{s.title}</span>
              <span className={styles.blurb}>{s.blurb}</span>
              <span className={styles.arrow} aria-hidden="true">
                →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
