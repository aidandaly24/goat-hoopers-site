/**
 * /trade-analyzer — price a hypothetical trade in FAAB dollars.
 *
 * Thin page: loads the market via the data loader, hands the slim
 * StockQuotes to the trade-analyzer surface. All verdict math lives in
 * the domain (analyzeTrade); the surface never fetches.
 */
import { Suspense } from "react";
import { getStockMarketData } from "@/data/league";
import { TradeAnalyzer } from "@/surfaces/trade-analyzer/TradeAnalyzer";

export const revalidate = 300; // refresh prices every 5 minutes

export const metadata = {
  title: "Trade Analyzer | GOAT Hoopers",
  description:
    "Price a hypothetical trade in FAAB dollars — fair deal or fleece?",
};

export default async function TradeAnalyzerPage() {
  const market = await getStockMarketData();
  // Suspense: the surface reads ?a=/?b= share params via useSearchParams,
  // which needs a boundary during static generation.
  return (
    <Suspense fallback={<p>Loading trade analyzer…</p>}>
      <TradeAnalyzer stocks={market.stocks} />
    </Suspense>
  );
}
