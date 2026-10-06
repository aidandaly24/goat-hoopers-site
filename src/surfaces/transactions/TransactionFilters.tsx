"use client";

import { useMemo, useState } from "react";
import type { Team, Transaction, TransactionType } from "@/domain";
import { Badge } from "@/ui/Badge";
import { Card } from "@/ui/Card";
import { SectionHeading } from "@/ui/SectionHeading";
import { TransactionSummary } from "@/ui/TransactionSummary";
import styles from "./TransactionHistory.module.css";

const TONE: Record<TransactionType, "gold" | "neutral"> = {
  trade: "gold",
  waiver: "neutral",
  free_agent: "neutral",
};

const LABEL: Record<TransactionType, string> = {
  trade: "Trade",
  waiver: "Waiver",
  free_agent: "FA",
};

const TYPE_FILTERS = [
  { value: "all", label: "All" },
  { value: "trade", label: "Trades" },
  { value: "waiver", label: "Waivers" },
  { value: "free_agent", label: "Free agents" },
] as const;

type TypeFilter = (typeof TYPE_FILTERS)[number]["value"];

function weekLabel(week: number): string {
  return week <= 0 ? "Preseason" : `Week ${week}`;
}

function dateLabel(createdAt: number): string {
  return new Date(createdAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

/**
 * Client-side filter controls + list. All filtering happens in-memory
 * over the fully-loaded props — no refetching, no URL state.
 */
export function TransactionFilters({
  transactions,
  teams,
}: {
  transactions: Transaction[];
  teams: Team[];
}) {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [teamFilter, setTeamFilter] = useState<string>("all");

  const sortedTeams = useMemo(
    () => [...teams].sort((a, b) => a.name.localeCompare(b.name)),
    [teams]
  );

  const visible = useMemo(
    () =>
      transactions.filter(
        (t) =>
          (typeFilter === "all" || t.type === typeFilter) &&
          (teamFilter === "all" || t.teamIds.includes(teamFilter))
      ),
    [transactions, typeFilter, teamFilter]
  );

  return (
    <Card>
      <SectionHeading eyebrow="The league" title="Transactions" />
      <div className={styles.controls}>
        <div
          className={styles.typeRow}
          role="group"
          aria-label="Filter by transaction type"
        >
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              className={`${styles.typeButton} ${
                typeFilter === f.value ? styles.active : ""
              }`}
              aria-pressed={typeFilter === f.value}
              onClick={() => setTypeFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <label className={styles.teamLabel}>
          <span className={styles.teamCaption}>Team</span>
          <select
            className={styles.teamSelect}
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            aria-label="Filter by team"
          >
            <option value="all">All teams</option>
            {sortedTeams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className={styles.count} aria-live="polite">
        {visible.length} {visible.length === 1 ? "transaction" : "transactions"}
      </p>
      {visible.length === 0 ? (
        <p className={styles.empty}>
          {transactions.length === 0
            ? "No transactions yet. The wire is quiet."
            : "No transactions match those filters."}
        </p>
      ) : (
        <ul className={styles.list}>
          {visible.map((t) => (
            <li key={t.id} className={styles.item}>
              <Badge tone={TONE[t.type]}>{LABEL[t.type]}</Badge>
              <div className={styles.body}>
                <span className={styles.summary}>
                  <TransactionSummary transaction={t} teams={teams} />
                </span>
                <span className={styles.meta}>
                  {weekLabel(t.week)} · {dateLabel(t.createdAt)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
