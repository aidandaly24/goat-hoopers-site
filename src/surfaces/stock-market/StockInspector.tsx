import type { CSSProperties, Ref } from "react";
import type { StockDetail, StockQuote } from "@/domain";
import { PlayerName } from "@/ui/PlayerRow";
import Link from "next/link";
import { formatPct, formatPrice } from "./format";
import { moveClass } from "./StockQuoteRow";
import { priceSegments } from "./board";
import { ExchangeIcon } from "./ExchangeIcon";
import styles from "./StockMarket.module.css";

export type DetailState = { status: "idle" | "loading" | "error" } | { status: "ready"; detail: StockDetail };

const dateLabel = (date: string) => new Intl.DateTimeFormat("en-GB", {
  day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
}).format(new Date(date));

function DetailContents({ detail }: { detail: StockDetail }) {
  const seasons = [...detail.seasonHistory].reverse();
  const maxFppg = Math.max(...seasons.map((s) => s.fppg), 1);
  const segments = priceSegments(detail.spark);
  const first = detail.spark[0];
  const last = detail.spark[detail.spark.length - 1];
  const sources = [...new Set(detail.spark.map((p) => p.source))];
  const hasRecordedPrices = detail.spark.slice(0, -1).some((p) => p.source === "live");
  const sourceLabels = { gamelog: "Game-log FAAB estimates (dashed)", backtest: "Annual FAAB estimates (dashed)", live: hasRecordedPrices ? "Recorded site prices + current quote (solid)" : "Current modeled quote (solid)" };
  return <>
    <section className={styles["detail-section"]} aria-labelledby="stock-price-history">
      <h4 id="stock-price-history">Value history</h4>
      {segments.length > 0 ? <>
        <svg className={styles.sparkline} viewBox="0 0 280 48" role="img"
          aria-label={`FAAB value history from ${dateLabel(first.date)} to ${dateLabel(last.date)}. ${sources.map((s) => sourceLabels[s]).join("; ")}.`}>
          {segments.map((segment, index) => <polyline key={index} points={segment.coords.join(" ")} fill="none"
            stroke="var(--gh-gold)" strokeWidth="2" strokeDasharray={segment.dashed ? "4 3" : undefined}
            opacity={segment.dashed ? 0.7 : 1} />)}
        </svg>
        <div className={`${styles["spark-caption"]} gh-num`}><span>{dateLabel(first.date)}<br />{formatPrice(first.price)}<br />{first.source === "live" ? "Recorded" : "Estimated"}</span><span>{dateLabel(last.date)}<br />{formatPrice(last.price)}<br />{last.source === "live" ? "Current quote" : "Estimated"}</span></div>
        <p className={styles["section-note"]}>{sources.map((s) => sourceLabels[s]).join(" · ")}. Reconstructed estimates use historical inputs. Recorded prices are site snapshots; the final value is the current modeled quote. Values are in FAAB.</p>
      </> : <p className={styles["section-note"]}>{detail.spark.length === 1 ? first.source === "live" ? "Current modeled quote only. Historical value points are unavailable." : `One ${first.source === "gamelog" ? "game-log FAAB estimate" : "annual FAAB estimate"} is available. A chart appears when more history points exist.` : "Value history is unavailable. A chart appears when history points exist."}</p>}
    </section>
    <section className={styles["detail-section"]} aria-labelledby="stock-production-history">
      <h4 id="stock-production-history">Production history</h4>
      {seasons.length ? <>
        <div className={styles["season-bars"]} role="img" aria-label={seasons.map((s) => `${s.season}: ${s.fppg.toFixed(1)} fantasy points per game, ${s.games} games`).join("; ")}>
          {seasons.map((s) => <div className={styles["season-column"]} key={s.season} aria-hidden="true">
            <span className={styles["bar-value"]}>{s.fppg.toFixed(1)}</span>
            <span className={styles.bar} style={{ "--bar-height": `calc(var(--gh-s16) * ${Math.max(0.05, s.fppg / maxFppg) * 1.125})` } as CSSProperties} />
            <span className={styles["bar-label"]}>{s.season}</span><span className={styles["bar-games"]}>{s.games} games</span>
          </div>)}
        </div>
        <p className={styles["section-note"]}>Fantasy PPG in this league’s scoring. Games shown for context.</p>
      </> : <p className={styles["section-note"]}>NBA production history is unavailable for this player.</p>}
    </section>
    <section className={styles["detail-section"]} aria-labelledby="stock-price-components">
      <h4 id="stock-price-components">Price components · FAAB</h4>
      <p className={styles["section-note"]}>Explains the price level; these are not changes since the previous snapshot.</p>
      {detail.factors.filter((f) => f.kind !== "contract").map((factor) => <div className={styles.factor} key={factor.kind}>
        <span className={styles["factor-name"]}>{factor.label}</span><span className={`${styles["factor-value"]} gh-num ${moveClass(factor.delta)}`}>
          {factor.delta > 0 ? "+" : factor.delta < 0 ? "−" : ""}{formatPrice(Math.abs(factor.delta))}
        </span><p>{factor.note}</p>
      </div>)}
      {detail.factors.length === 0 ? <p className={styles["section-note"]}>Price components are unavailable.</p> : null}
    </section>
  </>;
}

export function StockInspector({ quote, detail, headingRef, onClose, onRetry, examples, onInspect }: {
  quote: StockQuote | null;
  detail: DetailState;
  headingRef: Ref<HTMLHeadingElement>;
  onClose: () => void;
  onRetry: () => void;
  examples: StockQuote[];
  onInspect: (quote: StockQuote, trigger: HTMLButtonElement) => void;
}) {
  return <aside id="stock-inspector" className={`${styles.inspector} ${quote ? styles["has-selection"] : ""}`} aria-labelledby="inspector-title">
    <div className={styles["inspector-head"]}><p className={styles.eyebrow}>A CLOSER LOOK</p>
      <h2 id="inspector-title" tabIndex={-1} ref={headingRef} aria-label={quote ? `Inside the price: ${quote.playerName}` : undefined}>Inside the price</h2>
      {quote ? <button type="button" className={styles["close-detail"]} onClick={onClose} aria-label="Close player detail">×</button> : null}
    </div>
    <div className={styles["detail-content"]}>
      {quote ? <>
        <div className={styles["detail-identity"]}>
          <h3><PlayerName player={{ id: quote.playerId, fullName: quote.playerName }} /></h3>
          <span className={styles["player-meta"]}>{[quote.position, quote.nbaTeam, quote.rookiePick !== null ? `League draft #${quote.rookiePick}` : null].filter(Boolean).join(" · ")}</span>
          <div className={`${styles["detail-price"]} gh-num`}><strong>{formatPrice(quote.price)}</strong>
            <span className={moveClass(quote.changePct)}>{quote.changePct === null ? "— No baseline" : formatPct(quote.changePct)}</span></div>
          <p className={styles["detail-baseline"]}>{quote.prevPrice === null ? "Previous recorded price unavailable" : `Previous recorded price ${formatPrice(quote.prevPrice)}`} · FAAB</p>
        </div>
        {detail.status === "ready" ? <DetailContents detail={detail.detail} /> :
          <div className={styles["detail-state"]} role="status" aria-live="polite" aria-busy={detail.status === "loading"}>
            {detail.status === "error" ? <><h3>Detail temporarily unavailable</h3><p>The quote remains available. Retry the detail when ready.</p>
              <button type="button" className={styles["outline-button"]} onClick={onRetry}>Retry detail</button></> : <p>Loading player detail…</p>}
          </div>}
        <Link href={`/player/${quote.playerId}`} className={styles["detail-link"]} prefetch={false}>Player profile & league moves <ExchangeIcon kind="right" /></Link>
      </> : <div className={styles["detail-prompt"]}><span className={styles["prompt-symbol"]} aria-hidden="true"><ExchangeIcon kind="chart" /></span><h3>Follow the numbers.</h3>
        <p>Choose a player to explore recorded production, price history, and the components behind their value.</p>
        {examples.map((example, index) => <button type="button" key={example.playerId} className={styles[index === 0 ? "outline-button" : "text-button"]}
          onClick={(event) => onInspect(example, event.currentTarget)}>{index === 0 ? `Explore ${example.playerName.split(" ").at(-1)}` : "Or inspect a drafted player"} <ExchangeIcon kind="right" /></button>)}
      </div>}
    </div>
  </aside>;
}
