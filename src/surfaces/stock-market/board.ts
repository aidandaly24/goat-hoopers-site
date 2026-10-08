import type { PriceHistoryPoint, StockQuote } from "@/domain";

export const PAGE_SIZE = 25;
export type BoardFilters = {
  query: string;
  position: string;
  drafted: boolean;
  roster: "all" | "rostered" | "unrostered";
  sort: "price" | "change" | "falling" | "name";
};
export const DEFAULT_FILTERS: BoardFilters = {
  query: "", position: "", drafted: false, roster: "all", sort: "price",
};

/** Presentation only: combine filters; keep absent changes behind known ones. */
export function filterStocks(stocks: StockQuote[], filters: BoardFilters) {
  const query = filters.query.trim().toLowerCase();
  return stocks.filter((s) =>
    (!query || s.playerName.toLowerCase().includes(query)) &&
    (!filters.position || s.position === filters.position) &&
    (!filters.drafted || s.rookiePick !== null) &&
    (filters.roster === "all" ||
      (filters.roster === "rostered" ? s.ownership > 0 : s.ownership === 0))
  ).sort((a, b) => {
    let difference = 0;
    if (filters.sort === "name") return a.playerName.localeCompare(b.playerName);
    if (filters.sort === "price") difference = b.price - a.price;
    else {
      if (a.changePct === null && b.changePct !== null) return 1;
      if (b.changePct === null && a.changePct !== null) return -1;
      difference = filters.sort === "change"
        ? (b.changePct ?? 0) - (a.changePct ?? 0)
        : (a.changePct ?? 0) - (b.changePct ?? 0);
    }
    return difference || a.playerName.localeCompare(b.playerName);
  });
}

export function visibleStocks(stocks: StockQuote[], visible: number) {
  return stocks.slice(0, visible);
}

/** SVG coordinates use actual dates; both reconstructed sources stay dashed (PR #49). */
export function priceSegments(points: PriceHistoryPoint[]) {
  if (points.length < 2) return [];
  const times = points.map((p) => Date.parse(p.date));
  const elapsed = times[times.length - 1] - times[0];
  const prices = points.map((p) => p.price);
  const low = Math.min(...prices);
  const range = Math.max(...prices) - low || 1;
  const coords = points.map((p, i) => {
    const x = elapsed > 0 ? (times[i] - times[0]) / elapsed : i / (points.length - 1);
    return `${(x * 280).toFixed(1)},${(44 - (p.price - low) / range * 36).toFixed(1)}`;
  });
  const segments: { coords: string[]; dashed: boolean }[] = [];
  for (let i = 0; i < coords.length - 1; i++) {
    const dashed = points[i].source !== "live" || points[i + 1].source !== "live";
    const previous = segments[segments.length - 1];
    if (previous?.dashed === dashed) previous.coords.push(coords[i + 1]);
    else segments.push({ coords: [coords[i], coords[i + 1]], dashed });
  }
  return segments;
}
