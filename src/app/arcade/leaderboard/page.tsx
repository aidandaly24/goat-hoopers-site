import type { Metadata } from "next";
import Link from "next/link";
import { WeeklyLeaderboard } from "@/surfaces/arcade/WeeklyLeaderboard";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Weekly leaderboard | GOAT Hoopers",
  description: "Weekly Arcade competition status. Local practice scores are not ranked.",
};

/** Public competition status only. Ranked admission and data access remain separate. */
export default function ArcadeLeaderboardPage() {
  return <div className={styles.page}>
    <Link href="/arcade" className={styles.back}>← Back to the Arcade</Link>
    <WeeklyLeaderboard state={{ status: "closed" }} headingLevel={1} />
    <p className={styles.practice}><Link href="/arcade/free-throw">Play Free Throw practice ↗</Link></p>
  </div>;
}
