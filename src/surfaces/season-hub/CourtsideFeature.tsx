"use client";

/* eslint-disable @next/next/no-img-element -- Existing, pre-sized court image bypasses optimizer quota. */
import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { isFinal, type Matchup } from "@/domain";
import type { LiveClubhouseDirectoryEntry } from "@/domain/clubhouse-directory";
import type { WeeklyEdition } from "@/domain/weekly-spotlight";
import { TeamAvatar } from "@/ui/TeamAvatar";
import { CourtsideDialog } from "./CourtsideDialog";
import { cs } from "./CourtsideStyles";

type Props = {
  edition: WeeklyEdition;
  entries: Pick<LiveClubhouseDirectoryEntry, "identity" | "previousSeason" | "currentRecord" | "currentMatchup">[];
  rosterCounts: Record<string, number>;
  preseason: boolean;
  checkedAt: string;
  sources: ReactNode;
};

/** This week's story → select a pairing / inspect the floor.
 * States: dated draft, historical final, live pairing, pending and unavailable.
 * Phones retain the court, five pairings and linked identities in reading order.
 * No projected scores, scroll hijacking, ornamental frames or standalone hoopers.
 */
export function CourtsideFeature({ edition, entries, rosterCounts, preseason, checkedAt, sources }: Props) {
  const [selected, setSelected] = useState<Matchup | null>(null);
  const [side, setSide] = useState(0);
  const [inspecting, setInspecting] = useState(false);
  const [paused, setPaused] = useState(false);
  const court = useRef<HTMLElement>(null);
  const pairs = entries.flatMap((entry, index) => {
    const matchup = entry.currentMatchup;
    return matchup && !entries.slice(0, index).some((previous) =>
      previous.currentMatchup?.week === matchup.week &&
      [previous.currentMatchup.home.id, previous.currentMatchup.away.id].sort().join(":") === [matchup.home.id, matchup.away.id].sort().join(":"),
    ) ? [matchup] : [];
  });
  const game = edition.game;
  const ids = selected ? [selected.home.id, selected.away.id] : game.teamIds ?? [];
  const teams = ids.map((id) => entries.find((entry) => entry.identity.id === id)).filter((entry) => !!entry);
  const state = selected ? isFinal(selected) ? "final" : "upcoming" : game.state;
  const status = selected
    ? `Week ${selected.week} · ${isFinal(selected) ? "Final" : "Upcoming · scores pending"}`
    : game.state === "final" ? `Historical final · ${edition.season}`
      : game.state === "upcoming" ? `Week ${game.leagueWeek} · Upcoming` : "Spotlight pending";
  const title = selected ? `${selected.home.name} vs ${selected.away.name}` : game.title;
  const scores = selected ? [selected.homePoints, selected.awayPoints] : game.scores;
  const context = selected ? isFinal(selected)
    ? "Completed fantasy matchup. Select a team below for its league context."
    : "Current league pairing. Scores are pending; select a team below for its league context."
    : game.context;
  const week = pairs[0]?.week;

  useEffect(() => {
    const node = court.current;
    if (!node) return;
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    let visible = true;
    const sync = () => { node.dataset.motion = !paused && !preference.matches && visible && !document.hidden ? "on" : "off"; };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
    observer.observe(node);
    preference.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    sync();
    return () => { observer.disconnect(); preference.removeEventListener("change", sync); document.removeEventListener("visibilitychange", sync); };
  }, [paused]);

  return <>
    <div className={cs("feature-heading")}>
      <div>
        <p className={cs("feature-label")}>{selected ? "This week" : "Game of the week"} · {status}</p>
        <h1 id="game-title">{title}</h1>
      </div>
      <p className={cs("feature-context")}>{context}</p>
    </div>
    <div className={cs("clubhouse-layout")}>
      <div className={cs("court-column")}>
        <figure ref={court} className={cs("clubhouse-court")} data-inspecting={inspecting} data-motion="off" id="clubhouse-court">
          <img src="/courtside/arena.jpg" alt="The GOAT Hoopers basketball court, with players on the floor and fans in the stands" width="1440" height="810" fetchPriority="high" />
        </figure>
        <div className={cs("court-actions")}>
          <button type="button" aria-pressed={paused} onClick={() => setPaused(!paused)}>{paused ? "Resume motion" : "Pause motion"}</button>
          <button type="button" aria-pressed={inspecting} aria-controls="clubhouse-court" onClick={() => setInspecting(!inspecting)}>{inspecting ? "Return to wide view" : "Inspect the floor"}</button>
        </div>
      </div>
      <aside className={cs("week-desk")} aria-labelledby="this-week-title">
        <div className={cs("week-heading")}><h2 id="this-week-title">This week</h2><span>{week ? `Week ${week}` : "Pairings pending"}{preseason && <><br />Upcoming</>}</span></div>
        <div className={cs("week-games")}>
          {pairs.map((pair) => {
            const active = selected === pair || (!selected && game.state === "upcoming" && game.leagueWeek === pair.week && game.teamIds?.every((id) => [pair.home.id, pair.away.id].includes(id)));
            return <button type="button" key={`${pair.week}:${pair.home.id}:${pair.away.id}`} className={cs("week-game")} aria-pressed={!!active} aria-controls="game-title matchup-context" aria-label={`${pair.home.name} versus ${pair.away.name}, ${isFinal(pair) ? "final" : "upcoming"}`} onClick={() => { setSelected(pair); setSide(0); }}>
              {[pair.home, pair.away].map((team, index) => <span className={cs("week-team")} key={team.id}>
                <TeamAvatar name={team.name} avatar={team.avatar} /><strong>{team.name}</strong>
                <span className={cs("week-score", "gh-num")} aria-label={isFinal(pair) ? `${index === 0 ? pair.homePoints : pair.awayPoints} fantasy points` : "Score pending"}>{isFinal(pair) ? (index === 0 ? pair.homePoints : pair.awayPoints)!.toFixed(1) : "—"}</span>
              </span>)}
            </button>;
          })}
          {!pairs.length && <p className={cs("empty")}>Current pairings are temporarily unavailable. Team profiles remain available below.</p>}
        </div>
        <CourtsideDialog label={selected ? "Matchup notes" : "Featured matchup notes"} title={title}>
          <p>{context}</p><p>{selected ? "Pairing and scores come from the current league check; no projected result is implied." : game.selectionReason}</p>
          <p className={cs("caption")}>{selected ? `League check ${checkedAt.slice(0, 10)}` : game.note}</p>
          <div className={cs("notes-teams")}>{teams.map((team) => <Link key={team.identity.id} href={`/teams/${team.identity.id}`}>{team.identity.name} ↗</Link>)}</div>
          {!selected && sources}
        </CourtsideDialog>
        {selected && <button type="button" className={cs("text-link")} onClick={() => { setSelected(null); setSide(0); }}>Back to Game of the Week</button>}
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
