/**
 * /transactions — full league transaction history.
 *
 * Thin page: loads everything via the data layer, hands domain objects
 * to the transactions surface. Filtering is client-side over the loaded
 * data — no refetching.
 */
import { getTransactionHistory } from "@/data/league";
import { TransactionHistory } from "@/surfaces/transactions/TransactionHistory";
import { SectionNav } from "@/ui/SectionNav";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Transactions | GOAT Hoopers",
  description:
    "Every trade, waiver claim, and free-agent move in GOAT Hoopers history.",
  alternates: { canonical: "/transactions" },
};

export const revalidate = 300; // refresh league data every 5 minutes

export default async function TransactionsPage() {
  const { transactions, teams } = await getTransactionHistory();
  return (
    <>
      <h1 className="visually-hidden">Transactions</h1>
      <SectionNav current="transactions" />
      <TransactionHistory transactions={transactions} teams={teams} />
    </>
  );
}
