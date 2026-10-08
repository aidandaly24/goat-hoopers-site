import type { StockMarket as StockMarketData } from "@/domain";
import { StockRow } from "./StockRow";
import { StockBoard } from "./StockBoard";
import { PanicMeter } from "./PanicMeter";
import styles from "./StockMarket.module.css";

/**
 * stock-market — the league's player stock market, as a Bloomberg
 * terminal: a deliberate dark island (see the --gh-term-* tokens).
 * Yahoo Finance-style quote rows, top gainers/decliners, the panic
 * meter, and the full filterable board. Prices are modeled in FAAB
 * dollars from real league signals — see the model notes in
 * `src/data/transform.ts`.
 *
 * Contract:
 * - Receives a fully-loaded `StockMarket` (see `src/data/league.ts`).
 * - Never fetches. Never touches Sleeper. Domain objects in, JSX out.
 * - The site-wide ticker is a separate component (`CombinedTicker`),
 *   rendered by the root layout — this surface owns the full page.
 * - The board's position/rookie filters live in the client component
 *   `StockBoard`; everything else renders on the server.
 */
export function StockMarket({ market }: { market: StockMarketData }) {
  const ups = market.stocks.filter((s) => s.trend === "up").length;
  const downs = market.stocks.filter((s) => s.trend === "down").length;
  const fresh = market.stocks.filter((s) => s.changePct == null).length;
  const asof = new Date(market.updatedAt).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className={styles.terminal}>
      <header className={styles.head}>
        <p className={styles.eyebrow}>GOAT Hoopers exchange · live</p>
        <h1 className={styles.title}>Player Stock Market</h1>
        <div className={styles.stats}>
          <span className={styles.statUp}>▲ {ups} up</span>
          <span className={styles.statDown}>▼ {downs} down</span>
          <span className={styles.statNew}>{fresh} new</span>
          <span className={styles.asof}>
            Updated {asof} · priced in FAAB $
          </span>
        </div>
      </header>

      <div className={styles.movers}>
        <section>
          <h2 className={styles.sect}>Top gainers</h2>
          {market.trending.length === 0 ? (
            <p className={styles.empty}>
              {market.hasHistory
                ? "No big gainers yet — check back after the next snapshot."
                : "Gainers unlock after the first price snapshot. Prices are live now; movers appear on the next refresh."}
            </p>
          ) : (
            <ul className={styles.list}>
              {market.trending.slice(0, 5).map((s) => (
                <StockRow key={s.playerId} quote={s} />
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className={styles.sect}>Top decliners</h2>
          {market.falling.length === 0 ? (
            <p className={styles.empty}>
              {market.hasHistory
                ? "No big losers yet — check back after the next snapshot."
                : "Decliners unlock after the first price snapshot. Prices are live now; movers appear on the next refresh."}
            </p>
          ) : (
            <ul className={styles.list}>
              {market.falling.slice(0, 5).map((s) => (
                <StockRow key={s.playerId} quote={s} />
              ))}
            </ul>
          )}
        </section>
      </div>

      <section>
        <h2 className={styles.sect}>Panic meter</h2>
        <PanicMeter signals={market.panic} />
      </section>

      <section>
        <h2 className={styles.sect}>All stocks</h2>
        <StockBoard stocks={market.stocks} />
      </section>

      <p className={styles.foot}>
        Every price is modeled from age, production, injuries, dynasty
        outlook, recent form, league trades, draft capital, and real waiver
        bids. Tap any row for the full breakdown.
      </p>
    </div>
  );
}
