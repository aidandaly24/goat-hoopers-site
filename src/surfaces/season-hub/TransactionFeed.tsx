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
 * Player and team names link out via TransactionSummary. The viewer's own
 * moves (extraTransactions) fold into this same wire — merged by recency
 * and marked "Your team" — never a separate around-your-team section.
 */
export function TransactionFeed({
  transactions,
  teams,
  viewerTeamId,
  extraTransactions = [],
}: {
  transactions: Transaction[];
  teams: Team[];
  viewerTeamId?: string;
  extraTransactions?: Transaction[];
}) {
  const seen = new Set(transactions.map((t) => t.id));
  const merged = [...extraTransactions.filter((t) => !seen.has(t.id)), ...transactions]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 12);
  return (
    <Card className={styles.panel}>
      <SectionHeading eyebrow="Latest moves" title="Recent activity" />
      {merged.length === 0 ? (
        <p className={styles.empty}>
          No recent transactions.
        </p>
      ) : (
        <ul className={styles.feed}>
          {merged.map((t) => {
            const own = !!viewerTeamId && t.teamIds.includes(viewerTeamId);
            return (
              <li key={t.id} className={own ? `${styles.item} ${styles.ownItem}` : styles.item} data-own-move={own || undefined}>
                <Badge tone={TONE[t.type]}>{TYPE_LABEL[t.type]}</Badge>
                <span className={styles.summary}>
                  <TransactionSummary transaction={t} teams={teams} />
                </span>
                {own && <span className={styles.youTag}>Your team</span>}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
