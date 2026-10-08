import type { StockDetail } from '@/domain';
/** Vite alias replaces the default detail transport only in this fixture. */
export async function fetchStockDetail(playerId: string): Promise<StockDetail> {
  if (new URLSearchParams(location.search).get('state') === 'error') throw new Error('Synthetic detail error');
  return {
    playerId, spark: [
      { date: '2025-01-01', price: 22, source: 'backtest' },
      { date: '2025-06-01', price: 25, source: 'backtest' },
      { date: '2026-10-07', price: 28, source: 'live' },
      { date: '2026-10-08', price: 32, source: 'live' },
    ],
    seasonHistory: [{ season: '2025', fppg: 42.1, games: 67 }, { season: '2024', fppg: 38.5, games: 62 }],
    factors: [{ kind: 'production', label: 'Production', delta: 25, note: 'Synthetic QA fixture; not a league quote.' }, { kind: 'age', label: 'Age', delta: -3, note: 'Synthetic factor for negative-state contrast.' }],
  };
}
