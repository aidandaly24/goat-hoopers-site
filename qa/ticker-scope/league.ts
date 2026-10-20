import { appendFileSync } from 'node:fs';
import { headers } from 'next/headers';
import type { PlayerStock, Season, StockMarket, Team } from '@/domain';
import type { RealNewsArticle } from '@/domain/news';

/** Synthetic request-scoped adapters; never import production data/storage. */
async function probe(loader: 'market' | 'news') {
  const request = await headers();
  const id = request.get('x-ticker-probe');
  const scenario = request.get('x-ticker-fixture-case') ?? 'full';
  if (!id || !/^[a-z0-9-]{1,100}$/.test(id)) throw Error('Ticker fixture requires a probe header');
  const log = process.env.GOAT_TICKER_PROBE_LOG;
  if (!log) throw Error('Ticker fixture requires its own temporary probe log');
  appendFileSync(log, JSON.stringify({ id, loader, scenario }) + '\n');
  return scenario;
}
const stocks: PlayerStock[] = Array.from({ length: 30 }, (_, index) => ({
  playerId: `ticker-stock-${index}`, playerName: `TICKER_STOCK_FIXTURE_${String(index).padStart(2, '0')}`,
  position: 'PG', nbaTeam: 'SYN', price: 100 - index, prevPrice: 90 - index, change: 10,
  changePct: index, trend: 'up', ownership: .1, rookiePick: null, faabSpent: 0, tradeCount: 0,
  factors: [{ kind: 'production', label: 'TICKER_DEEP_FIELD_MUST_NOT_SHIP', delta: 1, note: 'Synthetic non-DTO evidence' }],
  spark: [], seasonHistory: [],
}));
const news: RealNewsArticle[] = Array.from({ length: 16 }, (_, index) => ({
  id: `ticker-news-${index}`, headline: `TICKER_NEWS_FIXTURE_${String(index).padStart(2, '0')}`,
  outlet: { id: 'synthetic', name: 'Synthetic Wire' }, url: `https://example.invalid/ticker-${index}`,
  publishedAt: 0, summary: 'TICKER_DEEP_FIELD_MUST_NOT_SHIP', players: [], sections: ['latest'],
}));
export async function getStockMarketData(): Promise<StockMarket> {
  const scenario = await probe('market');
  if (scenario === 'market-failure') throw Error('Synthetic market outage');
  return { stocks: scenario === 'empty' || scenario === 'news-only' ? [] : stocks,
    trending: [], falling: [], panic: [], updatedAt: 0, hasHistory: true, pricingBasis: 'preseason' };
}
export async function getLeagueNews(): Promise<RealNewsArticle[]> {
  const scenario = await probe('news');
  if (scenario === 'news-failure') throw Error('Synthetic news outage');
  return scenario === 'empty' || scenario === 'market-only' ? [] : news;
}
export async function getSeasonMeta(): Promise<Season | null> { return null; }
export async function getTeams(): Promise<Team[]> { throw Error('Signed-out fixture must not load teams'); }
