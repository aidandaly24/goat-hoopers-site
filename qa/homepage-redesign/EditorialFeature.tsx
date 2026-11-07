/* eslint-disable @next/next/no-img-element -- Approved local court art, bounded and direct. */
import type { ComponentProps } from "react";
import Link from "next/link";
import { CourtsideFeature as OriginalFeature, MemberTeamActions } from "@/surfaces/season-hub/CourtsideFeature";
import { TipCountdown } from "@/surfaces/season-hub/TipCountdown";
import { deriveWeekPairs, memberPair, savedPickFor, championTeamIdOf, hasPairScores, recordLine } from "@/surfaces/season-hub/weekPairs";
import { formatHomeStamp } from "@/surfaces/season-hub/homeFormat";
import { WEEK_ONE_TIP_OFF_ISO, openingPhase } from "@/domain/season-opening";
import { AI_PROBABILITY_LABEL } from "@/domain/ai-decider";
import { TeamAvatar } from "@/ui/TeamAvatar";

// The parent composite imports these helpers from the same leaf. Their real
// implementation remains unchanged, including the missing-edition fallback.
export { MemberTeamActions, RosterValuationDetails } from "@/surfaces/season-hub/CourtsideFeature";
type Props = ComponentProps<typeof OriginalFeature>;

/** QA-only replacement of the current feature leaf. Selection, saved-pick
 * matching and opening-clock predicates use the existing pure functions.
 * Archives and the comparison route keep the untouched original component. */
export function CourtsideFeature(props: Props) {
  const { edition, entries, rosterCounts, preseason, checkedAt, season, aiWeekly, hero, archived } = props;
  if (archived || new URLSearchParams(location.search).get("style") === "baseline") return <OriginalFeature {...props} />;
  return <CurrentFeature {...{ edition, entries, rosterCounts, preseason, checkedAt, season, aiWeekly, hero }} />;
}

function CurrentFeature({ edition, entries, rosterCounts, preseason, checkedAt, season, aiWeekly, hero }: Props) {
  const summary = hero?.summary ?? null;
  const { pairs, preseasonPreview } = deriveWeekPairs(entries, aiWeekly, season);
  const ownPair = summary ? memberPair(summary, entries) : null;
  const pair = ownPair ?? pairs.find(candidate => edition.game.leagueWeek === candidate.week
    && edition.game.teamIds?.every(id => [candidate.home.id, candidate.away.id].includes(id))) ?? pairs[0] ?? null;
  const week = pair?.week ?? edition.game.leagueWeek;
  const championTeamId = championTeamIdOf(entries);
  const stale = Date.parse(checkedAt) >= Date.parse(edition.endsAt);
  const status = preseasonPreview ? "Preseason lineup preview" : pair ? hasPairScores(pair) ? "Current score; week not confirmed complete" : "Upcoming; scores pending" : "Spotlight pending";
  const pick = pair ? savedPickFor(aiWeekly, season, pair) : undefined;
  const result = pick?.status === "ready" ? pick.result : null;
  const ai = summary?.ai;
  const ownResult = ai?.pick.status === "ready" ? ai.pick.result : null;
  const ownProbability = ownResult?.probabilities.find(row => row.choice === summary?.team.id)?.probability ?? null;
  const choiceName = (id: string) => entries.find(entry => entry.identity.id === id)?.identity.name ?? `Roster ${id}`;
  const stamp = formatHomeStamp(ai?.generatedAt ?? aiWeekly?.generatedAt ?? null);
  const opening = openingPhase(Date.parse(checkedAt), Date.parse(WEEK_ONE_TIP_OFF_ISO), week);
  const pct = (value: number) => `${Number((value * 100).toFixed(1))}%`;
  return <div className="editorial-feature" data-qa-feature>
    <details className="edition-context" data-edition-story>
      <summary>
        <span>{summary ? "Your " : ""}{week ? `Week ${week}` : "Featured matchup"} · {season ?? "Season unavailable"}{preseason ? " preseason" : " season"} · {status}</span>
        <span>{edition.status === "draft" ? "Sample editorial" : "Weekly edition"} {edition.dateLabel}{stale ? "; next edition pending" : ""} <span className="context-cue">Context +</span></span>
      </summary>
      <div>
        {stale && <p>You’re reading the last edition, from {edition.dateLabel}. The next weekly spotlight is pending.</p>}
        <p>{edition.status === "draft" ? "Proposed editorial copy for review. Muse has not published this edition." : `Published ${edition.publishedAt}.`} The editorial calendar is separate from the league’s scoring week.</p>
        <p><strong>{edition.game.title}</strong></p><p>{edition.game.context}</p>
        <p>{edition.game.selectionReason}</p>
        {preseasonPreview && <p>Saved preseason roster pairing — a lineup comparison, not a fantasy-week score forecast.</p>}
      </div>
    </details>
    <div className={`opening-spread${summary ? " with-personal-desk" : ""}`}>
      <div id="clubhouse-court" className="matchup-overview" data-matchup-spread data-league-desk={!summary || undefined}>
        {pair ? <>
          <h1 id="game-title" className="matchup-title">
            <Link href={`/teams/${pair.home.id}`} prefetch={false}>{pair.home.name}</Link>
            <span className="sr-only"> versus </span>
            <Link href={`/teams/${pair.away.id}`} prefetch={false}>{pair.away.name}</Link>
          </h1>
          <div className="pair-facts">
            {[pair.home, pair.away].map((team, index) => {
              const entry = entries.find(row => row.identity.id === team.id);
              const record = recordLine(entry, preseason);
              const points = index === 0 ? pair.homePoints : pair.awayPoints;
              const probability = result?.probabilities.find(row => row.choice === team.id)?.probability;
              return <div key={team.id} className="pair-side" data-pair-side={team.id}>
                <div className="pair-manager"><TeamAvatar name={team.name} avatar={team.avatar} isChampion={team.id === championTeamId} /><span>{team.managerName}</span></div>
                <p className="pair-record">{record.label} <strong>{record.text ?? "Unavailable"}</strong></p>
                {preseason && entry?.previousSeason?.finish && <p className="pair-record">{entry.previousSeason.season} finish: {entry.previousSeason.finish}{entry.previousSeason.ownerNote ? " · previous manager" : ""}</p>}
                <p className={`pair-score gh-num${!hasPairScores(pair) ? " is-pending" : ""}`}>{points === null ? <span>Pending</span> : points.toFixed(1)}</p>
                <p className="pair-score-label">{points === null ? "Score unavailable" : "Fantasy points"}</p>
                {!summary && <p className="pair-model">AI win probability <strong>{probability === undefined ? "Unavailable" : pct(probability)}</strong></p>}
              </div>;
            })}
          </div>
          <figure className="court-cut">
            <img src="/courtside/arena.jpg" alt="" width="1440" height="810" />
            <figcaption><span>Our GOAT court · illustration</span><Link href="/arcade/free-throw" prefetch={false}>Play free throw</Link></figcaption>
          </figure>
        </> : <><h1 id="game-title">{edition.game.title}</h1><p>{edition.game.note}</p><p>{edition.game.context}</p></>}
        {!summary && <div className="public-model" data-desk-ai>
          <p>{AI_PROBABILITY_LABEL}{aiWeekly?.status === "stale" ? " · Past-week saved picks" : " · Saved result"}</p>
          {result ? <details><summary>Saved result & provenance</summary><p>{aiWeekly?.status === "stale" ? "Saved comparison / past-week saved picks" : "Saved result"}{stamp ? ` · Saved ${stamp}` : ""} · {result.model}</p><p>Model choice: {choiceName(result.choice)}.</p></details> : <p>No saved AI preview for this pairing yet.</p>}
        </div>}
        <p id="matchup-context" className="sr-only">{summary ? "Your " : ""}Week {week} pairing. {status}</p>
        {opening !== "past" && <div className="opening-clock"><TipCountdown serverNowIso={checkedAt} week={week} /></div>}
      </div>
      {summary && <aside className="personal-desk" data-team-desk aria-label="Your team">
        <div className="personal-desk-head"><h2>Your team desk</h2><span>Roster {summary.team.id.padStart(2, "0")}</span></div>
        <MemberTeamActions summary={summary} />
        <dl className="personal-facts">
          <div><dt>Roster</dt><dd>{rosterCounts[summary.team.id] ?? "Unknown"} players</dd></div>
          <div><dt>{preseason ? "Previous finish" : "Standing"}</dt><dd>{preseason ? entries.find(entry => entry.identity.id === summary.team.id)?.previousSeason?.finish ?? "Unavailable" : summary.standing?.rank ? `No. ${summary.standing.rank}` : "Unavailable"}</dd></div>
        </dl>
        <div className="personal-ai" data-desk-ai>
          <p>Your AI win probability <strong>{ownProbability === null ? "Unavailable" : pct(ownProbability)}</strong></p>
          <small>{AI_PROBABILITY_LABEL}{ai?.status === "stale" ? ` · Stale · saved Week ${ai.week}` : " · Saved result"}</small>
          {ai && ownResult ? <details><summary>Saved result & provenance</summary><p>{ai.label}{ai.status === "stale" ? ` · Stale · saved Week ${ai.week}` : ""}{stamp ? ` · Saved ${stamp}` : ""} · Model choice: {choiceName(ownResult.choice)}</p></details> : <p>No saved AI result for your matchup yet — the full slate is down the page.</p>}
        </div>
      </aside>}
    </div>
    {aiWeekly?.sourceCompatibility && <p data-ai-source-compatibility={aiWeekly.sourceCompatibility.status}>{aiWeekly.sourceCompatibility.message}</p>}
    <Link className="week-index-link" href="#ai-decides" prefetch={false}>{summary ? `Week ${week} matchups` : "Explore this week · All five matchups"}</Link>
  </div>;
}
