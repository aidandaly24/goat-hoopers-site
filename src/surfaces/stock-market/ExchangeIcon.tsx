import styles from "./StockMarket.module.css";

/** Small stroked SVGs, matching the site's existing navigation icon treatment. */
export function ExchangeIcon({ kind }: { kind: "inspect" | "chart" | "right" | "down" }) {
  return <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    {kind === "inspect" ? <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.2 15.2 5.8 5.8" /></> :
      kind === "chart" ? <><path d="M3 3v18h18" /><path d="m6 15 4-5 4 2 6-7" /></> :
        <path d={kind === "right" ? "m9 5 7 7-7 7" : "m5 9 7 7 7-7"} />}
  </svg>;
}
