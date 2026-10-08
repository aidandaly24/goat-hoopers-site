"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { StockQuote, TradeVerdict } from "@/domain";
import { analyzeTrade, tradeTotal } from "@/domain";
import styles from "./TradeAnalyzer.module.css";

const MAX_RESULTS = 8;

function fmt(n: number): string {
  return `$${n.toFixed(2)}`;
}

function SidePicker({
  label,
  stocks,
  picks,
  pickedIds,
  onAdd,
  onRemove,
}: {
  label: string;
  stocks: StockQuote[];
  picks: StockQuote[];
  pickedIds: Set<string>;
  onAdd: (q: StockQuote) => void;
  onRemove: (playerId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (q.length === 0) return [];
    return stocks
      .filter(
        (s) =>
          !pickedIds.has(s.playerId) &&
          s.playerName.toLowerCase().includes(q)
      )
      .slice(0, MAX_RESULTS);
  }, [stocks, q, pickedIds]);

  return (
    <section className={styles.side} aria-label={label}>
      <h2 className={styles.sideTitle}>{label}</h2>
      <div className={styles.searchWrap}>
        <input
          className={styles.search}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search players to add…"
          aria-label={`Search players for ${label}`}
          autoComplete="off"
        />
        {q.length > 0 && (
          <ul className={styles.results}>
            {results.map((s) => (
              <li key={s.playerId}>
                <button
                  type="button"
                  className={styles.result}
                  onClick={() => {
                    onAdd(s);
                    setQuery("");
                  }}
                >
                  <span className={styles.resultName}>{s.playerName}</span>
                  <span className={styles.resultMeta}>
                    {s.position ?? "—"} · {fmt(s.price)}
                  </span>
                </button>
              </li>
            ))}
            {results.length === 0 && (
              <li className={styles.noResults}>No matches.</li>
            )}
          </ul>
        )}
      </div>
      <ul className={styles.picks}>
        {picks.map((p) => (
          <li key={p.playerId} className={styles.pick}>
            <Link
              href={`/player/${p.playerId}`}
              className={styles.pickName}
            >
              {p.playerName}
            </Link>
            <span className={styles.pickMeta}>{p.position ?? "—"}</span>
            <span className={styles.pickPrice}>{fmt(p.price)}</span>
            <button
              type="button"
              className={styles.remove}
              onClick={() => onRemove(p.playerId)}
              aria-label={`Remove ${p.playerName} from ${label}`}
            >
              ×
            </button>
          </li>
        ))}
        {picks.length === 0 && (
          <li className={styles.emptySide}>No players yet — search above.</li>
        )}
      </ul>
      <div className={styles.total}>
        <span>TOTAL</span>
        <span className={styles.totalValue}>{fmt(tradeTotal(picks))}</span>
      </div>
    </section>
  );
}

function verdictCopy(v: TradeVerdict): {
  tone: "idle" | "fair" | "leans" | "fleece";
  title: string;
  sub: string;
} {
  switch (v.kind) {
    case "empty":
      return {
        tone: "idle",
        title: "> AWAITING INPUT",
        sub: "Add players to both sides to price the deal.",
      };
    case "fair":
      return {
        tone: "fair",
        title: "> FAIR DEAL",
        sub: `Dead even — ${fmt(v.diff)} apart (${(v.pct * 100).toFixed(1)}%). Nobody's getting fleeced. Shake hands.`,
      };
    case "leans":
      return {
        tone: "leans",
        title: `> LEANS TEAM ${v.winner}`,
        sub: `Team ${v.winner} banks ${fmt(v.diff)} more (${(v.pct * 100).toFixed(1)}%). Somebody's buying the dip — or selling it.`,
      };
    case "fleece":
      return {
        tone: "fleece",
        title: `> FLEECE ALERT: TEAM ${v.winner}`,
        sub: `Team ${v.winner} walks away with ${fmt(v.diff)} extra (${(v.pct * 100).toFixed(1)}%). Call the league office.`,
      };
  }
}

/**
 * trade-analyzer — price a hypothetical trade in FAAB dollars.
 *
 * Client surface: two pickers (Team A / Team B) with search, running
 * totals, and a verdict band from the domain's analyzeTrade. Receives
 * slim StockQuotes; never fetches.
 */
export function TradeAnalyzer({ stocks }: { stocks: StockQuote[] }) {
  const [sideA, setSideA] = useState<StockQuote[]>([]);
  const [sideB, setSideB] = useState<StockQuote[]>([]);

  const pickedIds = useMemo(
    () => new Set([...sideA, ...sideB].map((p) => p.playerId)),
    [sideA, sideB]
  );

  const add = (side: "A" | "B") => (q: StockQuote) => {
    const set = side === "A" ? setSideA : setSideB;
    set((prev) =>
      prev.some((p) => p.playerId === q.playerId) ? prev : [...prev, q]
    );
  };
  const remove = (side: "A" | "B") => (playerId: string) => {
    const set = side === "A" ? setSideA : setSideB;
    set((prev) => prev.filter((p) => p.playerId !== playerId));
  };

  const verdict = analyzeTrade(sideA, sideB);
  const copy = verdictCopy(verdict);

  return (
    <div className={styles.terminal}>
      <header className={styles.head}>
        <p className={styles.prompt}>~/goat-hoopers $ trade-analyzer</p>
        <h1 className={styles.title}>Trade Analyzer</h1>
        <p className={styles.lede}>
          Price a hypothetical deal in FAAB dollars. Within 10% is fair,
          10–25% leans, 25%+ is a fleece.
        </p>
      </header>
      <div className={styles.columns}>
        <SidePicker
          label="TEAM A"
          stocks={stocks}
          picks={sideA}
          pickedIds={pickedIds}
          onAdd={add("A")}
          onRemove={remove("A")}
        />
        <SidePicker
          label="TEAM B"
          stocks={stocks}
          picks={sideB}
          pickedIds={pickedIds}
          onAdd={add("B")}
          onRemove={remove("B")}
        />
      </div>
      <div className={styles.verdict} data-tone={copy.tone}>
        <p className={styles.verdictTitle}>{copy.title}</p>
        <p className={styles.verdictSub}>{copy.sub}</p>
      </div>
    </div>
  );
}
