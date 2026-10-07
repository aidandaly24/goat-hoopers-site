import type { PlayerStock } from "@/domain";
import { Badge } from "@/ui/Badge";
import { Card } from "@/ui/Card";
import { formatPrice, formatPct, formatChange } from "./format";
import styles from "./StockCard.module.css";

/** Inline SVG sparkline — no chart library, no JavaScript. */
function Sparkline({ points }: { points: number[] }) {
  if (points.length < 2) return null;
  const w = 96;
  const h = 32;
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
        stroke={up ? "var(--gh-win)" : "var(--gh-loss)"}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * One player's stock card: price, move, sparkline, and the full factor
 * breakdown inside a native <details> (no JavaScript needed to expand).
 */
export function StockCard({ stock }: { stock: PlayerStock }) {
  const s = stock;
  return (
    <Card className={styles.card}>
      <div className={styles.head}>
        <div>
          <div className={styles.name}>{s.playerName}</div>
          <div className={styles.meta}>
            {s.position && <Badge tone="neutral">{s.position}</Badge>}
            {s.nbaTeam && <span className={styles.team}>{s.nbaTeam}</span>}
            <span className={styles.owned}>
              {Math.round(s.ownership * 100)}% owned
            </span>
          </div>
        </div>
        <Sparkline points={s.spark} />
      </div>

      <div className={styles.quote}>
        <span className={styles.price}>{formatPrice(s.price)}</span>
        {s.changePct == null ? (
          <Badge tone="gold">NEW LISTING</Badge>
        ) : (
          <span
            className={
              s.trend === "up"
                ? styles.up
                : s.trend === "down"
                  ? styles.down
                  : styles.flat
            }
          >
            {s.trend === "up" ? "▲" : s.trend === "down" ? "▼" : "▪"}{" "}
            {formatChange(s.change ?? 0)} ({formatPct(s.changePct)})
          </span>
        )}
      </div>

      <details className={styles.factors}>
        <summary className={styles.summary}>Why this price</summary>
        <ul className={styles.factorList}>
          {s.factors.map((f) => (
            <li key={f.kind} className={styles.factor}>
              <span className={styles.factorLabel}>{f.label}</span>
              <span
                className={
                  f.delta > 0
                    ? styles.deltaUp
                    : f.delta < 0
                      ? styles.deltaDown
                      : styles.deltaFlat
                }
              >
                {f.delta > 0 ? "+" : ""}
                {f.delta.toFixed(2)}
              </span>
              <span className={styles.factorNote}>{f.note}</span>
            </li>
          ))}
        </ul>
      </details>
    </Card>
  );
}
