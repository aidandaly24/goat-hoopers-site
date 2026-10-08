import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import Link from "next/link";
import type { StockDetail, StockQuote } from "@/domain";
import { StockBoard } from "@/surfaces/stock-market/StockBoard";
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
  return <main style={{ padding: "var(--gh-s4)", maxWidth: "90rem", margin: "auto" }}
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
    </p>
    <p role="status">Requests: {calls.length} ({calls.join(", ")}) · Escapes bubbled: {bubbled} · Descendant handled: {descendantHandled}</p>
    <StockBoard key={generation} stocks={stocks} loadDetail={loadDetail} />
    <button>After inspector</button>
  </main>;
}

createRoot(document.getElementById("root")!).render(
  window.location.pathname.startsWith("/player/") ?
    <main><h1>Synthetic player profile</h1><p>{window.location.pathname}</p><Link href="/" prefetch={false}>Return to fixture</Link></main> : <Fixture />,
);
