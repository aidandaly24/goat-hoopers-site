import type { PlayerStock } from "@/domain";
import { formatPrice, formatPct, formatChange } from "./format";
import styles from "./StockRow.module.css";

/** Inline SVG sparkline — no chart library, no JavaScript. */
function Sparkline({ points }: { points: number[] }) {
  if (points.length < 2) return null;
  const w = 120;
  const h = 36;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const coords = points.map(
    (p, i) =>
      `${((i / (points.length - 1)) * w).toFixed(1)},${(h - 2 - ((p - min) / range) * (h - 4)).toFixed(1)}`
  );
  const up = points[points.length - 1] >= points[0];
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={styles.spark}
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      <polyline
        points={coords.join(" ")}
        fill="none"
        stroke={up ? "var(--gh-term-up)" : "var(--gh-term-down)"}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * One player's stock as a Yahoo Finance-style quote row: name + meta on
 * the left, mono price + colored move on the right. Expands (native
 * <details>, no JavaScript) to the sparkline and the "why this price"
 * factor breakdown.
 */
export function StockRow({ stock: s }: { stock: PlayerStock }) {
  const moveClass =
    s.trend === "up" ? styles.up : s.trend === "down" ? styles.down : styles.flat;
  const arrow = s.trend === "up" ? "▲" : s.trend === "down" ? "▼" : "▪";
  return (
    <li className={styles.item}>
      <details className={styles.row}>
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
          <div className={styles.detailHead}>
            <Sparkline points={s.spark} />
            <span className={styles.owned}>
              {Math.round(s.ownership * 100)}% owned
            </span>
          </div>
          <p className={styles.whyHead}>Why this price</p>
          <ul className={styles.factors}>
            {s.factors.map((f) => (
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
        </div>
      </details>
    </li>
  );
}
