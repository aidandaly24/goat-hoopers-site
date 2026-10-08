"use client";

import { useReducer, useRef } from "react";
import type { PriceHistoryPoint, StockDetail, StockQuote } from "@/domain";
import { formatPrice, formatPct, formatChange } from "./format";
import {
  createDetailLoader,
  detailReducer,
  type DetailState,
} from "./detailMachine";
import styles from "./StockRow.module.css";

/**
 * Inline SVG sparkline — no chart library, no JavaScript.
 * Both gamelog and yearly backtest prices are reconstructed estimates.
 */
function Sparkline({ points }: { points: PriceHistoryPoint[] }) {
  if (points.length < 2) return null;
  const w = 120;
  const h = 36;
  const prices = points.map((p) => p.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const coords = points.map(
    (p, i) =>
      `${((i / (points.length - 1)) * w).toFixed(1)},${(h - 2 - ((p.price - min) / range) * (h - 4)).toFixed(1)}`
  );
  const up = prices[prices.length - 1] >= prices[0];
  const stroke = up ? "var(--gh-term-up)" : "var(--gh-term-down)";
  // Group consecutive segments by style: dashed when either endpoint
  // is a backtest reconstruction.
  const segments: Array<{ coords: string[]; dashed: boolean }> = [];
  for (let i = 0; i < coords.length - 1; i++) {
    const dashed =
      points[i].source !== "live" || points[i + 1].source !== "live";
    const last = segments[segments.length - 1];
    if (last && last.dashed === dashed) {
      last.coords.push(coords[i + 1]);
    } else {
      segments.push({ coords: [coords[i], coords[i + 1]], dashed });
    }
  }
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={styles.spark}
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      {segments.map((s, i) => (
        <polyline
          key={i}
          points={s.coords.join(" ")}
          fill="none"
          stroke={stroke}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          strokeDasharray={s.dashed ? "4 3" : undefined}
          opacity={s.dashed ? 0.7 : 1}
        />
      ))}
    </svg>
  );
}

/**
 * Bloomberg-style season history chart: per-season fantasy PPG as bars,
 * newest season highlighted. Compact — lives inside the expanded row.
 * Inline SVG, no chart library.
 */
function SeasonChart({
  history,
}: {
  history: StockDetail["seasonHistory"];
}) {
  if (history.length === 0) return null;
  // Oldest → newest left to right; input is newest first.
  const seasons = [...history].reverse();
  const max = Math.max(...seasons.map((h) => h.fppg), 1);
  const w = 280;
  const h = 110;
  const padB = 30;
  const padT = 18;
  const slotW = w / seasons.length;
  const barW = Math.min(44, slotW * 0.55);
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={styles.seasonChart}
      role="img"
      aria-label="Fantasy points per game by season"
      preserveAspectRatio="xMidYMid meet"
    >
      {seasons.map((s, i) => {
        const barH = Math.max(3, ((h - padB - padT) * s.fppg) / max);
        const x = slotW * i + (slotW - barW) / 2;
        const y = h - padB - barH;
        const newest = i === seasons.length - 1;
        return (
          <g key={s.season}>
            <title>
              {s.season}: {s.fppg.toFixed(1)} fppg over {s.games} games
            </title>
            <rect
              x={x}
              y={y}
              width={barW}
              height={barH}
              rx="2"
              fill={
                newest ? "var(--gh-term-amber)" : "var(--gh-term-faint)"
              }
              opacity={newest ? 1 : 0.75}
            />
            <text
              x={x + barW / 2}
              y={y - 5}
              textAnchor="middle"
              className={styles.chartValue}
            >
              {s.fppg.toFixed(1)}
            </text>
            <text
              x={x + barW / 2}
              y={h - padB + 14}
              textAnchor="middle"
              className={styles.chartLabel}
            >
              {s.season.slice(2)}
            </text>
            <text
              x={x + barW / 2}
              y={h - 4}
              textAnchor="middle"
              className={styles.chartGames}
            >
              {s.games}g
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/**
 * One player's stock as a Yahoo Finance-style quote row: name + meta on
 * the left, mono price + colored move on the right.
 *
 * Per Rule 14 the row ships only its quote. Expanding fetches the deep
 * data (sparkline, season history chart, factor breakdown) on demand from
 * GET /api/stocks/[playerId] — never in the list HTML.
 *
 * The same-origin detail fetch is an allowed client boundary
 * (ARCHITECTURE.md §3): the API route owns server data access and
 * delegates to @/data/ loaders. No Sleeper/DB access in this component.
 * Detail loading is driven by the state machine in ./detailMachine:
 * a failed request can be retried by re-expanding the row or with the
 * Retry button; in-flight requests are never duplicated and ready
 * data is cached for the mounted row.
 */
export function StockRow({ quote: s }: { quote: StockQuote }) {
  const [detail, dispatch] = useReducer(detailReducer, {
    status: "idle",
  } satisfies DetailState);
  // Ref mirror so the async loader always reads fresh state without
  // re-creating the loader on every render.
  const stateRef = useRef<DetailState>(detail);
  const loaderRef = useRef<ReturnType<typeof createDetailLoader> | null>(null);
  if (loaderRef.current === null) {
    loaderRef.current = createDetailLoader({
      playerId: s.playerId,
      fetchDetail: async (playerId) => {
        const res = await fetch(`/api/stocks/${playerId}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return (await res.json()) as StockDetail;
      },
      getState: () => stateRef.current,
      dispatch: (event) => {
        stateRef.current = detailReducer(stateRef.current, event);
        dispatch(event);
      },
    });
  }

  const moveClass =
    s.trend === "up" ? styles.up : s.trend === "down" ? styles.down : styles.flat;
  const arrow = s.trend === "up" ? "▲" : s.trend === "down" ? "▼" : "▪";

  function onToggle(e: React.SyntheticEvent<HTMLDetailsElement>) {
    // Only fire on open. The loader's own guards (idle/error only,
    // in-flight dedupe) decide whether a request goes out.
    if (!e.currentTarget.open) return;
    void loaderRef.current?.load();
  }

  function onRetry() {
    void loaderRef.current?.load();
  }

  return (
    <li className={styles.item}>
      <details className={styles.row} onToggle={onToggle}>
        <summary className={styles.quote}>
          <span className={styles.who}>
            <span className={styles.name}>{s.playerName}</span>
            <span className={styles.meta}>
              {[s.position, s.nbaTeam].filter(Boolean).join(" · ")}
              {s.rookiePick != null && (
                <span className={styles.rookie}> · R#{s.rookiePick}</span>
              )}
            </span>
          </span>
          <span className={styles.numbers}>
            <span className={styles.price}>{formatPrice(s.price)}</span>
            {s.changePct == null ? (
              <span className={styles.newTag}>NEW</span>
            ) : (
              <span className={moveClass}>
                {arrow} {formatChange(s.change ?? 0)} ({formatPct(s.changePct)})
              </span>
            )}
          </span>
        </summary>
        <div className={styles.detail}>
          {detail.status === "idle" || detail.status === "loading" ? (
            <p className={styles.loading}>Loading the tape…</p>
          ) : detail.status === "error" ? (
            <p className={styles.loading}>
              Couldn&apos;t load the detail.{" "}
              <button
                type="button"
                className={styles.retry}
                onClick={onRetry}
              >
                Retry
              </button>
            </p>
          ) : (
            <>
              <div className={styles.detailHead}>
                <Sparkline points={detail.detail.spark} />
                <span className={styles.owned}>
                  {Math.round(s.ownership * 100)}% owned
                </span>
              </div>
              {detail.detail.spark.some(p => p.source !== "live") && (
                <p className={styles.loading}>Dashed: reconstructed FAAB estimates; solid: recorded site prices.</p>
              )}
              {detail.detail.seasonHistory.length > 0 && (
                <>
                  <p className={styles.whyHead}>
                    Production history (fppg)
                  </p>
                  <SeasonChart history={detail.detail.seasonHistory} />
                </>
              )}
              <p className={styles.whyHead}>Why this price</p>
              <ul className={styles.factors}>
                {detail.detail.factors.map((f) => (
                  <li key={f.kind} className={styles.factor}>
                    <span className={styles.factorLabel}>{f.label}</span>
                    <span
                      className={
                        f.delta > 0
                          ? styles.dUp
                          : f.delta < 0
                            ? styles.dDown
                            : styles.dFlat
                      }
                    >
                      {f.delta > 0 ? "+" : ""}
                      {f.delta.toFixed(2)}
                    </span>
                    <span className={styles.factorNote}>{f.note}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </details>
    </li>
  );
}
