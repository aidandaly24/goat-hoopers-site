import type { Team, Transaction } from "@/domain";
import { Suspense } from "react";
import { TransactionFilters } from "./TransactionFilters";

export type TransactionHistoryProps = {
  /** Every transaction this season, newest first. */
  transactions: Transaction[];
  /** All league teams, for the team filter dropdown. */
  teams: Team[];
};

/**
 * transactions — the league's full transaction history.
 *
 * One coherent experience for "what has every team been doing": the
 * complete wire history with type and team filters. Filtering is
 * client-side (no refetch); the data arrives fully loaded as props.
 *
 * Contract:
 * - Receives `transactions` (newest first) and `teams` as domain objects.
 * - Never fetches. Never touches Sleeper. Domain objects in, JSX out.
 */
export function TransactionHistory({ transactions, teams }: TransactionHistoryProps) {
  return (
    <Suspense fallback={<p role="status">Loading transactions…</p>}>
      <TransactionFilters transactions={transactions} teams={teams} />
    </Suspense>
  );
}
