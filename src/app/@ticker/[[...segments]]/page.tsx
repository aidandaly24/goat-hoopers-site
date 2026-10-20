import { getStockMarketData, getLeagueNews } from "@/data/league";
import {
  CombinedTicker,
  type TickerHeadline,
  type TickerStock,
} from "@/surfaces/stock-market/CombinedTicker";
import { shouldRenderTicker } from "../policy";

/**
 * A matched slot returns null for utility flows, so soft navigation clears
 * the previous ticker too. Gate here: hiding a slot in its parent would
 * still execute its server loaders.
 */
export default async function TickerSlot({
  params,
}: {
  params: Promise<{ segments?: string[] }>;
}) {
  const { segments } = await params;
  if (!shouldRenderTicker(segments)) return null;

  let stocks: TickerStock[] = [];
  let headlines: TickerHeadline[] = [];
  try {
    const [market, news] = await Promise.all([
      getStockMarketData(),
      getLeagueNews(),
    ]);
    // Keep the existing bounded DTO; factors and histories never ship here.
    stocks = market.stocks.slice(0, 25).map((stock) => ({
      playerId: stock.playerId,
      playerName: stock.playerName,
      price: stock.price,
      trend: stock.trend,
      changePct: stock.changePct,
    }));
    headlines = news.slice(0, 12).map((article) => ({
      text: article.headline,
      publication: article.outlet.name,
    }));
  } catch {
    // Preserve the previous all-or-nothing, best-effort outage behavior.
    stocks = [];
    headlines = [];
  }
  if (stocks.length === 0 && headlines.length === 0) return null;
  return <CombinedTicker stocks={stocks} headlines={headlines} />;
}
