/* eslint-disable @next/next/no-img-element -- Approved bounded local portraits in an offline QA entry. */
import { useCallback, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { createPortal } from "react-dom";
import { CourtsideHome } from "@/surfaces/season-hub/CourtsideHome";
import { SiteHeader } from "@/ui/SiteHeader";
import { SiteFooter } from "@/ui/SiteFooter";
import { TeamAvatar } from "@/ui/TeamAvatar";
import controls from "@/ui/controls.module.css";
import { homepageFixture, portraits } from "./fixture";
import { presentation } from "./presentation";
import "@/ui/tokens.css";
import "@/app/globals.css";
import "./review.css";

const query = new URLSearchParams(location.search);
type Fixture = ReturnType<typeof homepageFixture>;

/** Composition from existing facts, not a new score, forecast or metric.
 * This replaces the decorative figure only. The original caption/clock,
 * desk, full saved picks and all sources remain the source components'. */
function MatchupSpread({ data }: { data: Fixture }) {
  const memberTeamId = data.personal.kind === "member" ? data.personal.summary?.team.id ?? null : null;
  const pair = data.home.directory.find(entry => entry.identity.id === (memberTeamId ?? data.home.edition?.game.teamIds?.[0]))?.currentMatchup;
  if (!pair) return <div className="matchup-spread" data-matchup-spread><p>Pairing pending. Team profiles remain available below.</p></div>;
  return <div className="matchup-spread" data-matchup-spread>
    <div className="spread-heading"><span>Week {pair.week}</span><span>Current league pairing</span></div>
    <div className="spread-teams">
      {[pair.home, pair.away].map((team, index) => {
        const face = data.faces.find(row => row.team.id === team.id);
        const score = index === 0 ? pair.homePoints : pair.awayPoints;
        return <div className="spread-side" key={team.id}>
          <div className="spread-identity"><TeamAvatar name={team.name} avatar={team.avatar} isChampion={face?.champion} /><span>{team.managerName}</span></div>
          <a href={`/teams/${team.id}`} className="spread-team-name">{team.name}</a>
          <p className="spread-record">Record {team.wins}–{team.losses}</p>
          <p className="spread-score gh-num">{score === null ? <span>Pending</span> : score.toFixed(1)}</p>
          <p className="spread-score-label">{score === null ? "Score not yet available" : "Current fantasy points"}</p>
          {face?.player && <a className="spread-anchor" href={`/player/${face.player.id}`}>
            {portraits[face.player.id] && <img src={portraits[face.player.id]} alt="" width="80" height="64" />}
            <span><small>Top modeled player value</small><strong>{face.player.name}</strong><span className="gh-num">${face.player.value.toFixed(2)}</span></span>
          </a>}
        </div>;
      })}
    </div>
    <p className="spread-source">Sample current scores & prices. No final result or live forecast is asserted.</p>
  </div>;
}

/** Surface contract: find this week's matchup and the next useful action.
 * Member: My team / roster. Public: inspect matchup/teams. Same underlying
 * CourtsideHome, including missing-edition/unknown data and every disclosure.
 * Narrow layout preserves reading order and targets. No new data requests,
 * production logic, fake Power rankings, 3D or generic feature-card grid. */
function Review() {
  const [member, setMember] = useState(query.get("view") === "member");
  const [missing, setMissing] = useState(query.get("edition") === "missing");
  const baseline = query.get("style") === "baseline";
  const [figure, setFigure] = useState<HTMLElement | null>(null);
  const data = useMemo(() => homepageFixture(member, missing), [member, missing]);
  // The missing-edition fixture changes this subtree. A callback ref binds
  // the portal after commit without a synchronous effect/state cycle.
  const bindMain = useCallback((element: HTMLElement | null) => {
    setFigure(element?.querySelector<HTMLElement>("#clubhouse-court") ?? null);
  }, []);
  return <>
    {!baseline && <style>{presentation}</style>}
    <aside className="review-toolbar" aria-label="Prototype controls">
      <div><strong>Homepage / Editorial study</strong><span>Offline fixture · sample current scores, prices, form & AI</span></div>
      <div className="review-controls">
        <button className={controls.secondary} aria-pressed={member} onClick={() => setMember(!member)}>{member ? "Your edition" : "League edition"}</button>
        <label><input type="checkbox" checked={missing} onChange={event => setMissing(event.target.checked)} /> Missing editorial</label>
        <a href={`/?view=${member ? "member" : "public"}${baseline ? "" : "&style=baseline"}`}>{baseline ? "See redesign" : "Compare current"}</a>
      </div>
    </aside>
    <SiteHeader user={member ? { displayName: "Aidan · sample", teamId: "1", avatar: null } : null} logoutAction={async () => setMember(false)} />
    <main key={missing ? "missing" : "edition"} ref={bindMain} className={baseline ? "baseline-home" : "editorial-study"} id="main-content" tabIndex={-1} data-review-view={member ? "member" : "public"}>
      <CourtsideHome data={data.home} archive={data.archive} portraits={portraits} personal={data.personal}
        aiWeekly={data.weekly} faces={data.faces} viewerTeamId={member ? "1" : undefined} />
      {!baseline && figure && createPortal(<MatchupSpread data={data} />, figure)}
    </main>
    <p className="review-receipt">Design review only. Dated Oct 8 roster identities & editorial; synthetic current scores, prices, form, news and AI picks. No live data, account actions, Power producer or unpublished recap integration.</p>
    <SiteFooter season={data.home.hub?.season ?? null} />
  </>;
}

createRoot(document.getElementById("root")!).render(<Review />);
