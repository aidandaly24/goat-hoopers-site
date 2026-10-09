/**
 * Bounded synthetic before/after evidence for #116 (player-name search
 * normalization). Run from the repo root:
 *
 *   npx tsx --import ./qa/player-search/hooks.register.mts qa/player-search/evidence.mts
 *
 * Renders the PRODUCTION filterStocks predicate (after) against the OLD
 * predicate (before, copied verbatim from base f5be2b7) over synthetic
 * fixtures, then renders each surviving row with the PRODUCTION StockQuoteRow
 * component (ReactDOMServer static markup). One HTML file per scenario, each
 * showing before/after at 1280 / 390 / 320 px widths.
 *
 * Method limits (see README.md): no browser is available in this environment,
 * so there are no screenshots and no live keystroke capture. "Keyboard entry"
 * is represented by the exact BoardFilters state the search input's onChange
 * produces (that wiring is untouched by this diff). CSS modules are stubbed
 * to class-name passthrough, so layout styling is approximate.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { StockQuote } from "@/domain";
import {
  DEFAULT_FILTERS,
  PAGE_SIZE,
  filterStocks,
  visibleStocks,
  type BoardFilters,
} from "@/surfaces/stock-market/board";
import { StockQuoteRow } from "@/surfaces/stock-market/StockQuoteRow";

const root = join(dirname(fileURLToPath(import.meta.url)), "evidence");
mkdirSync(root, { recursive: true });

/** The pre-#116 predicate, copied verbatim from base f5be2b7 board.ts. */
function filterStocksBefore(stocks: StockQuote[], filters: BoardFilters) {
  const query = filters.query.trim().toLowerCase();
  return stocks
    .filter(
      (s) =>
        (!query || s.playerName.toLowerCase().includes(query)) &&
        (!filters.position || s.position === filters.position) &&
        (!filters.drafted || s.rookiePick !== null) &&
        (filters.roster === "all" ||
          (filters.roster === "rostered" ? s.ownership > 0 : s.ownership === 0)),
    )
    .sort((a, b) => b.price - a.price || a.playerName.localeCompare(b.playerName));
}

const quote = (playerId: string, patch: Partial<StockQuote>): StockQuote => ({
  playerId,
  playerName: playerId,
  position: "PG",
  nbaTeam: "NYK",
  price: 20,
  prevPrice: 10,
  change: 10,
  changePct: 100,
  trend: "up",
  ownership: 0.1,
  rookiePick: null,
  espnId: null,
  ...patch,
});

// Synthetic fixtures: accented display names, distinct positions/prices.
const stocks = [
  quote("wemby", { playerName: "Victor Wembanyama", position: "C", nbaTeam: "SAS", price: 99, changePct: 12 }),
  quote("jokic", { playerName: "Nikola Jokić", position: "C", nbaTeam: "DEN", price: 95, changePct: 8 }),
  quote("doncic", { playerName: "Luka Dončić", position: "PG", nbaTeam: "LAL", price: 94, changePct: -2 }),
  quote("lebron", { playerName: "LeBron James", position: "SF", nbaTeam: "LAL", price: 88, changePct: 0 }),
  quote("sengun", { playerName: "Alperen Şengün", position: "C", nbaTeam: "HOU", price: 60, changePct: 5, ownership: 0 }),
  quote("sharpe", { playerName: "Day'Ron Sharpe", position: "C", nbaTeam: "BKN", price: 30, changePct: -4, ownership: 0, rookiePick: 12 }),
];

const scenarios: { id: string; label: string; filters: BoardFilters }[] = [
  { id: "initial", label: "Initial board — no query (regression: identical before/after)", filters: DEFAULT_FILTERS },
  { id: "search-jokic", label: "Keyboard entry: query “jokic”", filters: { ...DEFAULT_FILTERS, query: "jokic" } },
  { id: "search-dayron", label: "Keyboard entry: query “dayron”", filters: { ...DEFAULT_FILTERS, query: "dayron" } },
  { id: "search-accented", label: "Keyboard entry: accented query “Jokić” (regression: still matches)", filters: { ...DEFAULT_FILTERS, query: "Jokić" } },
  { id: "combined", label: "Combined: query “e” + position C + Drafted chip", filters: { ...DEFAULT_FILTERS, query: "e", position: "C", drafted: true } },
  { id: "no-match", label: "No match: query “zzz” (empty state + reset)", filters: { ...DEFAULT_FILTERS, query: "zzz" } },
  { id: "punctuation", label: "Guard: punctuation-only query “...” matches nothing, not everything", filters: { ...DEFAULT_FILTERS, query: "..." } },
  { id: "blank", label: "Blank query “   ” lists everything (current behavior preserved)", filters: { ...DEFAULT_FILTERS, query: "   " } },
];

const widths = [1280, 390, 320];

function rowsHtml(filtered: StockQuote[]): string {
  if (filtered.length === 0) {
    return `<div class="empty-result"><h3>No players match</h3><p>Try another name, position, or roster status.</p><button type="button" class="outline-button">Reset filters</button></div>`;
  }
  const shown = visibleStocks(filtered, PAGE_SIZE);
  const ranks = new Map(stocks.map((s, i) => [s.playerId, i + 1]));
  const items = shown
    .map((q) =>
      renderToStaticMarkup(
        createElement(StockQuoteRow, { quote: q, rank: ranks.get(q.playerId) ?? 0, selected: false, onInspect: () => {} }),
      ),
    )
    .join("\n");
  return `<ol class="player-list">\n${items}\n</ol>`;
}

function boardHtml(filtered: StockQuote[]): string {
  return `<p class="board-caption"><span class="gh-num" role="status" aria-live="polite">${visibleStocks(filtered, PAGE_SIZE).length} of ${filtered.length} players</span><span>Change vs previous recorded price</span></p>\n${rowsHtml(filtered)}`;
}

const css = `
body { font-family: ui-sans-serif, system-ui, sans-serif; margin: 0; padding: 24px; background: #f5f1e8; color: #1a1a1a; }
h1 { font-size: 20px; } h2 { font-size: 15px; margin: 28px 0 8px; } h3 { font-size: 14px; margin: 0 0 4px; }
.note { font-size: 12px; color: #555; max-width: 70ch; }
.width-block { border: 2px solid #b3541e; margin: 12px 0; padding: 12px; background: #fffdf8; overflow-x: auto; }
.width-label { font-size: 12px; font-weight: 700; color: #b3541e; margin-bottom: 8px; }
.verdict { font-size: 13px; font-weight: 700; padding: 6px 10px; display: inline-block; margin: 8px 0; }
.verdict.same { background: #e6f0e6; } .verdict.fixed { background: #fff3d6; }
.player-list { list-style: none; padding: 0; margin: 0; }
.player { display: flex; gap: 12px; align-items: center; padding: 8px 4px; border-bottom: 1px solid #ddd; }
.rank, .price, .change { font-family: ui-monospace, monospace; }
.player-identity { flex: 1; } .player-name { font-weight: 600; }
.player-meta { display: block; font-size: 12px; color: #555; }
.empty-result { border: 1px dashed #999; padding: 16px; margin-top: 8px; }
.board-caption { font-size: 13px; display: flex; gap: 12px; }
`;

for (const scenario of scenarios) {
  const before = filterStocksBefore(stocks, scenario.filters);
  const after = filterStocks(stocks, scenario.filters);
  const same =
    before.length === after.length && before.every((s, i) => s.playerId === after[i].playerId);
  const blocks = widths
    .map(
      (w) => `<div class="width-block" style="max-width:${w}px"><div class="width-label">${w}px viewport</div>
<h3>Before (base f5be2b7 predicate)</h3>${boardHtml(before)}
<h3>After (#116 normalized predicate)</h3>${boardHtml(after)}</div>`,
    )
    .join("\n");
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>#116 evidence — ${scenario.id}</title><style>${css}</style></head>
<body><h1>${scenario.label}</h1>
<p class="note">Scenario <b>${scenario.id}</b> · filters ${JSON.stringify(scenario.filters)}. Rows rendered by the production <code>StockQuoteRow</code> component; counts by production <code>filterStocks</code>. Styling is approximate (CSS modules stubbed); DOM structure, order, counts and display spelling are production. Before/after: <span class="verdict ${same ? "same" : "fixed"}">${same ? "IDENTICAL" : "CHANGED — see rows"}</span></p>
${blocks}
</body></html>`;
  writeFileSync(join(root, `${scenario.id}.html`), html);
  console.log(`wrote ${scenario.id}.html (before=${before.length}, after=${after.length}, ${same ? "identical" : "CHANGED"})`);
}
