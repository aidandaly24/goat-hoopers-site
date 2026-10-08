import type { StockQuote } from "@/domain";
import { PlayerHeadshot } from "@/ui/PlayerHeadshot";
import Link from "next/link";
import { formatChange, formatPct, formatPrice } from "./format";
import { ExchangeIcon } from "./ExchangeIcon";
import styles from "./StockMarket.module.css";

export function moveClass(value: number | null) {
  return value === null || value === 0 ? styles.neutral : value > 0 ? styles.up : styles.down;
}

export function StockQuoteRow({ quote, rank, selected, onInspect }: {
  quote: StockQuote;
  rank: number;
  selected: boolean;
  onInspect: (quote: StockQuote, trigger: HTMLButtonElement) => void;
}) {
  const meta = [quote.position, quote.nbaTeam,
    quote.rookiePick !== null ? `Draft #${quote.rookiePick}` : null].filter(Boolean).join(" · ");
  return (
    <li className={`${styles.player} ${selected ? styles.selected : ""}`}>
      <span className={`${styles.rank} gh-num`} aria-label={`Value rank ${rank}`}>{String(rank).padStart(2, "0")}</span>
      <div className={styles["player-identity"]}>
        <span className={styles.avatar}><PlayerHeadshot espnId={quote.espnId ?? null} name={quote.playerName} size={32} /></span>
        <div><button type="button" className={`${styles["player-name"]} ${styles["name-button"]}`}
          aria-label={`${quote.playerName} price history`} aria-expanded={selected} aria-controls="stock-inspector"
          onClick={(event) => onInspect(quote, event.currentTarget)}>{quote.playerName}</button>
          <span className={styles["player-meta"]}>{meta || "Player metadata unavailable"}</span></div>
      </div>
      <span className={`${styles.price} gh-num`} aria-label={`Value ${formatPrice(quote.price)} FAAB`}>{formatPrice(quote.price)}</span>
      <span className={`${styles.change} gh-num ${moveClass(quote.changePct)}`}>
        {quote.changePct === null ? <>—<small>No baseline</small><span className={styles["sr-only"]}>No price baseline</span></> :
          <>{formatPct(quote.changePct)}<small>{quote.change !== null ? formatChange(quote.change) : ""}</small></>}
      </span>
      <span className={styles["roster-status"]}>{quote.ownership > 0 ? "Rostered" : "Unrostered"}</span>
      <div className={styles["player-actions"]}>
        <button type="button" className={styles["inspect-button"]} aria-label={`Price history for ${quote.playerName}`}
          aria-expanded={selected} aria-controls="stock-inspector"
          onClick={(event) => onInspect(quote, event.currentTarget)}><ExchangeIcon kind="chart" /> Price history</button>
        <Link href={`/player/${quote.playerId}`} className={styles["profile-link"]} prefetch={false}
          aria-label={`Full profile for ${quote.playerName}`}>Full profile</Link>
      </div>
    </li>
  );
}
