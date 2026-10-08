"use client";

import { useEffect, useRef, useState } from "react";
import type { PlayerStock } from "@/domain";
import { StockRow } from "./StockRow";
import styles from "./StockBoard.module.css";

const POSITIONS = ["PG", "SG", "SF", "PF", "C"];
/** Rows rendered per "page" — the rest load as you scroll. */
const PAGE_SIZE = 25;

/**
 * The full board: Yahoo Finance-style quote rows with filter chips above.
 * "All" resets everything; position chips single-select; "Rookies" is an
 * independent toggle that combines with the position filter.
 */
export function StockBoard({ stocks }: { stocks: PlayerStock[] }) {
  const [pos, setPos] = useState<string | null>(null);
  const [rookiesOnly, setRookiesOnly] = useState(false);
  const [query, setQuery] = useState("");

  // Search always wins: a typed query searches the whole board and
  // bypasses the position/rookie filters, so a stale chip can never
  // hide the player you're looking for.
  const q = query.trim().toLowerCase();
  const searching = q.length > 0;
  const filtered = stocks.filter((s) =>
    searching
      ? s.playerName.toLowerCase().includes(q)
      : (pos === null || s.position === pos) &&
        (!rookiesOnly || s.rookiePick !== null)
  );

  const allActive = pos === null && !rookiesOnly;

  // Progressive loading: render the first page, then grow as the
  // sentinel scrolls into view. Resets whenever the filter changes.
  const [visible, setVisible] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [pos, rookiesOnly, q]);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || visible >= filtered.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible((v) => Math.min(v + PAGE_SIZE, filtered.length));
        }
      },
      { rootMargin: "600px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visible, filtered.length]);
  const shown = filtered.slice(0, visible);

  return (
    <div>
      <div className={styles.filters}>
        <div className={styles.chips} role="group" aria-label="Filter stocks">
          <button
            type="button"
            className={allActive ? styles.chipActive : styles.chip}
            onClick={() => {
              setPos(null);
              setRookiesOnly(false);
            }}
          >
            All
          </button>
          {POSITIONS.map((p) => (
            <button
              key={p}
              type="button"
              className={pos === p ? styles.chipActive : styles.chip}
              onClick={() => setPos((cur) => (cur === p ? null : p))}
            >
              {p}
            </button>
          ))}
          <button
            type="button"
            className={rookiesOnly ? styles.chipActive : styles.chip}
            onClick={() => setRookiesOnly((v) => !v)}
            aria-pressed={rookiesOnly}
          >
            Rookies
          </button>
        </div>

        <div className={styles.searchWrap}>
          <svg
            className={styles.searchIcon}
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.8-3.8" />
          </svg>
          <input
            type="text"
            className={styles.search}
            placeholder="Search players…"
            aria-label="Search stocks by player name"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button
              type="button"
              className={styles.clear}
              onClick={() => setQuery("")}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>
      </div>

      <p className={styles.count}>
        {searching ? (
          <>
            {filtered.length} {filtered.length === 1 ? "result" : "results"}{" "}
            for &ldquo;{query.trim()}&rdquo;
          </>
        ) : (
          <>
            Showing {shown.length} of {filtered.length}{" "}
            {filtered.length === 1 ? "stock" : "stocks"}
          </>
        )}
      </p>

      {filtered.length === 0 ? (
        <p className={styles.empty}>
          {searching ? (
            <>No players match &ldquo;{query.trim()}&rdquo;.</>
          ) : (
            <>No stocks match this filter — try widening it.</>
          )}
        </p>
      ) : (
        <>
          <ul className={styles.list}>
            {shown.map((s) => (
              <StockRow key={s.playerId} stock={s} />
            ))}
          </ul>
          {visible < filtered.length && <div ref={sentinelRef} aria-hidden="true" />}
        </>
      )}
    </div>
  );
}
