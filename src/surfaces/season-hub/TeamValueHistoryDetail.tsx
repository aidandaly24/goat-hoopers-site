import Link from "next/link";
import { PlayerHeadshot } from "@/ui/PlayerHeadshot";
import type { TeamHistoryMove, TeamValueHistoryDetail as HistoryDetail } from "@/domain/team-value-history";
import { compareHistoryRosters, historyPickDirection, historyRosterId } from "./team-value-history-view";
import styles from "./TeamValueHistory.module.css";

const money = (cents: number) => `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const signed = (cents: number) => `${cents < 0 ? "−" : "+"}${money(Math.abs(cents))}`;
const date = (day: string) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${day}T00:00:00Z`));
const moveDay = (move: TeamHistoryMove) => move.precision === "instant" ? move.effectiveAt!.slice(0, 10) : move.day;
const shortDate = (day: string) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${day}T00:00:00Z`));
export type HistoryPlayerPhotos = Record<string, { espnId: string | null; portraitSrc?: string }>;

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
export function TeamValueHistoryDetail({ detail, previous, comparisonLoading, comparisonError, retryComparison, playerPhotos = {} }: {
  detail: HistoryDetail; previous?: HistoryDetail;
  comparisonLoading?: boolean; comparisonError?: "changed" | "unavailable"; retryComparison?: () => void;
  playerPhotos?: HistoryPlayerPhotos;
}) {
  const rosterId = historyRosterId(detail.teamId);
  const comparison = previous ? compareHistoryRosters(previous, detail) : null;
  const changed = (comparison?.continuing ?? []).filter(player => player.deltaCents !== null && player.deltaCents !== 0)
    .sort((a, b) => Math.abs(b.deltaCents!) - Math.abs(a.deltaCents!) || a.id.localeCompare(b.id));
  const unchanged = comparison?.continuing.filter(player => player.deltaCents === 0).length ?? 0;
  const unknown = comparison?.continuing.filter(player => player.deltaCents === null).length ?? 0;
  const known = comparison?.continuing.filter(player => player.deltaCents !== null).length ?? 0;
  const net = changed.reduce((sum, player) => sum + player.deltaCents!, 0);
  const [basis, ...moreEvidence] = detail.rosterEvidence;
  const datedMoves = detail.moves.filter(move => moveDay(move) === detail.day);
  const otherMoves = detail.moves.filter(move => moveDay(move) !== detail.day);
  return <div className={styles.inspection} data-history-detail>
    <header className={styles.changeHeader}>
      <div><p className={styles.changeEyebrow}>Player changes</p><h4 className={styles.changeHeading}>{date(detail.day)}</h4>
        <p className={styles.changePeriod}>{comparison ? `Compared with ${date(comparison.previousDay)}${comparison.daysApart > 1 ? ` · ${comparison.daysApart} days apart` : ""}` : "Selected historical date"} · UTC</p></div>
      {comparison && known > 0 && <div className={styles.changeNet} data-history-change-net>
        <span>{unknown > 0 ? "Known price change subtotal" : "Comparable price change"}</span>
        <strong className={net > 0 ? styles.gain : net < 0 ? styles.loss : undefined}>{signed(net)}</strong>
      </div>}
    </header>
    {comparisonLoading && <p className={styles.caption} role="status">Loading the previous supported observation…</p>}
    {comparisonError && <div role="status" className={styles.caption}>
      <p>{comparisonError === "changed" ? "History changed. Refresh before comparing these observations." : "The previous observation could not be loaded. This day's evidence remains available."}</p>
      {comparisonError === "unavailable" && retryComparison && <button type="button" onClick={retryComparison}>Retry comparison</button>}
    </div>}
    {comparison ? <>
      <div className={styles.changeSummary} data-history-comparison>
        <p>{changed.length} changed{unchanged > 0 ? ` · ${unchanged} unchanged` : ""}{unknown > 0 ? ` · ${unknown} comparison${unknown === 1 ? "" : "s"} unavailable` : ""}</p>
      </div>
      {changed.length ? <ul className={styles.priceChanges} data-history-price-changes>{changed.map(player => {
        const photo = Object.hasOwn(playerPhotos, player.id) ? playerPhotos[player.id] : undefined;
        return <li key={player.id} data-history-price-change={player.id} className={styles.moverCard}>
          <Link className={styles.changePlayer} prefetch={false} href={`/player/${encodeURIComponent(player.id)}`} aria-label={`View ${player.name}`}>
            <span className={styles.changePhoto} aria-hidden="true"><PlayerHeadshot name={player.name} espnId={photo?.espnId ?? null} portraitSrc={photo?.portraitSrc} teamId={detail.teamId} size={48} /></span>
            <span className={styles.changeName}>{player.name}</span>
          </Link>
          <strong className={`${styles.playerDelta} ${player.deltaCents! > 0 ? styles.gain : styles.loss}`} aria-label={`${player.deltaCents! > 0 ? "Increase" : "Decrease"} ${money(Math.abs(player.deltaCents!))}`}>{signed(player.deltaCents!)}</strong>
          <div className={styles.priceJourney} aria-label={`Price from ${date(comparison.previousDay)} to ${date(detail.day)}`}>
            <div><span><time dateTime={comparison.previousDay}>{shortDate(comparison.previousDay)}</time></span><span className={styles.beforePrice}>{money(player.beforeCents!)}</span></div>
            <svg className={styles.priceConnector} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M4 12h16m-6-6 6 6-6 6" /></svg>
            <div><span><time dateTime={detail.day}>{shortDate(detail.day)}</time></span><strong className={styles.afterPrice}>{money(player.afterCents!)}</strong></div>
          </div>
        </li>;
      })}</ul> : <p className={styles.changeEmpty} data-history-no-changes>No comparable player-price changes.{unknown > 0 ? " Unavailable comparisons are not counted as unchanged." : ""}</p>}
    </> : !comparisonLoading && !comparisonError && <p className={styles.caption}>No earlier comparable value. Player changes are unavailable.</p>}
    {(!!comparison?.entered.length || !!comparison?.exited.length) && <p className={styles.caption} data-history-membership-change>{comparison.entered.length} joined and {comparison.exited.length} left this roster between observations; these are not comparable price changes.</p>}
    {detail.rosterCount === 0 && <p className={styles.caption}>No players on this roster at the selected date.</p>}
    {detail.rosterCount === null && <p className={styles.caption}>The historical roster is unavailable for this date.</p>}
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
      {!!changed.length && <ul>{changed.map(player => {
        const value = detail.players.find(p => p.id === player.id)!;
        return <li key={player.id}>{player.name}: {value.price?.kind === "recorded" ? <>quote {value.price.quoteId} · {value.price.nativeTimestamp} UTC</> : value.price ? <>{value.price.source} · {value.price.modelVersion} · {value.price.datasetId} · inputs through {value.price.inputCutoff}</> : "Source unavailable"}.</li>;
      })}</ul>}
      {!!moreEvidence.length && <ul>{moreEvidence.map((note, i) => <li key={i}>{note}</li>)}</ul>}
    </details>
  </div>;
}
