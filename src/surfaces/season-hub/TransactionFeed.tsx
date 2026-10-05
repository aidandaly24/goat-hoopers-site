import type { Transaction } from "@/domain";
import { Card } from "@/ui/Card";
import { SectionHeading } from "@/ui/SectionHeading";
import { Badge } from "@/ui/Badge";
import styles from "./TransactionFeed.module.css";

const TONE: Record<Transaction["type"], "gold" | "neutral"> = {
  trade: "gold",
  waiver: "neutral",
  free_agent: "neutral",
};

const LABEL: Record<Transaction["type"], string> = {
  trade: "Trade",
  waiver: "Waiver",
  free_agent: "FA",
};

/** Latest league activity. Empty state covers the quiet offseason. */
export function TransactionFeed({ transactions }: { transactions: Transaction[] }) {
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
              <Badge tone={TONE[t.type]}>{LABEL[t.type]}</Badge>
              <span className={styles.summary}>{t.summary}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
