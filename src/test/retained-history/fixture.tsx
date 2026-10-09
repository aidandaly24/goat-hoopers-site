import { createRoot } from "react-dom/client";
import type { StockDetail, StockQuote } from "@/domain";
import type { StockHistoryRangePage, StockHistoryRecord } from "@/domain/stock-history-range";
import { StockBoard } from "@/surfaces/stock-market/StockBoard";
import styles from "@/surfaces/stock-market/StockMarket.module.css";
import "@/ui/tokens.css";
import "@/app/globals.css";

const stocks: StockQuote[] = ["2577", "4866"].map((playerId, i) => ({
  playerId, playerName: `Synthetic ${i ? "Beta" : "Alpha"}`, position: "PG", nbaTeam: null,
  price: 85 - i, prevPrice: 80, change: 5 - i, changePct: 6.25, trend: "up", ownership: 0, rookiePick: null,
}));
const loadDetail = async (playerId: string): Promise<StockDetail> => ({ playerId,
  spark: [{ date: "2025-01-01", price: 10, source: "backtest" }, { date: "2026-10-08", price: 85, source: "live" }],
  seasonHistory: [], factors: [],
});
const requests: { url: string; signal?: AbortSignal | null }[] = [];
const pending: (() => void)[] = [];
Object.assign(window, { historyFixture: { requests, pending } });
function fixturePage(playerId: string, query: URLSearchParams): StockHistoryRangePage {
  const kind = query.get("kind") === "modeled" ? "modeled" : "observed";
  const from = query.get("from")!, to = query.get("to")!, more = query.has("cursor");
  const record = (id: string, date: string, priceCents: number): StockHistoryRecord => ({ id, playerId, date,
    priceCents, source: kind === "observed" ? "live" : "gamelog", season: kind === "observed" ? null : "2025-26" });
  const records = kind === "observed" ? more ? [record("observed-c", "2026-10-08T02:41:52.104607", 8601)] :
    [record("observed-a", "2026-10-08T01:41:52.104607", 8438), record("observed-b", "2026-10-08T01:41:52.104607", 8438)] :
    [record(more ? "model-b" : "model-a", more ? "2026-10-01T00:00:00.000000Z" : "2026-09-01T00:00:00.000000Z", more ? 7500 : 7000)];
  return { version: "stock-history-range-v1", playerId, requested: { from, to, kind }, readStatus: "ready", records,
    precedingModelAnchor: null, nextCursor: more ? null : `${kind}_more`, hasMore: !more,
    returnedBounds: { first: records[0].date, last: records.at(-1)!.date },
    provenance: { timestampBasis: kind === "observed" ? "database-local-unverified" : "UTC", generation: kind === "modeled" ? "synthetic-v1" : null,
      declaredModelVersion: kind === "modeled" ? "synthetic-model" : null,
      consistency: kind === "observed" ? "best-effort-retained" : "publication-generation",
      calibration: kind === "observed" ? "observed-cents-unchanged" : "stored-model-scale-unvalidated",
      receiptTiming: kind === "observed" ? "recorded-database-time" : "historical-receipt-unknown" },
    coverage: { status: "unknown", retainedRangeExhausted: more, limitations: ["Synthetic fixture. Earlier snapshots may be absent; daily/game coverage is unknown."] },
    modeledWindow: kind === "observed" ? { status: "not-applicable", from: null, toExclusive: null, intervals: [] } :
      { status: "available", from: more ? records[0].date : `${from}T00:00:00.000000Z`,
        toExclusive: more ? `${to}T00:00:00.000000Z` : "2026-10-01T00:00:00.000000Z",
        intervals: [
          ...(!more ? [{ from: `${from}T00:00:00.000000Z`, toExclusive: records[0].date, priceCents: null,
            anchor: null, meaning: "before-first-estimate" as const }] : []),
          { from: records[0].date, toExclusive: more ? `${to}T00:00:00.000000Z` : "2026-10-01T00:00:00.000000Z",
            priceCents: records[0].priceCents, anchor: records[0], meaning: "held-reconstructed-estimate" },
        ] },
  };
}
// The actual browser adapter is used. All application fetches terminate here.
window.fetch = async (input, init) => {
  const url = new URL(input instanceof Request ? input.url : String(input), location.origin);
  const match = /^\/api\/stocks\/(2577|4866)\/history$/.exec(url.pathname);
  if (!match || url.origin !== location.origin || init?.method !== "GET") throw new Error("Synthetic fixture forbids this request");
  requests.push({ url: url.pathname + url.search, signal: init?.signal });
  const mode = (document.getElementById("response-mode") as HTMLSelectElement).value;
  if (mode === "pending") await new Promise<void>(resolve => pending.push(resolve));
  if (mode === "drift" && url.searchParams.get("kind") === "modeled" && url.searchParams.has("cursor")) return Response.json({}, { status: 409 });
  const page = fixturePage(match[1], url.searchParams);
  if (mode === "unavailable" && page.requested.kind === "observed") {
    page.readStatus = "unavailable"; page.records = []; page.hasMore = false; page.nextCursor = null; page.returnedBounds = null;
    return Response.json(page, { status: 503 });
  }
  return Response.json(page);
};

createRoot(document.getElementById("root")!).render(<main className={styles.exchange}>
  <h1>Synthetic retained-history caller</h1>
  <p>Local fake responses only. No application server, database or provider requests.</p>
  <label>History response <select id="response-mode" defaultValue="ready">
    <option value="ready">Ready</option><option value="unavailable">Unavailable</option>
    <option value="drift">Generation changed</option><option value="pending">Pending</option>
  </select></label>
  <button type="button" onClick={() => { for (const resolve of pending.splice(0)) resolve(); }}>Resolve pending fixture</button>
  <StockBoard stocks={stocks} loadDetail={loadDetail} />
</main>);
