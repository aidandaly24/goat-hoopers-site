import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import Link from "next/link";
import type { StockDetail, StockQuote } from "@/domain";
import { StockBoard } from "@/surfaces/stock-market/StockBoard";
import styles from "@/surfaces/stock-market/StockMarket.module.css";
import "@/ui/tokens.css";
import "@/app/globals.css";

const quotes: StockQuote[] = ["Alpha", "Beta", "Gamma"].map((name, index) => ({
  playerId: `fixture-${name.toLowerCase()}`, playerName: `Synthetic ${name}`, position: "PG",
  nbaTeam: null, price: 30 - index, prevPrice: 20, change: 10 - index,
  changePct: 50 - index, trend: "up", ownership: 0, rookiePick: null,
}));
const detail = (playerId: string): StockDetail => ({
  playerId,
  spark: [{ date: "2025-01-01", price: 10, source: "backtest" }, { date: "2026-10-08", price: 30, source: "live" }],
  seasonHistory: Array.from({ length: 5 }, (_, index) => ({ season: String(2025 - index), fppg: 40 - index, games: 50 })),
  factors: (["age", "production", "injury", "dynasty", "recent", "trades", "draft", "faab"] as const).map((kind) => ({
    kind, label: `Synthetic ${kind}`, delta: 1,
    note: "Synthetic detail for tall-panel keyboard and scroll checks. ".repeat(6),
  })),
});
type Pending = { playerId: string; resolve: (value: StockDetail) => void; reject: (reason: Error) => void };

function Fixture() {
  const [stocks, setStocks] = useState(quotes);
  const [generation, setGeneration] = useState(0);
  const [mode, setMode] = useState("ready");
  const [handled, setHandled] = useState("none");
  const [calls, setCalls] = useState<string[]>([]);
  const [bubbled, setBubbled] = useState(0);
  const [descendantHandled, setDescendantHandled] = useState(0);
  const [alignment, setAlignment] = useState("Not measured. Check 1025px, the 1040/1041px boundary and 1440px.");
  const pending = useRef<Pending[]>([]);
  const modeRef = useRef(mode);
  useEffect(() => {
    if (handled === "none") return;
    const controls = new Set<HTMLElement>();
    const ownEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setDescendantHandled((current) => current + 1);
      if (handled === "prevent") event.preventDefault();
      else event.stopPropagation();
    };
    const bind = () => {
      document.querySelectorAll<HTMLElement>("#stock-inspector button, #stock-inspector a, #inspector-title").forEach((control) => {
        controls.add(control);
        control.addEventListener("keydown", ownEscape);
      });
    };
    const observer = new MutationObserver(bind);
    observer.observe(document.getElementById("root")!, { childList: true, subtree: true });
    bind();
    return () => { observer.disconnect(); for (const control of controls) control.removeEventListener("keydown", ownEscape); };
  }, [handled]);
  // The injected seam never calls fetch or any application data loader.
  const [loadDetail] = useState(() => (playerId: string) => {
    setCalls((current) => [...current, playerId]);
    if (modeRef.current === "error") return Promise.reject(new Error("Synthetic error"));
    if (modeRef.current === "pending") return new Promise<StockDetail>((resolve, reject) => {
      pending.current.push({ playerId, resolve, reject });
    });
    return Promise.resolve(detail(playerId));
  });
  return <main className={styles.exchange}
    onKeyDown={(event) => { if (event.key === "Escape") setBubbled((current) => current + 1); }}>
    <h1>Issue 65 · synthetic inspector</h1>
    <p>Local synthetic quotes and detail only. No application server or database.</p>
    <label>Detail response <select aria-label="Detail response" value={mode} onChange={(event) => { modeRef.current = event.target.value; setMode(event.target.value); }}>
      <option value="ready">Ready</option><option value="pending">Pending</option><option value="error">Error</option>
    </select></label>{" "}
    <label>Descendant Escape <select aria-label="Descendant Escape" value={handled} onChange={(event) => setHandled(event.target.value)}>
      <option value="none">Unhandled</option><option value="prevent">Prevent default</option><option value="stop">Stop propagation</option>
    </select></label>
    <p>
      <button onClick={() => { for (const request of pending.current.splice(0)) request.resolve(detail(request.playerId)); }}>Resolve pending</button>{" "}
      <button onClick={() => { for (const request of pending.current.splice(0)) request.reject(new Error("Synthetic pending error")); }}>Reject pending</button>{" "}
      <button onClick={() => setStocks([])}>Remove triggers</button>{" "}
      <button onClick={() => { setStocks(quotes); setGeneration((current) => current + 1); setCalls([]); }}>Reset board</button>{" "}
      <button>Outside inspector</button>
      {" "}<button onClick={(event) => {
        const root = event.currentTarget.closest("main")!;
        const header = root.querySelector<HTMLElement>(`.${styles["column-labels"]}`)!;
        const rows = [...root.querySelectorAll<HTMLElement>(`.${styles.player}`)];
        if (!rows.length) { setAlignment("No rows to compare. Reset the board first."); return; }
        const board = root.querySelector<HTMLElement>(`.${styles["board-panel"]}`)!;
        const grids = [header, ...rows].filter((grid) => getComputedStyle(grid).display !== "none");
        const overflow = Math.max(0, board.scrollWidth - board.clientWidth,
          document.documentElement.scrollWidth - document.documentElement.clientWidth,
          ...grids.flatMap((grid) => {
            const bounds = grid.getBoundingClientRect(), style = getComputedStyle(grid);
            const left = bounds.left + grid.clientLeft + parseFloat(style.paddingLeft);
            const right = bounds.left + grid.clientLeft + grid.clientWidth - parseFloat(style.paddingRight);
            return [...grid.children, ...grid.querySelectorAll("button, a")].flatMap((child) => {
              const cell = child as HTMLElement, rectangle = cell.getBoundingClientRect();
              return rectangle.width && rectangle.height ?
                [left - rectangle.left, rectangle.right - right, cell.scrollWidth - cell.clientWidth] : [];
            });
          }));
        const observation = `${window.innerWidth}px viewport / ${document.documentElement.clientWidth}px content · ` +
          `bounds ${overflow <= .5 ? "PASS" : "FAIL"}, maximum overflow ${overflow.toFixed(2)}px`;
        if (getComputedStyle(header).display === "none") {
          setAlignment(`${observation} · compact layout; desktop alignment not applicable.`);
          return;
        }
        const differences = rows.flatMap((row) => [2, 3, 4].map((column) => {
          const label = header.children[column].getBoundingClientRect();
          const cell = row.children[column].getBoundingClientRect();
          return Math.max(Math.abs(label.left - cell.left), Math.abs(label.right - cell.right));
        }));
        const maximum = Math.max(...differences);
        setAlignment(`${observation} · alignment ${maximum <= .5 ? "PASS" : "FAIL"} · ${rows.length} rows · ` +
          `maximum VALUE / CHANGE / IN LEAGUE boundary difference ${maximum.toFixed(2)}px.`);
      }}>Measure alignment and bounds</button>
    </p>
    <p role="status">Requests: {calls.length} ({calls.join(", ")}) · Escapes bubbled: {bubbled} · Descendant handled: {descendantHandled}</p>
    <p role="status">Layout observation: {alignment}</p>
    <StockBoard key={generation} stocks={stocks} loadDetail={loadDetail} />
    <button>After inspector</button>
  </main>;
}

createRoot(document.getElementById("root")!).render(
  window.location.pathname.startsWith("/player/") ?
    <main><h1>Synthetic player profile</h1><p>{window.location.pathname}</p><Link href="/" prefetch={false}>Return to fixture</Link></main> : <Fixture />,
);
