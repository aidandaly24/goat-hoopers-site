"use client";

import { useState } from "react";
import type { PlayerStock } from "@/domain";
import { StockRow } from "./StockRow";
import styles from "./StockBoard.module.css";

const POSITIONS = ["PG", "SG", "SF", "PF", "C"];

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
            {filtered.length} {filtered.length === 1 ? "stock" : "stocks"}
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
        <ul className={styles.list}>
          {filtered.map((s) => (
            <StockRow key={s.playerId} stock={s} />
          ))}
        </ul>
      )}
    </div>
  );
}
