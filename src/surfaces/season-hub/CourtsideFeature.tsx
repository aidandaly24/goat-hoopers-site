"use client";

/* eslint-disable @next/next/no-img-element -- Existing, pre-sized court image bypasses optimizer quota. */
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import type { Matchup } from "@/domain";
import type { LiveClubhouseDirectoryEntry } from "@/domain/clubhouse-directory";
import type { WeeklyEdition } from "@/domain/weekly-spotlight";
import { AI_PROBABILITY_LABEL, type AiSnapshotMetadata, type AiWeeklySlate } from "@/domain/ai-decider";
import { TeamAvatar } from "@/ui/TeamAvatar";
import { PlayerHeadshot } from "@/ui/PlayerHeadshot";
import { teamColorVar } from "@/ui/teamColors";
import { CourtsideDialog } from "./CourtsideDialog";
import { cs } from "./CourtsideStyles";
import { isHomePreseasonPreview, type HomeTeamFace, type HomeTeamSummary } from "@/domain/personalized-home";
import { TipCountdown, WEEK_ONE_TIP_OFF_ISO } from "./TipCountdown";
import { formatHomeStamp } from "./homeFormat";

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
  viewerTeamId?: string;
  /** The signed-in member's hero: their pairing becomes the featured matchup.
   * Absent for signed-out visitors — the editorial feature renders as before. */
  hero?: { summary: HomeTeamSummary; faces: HomeTeamFace[] } | null;
  portraits?: Record<string, string>;
};

const savedComparison = (snapshot: AiSnapshotMetadata | null | undefined) => snapshot?.comparison === "preseason_lineup_preview" ? "Preseason lineup preview" : snapshot?.comparison === "weekly_lineup_preview" ? "Weekly lineup preview" : null;
const savedTimestamp = (value: string) => Number.isFinite(Date.parse(value)) ? `${new Date(value).toISOString().slice(0, 16).replace("T", " ")} UTC` : "unavailable";
function previewPeriod(snapshot: AiSnapshotMetadata | null): string | null {
  if (!savedComparison(snapshot)) return null;
  if (snapshot?.comparison === "preseason_lineup_preview") return snapshot.startsAt && Number.isFinite(Date.parse(snapshot.startsAt)) ? `Publication closes ${savedTimestamp(snapshot.startsAt)}.` : "Publication closure unavailable.";
  return snapshot?.startsAt && snapshot.endsAt ? null : "Period dates unavailable.";
}

/** One side of the hero face-off: the team's star at editorial size, its
 * identity (the champion's avatar wears the crown), star value and record. */
function HeroSide({ team, star, portraits, champion, own, recordLabel, recordText, away }: {
  team: DisplayPair["home"];
  star: HomeTeamFace["player"];
  portraits?: Record<string, string>;
  champion: boolean;
  own: boolean;
  recordLabel: string;
  recordText: string | null;
  away?: boolean;
}) {
  return (
    <div className={cs(away ? "hero-side hero-side-away" : "hero-side")} style={{ "--hero-glow": teamColorVar(team.id) } as CSSProperties}>
      <span className={cs("hero-star")}>
        {star
          ? <PlayerHeadshot portraitSrc={portraits?.[star.id]} espnId={star.espnId} name={star.name} teamId={team.id} size={112} />
          : <TeamAvatar name={team.name} avatar={team.avatar} isChampion={champion} />}
      </span>
      <span className={cs("hero-teamline")}>
        <TeamAvatar name={team.name} avatar={team.avatar} isChampion={champion} />
        <Link href={`/teams/${team.id}`} prefetch={false}>{team.name}</Link>
        {own && <span className={cs("you")}>Your team</span>}
      </span>
      {star && <span className={cs("hero-starname")}>{star.name} · <span className="gh-num">${star.value.toFixed(1)}</span></span>}
      {recordText && <span className={cs("hero-record")}>{recordLabel} {recordText}</span>}
    </div>
  );
}

/** Featured matchup read the editorial reason / select a pairing / inspect notes.
 * States: dated draft, historical final, live pairing, saved ready/stale pick and unavailable.
 * Saved probabilities require the same season, week and roster IDs; reads never generate.
 * Phones retain court → featured team context → five compact pairings in reading order.
 * The court is a still image; only deliberate team selection moves the context rail.
 * No projected scores, scroll hijacking, ornamental frames or standalone hoopers.
 */
export function CourtsideFeature({ edition, entries, rosterCounts, preseason, checkedAt, season, aiWeekly, sources, viewerTeamId, hero, portraits }: Props) {
  const [selected, setSelected] = useState<DisplayPair | null>(null);
  const [side, setSide] = useState(0);
  const [barIn, setBarIn] = useState(false);
  const livePairs = entries.flatMap((entry, index) => {
    const matchup = entry.currentMatchup;
    return matchup && !entries.slice(0, index).some((previous) =>
      previous.currentMatchup?.week === matchup.week &&
      [previous.currentMatchup.home.id, previous.currentMatchup.away.id].sort().join(":") === [matchup.home.id, matchup.away.id].sort().join(":"),
    ) ? [matchup] : [];
  });
  const preseasonPreview = isHomePreseasonPreview(aiWeekly, season);
  const pairs: DisplayPair[] = preseasonPreview && aiWeekly ? aiWeekly.matchups.flatMap(pick => {
    const home = entries.find(entry => entry.identity.id === pick.teamIds[0])?.identity;
    const away = entries.find(entry => entry.identity.id === pick.teamIds[1])?.identity;
    return home && away ? [{ week: aiWeekly.week, home, away, homePoints: null, awayPoints: null }] : [];
  }) : livePairs;
  const game = edition.game;
  // A member's own pairing is the default display: the hero. Selecting another
  // pairing in the week desk takes over the display exactly as a selection
  // always has; signed-out visitors (no hero) get the editorial game.
  const heroSummary = hero?.summary ?? null;
  const heroPair: DisplayPair | null = (() => {
    if (!heroSummary) return null;
    const identityOf = (id: string) => entries.find((entry) => entry.identity.id === id)?.identity;
    if (heroSummary.matchup) {
      const home = identityOf(heroSummary.matchup.home.id);
      const away = identityOf(heroSummary.matchup.away.id);
      return home && away ? { week: heroSummary.matchup.week, home, away, homePoints: heroSummary.matchup.homePoints, awayPoints: heroSummary.matchup.awayPoints } : null;
    }
    if (heroSummary.ai) {
      const [first, second] = heroSummary.ai.pick.teamIds;
      const home = first ? identityOf(first) : undefined;
      const away = second ? identityOf(second) : undefined;
      return home && away ? { week: heroSummary.ai.week, home, away, homePoints: null, awayPoints: null } : null;
    }
    return null;
  })();
  const shown = selected ?? heroPair;
  const isHeroShown = !!heroPair && !!shown && shown.week === heroPair.week
    && shown.home.id === heroPair.home.id && shown.away.id === heroPair.away.id;
  const championTeamId = entries.find((entry) => entry.previousSeason?.finish === 1)?.identity.id;
  useEffect(() => {
    if (!isHeroShown) return;
    const frame = requestAnimationFrame(() => setBarIn(true));
    return () => cancelAnimationFrame(frame);
  }, [isHeroShown]);
  const ids = shown ? [shown.home.id, shown.away.id] : game.teamIds ?? [];
  const teams = ids.map((id) => entries.find((entry) => entry.identity.id === id)).filter((entry) => !!entry);
  const state = shown ? isFinal(shown) ? "final" : "upcoming" : game.state;
  const status = shown
    ? preseasonPreview ? `Preseason lineup preview · target Week ${shown.week}` : `Week ${shown.week} · ${isFinal(shown) ? "Final" : "Upcoming · scores pending"}`
    : game.state === "final" ? `Historical final · ${edition.season}`
      : game.state === "upcoming" ? `Week ${game.leagueWeek} · Upcoming` : "Spotlight pending";
  const title = shown ? `${shown.home.name} vs ${shown.away.name}` : game.title;
  const scores = shown ? [shown.homePoints, shown.awayPoints] : game.scores;
  const context = shown ? preseasonPreview ? "Saved preseason roster pairing. This lineup comparison is not a fantasy-week score forecast; select a team below for its current league context." : isFinal(shown)
    ? "Completed fantasy matchup. Select a team below for its league context."
    : "Current league pairing. Scores are pending; select a team below for its league context."
    : game.selectionReason;
  const week = pairs[0]?.week;
  const savedPick = (pair: DisplayPair) => aiWeekly?.status !== "unavailable" && aiWeekly?.season === season && aiWeekly.week === pair.week
    ? aiWeekly.matchups.find((pick) => pick.teamIds.includes(pair.home.id) && pick.teamIds.includes(pair.away.id))
    : undefined;
  const detailPair = shown ?? pairs.find(pair => game.state === "upcoming" && game.leagueWeek === pair.week && game.teamIds?.every(id => [pair.home.id, pair.away.id].includes(id)));
  const detailPick = detailPair ? savedPick(detailPair) : undefined;
  const detailResult = detailPick?.status === "ready" ? detailPick.result : null;
  const detailChoice = detailResult && teams.find(team => team.identity.id === detailResult.choice)?.identity.name;
  const heroAi = heroSummary?.ai ?? null;
  const heroResult = heroAi?.pick.result ?? null;
  const heroOwnProbability = heroResult && heroSummary ? heroResult.probabilities.find((row) => row.choice === heroSummary.team.id)?.probability ?? null : null;
  const heroOpponentProbability = heroResult && heroAi ? heroResult.probabilities.find((row) => row.choice === heroAi.opponent.id)?.probability ?? null : null;
  const heroSavedStamp = heroAi ? formatHomeStamp(heroAi.generatedAt) : null;
  const heroChoiceName = heroResult && heroSummary && heroAi ? (heroResult.choice === heroSummary.team.id ? heroSummary.team.name : heroAi.opponent.name) : null;
  const viewerEntry = heroSummary ? entries.find((entry) => entry.identity.id === heroSummary.team.id) : undefined;
  const viewerPrior = preseason ? viewerEntry?.previousSeason : null;
  const viewerRecord = viewerPrior ?? viewerEntry?.currentRecord ?? null;
  const tipPassed = Date.parse(checkedAt) >= Date.parse(WEEK_ONE_TIP_OFF_ISO);
  const sideRecord = (teamId: string) => {
    const entry = entries.find((candidate) => candidate.identity.id === teamId);
    const prior = preseason ? entry?.previousSeason : null;
    const record = prior ?? entry?.currentRecord ?? null;
    return { label: prior ? `${prior.season} record` : "Record", text: record ? `${record.wins}–${record.losses}` : null };
  };

  return <>
    <div className={cs("feature-heading")}>
      <div>
        <p className={cs("feature-label")}>{isHeroShown && !selected ? "Your featured matchup" : selected ? preseasonPreview ? "Selected preseason pairing" : "Selected matchup" : "Featured matchup"} · {status}</p>
        <h1 id="game-title">{title}</h1>
      </div>
    </div>
    {isHeroShown && heroSummary && shown && (
      <div className={cs("hero")} data-hero>
        <div className={cs("hero-faceoff", "hero-enter")}>
          <HeroSide team={shown.home} star={hero?.faces.find((face) => face.team.id === shown.home.id)?.player ?? null}
            portraits={portraits} champion={shown.home.id === championTeamId} own={shown.home.id === heroSummary.team.id}
            recordLabel={sideRecord(shown.home.id).label} recordText={sideRecord(shown.home.id).text} />
          <div className={cs("hero-center")}>
            {preseason && !tipPassed
              ? <TipCountdown serverNowIso={checkedAt} />
              : isFinal(shown)
                ? <><span className={cs("hero-vs")}>Final</span><span className={cs("hero-score", "gh-num")}>{shown.homePoints?.toFixed(1)} – {shown.awayPoints?.toFixed(1)}</span></>
                : shown.homePoints !== null && shown.awayPoints !== null
                  ? <span className={cs("hero-score", "gh-num")}>{shown.homePoints.toFixed(1)} – {shown.awayPoints.toFixed(1)}</span>
                  : <span className={cs("hero-vs")}>VS</span>}
            <span className={cs("hero-week")}>Week {shown.week}</span>
          </div>
          <HeroSide team={shown.away} star={hero?.faces.find((face) => face.team.id === shown.away.id)?.player ?? null}
            portraits={portraits} champion={shown.away.id === championTeamId} own={shown.away.id === heroSummary.team.id}
            recordLabel={sideRecord(shown.away.id).label} recordText={sideRecord(shown.away.id).text} away />
        </div>
        <dl className={cs("hero-dateline", "hero-enter")} style={{ animationDelay: "70ms" }}>
          <div>
            <dt>{viewerPrior ? `${viewerPrior.season} record` : "Record"}</dt>
            <dd className="gh-num">{viewerRecord ? `${viewerRecord.wins}–${viewerRecord.losses}` : "—"}</dd>
          </div>
          <div>
            <dt>Roster value</dt>
            <dd className="gh-num">{heroSummary.valuation.total === null ? "Unavailable" : `$${heroSummary.valuation.total.toFixed(2)} FAAB`}</dd>
            {heroSummary.valuation.knownRoster && !heroSummary.valuation.complete && (
              <dd className={cs("hero-subtotal")}>Known-value subtotal · {heroSummary.coverage.priced} of {heroSummary.coverage.roster} priced</dd>
            )}
          </div>
          {heroSummary.valuation.rank ? (
            <div>
              <dt>Value rank</dt>
              <dd className="gh-num">No. {heroSummary.valuation.rank.rank} of {heroSummary.valuation.rank.teams}</dd>
            </div>
          ) : heroSummary.standing && heroSummary.standing.wins + heroSummary.standing.losses + heroSummary.standing.ties > 0 ? (
            <div>
              <dt>Standing</dt>
              <dd className="gh-num">No. {heroSummary.standing.rank} of {heroSummary.season.totalTeams}</dd>
            </div>
          ) : null}
        </dl>
        {heroSummary.valuation.knownRoster && heroSummary.rosterValues.length > 0 && (
          <details className={cs("hero-valuation", "hero-enter")} style={{ animationDelay: "140ms" }} data-hero-valuation>
            <summary>Full roster valuation</summary>
            <ul className={cs("hero-valuation-rows")}>
              {heroSummary.rosterValues.map((player) => (
                <li key={player.id}>
                  <Link href={`/player/${player.id}`} prefetch={false}>
                    {player.name}
                    <small>{player.position ?? "Position unavailable"}</small>
                  </Link>
                  <span className="gh-num">{player.value === null ? "Unpriced" : `$${player.value.toFixed(2)}`}</span>
                </li>
              ))}
            </ul>
            <p className={cs("caption")}>
              {heroSummary.valuation.complete
                ? `All ${heroSummary.rosterValues.length} roster players priced.`
                : `Subtotal counts priced players only · ${heroSummary.coverage.priced} of ${heroSummary.coverage.roster} priced · ${heroSummary.valuation.unpriced} unpriced — unknown is never $0.`}
            </p>
          </details>
        )}
        <nav className={cs("hero-actions", "hero-enter")} style={{ animationDelay: "140ms" }} aria-label="Your team">
          <Link className={cs("text-link")} href="/team" prefetch={false}>My team</Link>
          <Link className={cs("text-link")} href={`/teams/${heroSummary.team.id}#team-roster`} prefetch={false}>Full roster</Link>
          <Link className={cs("text-link")} href={heroSummary.standingsAvailable ? "#your-standings" : "/teams"} prefetch={false}>{heroSummary.standingsAvailable ? "League standings" : "League teams"}</Link>
        </nav>
        {heroAi && heroResult && heroOwnProbability !== null && heroOpponentProbability !== null && (
          <div className={cs("hero-ai", "hero-enter")} style={{ animationDelay: "210ms" }} data-hero-ai>
            <div className={cs("hero-ai-chips")}>
              <span className={cs("chip")}>{AI_PROBABILITY_LABEL}</span>
              <span className={cs("chip")}>{heroAi.label}</span>
              {heroAi.status === "stale" && <span className={cs("chip", "chip-stale")}>Stale · saved Week {heroAi.week}</span>}
            </div>
            <div className={cs("hero-ai-bar")} aria-hidden="true">
              <span className={cs("hero-ai-own")} style={{ width: barIn ? `${heroOwnProbability * 100}%` : "0%", background: teamColorVar(heroSummary.team.id) }} />
              <span className={cs("hero-ai-opp")} style={{ width: barIn ? `${heroOpponentProbability * 100}%` : "0%" }} />
            </div>
            <p className={cs("hero-ai-legend")}>
              <span>{heroSummary.team.name} <strong className="gh-num">{Number((heroOwnProbability * 100).toFixed(1))}%</strong></span>
              <span><strong className="gh-num">{Number((heroOpponentProbability * 100).toFixed(1))}%</strong> {heroAi.opponent.name}</span>
            </p>
            <p className={cs("caption")}>{heroSavedStamp ? `Saved ${heroSavedStamp} · ` : ""}Model choice: {heroChoiceName}</p>
          </div>
        )}
      </div>
    )}
    <div className={cs("clubhouse-layout")}>
      <div className={cs("court-column")}>
        <figure className={cs("clubhouse-court")} id="clubhouse-court">
          <img src="/courtside/arena.jpg" alt="The GOAT Hoopers basketball court, with players on the floor and fans in the stands" width="1440" height="810" fetchPriority="high" />
        </figure>
        <p className={cs("feature-context")}>{context}</p>
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
                  <div><dt>{prior ? "2025 finish" : "Team profile"}</dt><dd>{prior ? `${prior.finish}${prior.finish === 1 ? "st" : prior.finish === 2 ? "nd" : prior.finish === 3 ? "rd" : "th"}` : <Link href={`/teams/${team.identity.id}`} tabIndex={side === index ? 0 : -1}>Open</Link>}</dd></div>
                </dl>;
              })}
            </div>
          </div>
          <Link className={cs("text-link")} href={`/teams/${teams[side]?.identity.id ?? teams[0].identity.id}`} prefetch={false}>Full team profile</Link>
        </div>}
        <div className={cs("feature-actions")}>
          <CourtsideDialog label={selected ? "Matchup notes" : "Featured matchup notes"} title={title}>
            <p>{context}</p><p>{shown ? preseasonPreview ? "Pairing comes from saved preview inputs; no weekly score forecast is implied." : "Pairing and scores come from the current league check; no projected result is implied." : game.context}</p>
            <p className={cs("caption")}>{shown ? preseasonPreview ? `Preview inputs captured ${aiWeekly?.snapshot?.capturedAt ?? "unavailable"}` : `League check ${checkedAt.slice(0, 10)}` : game.note}</p>
            <div className={cs("notes-teams")}>{teams.map((team) => <Link key={team.identity.id} href={`/teams/${team.identity.id}`}>{team.identity.name}</Link>)}</div>
            {!shown && sources}
            {detailPick && aiWeekly && <>
              <p>{aiWeekly.generatedAt ? <>Saved <time dateTime={aiWeekly.generatedAt}>{savedTimestamp(aiWeekly.generatedAt)}</time>.</> : "No saved prediction time available."}</p>
              {previewPeriod(aiWeekly.snapshot) && <p>{previewPeriod(aiWeekly.snapshot)}</p>}
            </>}
            {detailResult && <>
              <h3>{savedComparison(detailResult.snapshot) ?? "Saved model pick"}{aiWeekly?.status === "stale" ? " · past week" : ""}</h3>
              <p>Current team names identify saved roster inputs. Model choice: {detailChoice ?? `Roster ${detailResult.choice}`}.</p>
              <ul>{detailResult.probabilities.map(p => <li key={p.choice}>Roster {p.choice} · {teams.find(team => team.identity.id === p.choice)?.identity.name ?? "Team name unavailable"}: {Number((p.probability * 100).toFixed(1))}%</li>)}</ul>
              <p>{AI_PROBABILITY_LABEL}. API confidence {Number((detailResult.confidence * 100).toFixed(1))}% is a separate signal.</p>
              <p>{detailResult.model} · {detailResult.promptVersion} · Inputs captured {detailResult.snapshot?.capturedAt ?? "unavailable"}</p>
              {detailResult.snapshot && <p>Scoring mode: {detailResult.snapshot.scoringMode}</p>}
              <ul>{detailPick?.evidence.map((e, index) => <li key={index}>{e}</li>)}</ul>
            </>}
          </CourtsideDialog>
          {selected && <button type="button" className={cs("text-link")} onClick={() => { setSelected(null); setSide(0); }}>Back to featured matchup</button>}
          <p className={cs("feature-check")}>League check · {checkedAt.slice(0, 10)}</p>
        </div>
      </div>
      <aside className={cs("week-desk")} aria-labelledby="this-week-title">
        <div className={cs("week-heading")}><h2 id="this-week-title">{aiWeekly ? <Link href="/ai-decides">AI Decides</Link> : "This week"}</h2><span>{preseasonPreview ? "Preseason preview · target Week 1" : <>{aiWeekly && "This week · "}{week ? `Week ${week}` : "Pairings pending"}{preseason && <><br />Upcoming</>}</>}</span></div>
        {aiWeekly && <p className={cs("week-provenance")}>Model estimates{aiWeekly.status === "stale" ? " · saved picks" : ""}{aiWeekly.status === "stale" && " · past week"}</p>}
        <div className={cs("week-games")}>
          {pairs.map((pair) => {
            const active = shown ? shown.week === pair.week && [shown.home.id, shown.away.id].every(id => [pair.home.id, pair.away.id].includes(id)) : game.state === "upcoming" && game.leagueWeek === pair.week && game.teamIds?.every((id) => [pair.home.id, pair.away.id].includes(id));
            const pick = savedPick(pair);
            const result = pick?.status === "ready" ? pick.result : null;
            const pickLabel = aiWeekly ? result
              ? ` ${aiWeekly.status === "stale" ? "Past-week" : "Saved"} model probabilities: ${result.probabilities.map((p) => `${[pair.home, pair.away].find(team => team.id === p.choice)?.name ?? 'Team name unavailable'} ${Number((p.probability * 100).toFixed(1))}%`).join(", ")}.`
              : " Prediction unavailable." : "";
            return <button type="button" key={`${pair.week}:${pair.home.id}:${pair.away.id}`} className={cs("week-game")} aria-pressed={!!active} aria-controls="game-title matchup-context" aria-label={`${pair.home.name} versus ${pair.away.name}, ${preseasonPreview ? "preseason lineup preview for target Week 1" : isFinal(pair) ? "final" : "upcoming"}.${pickLabel}`} onClick={() => { setSelected(pair); setSide(0); }}>
              {[pair.home, pair.away].map((team, index) => {
                const probability = result?.probabilities.find((p) => p.choice === team.id);
                return <span className={`${cs("week-team")} ${team.id === viewerTeamId ? cs("ownTeam") : ""}`} key={team.id} data-own-team={team.id === viewerTeamId || undefined}>
                <TeamAvatar name={team.name} avatar={team.avatar} isChampion={team.id === championTeamId} /><strong>{team.name}{team.id === viewerTeamId && <span className={cs("you")}>Your team</span>}</strong>
                <span className={cs("week-score", "gh-num")} aria-label={probability ? `${Number((probability.probability * 100).toFixed(1))}% model estimate` : isFinal(pair) ? `${index === 0 ? pair.homePoints : pair.awayPoints} fantasy points` : preseasonPreview ? "Preview · score not forecast" : "Score pending"}>{probability ? `${Number((probability.probability * 100).toFixed(1))}%` : isFinal(pair) ? (index === 0 ? pair.homePoints : pair.awayPoints)!.toFixed(1) : "—"}</span>
                {probability && <span className={cs("week-probability", "week-bar")} data-probability-for={team.id} aria-hidden="true"><i style={{ width: `${probability.probability * 100}%` }} /></span>}
                {probability && isFinal(pair) && <span className={cs("week-final-score")}>{(index === 0 ? pair.homePoints : pair.awayPoints)!.toFixed(1)} fantasy points · Final</span>}
              </span>;
              })}
              {aiWeekly && !result && <span className={cs("week-pick-status")}>Prediction unavailable</span>}
            </button>;
          })}
          {!pairs.length && <p className={cs("empty")}>{preseasonPreview ? "Saved preview team identities are temporarily unavailable." : "Current pairings are temporarily unavailable."} Team profiles remain available below.</p>}
        </div>
        {aiWeekly && <Link className={cs("week-playground", "text-link")} href="/ai-decides">Open AI playground</Link>}
      </aside>
    </div>
    <p className={cs("sr-only")} role="status" aria-live="polite">{selected ? `Selected ${title}. ${status}.` : ""}</p>
  </>;
}
