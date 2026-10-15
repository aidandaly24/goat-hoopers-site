/**
 * /stocks — the full player stock market page.
 *
 * Thin page: loads via the data loader, hands the domain object to the
 * exchange surface. Deep data loads on selection through the existing
 * detail API. The site-wide ticker remains in the root layout.
 */
import { getStockMarketData } from "@/data/league";
import { StockMarket } from "@/surfaces/stock-market/StockMarket";
import { SectionNav } from "@/ui/SectionNav";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Player Stock Market | GOAT Hoopers",
  description:
    "Player stock prices, risers, and fallers in the GOAT Hoopers league.",
  alternates: { canonical: "/stocks" },
};

export const revalidate = 300; // refresh prices every 5 minutes

export default async function StocksPage() {
  const market = await getStockMarketData();
  return (
    <>
      <SectionNav current="stocks" />
      <StockMarket market={market} />
    </>
  );
}
