import Link from "next/link";
import type { TeamHistoryMove, TeamValueHistoryDetail as HistoryDetail } from "@/domain/team-value-history";
import { compareHistoryRosters, historyPickDirection, historyRosterId } from "./team-value-history-view";
import styles from "./TeamValueHistory.module.css";

const money = (cents: number) => `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const signed = (cents: number) => `${cents < 0 ? "−" : "+"}${money(Math.abs(cents))}`;
const date = (day: string) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${day}T00:00:00Z`));
const moveDay = (move: TeamHistoryMove) => move.precision === "instant" ? move.effectiveAt!.slice(0, 10) : move.day;

function Move({ move, rosterId }: { move: TeamHistoryMove; rosterId: number | null }) {
  const received = move.adds.filter(player => player.rosterId === rosterId);
  const sent = move.drops.filter(player => player.rosterId === rosterId);
  const participants = [...new Set(move.rosterIds)].filter(id => id !== rosterId).sort((a, b) => a - b);
  const directions = { received: "Received pick", sent: "Sent pick", unchanged: "Ownership unchanged", other: "Other recorded pick", unresolved: "Selected-roster direction unavailable" };
  return <li data-history-move>
    <strong>{move.origin === "boundary-reconciliation" ? "Boundary reconciliation" : move.type.replaceAll("_", " ")}</strong>
    <span>{move.precision === "instant" ? `${move.effectiveAt} UTC · source timestamp` : move.precision === "day" ? `${date(move.day!)} UTC · day precision only` : "Effective date unknown"}</span>
    <p className={styles.caption}>Source league {move.leagueId}{move.leg !== null ? ` · week ${move.leg}` : " · week not recorded"}</p>
    {rosterId !== null ? <div className={styles.moveTerms}>
      <p data-move-received><strong>Received players · roster {rosterId}</strong><span>{received.length ? received.map(player => player.name).join(", ") : "No player additions recorded for this roster."}</span></p>
      <p data-move-sent><strong>Sent players · roster {rosterId}</strong><span>{sent.length ? sent.map(player => player.name).join(", ") : "No player removals recorded for this roster."}</span></p>
    </div> : <div><p>Selected roster ID unavailable. These source legs cannot be assigned to this team.</p>
      <ul>{move.adds.map((player, i) => <li key={`add-${i}`}>Received by roster {player.rosterId}: {player.name}</li>)}
        {move.drops.map((player, i) => <li key={`drop-${i}`}>Sent by roster {player.rosterId}: {player.name}</li>)}</ul>
    </div>}
    <p data-move-participants>{rosterId === null ? "Declared participants" : "Other declared participants"}: {participants.length ? participants.map(id => `Roster ${id}`).join(", ") : "None listed in this record"}. </p>
    <div data-move-picks>
      <strong>Draft pick terms</strong>
      {move.draftPicks === null ? <p>Pick terms unavailable: the source record does not carry this field.</p>
        : move.draftPicks.length === 0 ? <p>No draft picks carried by this record.</p>
        : <ul>{move.draftPicks.map((pick, i) => <li key={i} data-pick-direction={historyPickDirection(pick, rosterId)}>
          <strong>{directions[historyPickDirection(pick, rosterId)]}</strong>
          <span>{pick.season ?? "Season unavailable"} · {pick.round === null ? "round unavailable" : `round ${pick.round}`}</span>
          <span>{pick.rosterId === null ? "Original roster unavailable" : `Original roster ${pick.rosterId}`}</span>
          <span>{pick.previousOwnerId === null ? "Previous owner unavailable" : `From roster ${pick.previousOwnerId}`} · {pick.ownerId === null ? "Recipient unavailable" : `To roster ${pick.ownerId}`}</span>
        </li>)}</ul>}
    </div>
    {(move.waiverBid !== null || move.type === "waiver") && <p data-move-bid><strong>Source waiver bid: </strong>{move.waiverBid === null ? "Not recorded" : `${move.waiverBid.toLocaleString("en-US")} FAAB units`}. This is a transaction field, not a player valuation.</p>}
    {move.type === "trade" && <p className={styles.caption}>Trade net: unavailable.</p>}
    {move.note && <p>{move.note}</p>}
    <details><summary>Move source</summary><small>{move.origin === "transaction" ? "Completed source transaction" : "Derived source event"} · {move.sourceId} · {move.sourceRef} · league {move.leagueId}{move.waiverBid !== null ? " · waiver bid from Sleeper settings.waiver_bid" : ""}</small></details>
  </li>;
}

/** Display the source-owned move contract without enriching identities or prices. */
export function TeamValueHistoryDetail({ detail, previous, comparisonLoading, comparisonError, retryComparison }: {
  detail: HistoryDetail; previous?: HistoryDetail;
  comparisonLoading?: boolean; comparisonError?: "changed" | "unavailable"; retryComparison?: () => void;
}) {
  const rosterId = historyRosterId(detail.teamId);
  const comparison = previous ? compareHistoryRosters(previous, detail) : null;
  const changes = new Map(comparison?.continuing.map(player => [player.id, player]));
  const changed = (comparison?.continuing ?? []).filter(player => player.deltaCents !== null && player.deltaCents !== 0)
    .sort((a, b) => Math.abs(b.deltaCents!) - Math.abs(a.deltaCents!) || a.id.localeCompare(b.id));
  const unchanged = comparison?.continuing.filter(player => player.deltaCents === 0).length ?? 0;
  const unknown = comparison?.continuing.filter(player => player.deltaCents === null).length ?? 0;
  const entered = new Set(comparison?.entered.map(player => player.id));
  const [basis, ...moreEvidence] = detail.rosterEvidence;
  const datedMoves = detail.moves.filter(move => moveDay(move) === detail.day);
  const otherMoves = detail.moves.filter(move => moveDay(move) !== detail.day);
  return <div className={styles.inspection} data-history-detail>
    <h4 className={styles.subheading}>Player changes on {date(detail.day)}</h4>
    {comparisonLoading && <p className={styles.caption} role="status">Loading the previous supported observation…</p>}
    {comparisonError && <div role="status" className={styles.caption}>
      <p>{comparisonError === "changed" ? "History changed. Refresh before comparing these observations." : "The previous observation could not be loaded. This day's evidence remains available."}</p>
      {comparisonError === "unavailable" && retryComparison && <button type="button" onClick={retryComparison}>Retry comparison</button>}
    </div>}
    {comparison ? <>
      <div className={styles.changeSummary} data-history-comparison>
        <p>Since {date(comparison.previousDay)} · {changed.length} changed{unchanged > 0 ? ` · ${unchanged} unchanged` : ""}{unknown > 0 ? ` · ${unknown} comparison${unknown === 1 ? "" : "s"} unavailable` : ""}</p>
      </div>
      {changed.length ? <ul className={styles.priceChanges} data-history-price-changes>{changed.map(player => <li key={player.id} data-history-price-change={player.id}>
        <div><Link prefetch={false} href={`/player/${encodeURIComponent(player.id)}`}>{player.name}</Link>
          <small>{money(player.beforeCents!)} <span aria-label="to">→</span> {money(player.afterCents!)}</small></div>
        <strong>{signed(player.deltaCents!)}</strong>
      </li>)}</ul> : <p className={styles.caption} data-history-no-changes>No comparable player-price changes.{unknown > 0 ? " Unavailable comparisons are not counted as unchanged." : ""}</p>}
    </> : !comparisonLoading && !comparisonError && <p className={styles.caption}>No earlier comparable value. Player changes are unavailable.</p>}
    <details className={styles.snapshot} data-history-snapshot><summary>Selected roster · {detail.rosterCount ?? "unknown"} players{unknown > 0 ? ` · ${unknown} comparison${unknown === 1 ? "" : "s"} unavailable` : ""}</summary>
    <h4 className={styles.subheading}>Player values on {date(detail.day)}</h4>
    {detail.players.length ? <ul className={styles.players}>{detail.players.map(player => {
      const change = changes.get(player.id);
      return <li key={player.id} data-history-player={player.id}>
        <div><Link prefetch={false} href={`/player/${encodeURIComponent(player.id)}`}>{player.name}</Link>
          {entered.has(player.id) && <small>Joined this roster between the two observations</small>}
          {change && <small data-player-change>{change.beforeCents === null ? "Unpriced" : money(change.beforeCents)} to {change.afterCents === null ? "Unpriced" : money(change.afterCents)} · {change.deltaCents === null ? "Comparison unavailable" : change.deltaCents === 0 ? "Unchanged" : signed(change.deltaCents)}</small>}
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
    {!!comparison?.entered.length && <p className={styles.caption}>{comparison.entered.length} roster addition{comparison.entered.length === 1 ? "" : "s"} between observations; these are not comparable price changes.</p>}
    </details>
    <details className={styles.moves}><summary>Recorded moves · {datedMoves.length}{otherMoves.length ? ` dated, ${otherMoves.length} nearby or undated` : " dated"}</summary><h4>Roster moves on {date(detail.day)}</h4>
      <p className={styles.caption}>Recorded roster changes</p>
      {datedMoves.length ? <ol>{datedMoves.map(move => <Move key={move.id} move={move} rosterId={rosterId} />)}</ol> : <p>No sourced move dated to this day was returned. This does not establish a complete transaction archive.</p>}
      {!!otherMoves.length && <details><summary>Nearby moves or timing unknown ({otherMoves.length})</summary><ol>{otherMoves.map(move => <Move key={move.id} move={move} rosterId={rosterId} />)}</ol></details>}
      {detail.movesTruncated && <p className={styles.caption}>More moves exist; this is a bounded selection.</p>}
      <Link prefetch={false} href="/transactions">Browse transactions</Link>
    </details>
    <details className={styles.evidence}><summary>Snapshot evidence</summary>
      <p className={styles.caption}>{detail.rosterStatus === "verified" ? "Independently verified roster" : detail.rosterStatus === "replayed" ? "Replayed roster · not independently verified at every date" : "Roster cannot be verified for this date"}. {detail.priced} of {detail.rosterCount ?? "unknown"} players priced.</p>
      <p className={styles.caption} data-history-inspection>Inspection time · <time dateTime={detail.valuationAt}>{detail.valuationAt}</time></p>
      {basis && <p className={styles.caption} data-history-roster-basis>{basis}</p>}
      {comparison && <p>{comparison.daysApart} {comparison.daysApart === 1 ? "day" : "days"} between observations. Gaps are not daily price history. Quote changes and roster moves may both contribute to the roster difference; this is not trade profit.</p>}
      {comparison?.totalDifferenceCents !== null && comparison?.totalDifferenceCents !== undefined && <p><strong>{signed(comparison.totalDifferenceCents)}</strong> recorded roster-value difference.</p>}
      <p className={styles.caption}>Player changes compare compatible dated quotes only. Missing prices or changed source basis stay unknown.</p>
      {!!moreEvidence.length && <ul>{moreEvidence.map((note, i) => <li key={i}>{note}</li>)}</ul>}
    </details>
  </div>;
}
