"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { StockQuote } from "@/domain";
import { fetchStockDetail } from "@/data/stock-detail-client";
import { fetchStockHistoryPage, type LoadStockHistoryPage } from "@/data/stock-history-client";
import { DEFAULT_FILTERS, PAGE_SIZE, filterStocks, visibleStocks, type BoardFilters } from "./board";
import { createDetailLoader, type LoadStockDetail } from "./detail";
import { StockQuoteRow } from "./StockQuoteRow";
import { StockInspector, type DetailState } from "./StockInspector";
import { ExchangeIcon } from "./ExchangeIcon";
import styles from "./StockMarket.module.css";

const POSITIONS = ["PG", "SG", "SF", "PF", "C"];

/** Slim quotes first; this board owns one cached, on-demand inspector. */
export function StockBoard({ stocks, loadDetail = fetchStockDetail, loadHistory = fetchStockHistoryPage }: {
  stocks: StockQuote[];
  /** Existing same-origin endpoint by default; injectable for focused UI tests. */
  loadDetail?: LoadStockDetail;
  loadHistory?: LoadStockHistoryPage;
}) {
  const [filters, setFilters] = useState<BoardFilters>(DEFAULT_FILTERS);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [selected, setSelected] = useState<StockQuote | null>(null);
  const [detail, setDetail] = useState<DetailState>({ status: "idle" });
  const [getDetail] = useState(() => createDetailLoader(loadDetail));
  const request = useRef(0);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const boardHeadingRef = useRef<HTMLHeadingElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const restoreFocusRef = useRef(false);
  useEffect(() => () => { request.current += 1; }, []);
  useLayoutEffect(() => {
    if (selected !== null || !restoreFocusRef.current) return;
    restoreFocusRef.current = false;
    // Mobile hides the inspector above the board. Restore against the new
    // row positions after that DOM change, before the browser paints.
    const trigger = triggerRef.current;
    if (trigger?.isConnected) {
      trigger.focus({ preventScroll: true });
      if (window.matchMedia("(max-width:64rem)").matches) trigger.scrollIntoView({ block: "center" });
    } else boardHeadingRef.current?.focus();
  }, [selected]);

  const filtered = filterStocks(stocks, filters);
  const shown = visibleStocks(filtered, visible);
  const ranks = new Map(stocks.map((s, index) => [s.playerId, index + 1]));
  const firstExample = stocks.find((s) => s.playerId === "2577") ?? stocks[0];
  const secondExample = stocks.find((s) => s.playerId === "4866") ??
    stocks.find((s) => s.rookiePick !== null && s.playerId !== firstExample?.playerId);
  const examples = [firstExample, secondExample].filter((s): s is StockQuote => Boolean(s));

  function updateFilters(patch: Partial<BoardFilters>) {
    setFilters((current) => ({ ...current, ...patch }));
    setVisible(PAGE_SIZE);
  }

  async function inspect(quote: StockQuote, trigger?: HTMLButtonElement) {
    restoreFocusRef.current = false;
    if (trigger) triggerRef.current = trigger;
    const currentRequest = ++request.current;
    setSelected(quote);
    setDetail({ status: "loading" });
    requestAnimationFrame(() => {
      if (request.current !== currentRequest) return;
      headingRef.current?.focus({ preventScroll: true });
      if (window.matchMedia("(max-width:64rem)").matches)
        headingRef.current?.closest("aside")?.scrollIntoView({ block: "start" });
    });
    try {
      const loaded = await getDetail(quote.playerId);
      if (request.current === currentRequest) setDetail({ status: "ready", detail: loaded });
    } catch {
      if (request.current === currentRequest) setDetail({ status: "error" });
    }
  }

  function close() {
    request.current += 1;
    restoreFocusRef.current = true;
    setSelected(null);
    setDetail({ status: "idle" });
  }

  return <div className={styles.workspace}>
    <section className={styles["board-panel"]} id="player-board" aria-labelledby="board-title">
      <div className={styles["section-top"]}><div><p className={styles.eyebrow}>SCOUT THE LEAGUE</p>
        <h2 id="board-title" tabIndex={-1} ref={boardHeadingRef}>The player board</h2></div><span className={styles.unit}>FAAB $</span></div>
      <div className={styles.toolbar}>
        <label className={styles["search-label"]}><span className={styles["sr-only"]}>Search players</span><span aria-hidden="true"><ExchangeIcon kind="inspect" /></span>
          <input type="search" placeholder="Search every listed player…" autoComplete="off" value={filters.query}
            onChange={(event) => updateFilters({ query: event.target.value })} /></label>
        <label className={styles["sort-label"]}><span className={styles["sr-only"]}>Sort players</span>
          <select value={filters.sort} onChange={(event) => updateFilters({ sort: event.target.value as BoardFilters["sort"] })}>
            <option value="price">Highest value</option><option value="change">Largest increase</option>
            <option value="falling">Largest decrease</option><option value="name">Player A–Z</option>
          </select></label>
      </div>
      <div className={styles["filter-row"]}>
        <div className={styles.chips} role="group" aria-label="Position">
          {["", ...POSITIONS].map((position) => <button type="button" key={position}
            className={`${styles.chip} ${filters.position === position ? styles.active : ""}`}
            aria-pressed={filters.position === position} onClick={() => updateFilters({ position })}>{position || "All"}</button>)}
        </div>
        <button type="button" className={`${styles.chip} ${filters.drafted ? styles.active : ""}`} aria-pressed={filters.drafted}
          onClick={() => updateFilters({ drafted: !filters.drafted })}>Drafted</button>
        <label className={styles["sr-only"]} htmlFor="stock-roster-filter">Roster status</label>
        <select id="stock-roster-filter" value={filters.roster} onChange={(event) => updateFilters({ roster: event.target.value as BoardFilters["roster"] })}>
          <option value="all">Any roster status</option><option value="rostered">Rostered</option><option value="unrostered">Unrostered</option>
        </select>
      </div>
      <p className={styles["board-caption"]}><span className="gh-num" role="status" aria-live="polite">{shown.length} of {filtered.length} players</span>
        <span>Change vs previous recorded price</span></p>
      <div className={styles["column-labels"]} aria-hidden="true"><span>#</span><span>PLAYER</span><span>VALUE</span><span>CHANGE</span><span>IN LEAGUE</span><span /></div>
      {filtered.length > 0 ? <>
        <ol className={styles["player-list"]}>{shown.map((quote) => <StockQuoteRow key={quote.playerId} quote={quote}
          rank={ranks.get(quote.playerId) ?? 0} selected={selected?.playerId === quote.playerId} onInspect={inspect} />)}</ol>
        {shown.length < filtered.length ? <button type="button" className={styles["more-button"]}
          onClick={() => setVisible((current) => current + PAGE_SIZE)}>Show 25 more players <ExchangeIcon kind="down" /></button> : null}
      </> : <div className={styles["empty-result"]}><h3>{stocks.length === 0 ? "No listings available" : "No players match"}</h3>
        <p>{stocks.length === 0 ? "League listings are unavailable. Try again later." : "Try another name, position, or roster status."}</p>
        {stocks.length > 0 ? <button type="button" className={styles["outline-button"]} onClick={() => updateFilters(DEFAULT_FILTERS)}>Reset filters</button> : null}
      </div>}
    </section>
    <StockInspector quote={selected} detail={detail} headingRef={headingRef} onClose={close} loadHistory={loadHistory}
      onRetry={() => { if (selected && detail.status === "error") void inspect(selected); }} examples={examples} onInspect={inspect} />
  </div>;
}
