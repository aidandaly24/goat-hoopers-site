/**
 * /stocks — the full player stock market page.
 *
 * Thin page: loads via the data loader, hands the domain object to the
 * surface. The Bloomberg-style ticker lives in the root layout, so it's
 * above this page too.
 */
import { getStockMarketData } from "@/data/league";
import { StockMarket } from "@/surfaces/stock-market/StockMarket";

export const revalidate = 300; // refresh prices every 5 minutes

export default async function StocksPage() {
  const market = await getStockMarketData();
  return <StockMarket market={market} />;
}
