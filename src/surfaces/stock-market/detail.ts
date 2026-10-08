import type { StockDetail } from "@/domain";

export type LoadStockDetail = (playerId: string) => Promise<StockDetail>;

/** One board's on-click cache. Failed requests are evicted so retry is real. */
export function createDetailLoader(load: LoadStockDetail): LoadStockDetail {
  const requests = new Map<string, Promise<StockDetail>>();
  return (playerId) => {
    const existing = requests.get(playerId);
    if (existing) return existing;
    const request = Promise.resolve().then(() => load(playerId)).catch((error) => {
      requests.delete(playerId);
      throw error;
    });
    requests.set(playerId, request);
    return request;
  };
}
