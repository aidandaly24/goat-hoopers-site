import Link from "next/link";
import type { Reward, SiteUser } from "@/domain/arcade";
import { Badge } from "@/ui/Badge";
import { Card } from "@/ui/Card";
import { SectionHeading } from "@/ui/SectionHeading";
import styles from "./RewardLedger.module.css";

/**
 * The logged-in user's FAAB reward ledger: pending vs settled.
 * Logged-out visitors get a nudge to claim their team instead.
 */
export function RewardLedger({
  rewards,
  user,
}: {
  rewards: Reward[];
  user: SiteUser | null;
}) {
  return (
    <Card>
      <SectionHeading eyebrow="Rewards" title="Your ledger" />
      {!user ? (
        <p className={styles.empty}>
          <Link href="/claim" className={styles.link}>
            Claim your team
          </Link>{" "}
          to earn FAAB rewards.
        </p>
      ) : rewards.length === 0 ? (
        <p className={styles.empty}>
          Nothing earned yet. Win a week, take home the FAAB.
        </p>
      ) : (
        <ul className={styles.list}>
          {rewards.map((r) => (
            <li key={r.id} className={styles.row}>
              <div>
                <span className={styles.amount}>+{r.amountFaab} FAAB</span>
                <span className={styles.meta}>
                  {r.gameId} · week {r.week}
                </span>
              </div>
              <Badge tone={r.settled ? "win" : "gold"}>
                {r.settled ? "Settled" : "Pending"}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
