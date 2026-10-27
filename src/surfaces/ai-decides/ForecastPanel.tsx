import type { AiDecidesData, AiForecastRevision } from "@/domain/ai-decider";
import { percent, timestamp } from "./client";
import { ChoiceLabel, ProbabilityRows, type AiTeam } from "./AiWeekly";
import styles from "./AiDecides.module.css";

const pointsLabel = (v: number | null) => v === null ? "Unavailable" : v.toFixed(1);
const countedLabel = (p: { value: number; basis: "exact" | "estimated" } | null | undefined) => p == null ? "Unavailable" : `${p.value.toFixed(1)} (${p.basis})`;
const name = (id: string, teams: AiTeam[]) => teams.find(t => t.id === id)?.name ?? `Roster ${id} · name unavailable`;

/**
 * In-season rolling forecast (issue #149): the latest immutable revision,
 * rendered beside — never instead of — the pregame slate. Locked points
 * (explicit lock evidence), final points (determinate, no games left)
 * and projected remaining points (estimates) stay in separate, labeled
 * columns with their evidence basis; an unavailable value says so
 * instead of showing a zero. As-of and per-input freshness are visible.
 */
export function AiForecast({ data, teams, championTeamId }: { data: AiDecidesData; teams: AiTeam[]; championTeamId?: string | null }) {
  const forecast = data.forecast;
  if (!forecast || forecast.status !== "ready" || !forecast.revision) return null;
  const revision: AiForecastRevision = forecast.revision;
  return <section id="forecast" className={styles.weekly} aria-labelledby="forecast-ai-title">
    <div className={styles.sectionHeading}><h2 id="forecast-ai-title">In-season forecast · Week {revision.week}</h2><span>Live mode · refreshed at least daily</span></div>
    <p className={styles.helper}><strong>Rolling forecast, as of <time dateTime={revision.generatedAt}>{timestamp(revision.generatedAt)}</time>.</strong> {forecast.message} This is a separate in-season mode from the pregame picks above; the pregame record is unchanged. Revision {forecast.revisionCount} for this week{revision.supersedes ? " — earlier revisions are retained for comparison" : ""}.</p>
    <p className={styles.provenance}>Input freshness (retrieved): {revision.inputFreshness.map(f => `${f.source} ${timestamp(f.observedAt)}`).join(" · ")}</p>
    <div className={styles.weeklyGrid}>{revision.matchups.map((m, index) => <div className={styles.weeklyPick} key={m.matchupId}>
      <div className={styles.pickMeta}><span>0{index + 1}</span><span>{m.result ? "Forecast" : "Unavailable"}</span></div>
      {m.result ? <><ProbabilityRows result={m.result} compact matchup={{ teamIds: m.teamIds, teams }} championTeamId={championTeamId} /><p className={styles.pickConfidence}>Model choice: <ChoiceLabel choice={m.result.choice} matchup={{ teamIds: m.teamIds, teams }} /></p><p className={styles.pickConfidence}>API confidence {percent(m.result.confidence)}</p></> : <><div className={styles.unavailableTeams}>{m.teamIds.map(id => <strong key={id}>{name(id, teams)}</strong>)}</div><p className={styles.helper}>The model declined this pairing in this revision.</p></>}
      <ul className={styles.forecastLines}>{m.teamIds.map(id => {
        const line = revision.teams.find(t => t.rosterId === id);
        return <li key={id}><span>{name(id, teams)}</span><span className={styles.number}>Locked {countedLabel(line?.lockedPoints)} · Final {countedLabel(line?.finalPoints)} · Projected {pointsLabel(line?.projectedRemainingPoints ?? null)} · Total {pointsLabel(line?.totalPoints ?? null)}</span></li>;
      })}</ul>
    </div>)}</div>
    <div className={styles.forecastTableWrap}><table className={styles.forecastTable}>
      <caption>Week {revision.week} points split — locked and final (counted) versus projected remaining, per team</caption>
      <thead><tr><th scope="col">Team</th><th scope="col">Locked points</th><th scope="col">Final points</th><th scope="col">Projected remaining</th><th scope="col">Forecast total</th></tr></thead>
      <tbody>{revision.teams.map(line => <tr key={line.rosterId}>
        <th scope="row">{name(line.rosterId, teams)}<small className={styles.rosterId}>Roster {line.rosterId}</small></th>
        <td className={styles.number}>{countedLabel(line.lockedPoints)}</td>
        <td className={styles.number}>{countedLabel(line.finalPoints)}</td>
        <td className={styles.number}>{pointsLabel(line.projectedRemainingPoints)}</td>
        <td className={styles.number}>{pointsLabel(line.totalPoints)}</td>
      </tr>)}</tbody>
    </table></div>
    <p className={styles.provenance}>Locked points come only from slots with explicit lock evidence — an unlocked starter&rsquo;s displayed score can still be replaced and is never banked. Final points are determinate counted values from slots with no lock and no games remaining. Counted values marked (estimated) were identified within the disclosed foul-residual band; (exact) values reconcile precisely. Projected remaining points estimate exactly one counting game per still-open slot at observed fantasy PPG ({revision.configVersion}) — never multiplied by remaining games; locked slots project zero, so nothing is double-counted. “Unavailable” means the evidence could not prove the value — it is never replaced with zero. Model: {revision.model} · {revision.promptVersion}. Model probability — not calibrated sports odds.</p>
  </section>;
}
