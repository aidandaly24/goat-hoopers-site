"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { PlayerStock } from "@/domain";
import { formatPrice, formatPct } from "./format";
import styles from "./CombinedTicker.module.css";

/**
 * The site-wide ticker, ESPN style: it alternates between league news
 * headlines and stock quotes — news for a stretch, then stocks, then
 * back again. The label names the current mode and links to the full
 * page (/news or /stocks).
 *
 * Pure CSS marquees (duplicated content, translateX loop) cross-fading
 * on a timer. No auto-switch under prefers-reduced-motion; the marquee
 * itself also stops per the CSS.
 */
const MODE_MS = 15_000;

export type TickerHeadline = {
  text: string;
  publication: string;
};

/**
 * Slim ticker DTO — only what the ticker renders. The full PlayerStock
 * (~1.2 KB each, mostly expand-only factors/history) never reaches the
 * client for the ticker. See perf audit on issue #16.
 */
export type TickerStock = Pick<
  PlayerStock,
  "playerId" | "playerName" | "price" | "trend" | "changePct"
>;

function StockItems({ stocks }: { stocks: TickerStock[] }) {
  return (
    <>
      {stocks.slice(0, 25).map((s) => (
        <span key={s.playerId} className={styles.item}>
          <span className={styles.name}>{s.playerName}</span>
          <span className={styles.price}>{formatPrice(s.price)}</span>
          <span
            className={
              s.trend === "up"
                ? styles.up
                : s.trend === "down"
                  ? styles.down
                  : styles.flat
            }
          >
            {s.changePct == null ? (
              "NEW"
            ) : (
              <>
                {s.trend === "up" ? "▲" : s.trend === "down" ? "▼" : "▪"}{" "}
                {formatPct(s.changePct)}
              </>
            )}
          </span>
        </span>
      ))}
    </>
  );
}

function NewsItems({ headlines }: { headlines: TickerHeadline[] }) {
  return (
    <>
      {headlines.map((h, i) => (
        <span key={i} className={styles.item}>
          <span className={styles.pub}>{h.publication}</span>
          <span className={styles.headline}>{h.text}</span>
        </span>
      ))}
    </>
  );
}

export function CombinedTicker({
  stocks,
  headlines,
}: {
  stocks: TickerStock[];
  headlines: TickerHeadline[];
}) {
  // If one feed is empty, park on the other permanently.
  const initial: "news" | "stocks" =
    headlines.length > 0 ? "news" : "stocks";
  const [mode, setMode] = useState<"news" | "stocks">(initial);

  useEffect(() => {
    if (headlines.length === 0 || stocks.length === 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(
      () => setMode((m) => (m === "news" ? "stocks" : "news")),
      MODE_MS
    );
    return () => clearInterval(t);
  }, [headlines.length, stocks.length]);

  return (
    <div className={styles.ticker}>
      <Link
        href={mode === "news" ? "/news" : "/stocks"}
        className={styles.hint}
        aria-label={
          mode === "news"
            ? "League news ticker — open the news page"
            : "Player stock ticker — open the full market"
        }
        title={mode === "news" ? "Open league news" : "Open the full market"}
      >
        {mode === "news" ? "News" : "Stocks"}&nbsp;→
      </Link>
      <div className={styles.viewport}>
        <div
          className={`${styles.track} ${mode === "news" ? styles.visible : styles.hidden}`}
          aria-hidden={mode !== "news"}
        >
          {[0, 1].map((copy) => (
            <span key={copy} className={styles.copy} aria-hidden={copy === 1}>
              <NewsItems headlines={headlines} />
            </span>
          ))}
        </div>
        <div
          className={`${styles.track} ${mode === "stocks" ? styles.visible : styles.hidden}`}
          aria-hidden={mode !== "stocks"}
        >
          {[0, 1].map((copy) => (
            <span key={copy} className={styles.copy} aria-hidden={copy === 1}>
              <StockItems stocks={stocks} />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
