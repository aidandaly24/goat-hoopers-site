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

  const filtered = stocks.filter(
    (s) =>
      (pos === null || s.position === pos) &&
      (!rookiesOnly || s.rookiePick !== null)
  );

  const allActive = pos === null && !rookiesOnly;

  return (
    <div>
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

      <p className={styles.count}>
        {filtered.length} {filtered.length === 1 ? "stock" : "stocks"}
      </p>

      {filtered.length === 0 ? (
        <p className={styles.empty}>
          No stocks match this filter — try widening it.
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
