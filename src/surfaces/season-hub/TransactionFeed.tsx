import type { Team, Transaction } from "@/domain";
import { Card } from "@/ui/Card";
import { SectionHeading } from "@/ui/SectionHeading";
import { Badge } from "@/ui/Badge";
import { TransactionSummary } from "@/ui/TransactionSummary";
import styles from "./TransactionFeed.module.css";

const TONE: Record<Transaction["type"], "gold" | "neutral"> = {
  trade: "gold",
  waiver: "neutral",
  free_agent: "neutral",
};

const TYPE_LABEL: Record<Transaction["type"], string> = {
  trade: "Trade",
  waiver: "Waiver",
  free_agent: "FA",
};

/**
 * Latest league activity. Empty state covers the quiet offseason.
 * Player and team names link out via TransactionSummary.
 */
export function TransactionFeed({
  transactions,
  teams,
}: {
  transactions: Transaction[];
  teams: Team[];
}) {
  return (
    <Card>
      <SectionHeading eyebrow="Around the league" title="Recent Activity" />
      {transactions.length === 0 ? (
        <p className={styles.empty}>
          Quiet on the wire. The league office is waiting for someone to make a move.
        </p>
      ) : (
        <ul className={styles.feed}>
          {transactions.map((t) => (
            <li key={t.id} className={styles.item}>
              <Badge tone={TONE[t.type]}>{TYPE_LABEL[t.type]}</Badge>
              <span className={styles.summary}>
                <TransactionSummary transaction={t} teams={teams} />
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
