"use client";

/* eslint-disable @next/next/no-img-element -- Existing, pre-sized court image bypasses optimizer quota. */
import { useState, type ReactNode } from "react";
import Link from "next/link";
import type { Matchup } from "@/domain";
import type { LiveClubhouseDirectoryEntry } from "@/domain/clubhouse-directory";
import type { WeeklyEdition } from "@/domain/weekly-spotlight";
import { AI_PROBABILITY_LABEL, type AiSnapshotMetadata, type AiWeeklySlate } from "@/domain/ai-decider";
import { TeamAvatar } from "@/ui/TeamAvatar";
import { CourtsideDialog } from "./CourtsideDialog";
import { cs } from "./CourtsideStyles";

type DisplayPair = Pick<Matchup, "week" | "homePoints" | "awayPoints"> & {
  home: LiveClubhouseDirectoryEntry["identity"];
  away: LiveClubhouseDirectoryEntry["identity"];
};
const isFinal = (pair: Pick<Matchup, "homePoints" | "awayPoints">) => pair.homePoints !== null && pair.awayPoints !== null;

type Props = {
  edition: WeeklyEdition;
  entries: Pick<LiveClubhouseDirectoryEntry, "identity" | "previousSeason" | "currentRecord" | "currentMatchup">[];
  rosterCounts: Record<string, number>;
  preseason: boolean;
  checkedAt: string;
  season: string | null;
  aiWeekly?: AiWeeklySlate;
  sources: ReactNode;
};

const savedComparison = (snapshot: AiSnapshotMetadata | null | undefined) => snapshot?.comparison === "preseason_lineup_preview" ? "Preseason lineup preview" : snapshot?.comparison === "weekly_lineup_preview" ? "Weekly lineup preview" : null;
const savedTimestamp = (value: string) => Number.isFinite(Date.parse(value)) ? `${new Date(value).toISOString().slice(0, 16).replace("T", " ")} UTC` : "unavailable";
function previewPeriod(snapshot: AiSnapshotMetadata | null): string | null {
  if (!savedComparison(snapshot)) return null;
  if (snapshot?.comparison === "preseason_lineup_preview") return snapshot.startsAt && Number.isFinite(Date.parse(snapshot.startsAt)) ? `Publication closes ${savedTimestamp(snapshot.startsAt)}.` : "Publication closure unavailable.";
  return snapshot?.startsAt && snapshot.endsAt ? null : "Period dates unavailable.";
}

/** Featured matchup → read the editorial reason / select a pairing / inspect notes.
 * States: dated draft, historical final, live pairing, saved ready/stale pick and unavailable.
 * Saved probabilities require the same season, week and roster IDs; reads never generate.
 * Phones retain the court, five pairings and linked identities in reading order.
 * The court is a still image; only deliberate team selection moves the context rail.
 * No projected scores, scroll hijacking, ornamental frames or standalone hoopers.
 */
export function CourtsideFeature({ edition, entries, rosterCounts, preseason, checkedAt, season, aiWeekly, sources }: Props) {
  const [selected, setSelected] = useState<DisplayPair | null>(null);
  const [side, setSide] = useState(0);
  const livePairs = entries.flatMap((entry, index) => {
    const matchup = entry.currentMatchup;
    return matchup && !entries.slice(0, index).some((previous) =>
      previous.currentMatchup?.week === matchup.week &&
      [previous.currentMatchup.home.id, previous.currentMatchup.away.id].sort().join(":") === [matchup.home.id, matchup.away.id].sort().join(":"),
    ) ? [matchup] : [];
  });
  const preseasonPreview = aiWeekly?.status === "ready" && aiWeekly.season === season && aiWeekly.week === 1 && aiWeekly.snapshot?.comparison === "preseason_lineup_preview" && (aiWeekly.snapshot.sourceLeg === 0 || aiWeekly.snapshot.sourceLeg === 1);
  const pairs: DisplayPair[] = preseasonPreview ? aiWeekly.matchups.flatMap(pick => {
    const home = entries.find(entry => entry.identity.id === pick.teamIds[0])?.identity;
    const away = entries.find(entry => entry.identity.id === pick.teamIds[1])?.identity;
    return home && away ? [{ week: aiWeekly.week, home, away, homePoints: null, awayPoints: null }] : [];
  }) : livePairs;
  const game = edition.game;
  const ids = selected ? [selected.home.id, selected.away.id] : game.teamIds ?? [];
  const teams = ids.map((id) => entries.find((entry) => entry.identity.id === id)).filter((entry) => !!entry);
  const state = selected ? isFinal(selected) ? "final" : "upcoming" : game.state;
  const status = selected
    ? preseasonPreview ? `Preseason lineup preview · target Week ${selected.week}` : `Week ${selected.week} · ${isFinal(selected) ? "Final" : "Upcoming · scores pending"}`
    : game.state === "final" ? `Historical final · ${edition.season}`
      : game.state === "upcoming" ? `Week ${game.leagueWeek} · Upcoming` : "Spotlight pending";
  const title = selected ? `${selected.home.name} vs ${selected.away.name}` : game.title;
  const scores = selected ? [selected.homePoints, selected.awayPoints] : game.scores;
  const context = selected ? preseasonPreview ? "Saved preseason roster pairing. This lineup comparison is not a fantasy-week score forecast; select a team below for its current league context." : isFinal(selected)
    ? "Completed fantasy matchup. Select a team below for its league context."
    : "Current league pairing. Scores are pending; select a team below for its league context."
    : game.selectionReason;
  const week = pairs[0]?.week;
  const savedPick = (pair: DisplayPair) => aiWeekly?.status !== "unavailable" && aiWeekly?.season === season && aiWeekly.week === pair.week
    ? aiWeekly.matchups.find((pick) => pick.teamIds.includes(pair.home.id) && pick.teamIds.includes(pair.away.id))
    : undefined;
  const selectedPick = selected ? savedPick(selected) : undefined;
  const selectedResult = selectedPick?.status === "ready" ? selectedPick.result : null;

  return <>
    <div className={cs("feature-heading")}>
      <div>
        <p className={cs("feature-label")}>{selected ? preseasonPreview ? "Selected preseason pairing" : "Selected matchup" : "Featured matchup"} · {status}</p>
        <h1 id="game-title">{title}</h1>
      </div>
      <p className={cs("feature-context")}>{context}</p>
    </div>
    <div className={cs("clubhouse-layout")}>
      <div className={cs("court-column")}>
        <figure className={cs("clubhouse-court")} id="clubhouse-court">
          <img src="/courtside/arena.jpg" alt="The GOAT Hoopers basketball court, with players on the floor and fans in the stands" width="1440" height="810" fetchPriority="high" />
        </figure>
      </div>
      <aside className={cs("week-desk")} aria-labelledby="this-week-title">
        <div className={cs("week-heading")}><h2 id="this-week-title">{aiWeekly ? "AI Decides" : "This week"}</h2><span>{preseasonPreview ? "Preseason preview · target Week 1" : <>{aiWeekly && "This week · "}{week ? `Week ${week}` : "Pairings pending"}{preseason && <><br />Upcoming</>}</>}</span></div>
        {aiWeekly && <p className={cs("week-provenance")}>Current team names · {savedComparison(aiWeekly.snapshot) ?? "saved model picks"}{aiWeekly.status === "stale" && " · past week"}</p>}
        <div className={cs("week-games")}>
          {pairs.map((pair) => {
            const active = selected ? selected.week === pair.week && [selected.home.id, selected.away.id].every(id => [pair.home.id, pair.away.id].includes(id)) : game.state === "upcoming" && game.leagueWeek === pair.week && game.teamIds?.every((id) => [pair.home.id, pair.away.id].includes(id));
            const pick = savedPick(pair);
            const result = pick?.status === "ready" ? pick.result : null;
            const choiceName = result && ([pair.home, pair.away].find((team) => team.id === result.choice)?.name ?? `Roster ${result.choice}`);
            const pickLabel = aiWeekly ? result
              ? ` ${aiWeekly.status === "stale" ? "Past-week" : "Saved"} model probabilities: ${result.probabilities.map((p) => `Roster ${p.choice} ${Number((p.probability * 100).toFixed(1))}%`).join(", ")}. Model choice: ${choiceName}.`
              : " Prediction unavailable." : "";
            return <button type="button" key={`${pair.week}:${pair.home.id}:${pair.away.id}`} className={cs("week-game")} aria-pressed={!!active} aria-controls="game-title matchup-context" aria-label={`${pair.home.name} versus ${pair.away.name}, ${preseasonPreview ? "preseason lineup preview for target Week 1" : isFinal(pair) ? "final" : "upcoming"}.${pickLabel}`} onClick={() => { setSelected(pair); setSide(0); }}>
              {[pair.home, pair.away].map((team, index) => {
                const probability = result?.probabilities.find((p) => p.choice === team.id);
                return <span className={cs("week-team")} key={team.id}>
                <TeamAvatar name={team.name} avatar={team.avatar} /><strong>{team.name}</strong>
                <span className={cs("week-score", "gh-num")} aria-label={isFinal(pair) ? `${index === 0 ? pair.homePoints : pair.awayPoints} fantasy points` : preseasonPreview ? "Preview · score not forecast" : "Score pending"}>{isFinal(pair) ? (index === 0 ? pair.homePoints : pair.awayPoints)!.toFixed(1) : "—"}</span>
                {probability && <span className={cs("week-probability")} data-probability-for={team.id}>
                  <span className={cs("week-bar")} aria-hidden="true"><i style={{ width: `${probability.probability * 100}%` }} /></span>
                  <span className={cs("gh-num")}>Roster {team.id} · {Number((probability.probability * 100).toFixed(1))}%</span>
                </span>}
              </span>;
              })}
              {aiWeekly && <span className={cs("week-pick-status")}>{result ? <>{aiWeekly.status === "stale" ? "Past-week pick" : "Model choice"}: {choiceName}</> : "Prediction unavailable"}</span>}
            </button>;
          })}
          {!pairs.length && <p className={cs("empty")}>{preseasonPreview ? "Saved preview team identities are temporarily unavailable." : "Current pairings are temporarily unavailable."} Team profiles remain available below.</p>}
        </div>
        {aiWeekly && <>
          <Link className={cs("week-playground", "text-link")} href="/ai-decides">Open AI playground ↗</Link>
          <p className={cs("week-provenance")}>{AI_PROBABILITY_LABEL}. {aiWeekly.generatedAt ? <>Saved <time dateTime={aiWeekly.generatedAt}>{savedTimestamp(aiWeekly.generatedAt)}</time>.</> : "No saved prediction time available."}</p>
          {previewPeriod(aiWeekly.snapshot) && <p className={cs("week-provenance")}>{previewPeriod(aiWeekly.snapshot)}</p>}
        </>}
        <CourtsideDialog label={selected ? "Matchup notes" : "Featured matchup notes"} title={title}>
          <p>{context}</p><p>{selected ? preseasonPreview ? "Pairing comes from saved preview inputs; no weekly score forecast is implied." : "Pairing and scores come from the current league check; no projected result is implied." : game.context}</p>
          <p className={cs("caption")}>{selected ? preseasonPreview ? `Preview inputs captured ${aiWeekly.snapshot?.capturedAt ?? "unavailable"}` : `League check ${checkedAt.slice(0, 10)}` : game.note}</p>
          <div className={cs("notes-teams")}>{teams.map((team) => <Link key={team.identity.id} href={`/teams/${team.identity.id}`}>{team.identity.name} ↗</Link>)}</div>
          {!selected && sources}
          {selectedResult && <>
            <h3>{savedComparison(selectedResult.snapshot) ?? "Saved model pick"}{aiWeekly?.status === "stale" ? " · past week" : ""}</h3>
            <p>{AI_PROBABILITY_LABEL}. API confidence {Number((selectedResult.confidence * 100).toFixed(1))}% is a separate signal.</p>
            <p>{selectedResult.model} · {selectedResult.promptVersion} · Inputs captured {selectedResult.snapshot?.capturedAt ?? "unavailable"}</p>
            {selectedResult.snapshot && <p>Scoring mode: {selectedResult.snapshot.scoringMode}</p>}
            <ul>{selectedPick?.evidence.map((e, index) => <li key={index}>{e}</li>)}</ul>
          </>}
        </CourtsideDialog>
        {selected && <button type="button" className={cs("text-link")} onClick={() => { setSelected(null); setSide(0); }}>Back to featured matchup</button>}
        <p className={cs("feature-check")}>League check · {checkedAt.slice(0, 10)}</p>
      </aside>
    </div>
    {!!teams.length && <div className={cs("team-context-rail")} id="matchup-context">
      <div className={cs("rail-controls")} role="group" aria-label="Select matchup team">
        {teams.map((team, index) => <button type="button" key={team.identity.id} aria-pressed={side === index} aria-controls="team-context-window" onClick={() => setSide(index)}>{team.identity.name}{state === "final" && scores?.[index] !== null && <span className={cs("gh-num")}> · {scores?.[index]?.toFixed(1)}</span>}</button>)}
      </div>
      <div className={cs("team-context-window")} id="team-context-window">
        <div className={cs("team-context-track")} style={{ transform: `translateX(-${side * 50}%)` }}>
          {teams.map((team, index) => {
            const prior = preseason ? team.previousSeason : null;
            const record = prior ?? team.currentRecord;
            return <dl key={team.identity.id} className={cs("team-context")} aria-hidden={side !== index}>
              <div><dt>{prior ? `2025 record${prior.ownerNote ? " · previous manager" : ""}` : "Current record"}</dt><dd>{record ? `${record.wins}–${record.losses}` : "—"}</dd></div>
              <div><dt>Roster players</dt><dd>{rosterCounts[team.identity.id] ?? "—"}</dd></div>
              <div><dt>{prior ? "2025 finish" : "Team profile"}</dt><dd>{prior ? `${prior.finish}${prior.finish === 1 ? "st" : prior.finish === 2 ? "nd" : prior.finish === 3 ? "rd" : "th"}` : <Link href={`/teams/${team.identity.id}`} tabIndex={side === index ? 0 : -1}>Open ↗</Link>}</dd></div>
            </dl>;
          })}
        </div>
      </div>
      <Link className={cs("text-link")} href={`/teams/${teams[side]?.identity.id ?? teams[0].identity.id}`} prefetch={false}>Full team profile ↗</Link>
    </div>}
    <p className={cs("sr-only")} role="status" aria-live="polite">{selected ? `Selected ${title}. ${status}.` : ""}</p>
  </>;
}
