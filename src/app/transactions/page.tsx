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

export const revalidate = 300; // refresh league data every 5 minutes

export default async function TransactionsPage() {
  const { transactions, teams } = await getTransactionHistory();
  return (
    <>
      <SectionNav current="transactions" />
      <TransactionHistory transactions={transactions} teams={teams} />
    </>
  );
}
