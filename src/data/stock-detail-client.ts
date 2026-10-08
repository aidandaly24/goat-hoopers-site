import type { StockDetail, StockFactor, PriceHistoryPoint } from "@/domain";

const object = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;
const finite = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

/** Validate the existing endpoint contract before rendering its deep data. */
function isDetail(value: unknown, playerId: string): value is StockDetail {
  if (!object(value) || value.playerId !== playerId) return false;
  return Array.isArray(value.factors) && value.factors.every((f: unknown): f is StockFactor =>
    object(f) && typeof f.kind === "string" && typeof f.label === "string" &&
    typeof f.note === "string" && finite(f.delta)) &&
    Array.isArray(value.seasonHistory) && value.seasonHistory.every((s: unknown) =>
      object(s) && typeof s.season === "string" && finite(s.fppg) && finite(s.games)) &&
    Array.isArray(value.spark) && value.spark.every((p: unknown): p is PriceHistoryPoint =>
      object(p) && typeof p.date === "string" && Number.isFinite(Date.parse(p.date)) &&
      finite(p.price) && ["gamelog", "backtest", "live"].includes(String(p.source)));
}

/** Same-origin GET only, triggered by board selection. No Sleeper/DB imports. */
export async function fetchStockDetail(
  playerId: string,
  fetcher: typeof fetch = fetch,
): Promise<StockDetail> {
  const response = await fetcher(`/api/stocks/${encodeURIComponent(playerId)}`);
  if (!response.ok) throw new Error("Player detail is unavailable");
  const detail: unknown = await response.json();
  if (!isDetail(detail, playerId)) throw new Error("Invalid player detail");
  return detail;
}
