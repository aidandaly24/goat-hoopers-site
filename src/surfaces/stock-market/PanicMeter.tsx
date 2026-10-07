import type { PanicSignal } from "@/domain";
import { Card } from "@/ui/Card";
import { formatPrice } from "./format";
import styles from "./PanicMeter.module.css";

/**
 * The panic meter — players with unusual trade/drop activity in the
 * window. Rule-based (see computeStockMarket): repeated trades, or a
 * rostered player getting dumped. Intensity 1 = keep an eye on it,
 * 2 = spicy, 3 = full panic.
 */
export function PanicMeter({ signals }: { signals: PanicSignal[] }) {
  if (signals.length === 0) {
    return <p className={styles.empty}>All quiet. Nobody is panicking… yet.</p>;
  }
  return (
    <ul className={styles.list}>
      {signals.map(({ stock, reason, intensity }) => (
        <li key={stock.playerId}>
          <Card className={styles.signal}>
            <div className={styles.row}>
              <span
                className={styles.meter}
                aria-label={`Panic intensity ${intensity} of 3`}
              >
                {[1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className={`${styles.bar} ${i <= intensity ? styles.lit : ""}`}
                  />
                ))}
              </span>
              <div>
                <div className={styles.name}>
                  {stock.playerName}{" "}
                  <span className={styles.price}>
                    {formatPrice(stock.price)}
                  </span>
                </div>
                <div className={styles.reason}>{reason}</div>
              </div>
            </div>
          </Card>
        </li>
      ))}
    </ul>
  );
}
