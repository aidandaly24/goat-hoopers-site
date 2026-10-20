import Link from "next/link";
import type { TeamHistoryMove, TeamValueHistoryDetail as HistoryDetail } from "@/domain/team-value-history";
import { compareHistoryRosters } from "./team-value-history-view";
import styles from "./TeamValueHistory.module.css";

const money = (cents: number) => `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const signed = (cents: number) => `${cents < 0 ? "−" : "+"}${money(Math.abs(cents))}`;
const date = (day: string) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${day}T00:00:00Z`));
const moveDay = (move: TeamHistoryMove) => move.precision === "instant" ? move.effectiveAt!.slice(0, 10) : move.day;

function Move({ move }: { move: TeamHistoryMove }) {
  const players = [...new Map([...move.adds, ...move.drops].map(player => [player.id, player])).values()];
  return <li data-history-move>
    <strong>{move.origin === "boundary-reconciliation" ? "Boundary reconciliation" : move.type.replaceAll("_", " ")}</strong>
    <span>{move.precision === "instant" ? `${move.effectiveAt} UTC` : move.precision === "day" ? date(move.day!) : "Effective date unknown"}</span>
    {move.type === "trade" ? <>
      <p>Players in this trade: {players.length ? players.map(player => player.name).join(", ") : "Player terms unavailable"}</p>
      <p className={styles.caption}>Received/sent sides, other assets and historical trade net are unavailable in this history. No current prices are substituted.</p>
    </> : <>
      {move.adds.length > 0 && <p>Source additions: {move.adds.map(player => player.name).join(", ")}</p>}
      {move.drops.length > 0 && <p>Source removals: {move.drops.map(player => player.name).join(", ")}</p>}
    </>}
    {move.note && <p>{move.note}</p>}
    <details><summary>Move source</summary><small>{move.origin === "transaction" ? "Completed source transaction" : "Derived source event"} · {move.sourceId} · {move.sourceRef}</small></details>
  </li>;
}

/** V1 source facts only. Direction and at-trade prices require the producer extension. */
export function TeamValueHistoryDetail({ detail, previous, comparisonLoading, comparisonError, retryComparison }: {
  detail: HistoryDetail; previous?: HistoryDetail;
  comparisonLoading?: boolean; comparisonError?: "changed" | "unavailable"; retryComparison?: () => void;
}) {
  const comparison = previous ? compareHistoryRosters(previous, detail) : null;
  const changes = new Map(comparison?.continuing.map(player => [player.id, player]));
  const entered = new Set(comparison?.entered.map(player => player.id));
  const datedMoves = detail.moves.filter(move => moveDay(move) === detail.day);
  const otherMoves = detail.moves.filter(move => moveDay(move) !== detail.day);
  return <div className={styles.inspection} data-history-detail>
    <p className={styles.caption}>{detail.rosterStatus === "verified" ? "Independently verified roster" : detail.rosterStatus === "replayed" ? "Replayed roster · not independently verified at every date" : "Roster cannot be verified for this date"}. {detail.priced} of {detail.rosterCount ?? "unknown"} players priced.</p>
    {comparisonLoading && <p className={styles.caption} role="status">Loading the previous supported observation…</p>}
    {comparisonError && <div role="status" className={styles.caption}>
      <p>{comparisonError === "changed" ? "History changed. Refresh before comparing these observations." : "The previous observation could not be loaded. This day's evidence remains available."}</p>
      {comparisonError === "unavailable" && retryComparison && <button type="button" onClick={retryComparison}>Retry comparison</button>}
    </div>}
    {comparison ? <div className={styles.comparison} data-history-comparison>
      <h4>Since {date(comparison.previousDay)}</h4>
      <p>{comparison.daysApart} {comparison.daysApart === 1 ? "day" : "days"} between observations. Gaps are not daily price history.</p>
      {comparison.totalDifferenceCents !== null && <p><strong>{signed(comparison.totalDifferenceCents)}</strong> recorded roster-value difference. Quote changes and roster moves may both contribute; this is not trade profit.</p>}
      <p className={styles.caption}>Player changes below compare compatible dated quotes only. Missing prices or changed source basis stay unknown.</p>
    </div> : !comparisonLoading && !comparisonError && <p className={styles.caption}>No comparable earlier observation is loaded for this date. Current prices do not fill the gap.</p>}
    <h4 className={styles.subheading}>Player values on {date(detail.day)}</h4>
    {detail.players.length ? <ul className={styles.players}>{detail.players.map(player => {
      const change = changes.get(player.id);
      return <li key={player.id} data-history-player={player.id}>
        <div><Link prefetch={false} href={`/player/${encodeURIComponent(player.id)}`}>{player.name}</Link>
          {entered.has(player.id) && <small>Joined this roster between the two observations</small>}
          {change && <small data-player-change>{change.beforeCents === null ? "Unpriced" : money(change.beforeCents)} → {change.afterCents === null ? "Unpriced" : money(change.afterCents)} · {change.deltaCents === null ? "Change unavailable" : signed(change.deltaCents)}</small>}
        </div>
        <div className={styles.playerPrice}><strong>{player.priceCents === null ? "Unpriced" : money(player.priceCents)}</strong>
          <small>{player.price?.kind === "recorded" ? "Recorded model" : player.price ? `Reconstructed · ${player.price.modelVersion}` : player.missingReason}</small>
          {player.price && <details className={styles.proof}><summary>Price source</summary>
            <p>{player.price.kind === "recorded" ? <>Quote {player.price.quoteId} · {player.price.nativeTimestamp} UTC.</> : <>{player.price.source} · {player.price.modelVersion} · {player.price.datasetId} · inputs through {player.price.inputCutoff}.</>}</p>
            <p>Eligible from {player.price.availableFrom}{player.price.validUntil ? ` until ${player.price.validUntil} (exclusive)` : "; no carry inferred"}.</p>
          </details>}
        </div>
      </li>;
    })}</ul> : <p>{detail.rosterCount === 0 ? "No players on this roster at the selected date." : "The historical roster is unavailable for this date."}</p>}
    {!!comparison?.exited.length && <div className={styles.moves} data-history-exited><h4>Left this roster between observations</h4><ul>{comparison.exited.map(player => <li key={player.id}>{player.name} · {player.priceCents === null ? "Unpriced" : money(player.priceCents)} at {date(comparison.previousDay)}</li>)}</ul><p className={styles.caption}>These are values at the earlier observation, not prices paid in a trade.</p></div>}
    <div className={styles.moves}><h4>Roster moves on {date(detail.day)}</h4>
      {datedMoves.length ? <ol>{datedMoves.map(move => <Move key={move.id} move={move} />)}</ol> : <p>No sourced move dated to this day was returned. This does not establish a complete transaction archive.</p>}
      {!!otherMoves.length && <details><summary>Nearby moves or timing unknown ({otherMoves.length})</summary><ol>{otherMoves.map(move => <Move key={move.id} move={move} />)}</ol></details>}
      {detail.movesTruncated && <p className={styles.caption}>More moves exist; this is a bounded selection.</p>}
      <Link prefetch={false} href="/transactions">Full transaction history</Link>
    </div>
    {!!detail.rosterEvidence.length && <details className={styles.evidence}><summary>Roster evidence</summary><ul>{detail.rosterEvidence.map((note, i) => <li key={i}>{note}</li>)}</ul></details>}
  </div>;
}
