import Link from "next/link";
import type { AiDecidesData, AiDecisionResult } from "@/domain/ai-decider";
import type { Team } from "@/domain/team";
import { percent, timestamp } from "./client";
import styles from "./AiDecides.module.css";

export type AiTeam = Pick<Team, "id" | "name">;
const name = (id: string, teams: AiTeam[]) => teams.find(t => t.id === id)?.name ?? `Roster ${id} · name unavailable`;

export function ProbabilityRows({ result, compact = false }: { result: AiDecisionResult; compact?: boolean }) {
  return <div className={compact ? styles.compactProbabilities : styles.probabilities}>
    {result.probabilities.map((p, index) => <div className={styles.probability} key={p.choice} style={{ "--order": index } as React.CSSProperties}>
      <div className={styles.probabilityLabel}><span>{p.choice}</span><span className={styles.number}>{percent(p.probability)}</span></div>
      {!compact && <div className={styles.bar} aria-hidden="true"><i style={{ width: `${p.probability * 100}%` }} /></div>}
    </div>)}
    {compact && <div className={styles.splitBar} aria-hidden="true">{result.probabilities.map(p => <i key={p.choice} style={{ flex: `${p.probability} 1 0` }} />)}</div>}
  </div>;
}

/** Public composition seam for the homepage owner. Cache reads never generate. */
export function AiDecidesHomeEntry({ data, teams }: { data: AiDecidesData; teams: AiTeam[] }) {
  return <section className={styles.homeEntry} aria-labelledby="home-ai-decides">
    <div className={styles.sectionHeading}><h2 id="home-ai-decides">AI Decides</h2><Link href="/ai-decides">Open picks &amp; make a call</Link></div>
    {data.weekly.matchups.length ? <div className={styles.weeklyGrid}>{data.weekly.matchups.map(p => <Link className={styles.homePick} href="/ai-decides#weekly" key={p.matchupId}>
      {p.status === "ready" && p.result ? <ProbabilityRows result={p.result} compact /> : <><strong>{name(p.teamIds[0], teams)}</strong><span>{name(p.teamIds[1], teams)}</span><small>Prediction unavailable</small></>}
    </Link>)}</div> : <p>{data.weekly.message}</p>}
    <p className={styles.provenance}>Experimental model estimates, not calibrated sports odds. {data.weekly.status === "stale" ? "Past week · " : ""}As of {timestamp(data.weekly.generatedAt)}.</p>
  </section>;
}

export function AiWeekly({ data, teams, onPair }: { data: AiDecidesData; teams: AiTeam[]; onPair: (ids: [string, string], opener: HTMLButtonElement) => void }) {
  return <section id="weekly" className={styles.weekly} aria-labelledby="weekly-ai-title">
    <div className={styles.sectionHeading}><h2 id="weekly-ai-title">This week’s picks</h2><span>Saved picks · separate from your experiments</span></div>
    <p className={styles.helper}>{data.weekly.status === "stale" ? "Past week · " : ""}{data.weekly.message}</p>
    <div className={styles.weeklyGrid}>{data.weekly.matchups.map((p, index) => <div className={styles.weeklyPick} key={p.matchupId}>
      <div className={styles.pickMeta}><span>0{index + 1}</span><span>{p.status === "ready" ? "Published" : "Unavailable"}</span></div>
      {p.status === "ready" && p.result ? <><ProbabilityRows result={p.result} compact /><p className={styles.pickConfidence}>API confidence {percent(p.result.confidence)}</p><details className={styles.source}><summary>Source &amp; model</summary><p>{p.result.model} · {p.result.promptVersion}<br />As of {timestamp(p.result.snapshot?.capturedAt ?? data.weekly.generatedAt)}</p><ul>{p.evidence.map((e, i) => <li key={i}>{e}</li>)}</ul>{p.baseline && <p>Experimental baseline · {p.baseline.label}. {p.baseline.teamValues.map(v => `${name(v.teamId, teams)}: ${v.value ?? "unknown"}`).join("; ")}</p>}</details></> : <><strong>{name(p.teamIds[0], teams)}</strong><span className={styles.otherTeam}>{name(p.teamIds[1], teams)}</span><p className={styles.helper}>{p.message}</p></>}
      <button type="button" className={styles.pairButton} onClick={e => onPair(p.teamIds, e.currentTarget)}>Try pairing</button>
    </div>)}</div>
    <p className={styles.provenance}>{data.weekly.matchups.length === 0 ? "Pairings unavailable. No teams or probabilities have been inferred." : "Model probability — not calibrated sports odds. Display percentages are rounded; API confidence is a separate signal."}</p>
  </section>;
}
