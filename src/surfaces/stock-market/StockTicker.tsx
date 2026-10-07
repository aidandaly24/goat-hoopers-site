import Link from "next/link";
import type { PlayerStock } from "@/domain";
import { formatPrice, formatPct } from "./format";
import styles from "./StockTicker.module.css";

/**
 * Site-wide Bloomberg-style ticker. Rendered in the root layout above every
 * page. The whole bar is a link to /stocks (the full market page).
 *
 * Pure CSS marquee: the list is rendered twice inside a max-content track
 * and translated -50% on a loop — no JavaScript. Pauses on hover and
 * disables entirely under prefers-reduced-motion.
 *
 * Contract:
 * - Receives priced stocks (already sorted); shows the first 25.
 * - Renders nothing when there are no stocks — the layout must never
 *   break because the market failed to load.
 */
export function StockTicker({ stocks }: { stocks: PlayerStock[] }) {
  const shown = stocks.slice(0, 25);
  if (shown.length === 0) return null;

  return (
    <Link
      href="/stocks"
      className={styles.ticker}
      aria-label="Player stock market ticker — open the full market"
      title="Open the full player stock market"
    >
      <span className={styles.hint}>Full market&nbsp;→</span>
      <span className={styles.viewport}>
        <span className={styles.track}>
          {[0, 1].map((copy) => (
            <span key={copy} className={styles.copy} aria-hidden={copy === 1}>
              {shown.map((s) => (
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
                        {s.trend === "up"
                          ? "▲"
                          : s.trend === "down"
                            ? "▼"
                            : "▪"}{" "}
                        {formatPct(s.changePct)}
                      </>
                    )}
                  </span>
                </span>
              ))}
            </span>
          ))}
        </span>
      </span>
    </Link>
  );
}
