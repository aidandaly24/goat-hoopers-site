"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { PlayerStock, LiveGame } from "@/domain";
import { useLiveGames } from "@/data/espn-client";
import { formatPrice, formatPct } from "./format";
import styles from "./CombinedTicker.module.css";

/**
 * The site-wide ticker, ESPN style: it alternates between league news
 * headlines, stock quotes, and — on game days — live NBA scores. News
 * for a stretch, then stocks, then scores, then back again. The label
 * names the current mode and links to the full page (/news, /stocks,
 * or ESPN's scoreboard for scores).
 *
 * The scores mode is fed by ESPN's public scoreboard API, polled
 * directly from the browser every 60s and only while games are live or
 * scheduled today (see src/data/espn.ts). If ESPN is unreachable the
 * mode silently never appears — the ticker parks on News/Stocks.
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

type TickerMode = "news" | "stocks" | "scores";

const MODE_META: Record<
  TickerMode,
  { label: string; href: string; aria: string; title: string; external?: boolean }
> = {
  news: {
    label: "News",
    href: "/news",
    aria: "League news ticker — open the news page",
    title: "Open league news",
  },
  stocks: {
    label: "Stocks",
    href: "/stocks",
    aria: "Player stock ticker — open the full market",
    title: "Open the full market",
  },
  scores: {
    label: "Scores",
    href: "https://www.espn.com/nba/scoreboard",
    aria: "Live NBA scores — open ESPN scoreboard",
    title: "Open ESPN scoreboard",
    external: true,
  },
};

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

function ScoreItems({ games }: { games: LiveGame[] }) {
  return (
    <>
      {games.map((g) =>
        g.status === "scheduled" ? (
          <span key={g.id} className={styles.item}>
            <span className={styles.name}>{g.awayAbbr}</span>
            <span className={styles.at}>@</span>
            <span className={styles.name}>{g.homeAbbr}</span>
            <span className={styles.clock}>{g.clock}</span>
          </span>
        ) : (
          <span key={g.id} className={styles.item}>
            <span className={styles.name}>{g.awayAbbr}</span>
            <span className={styles.score}>{g.awayScore}</span>
            <span className={styles.at}>·</span>
            <span className={styles.name}>{g.homeAbbr}</span>
            <span className={styles.score}>{g.homeScore}</span>
            {g.status === "in-progress" ? (
              <span className={styles.live}>
                <span className={styles.liveDot} aria-hidden="true" /> {g.clock}
              </span>
            ) : (
              <span className={styles.clock}>{g.clock}</span>
            )}
          </span>
        )
      )}
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
  // Live scores arrive asynchronously from the browser-side ESPN poll.
  // Null until the first fetch resolves; null forever on failure or
  // off-days — the scores mode then silently never joins the rotation.
  const games = useLiveGames();
  const hasScores = games !== null && games.length > 0;

  // Modes with content, in rotation order.
  const modes = useMemo<TickerMode[]>(() => {
    const m: TickerMode[] = [];
    if (headlines.length > 0) m.push("news");
    if (stocks.length > 0) m.push("stocks");
    if (hasScores) m.push("scores");
    return m;
  }, [headlines.length, stocks.length, hasScores]);

  const [mode, setMode] = useState<TickerMode>("news");

  // If the current mode loses its content (shouldn't happen for
  // news/stocks, but cheap insurance), park on the first available.
  useEffect(() => {
    if (modes.length > 0 && !modes.includes(mode)) {
      setMode(modes[0]);
    }
  }, [modes, mode]);

  useEffect(() => {
    if (modes.length <= 1) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => {
      setMode((m) => {
        const i = modes.indexOf(m);
        return modes[(i + 1) % modes.length];
      });
    }, MODE_MS);
    return () => clearInterval(t);
  }, [modes]);

  const meta = MODE_META[mode];
  const hint = meta.external ? (
    <a
      href={meta.href}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.hint}
      aria-label={meta.aria}
      title={meta.title}
    >
      {meta.label}&nbsp;→
    </a>
  ) : (
    <Link
      href={meta.href}
      className={styles.hint}
      aria-label={meta.aria}
      title={meta.title}
    >
      {meta.label}&nbsp;→
    </Link>
  );

  return (
    <div className={styles.ticker}>
      {hint}
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
        <div
          className={`${styles.track} ${mode === "scores" ? styles.visible : styles.hidden}`}
          aria-hidden={mode !== "scores"}
        >
          {[0, 1].map((copy) => (
            <span key={copy} className={styles.copy} aria-hidden={copy === 1}>
              {games !== null && <ScoreItems games={games} />}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
