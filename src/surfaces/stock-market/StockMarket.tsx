import Link from "next/link";
import type { StockMarket as StockMarketData } from "@/domain";
import { Badge } from "@/ui/Badge";
import { StockBoard } from "./StockBoard";
import { formatPct, formatPrice } from "./format";
import { ExchangeIcon } from "./ExchangeIcon";
import styles from "./StockMarket.module.css";

/** Server summary + slim quote board. Detailed data loads only on selection. */
export function StockMarket({ market }: { market: StockMarketData }) {
  const rostered = market.stocks.filter((s) => s.ownership > 0).length;
  const drafted = market.stocks.filter((s) => s.rookiePick !== null).length;
  const noBaseline = market.stocks.filter((s) => s.changePct === null).length;
  const asof = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "UTC",
  }).format(new Date(market.updatedAt));
  const hasSignals = market.trending.length > 0 || market.falling.length > 0 || market.panic.length > 0;
  return <main className={styles.exchange}>
    <a className={styles.skip} href="#player-board">Skip to player board</a>
    <header className={styles["page-head"]}>
      <div><p className={styles.eyebrow}>THE LEAGUE / PLAYER VALUES</p>
        <h1>Player exchange<span className={styles["title-dot"]}>.</span></h1>
        <p className={styles.intro}>Dynasty value, in league FAAB. Find a player. Understand the price.</p></div>
      <div className={styles.basis}><Badge tone="gold">{market.pricingBasis === "preseason" ? "Preseason pricing" : "In-season pricing"}</Badge>
        <span className={`${styles.muted} gh-num`}>Computed {asof} UTC</span><a href="#model-notes">How prices work <ExchangeIcon kind="down" /></a></div>
    </header>
    <section className={styles["market-strip"]} aria-label="Market coverage">
      {[
        ["LISTED PLAYERS", market.stocks.length, "League market footprint"],
        ["ON A ROSTER", rostered, "In this league"],
        ["DRAFT PEDIGREE", drafted, "Recorded league draft pick"],
        ["NO PRICE BASELINE", noBaseline, "Change is unavailable"],
      ].map(([label, count, note]) => <div key={label}><span className={styles["metric-label"]}>{label}</span>
        <strong className="gh-num">{count}</strong><span>{note}</span></div>)}
    </section>
    <div className={styles["tape-note"]}><span className={styles["tape-label"]}>THE TAPE</span>
      <p>{market.stocks.length === 0 ? "Listings are unavailable. Try again when league data returns." :
        !market.hasHistory ? "Prices are available. Movers appear once a previous recorded price exists." :
        hasSignals ? `${market.trending.length} gainers · ${market.falling.length} decliners · ${market.panic.length} activity signals. Moves compare with the previous recorded price.` :
        "No moves beyond ±2% since the previous recorded price. Explore the board below."}</p>
      <Link href="/transactions" prefetch={false}>League activity <ExchangeIcon kind="right" /></Link>
    </div>
    {hasSignals ? <details className={styles["market-signals"]}><summary>Market movers & league activity <span>+</span></summary>
      <div className={styles["signal-grid"]}>
        {[{ title: "Top gainers", quotes: market.trending }, { title: "Top decliners", quotes: market.falling }].map(({ title, quotes }) =>
          <section key={title}><h2>{title}</h2>
            <ul>{quotes.slice(0, 5).map((s) => <li key={s.playerId}>
              <Link href={`/player/${s.playerId}`} prefetch={false}>{s.playerName}</Link><span className="gh-num">{formatPrice(s.price)} · {s.changePct !== null ? formatPct(s.changePct) : "No baseline"}</span>
            </li>)}</ul></section>)}
        <section><h2>Activity signals</h2><ul>{market.panic.slice(0, 5).map((signal) => <li key={signal.stock.playerId}>
          <Link href={`/player/${signal.stock.playerId}`} prefetch={false}>{signal.stock.playerName}</Link><span>{signal.reason}</span>
        </li>)}</ul></section>
      </div>
    </details> : null}
    <StockBoard key={market.updatedAt} stocks={market.stocks} />
    <details className={styles["model-notes"]} id="model-notes"><summary>How to read the exchange <span>+</span></summary><div>
      <p>Values are modeled in the league’s waiver currency. Production and draft pedigree form the ability estimate; the age curve, league activity, and injury status adjust it.</p>
      <p>Change compares today’s quote with the previous available recorded price. It is not a fixed 24-hour return. A missing baseline is shown as unavailable, never as a zero move.</p>
      <p>“Drafted” means a recorded league draft pick exists. “Rostered” means the player is held in this league. This board lists players with a league market footprint, rather than the entire NBA.</p>
    </div></details>
  </main>;
}
