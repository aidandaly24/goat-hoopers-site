import type { StockMarket as StockMarketData } from "@/domain";
import { SectionHeading } from "@/ui/SectionHeading";
import { StockCard } from "./StockCard";
import { PanicMeter } from "./PanicMeter";
import { formatPrice } from "./format";
import styles from "./StockMarket.module.css";

/**
 * stock-market — the league's player stock market, Bloomberg-terminal style.
 *
 * One coherent experience for "what is every player worth right now":
 * the movers (trending up / falling), the panic meter (unusual trade/drop
 * activity), and the full board. Prices are modeled in FAAB dollars from
 * real league signals — see the model notes in `src/data/transform.ts`.
 *
 * Contract:
 * - Receives a fully-loaded `StockMarket` (see `src/data/league.ts`).
 * - Never fetches. Never touches Sleeper. Domain objects in, JSX out.
 * - The site-wide ticker is a separate component (`StockTicker`), rendered
 *   by the root layout — this surface owns the full-page experience.
 */
export function StockMarket({ market }: { market: StockMarketData }) {
  const ups = market.stocks.filter((s) => s.trend === "up").length;
  const downs = market.stocks.filter((s) => s.trend === "down").length;
  const fresh = market.stocks.filter((s) => s.changePct == null).length;

  return (
    <div className={styles.surface}>
      <div className={styles.hero}>
        <p className={styles.eyebrow}>GOAT Hoopers exchange</p>
        <h1 className={styles.title}>Player Stock Market</h1>
        <p className={styles.lede}>
          Every player priced like a stock, in FAAB dollars — blended from
          age, production, injuries, dynasty outlook, recent form, league
          trades, draft capital, and real waiver bids.
        </p>
        <div className={styles.tape}>
          <span className={styles.tapeUp}>{ups} up</span>
          <span className={styles.tapeDown}>{downs} down</span>
          <span className={styles.tapeNew}>{fresh} new listings</span>
        </div>
      </div>

      <section>
        <SectionHeading eyebrow="Movers" title="Trending" />
        {market.trending.length === 0 ? (
          <p className={styles.empty}>
            {market.hasHistory
              ? "No big gainers yet — check back after the next snapshot."
              : "Trending unlocks after the first price snapshot. Prices are live now; movers appear on the next refresh."}
          </p>
        ) : (
          <div className={styles.grid}>
            {market.trending.map((s) => (
              <StockCard key={s.playerId} stock={s} />
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionHeading eyebrow="Movers" title="Falling" />
        {market.falling.length === 0 ? (
          <p className={styles.empty}>
            {market.hasHistory
              ? "No big losers yet — check back after the next snapshot."
              : "Falling unlocks after the first price snapshot. Prices are live now; movers appear on the next refresh."}
          </p>
        ) : (
          <div className={styles.grid}>
            {market.falling.map((s) => (
              <StockCard key={s.playerId} stock={s} />
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionHeading eyebrow="Signals" title="Panic Meter" />
        <PanicMeter signals={market.panic} />
      </section>

      <section>
        <SectionHeading
          eyebrow="Full board"
          title="All stocks"
          action={
            <span className={styles.asof}>
              Updated{" "}
              {new Date(market.updatedAt).toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
          }
        />
        {market.stocks.length === 0 ? (
          <p className={styles.empty}>
            No players have market activity yet — the board fills in as the
            league makes moves.
          </p>
        ) : (
          <ol className={styles.board}>
            {market.stocks.map((s, i) => (
              <li key={s.playerId} className={styles.row}>
                <span className={styles.rank}>{i + 1}</span>
                <span className={styles.who}>
                  <span className={styles.whoName}>{s.playerName}</span>
                  <span className={styles.whoMeta}>
                    {[s.position, s.nbaTeam].filter(Boolean).join(" · ")}
                  </span>
                </span>
                <span className={styles.rowPrice}>{formatPrice(s.price)}</span>
                <span
                  className={
                    s.trend === "up"
                      ? styles.rowUp
                      : s.trend === "down"
                        ? styles.rowDown
                        : styles.rowFlat
                  }
                >
                  {s.changePct == null
                    ? "NEW"
                    : `${s.trend === "up" ? "▲" : s.trend === "down" ? "▼" : "▪"} ${Math.abs(s.changePct).toFixed(1)}%`}
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
