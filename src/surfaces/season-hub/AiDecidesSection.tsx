import Link from "next/link";
import { AI_PROBABILITY_LABEL, type AiWeeklySlate } from "@/domain/ai-decider";
import { SectionHeading } from "@/ui/SectionHeading";
import { TeamAvatar } from "@/ui/TeamAvatar";
import { cs } from "./CourtsideStyles";
import { formatHomeStamp } from "./homeFormat";
import {
  hasPairScores, previewPeriodLine, savedComparisonLabel, savedPickFor, savedTimestamp,
  type WeekPair,
} from "./weekPairs";

const pct = (probability: number) => `${Number((probability * 100).toFixed(1))}%`;

/**
 * AI Decides, down-page where the week's content lives: ALL FIVE pairings
 * as rows with team avatars, the saved model's split, and — per row — the
 * complete provenance disclosure for that pairing's saved result (model
 * choice, both probabilities under current team names, the saved
 * timestamp, preview-period closure, model + prompt version + input
 * snapshot, the evidence list, and confidence kept separate from the win
 * probability). Pairings without a saved pick say so plainly. Reads never
 * generate a pick; a missing slate is an honest state, not an empty box.
 */
export function AiDecidesSection({ pairs, aiWeekly, season, preseasonPreview, championTeamId, viewerTeamId }: {
  pairs: WeekPair[];
  aiWeekly?: AiWeeklySlate;
  season: string | null;
  preseasonPreview: boolean;
  championTeamId: string | undefined;
  viewerTeamId?: string;
}) {
  const week = pairs[0]?.week ?? aiWeekly?.week ?? null;
  const nameFor = (pair: WeekPair, rosterId: string) =>
    [pair.home, pair.away].find((team) => team.id === rosterId)?.name;
  return (
    <section className={cs("ai-section")} id="ai-decides" data-ai-decides aria-label="AI Decides">
      <SectionHeading
        eyebrow="The rest of the floor"
        title="A league of our own."
        action={<Link className={cs("text-link")} href="/ai-decides" prefetch={false}>AI Decides playground</Link>}
      />
      <p className={cs("ai-week-line")}>
        {week ? `Week ${week} · AI Decides` : "AI Decides"}
        {preseasonPreview && " · Preseason lineup preview"}
        {aiWeekly?.status === "stale" && (aiWeekly.sourceCompatibility?.currentWindow && aiWeekly.sourceCompatibility.status !== "compatible" ? " · Saved comparison" : " · Past-week saved picks")}
        {!aiWeekly && " · No saved slate for this week yet"}
      </p>
      {aiWeekly?.sourceCompatibility && <p className={cs("caption")} data-ai-source-compatibility={aiWeekly.sourceCompatibility.status}>{aiWeekly.sourceCompatibility.message}</p>}
      {!pairs.length ? (
        <p className={cs("empty")}>Current pairings are temporarily unavailable. Team profiles remain available below.</p>
      ) : !aiWeekly ? (
        <p className={cs("empty")}>
          The model has not saved picks for this week yet — when it has, all five pairings land here with their provenance. <Link className={cs("text-link")} href="/ai-decides" prefetch={false}>Open the playground</Link>
        </p>
      ) : (
        <ol className={cs("ai-rows")}>
          {pairs.map((pair) => {
            const pick = savedPickFor(aiWeekly, season, pair);
            const result = pick?.status === "ready" ? pick.result : null;
            const homeProbability = result?.probabilities.find((row) => row.choice === pair.home.id)?.probability;
            const awayProbability = result?.probabilities.find((row) => row.choice === pair.away.id)?.probability;
            const scored = hasPairScores(pair);
            const choiceName = result ? nameFor(pair, result.choice) : null;
            // The result's own snapshot is the provenance of record; the
            // slate's snapshot is the fallback when a pick predates
            // per-result snapshots.
            const snapshot = result?.snapshot ?? aiWeekly.snapshot;
            const period = result ? previewPeriodLine(snapshot) : null;
            const comparison = result ? savedComparisonLabel(snapshot) : null;
            return (
              <li key={`${pair.week}:${pair.home.id}:${pair.away.id}`} className={cs("ai-row")} data-ai-row>
                <div className={cs("ai-row-teams")}>
                  {[pair.home, pair.away].map((team, index) => {
                    const probability = index === 0 ? homeProbability : awayProbability;
                    return (
                      <span key={team.id} className={cs("ai-row-team", index === 1 ? "ai-row-team-away" : "")} data-own-team={team.id === viewerTeamId || undefined}>
                        <TeamAvatar name={team.name} avatar={team.avatar} isChampion={team.id === championTeamId} />
                        <Link href={`/teams/${team.id}`} prefetch={false}>{team.name}</Link>
                        {team.id === viewerTeamId && <span className={cs("you")}>Your team</span>}
                        <strong className={cs("ai-row-pct", "gh-num")}>{probability !== undefined ? pct(probability) : "—"}</strong>
                      </span>
                    );
                  })}
                </div>
                {result && homeProbability !== undefined && awayProbability !== undefined ? (
                  <div className={cs("ai-row-bar")} aria-hidden="true">
                    <span className={cs("ai-row-bar-home")} data-probability-for={pair.home.id} style={{ width: `${homeProbability * 100}%` }} />
                    <span className={cs("ai-row-bar-away")} data-probability-for={pair.away.id} style={{ width: `${awayProbability * 100}%` }} />
                  </div>
                ) : (
                  <p className={cs("ai-row-status")}>Prediction unavailable for this pairing.</p>
                )}
                {scored && (
                  <p className={cs("ai-row-final")}>
                    <span className="gh-num">{pair.homePoints?.toFixed(1)} – {pair.awayPoints?.toFixed(1)}</span> fantasy points · Current score
                  </p>
                )}
                {result && pick && (
                  <details className={cs("ai-prov")}>
                    <summary>Saved result &amp; provenance</summary>
                    <p>
                      {comparison ?? "Saved model pick"}{aiWeekly.status === "stale" ? (aiWeekly.sourceCompatibility?.currentWindow && aiWeekly.sourceCompatibility.status !== "compatible" ? " · saved comparison" : " · past week") : ""} ·{" "}
                      {aiWeekly.generatedAt ? <>Saved <time dateTime={aiWeekly.generatedAt}>{savedTimestamp(aiWeekly.generatedAt)}</time>.</> : "No saved prediction time available."}
                    </p>
                    {period && <p>{period}</p>}
                    <p>Current team names identify saved roster inputs. Model choice: {choiceName ?? `Roster ${result.choice}`}.</p>
                    <ul>
                      {result.probabilities.map((row) => (
                        <li key={row.choice}>
                          {nameFor(pair, row.choice) ?? `Roster ${row.choice}`} · <span className="gh-num">{pct(row.probability)}</span>
                        </li>
                      ))}
                    </ul>
                    <p>{AI_PROBABILITY_LABEL}. API confidence {Number((result.confidence * 100).toFixed(1))}% is a separate signal.</p>
                    <p>{result.model} · {result.promptVersion} · Inputs captured {snapshot?.capturedAt ?? "unavailable"}</p>
                    {snapshot && <p>Scoring mode: {snapshot.scoringMode}</p>}
                    {!!pick.evidence.length && (
                      <ul>
                        {pick.evidence.map((item, index) => <li key={index}>{item}</li>)}
                      </ul>
                    )}
                    <p className={cs("caption")}>League check {formatHomeStamp(aiWeekly.snapshot?.capturedAt) ?? "unavailable"} · probabilities are the saved model’s, never recomputed on read.</p>
                  </details>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
