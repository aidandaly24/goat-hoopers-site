"use client";

/* eslint-disable @next/next/no-img-element -- Small source portraits load only inside the selected roster; no optimizer quota. */
import Link from "next/link";
import { useEffect, useReducer, useRef, useState, useSyncExternalStore } from "react";
import { Badge } from "@/ui/Badge";
import {
  EMPTY_DRAFT, shuffleDemoTeams, transitionDraft,
  type DraftAction, type DraftDemo, type DraftPick, type DraftPlayer, type DraftState,
} from "@/domain/arcade/roster-draft";
import { isNbaSourceStale, type DraftRosterClient, type NbaRoster, type NbaTeam, type NbaTeamDirectory } from "@/domain/arcade/nba-rosters";
import "@/ui/week-two-draft-tokens.css";
import styles from "./WeekTwoDraft.module.css";

function Arrow({ back = false }: { back?: boolean }) {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={back ? { transform: "rotate(180deg)" } : undefined}>
    <path d="M4 12h15m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.6" />
  </svg>;
}
function Burst() {
  return <svg width="1em" height="1em" viewBox="0 0 40 40" fill="none" aria-hidden="true">
    <path d="M20 2v36M2 20h36M7 7l26 26M7 33 33 7" stroke="currentColor" strokeWidth="2.5" />
  </svg>;
}
function CourtLines() {
  return <svg className={styles.courtLines} viewBox="0 0 600 440" fill="none" aria-hidden="true">
    <path d="M30 25h540v390H30zM30 220h540M300 25v390M222 25v100h156V25M222 415V315h156v100" />
    <circle cx="300" cy="220" r="62" /><path d="M85 25v40a215 215 0 0 0 430 0V25M85 415v-40a215 215 0 0 1 430 0v40" />
  </svg>;
}
function Portrait({ player, className = "", lazy = false }: { player: DraftPlayer; className?: string; lazy?: boolean }) {
  const [failed, setFailed] = useState(false);
  return <span className={`${styles.portrait} ${className}`} aria-hidden="true">
    {failed || !player.portrait ? <span className={styles.portraitFallback}>{player.firstName[0]}{player.lastName[0]}</span>
      : <img src={player.portrait} loading={lazy ? "lazy" : "eager"} alt="" onError={() => setFailed(true)} draggable={false} />}
  </span>;
}
function TeamLogo({ team }: { team: NbaTeam }) {
  const [failed, setFailed] = useState(false);
  return team.logo && !failed ? <img className={styles.teamLogo} src={team.logo} alt="" onError={() => setFailed(true)} />
    : <span className={styles.logoFallback} aria-hidden="true">{team.abbreviation}</span>;
}
const subscribeMotion = (listener: () => void) => {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
};
const motionSnapshot = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const serverMotionSnapshot = () => false;
const sourceDate = (value: string) => new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
const DRAW_STEPS = [0, 80, 160, 240, 330, 430, 540, 670, 820, 1000, 1220, 1500, 1830];

function getPick(demo: DraftDemo, pick: DraftPick) {
  const team = demo.teams.find(team => team.id === pick.teamId)!;
  return { team, player: team.players.find(player => player.id === pick.playerId)! };
}

/** Local five-pick experience. Its injected client can read only the NBA directory/roster APIs. */
export function WeekTwoDraft({ client }: { client: DraftRosterClient }) {
  const [directory, setDirectory] = useState<NbaTeamDirectory | null>(null);
  const [directoryStatus, setDirectoryStatus] = useState<"idle" | "loading" | "error">("idle");
  const [rosters, setRosters] = useState<Record<string, NbaRoster>>({});
  const [rosterRequest, setRosterRequest] = useState<{ teamId: string; status: "loading" | "error" } | null>(null);
  const demo: DraftDemo = { pickCount: 5, teams: directory?.teams.map(team => ({ ...team, players: rosters[team.id]?.players ?? [] })) ?? [] };
  const [state, dispatch] = useReducer((state: DraftState, action: DraftAction) => transitionDraft(state, action, demo), EMPTY_DRAFT);
  const [search, setSearch] = useState("");
  const [inspectionTime, setInspectionTime] = useState<number | null>(null);
  const [drawFrame, setDrawFrame] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const firstDrawStarted = useRef(false);
  const active = useRef(true);
  const directoryBusy = useRef(false);
  const requestId = useRef(0);
  const requestController = useRef<AbortController | null>(null);
  const [exportState, setExportState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const exportBusy = useRef(false);
  const reducedMotion = useSyncExternalStore(subscribeMotion, motionSnapshot, serverMotionSnapshot);
  const currentTeam = directory?.teams.find(team => team.id === state.order[state.picks.length]);
  const currentRoster = currentTeam ? rosters[currentTeam.id] : undefined;
  const selected = currentRoster?.players.find(player => player.id === state.selectedId);
  const lockedPick = state.phase === "locked" ? getPick(demo, state.picks[state.picks.length - 1]) : null;
  const shownTeam = lockedPick ? directory?.teams.find(team => team.id === lockedPick.team.id) : currentTeam;
  const shownPlayer = lockedPick?.player ?? selected;
  const shownRoster = shownTeam ? rosters[shownTeam.id] : undefined;
  const isDrawing = state.phase === "drawing";
  const spinningTeam = drawFrame >= DRAW_STEPS.length - 1 ? currentTeam : directory?.teams[(drawFrame * 7 + state.picks.length * 11) % directory.teams.length];
  const normalizedSearch = search.trim().toLocaleLowerCase();
  const visiblePlayers = currentRoster?.players.filter(player => `${player.firstName} ${player.lastName} ${player.position}`.toLocaleLowerCase().includes(normalizedSearch)) ?? [];

  const cancelRequest = () => { requestController.current?.abort(); requestId.current += 1; };
  const begin = (teams: readonly NbaTeam[]) => {
    cancelRequest(); setInspectionTime(Date.now()); setRosterRequest(null); setSearch(""); setExportState("idle");
    dispatch({ type: "start", order: shuffleDemoTeams(teams.map(team => ({ ...team, players: [] })), Math.random) });
  };
  const start = async () => {
    if (directoryBusy.current) return;
    if (directory) { begin(directory.teams); return; }
    directoryBusy.current = true; setDirectoryStatus("loading");
    const controller = new AbortController(); requestController.current = controller;
    try {
      const result = await client.teams(controller.signal);
      if (!active.current || controller.signal.aborted) return;
      setDirectory(result); setDirectoryStatus("idle");
      // The reducer receives the directory on the next render; keep the first draw sealed until then.
    } catch { if (active.current && !controller.signal.aborted) setDirectoryStatus("error"); }
    finally { directoryBusy.current = false; }
  };
  // A successful first directory request enters the same local start path as later drafts.
  useEffect(() => {
    if (directory && state.phase === "teaser" && directoryStatus === "idle" && !firstDrawStarted.current) {
      firstDrawStarted.current = true;
      dispatch({ type: "start", order: shuffleDemoTeams(directory.teams.map(team => ({ ...team, players: [] })), Math.random) });
    }
  }, [directory, directoryStatus, state.phase]);
  const loadRoster = async (teamId: string) => {
    setInspectionTime(Date.now());
    if (rosters[teamId]) return;
    cancelRequest();
    const id = requestId.current;
    const controller = new AbortController(); requestController.current = controller;
    setRosterRequest({ teamId, status: "loading" });
    try {
      const roster = await client.roster(teamId, controller.signal);
      if (active.current && id === requestId.current && !controller.signal.aborted) {
        setRosters(previous => ({ ...previous, [teamId]: roster })); setRosterRequest(null);
      }
    } catch {
      if (active.current && id === requestId.current && !controller.signal.aborted) setRosterRequest({ teamId, status: "error" });
    }
  };
  const reveal = () => {
    if (!currentTeam || state.phase !== "sealed") return;
    setSearch(""); setDrawFrame(0); dispatch({ type: "reveal" }); void loadRoster(currentTeam.id);
  };
  useEffect(() => {
    if (!isDrawing) return;
    const finish = () => dispatch({ type: "finish-reveal" });
    if (reducedMotion || document.hidden) { finish(); return; }
    const timers = DRAW_STEPS.map((at, index) => window.setTimeout(() => setDrawFrame(index), at));
    timers.push(window.setTimeout(finish, 2200));
    const hidden = () => { if (document.hidden) finish(); };
    document.addEventListener("visibilitychange", hidden);
    return () => { timers.forEach(clearTimeout); document.removeEventListener("visibilitychange", hidden); };
  }, [isDrawing, reducedMotion]);
  useEffect(() => {
    if (state.phase === "teaser" || state.phase === "drawing") return;
    heading.current?.focus({ preventScroll: true });
    heading.current?.scrollIntoView({ block: "start", behavior: "instant" });
  }, [state.phase]);
  useEffect(() => { active.current = true; return () => { active.current = false; requestController.current?.abort(); }; }, []);

  const saveLineup = async () => {
    if (exportBusy.current) return;
    exportBusy.current = true; setExportState("saving");
    try {
      const { downloadLineup } = await import("./lineup-poster");
      await downloadLineup(demo, state.picks);
      if (active.current) setExportState("saved");
    } catch { if (active.current) setExportState("error"); }
    finally { exportBusy.current = false; }
  };

  return <div className={`gh-week-two-draft ${styles.root}`} data-draft-phase={state.phase}>
    <div className={styles.topline}>
      <Link href="/arcade" className={styles.back}><Arrow back /> Arcade</Link>
      <span className={styles.edition}>THE GAME ROOM <span>/</span> VOL. 02</span>
      <Badge>Unranked preview</Badge>
    </div>
    {state.phase === "teaser" ? <>
      <section className={styles.teaser} aria-labelledby="draft-title">
        <div className={styles.teaserCopy}>
          <div className={styles.kicker}><span className={styles.dot} /> WEEK 02 / 82–0</div>
          <h1 id="draft-title" ref={heading} tabIndex={-1} className={styles.teaserTitle}>Chase<br /><em>perfect.</em></h1>
          <p className={styles.lede}>30 NBA teams. Five random draws.<br />{" "}Choose a player from each team’s full roster.<br />{" "}Build a five worth arguing about.</p>
          <button className={styles.primary} onClick={() => void start()} disabled={directoryStatus === "loading"}>{directoryStatus === "loading" ? "Opening the draft room…" : directoryStatus === "error" ? "Retry opening draft" : "Enter the demo"}<Arrow /></button>
          <p className={styles.ctaNote} role="status">{directoryStatus === "error" ? "The NBA team directory is unavailable. Retry to start; no draw has been made." : "A playable preview. Week 2 competition stays locked."}</p>
        </div>
        <div className={styles.teaserPoster} aria-label="82–0 roster draft artwork">
          <CourtLines /><div className={styles.posterMast}><span>GOAT HOOPERS</span><span>THE ROSTER DRAFT</span></div>
          <div className={styles.bigRecord}>82<span>–</span>0<span className={styles.recordStar}><Burst /></span></div>
          <div className={styles.posterRule}><span>BUILD YOUR</span><span>PERFECT FIVE</span></div>
          <div className={styles.teaserSlots} aria-hidden="true">{[1, 2, 3, 4, 5].map(number => <span key={number}><small>PICK</small><strong>0{number}</strong><Burst /></span>)}</div>
          <div className={styles.posterFooter}><span>TRUST THE DRAW.<br />MAKE YOUR CALL.</span><span className={styles.posterNumber}>02</span></div>
          <div className={styles.artLabel}>FIVE PICKS · FULL TEAM ROSTERS · YOUR DECISIONS</div>
        </div>
      </section>
      <div className={styles.editorialFooter}><span className={styles.footerIndex}>THE IDEA <Arrow /></span><p><strong>Reveal. Choose. Lock it in.</strong> Each round draws a different NBA team. Search its source roster, choose one player, and add them to your five.</p><span className={styles.noForecast}>82–0 is the challenge.<br />No season forecast is generated.</span></div>
    </> : state.phase === "complete" ? <>
      <header className={styles.resultHeader}><div><p className={styles.kicker}>THE FINAL SELECTION</p><h1 ref={heading} tabIndex={-1}>Meet your five<span>.</span></h1></div><p>You made the calls.<br />Now let the group chat decide.</p></header>
      <div className={styles.resultGrid}>
        <section className={styles.lineupPoster} aria-label="Your completed demo lineup">
          <div className={styles.lineupMast}><span>GOAT HOOPERS / THE ROSTER DRAFT</span><strong>82–0<span><Burst /></span></strong></div>
          <div className={styles.lineupHeadline}>BUILT<br /><em>DIFFERENT.</em></div>
          <ol className={styles.finalPicks}>{state.picks.map((pick, index) => {
            const { team, player } = getPick(demo, pick);
            return <li key={player.id} data-draft-team={team.id}><span className={styles.pickNumber}>0{index + 1}</span><div className={styles.finalName}><span>{player.firstName}</span><strong>{player.lastName}</strong><small>{team.abbreviation} / {player.position}</small></div><Portrait player={player} /></li>;
          })}</ol>
          <div className={styles.lineupFooter}><span>WEEK 02 / UNRANKED PREVIEW</span><span>YOUR FIVE · NO SEASON PREDICTION</span></div>
        </section>
        <aside className={styles.resultActions}>
          <span className={styles.resultMark}><Burst /></span><h2>Put your<br />name on it.</h2><p>Your lineup, ready for the chat. Save a portrait-format poster with all five picks.</p>
          <button className={styles.primary} onClick={saveLineup} disabled={exportState === "saving"}>{exportState === "saving" ? "Making your poster…" : "Save lineup poster"}<Arrow /></button>
          <p className={styles.exportStatus} role="status">{exportState === "saved" ? "Poster downloaded. Ready when you are." : exportState === "error" ? "Couldn’t save the poster. Try again." : "PNG · 1080 × 1350 · saved on your device"}</p>
          <button className={styles.textButton} onClick={() => void start()}>Draft another five <Arrow /></button>
          <Link href="/arcade" className={styles.textButton}>Back to the Arcade <Arrow back /></Link>
          <p className={styles.resultDisclaimer}>Unranked preview. Your choices stay in this browser session. No ratings, season forecast, score submission or prize entry.</p>
        </aside>
      </div>
    </> : <>
      <header className={styles.draftHeader}><div><p className={styles.kicker}>82–0 / THE ROSTER DRAFT</p><h1 ref={heading} tabIndex={-1}>{state.phase === "sealed" ? "Trust the draw." : isDrawing ? "Here comes your team." : state.phase === "locked" ? "Good call." : "Your call."}</h1></div><div className={styles.round}><span>{state.phase === "locked" ? "PICKS LOCKED" : "ROUND"}</span><strong>0{Math.min(state.picks.length + (state.phase === "locked" ? 0 : 1), demo.pickCount)}<small> / 05</small></strong></div></header>
      <div className={styles.draftGrid}>
        <section className={`${styles.revealStage} ${state.phase === "locked" ? styles.lockedStage : ""}`} aria-label={state.phase === "sealed" || isDrawing ? "NBA team draw" : `${shownTeam?.city} ${shownTeam?.name}`}>
          <CourtLines /><div className={styles.stageRail}><span>GOAT HOOPERS DRAFT ROOM</span><span>WEEK 02</span></div>
          {state.phase === "sealed" ? <div className={styles.sealedContent}>
            <div className={styles.sealedArt} aria-hidden="true"><span>?</span><span>?</span><span>?</span></div><h2>Who’s on<br />the board?</h2><p>One of 30 teams. The call after that is yours.</p><button className={styles.revealButton} onClick={reveal}>Reveal NBA team <Arrow /></button>
          </div> : isDrawing ? <div className={styles.drawContent}>
            <div className={styles.drawWindow} aria-hidden="true"><small>DRAWING FROM {directory?.teams.length} NBA TEAMS</small><strong key={drawFrame}>{spinningTeam?.abbreviation}</strong><span>{spinningTeam?.city} {spinningTeam?.name}</span></div>
            <div className={styles.drawTrack} aria-hidden="true">{directory?.teams.slice(0, 15).map(team => <span key={team.id}>{team.abbreviation}</span>)}</div>
            <button className={styles.revealButton} onClick={() => dispatch({ type: "finish-reveal" })}>Skip animation <Arrow /></button>
          </div> : <>
            <div className={styles.teamTypography}><span>{shownTeam?.city}</span><h2>{shownTeam?.name}</h2></div><div className={styles.teamAbbreviation} aria-hidden="true">{shownTeam?.abbreviation}</div>
            {shownPlayer ? <Portrait key={shownPlayer.id} player={shownPlayer} className={styles.stagePortrait} /> : shownTeam ? <div className={styles.stageLogo}><TeamLogo key={shownTeam.id} team={shownTeam} /></div> : null}
            <div className={styles.stageBottom}><div><span>{state.phase === "locked" ? "THE PICK IS IN" : shownPlayer ? "YOUR SELECTION" : "TEAM REVEALED"}</span><strong>{shownPlayer ? `${shownPlayer.firstName} ${shownPlayer.lastName}` : "Make your move."}</strong></div><span className={styles.seal} aria-hidden="true">{state.phase === "locked" ? "✓" : <Burst />}</span></div>
            {state.phase === "locked" && <span className={styles.lockStamp}>LOCKED IN</span>}
          </>}
        </section>
        <div className={styles.decision}>
          {state.phase === "sealed" || isDrawing ? <div className={styles.decisionIntro}><span className={styles.bigStep}>0{state.picks.length + 1}<span>—</span></span><h2>First, the team.<br />Then, the talent.</h2><p>The draw picks a team. You get its full source roster, including listed reserve and two-way players. Choose anyone you want for your five.</p><p>Your team is fixed once you reveal it. A roster retry keeps the same draw.</p></div>
            : state.phase === "locked" ? <div className={styles.lockedCopy}><span className={styles.bigStep}>✓</span><h2>{shownPlayer?.lastName}.<br />On your side.</h2><p>{demo.pickCount - state.picks.length} more {demo.pickCount - state.picks.length === 1 ? "call" : "calls"} to make. A different team is waiting behind the next reveal.</p><button className={styles.primary} onClick={() => { setSearch(""); dispatch({ type: "next" }); }}>Next team <Arrow /></button></div>
              : currentRoster ? <>
                <div className={styles.choiceHeading}><h2>Who are you taking?</h2><span>{currentRoster.players.length} PLAYERS</span></div>
                <label className={styles.rosterSearch}>Search this roster<input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Player name or position" /></label>
                <div className={styles.playerChoices} role="group" aria-label={`Choose one ${currentTeam?.name} player`}>
                  {visiblePlayers.map(player => { const alreadyPicked = state.picks.some(pick => pick.playerId === player.id); return <button key={player.id} aria-pressed={state.selectedId === player.id} disabled={alreadyPicked} className={styles.playerChoice} onClick={() => dispatch({ type: "select", playerId: player.id })}>
                    <Portrait player={player} lazy /><span className={styles.choiceName}><span>{player.firstName}</span><strong>{player.lastName}</strong><small>{player.position}{player.jersey ? ` · #${player.jersey}` : ""}{alreadyPicked ? " · Already drafted" : player.status ? ` · ${player.status}` : ""}</small></span><span className={styles.choiceIndicator} aria-hidden="true">{state.selectedId === player.id ? "✓" : "+"}</span>
                  </button>; })}
                  {visiblePlayers.length === 0 && <p className={styles.emptySearch}>No players match. <button className={styles.textButton} onClick={() => setSearch("")}>Clear search</button></p>}
                </div>
                <div className={styles.lockAction}><p>{selected ? `${selected.firstName} ${selected.lastName}. Your call?` : "Pick a player to continue."}</p><button className={styles.primary} disabled={!selected} onClick={() => dispatch({ type: "lock" })}>Lock in pick <span aria-hidden="true">✓</span></button></div>
              </> : <div className={styles.rosterLoading} role="status"><span className={styles.bigStep}>{rosterRequest?.status === "error" ? "!" : "…"}</span><h2>{rosterRequest?.status === "error" ? "Roster on hold." : "Opening the roster…"}</h2><p>{rosterRequest?.status === "error" ? `We couldn’t load ${currentTeam?.city}’s roster. Your team and picks are kept. Retry this same team.` : `Getting every listed ${currentTeam?.name} player from the roster source.`}</p>{rosterRequest?.status === "error" && currentTeam && <button className={styles.primary} onClick={() => void loadRoster(currentTeam.id)}>Retry roster <Arrow /></button>}</div>}
          <div className={styles.poolNote}>UNRANKED PREVIEW <span>{shownRoster ? <><a href={shownRoster.source.sourceUrl} target="_blank" rel="noreferrer">ESPN roster</a>{shownRoster.source.seasonLabel ? ` · ${shownRoster.source.seasonLabel}` : ""} · Retrieved {sourceDate(shownRoster.source.observedAt)}{shownRoster.source.sourceUpdatedAt ? ` · Source updated ${sourceDate(shownRoster.source.sourceUpdatedAt)}` : " · Source update time unavailable"}. All {shownRoster.players.length} listed players.{isNbaSourceStale(shownRoster.source, inspectionTime ?? Date.parse(shownRoster.source.observedAt)) ? " Cached roster may be out of date." : " Team rosters can change."}</> : "Source rosters load only after your draw. No ratings, scoring or account submission."}</span></div>
        </div>
      </div>
      <section className={styles.rosterRail} aria-label="Your demo lineup progress"><div className={styles.rosterRailTitle}><span>YOUR LINEUP</span><strong>{state.picks.length} / {demo.pickCount}<small> PICKS</small></strong></div><ol>{Array.from({ length: demo.pickCount }, (_, index) => {
        const pick = state.picks[index] ? getPick(demo, state.picks[index]) : null;
        return <li key={index} className={pick ? styles.filledSlot : ""}>{pick ? <><Portrait player={pick.player} lazy /><span title={`${pick.player.firstName} ${pick.player.lastName}`}>{pick.player.lastName}</span></> : <><span className={styles.emptySlot}>0{index + 1}</span><span>OPEN</span></>}</li>;
      })}</ol><button className={styles.textButton} onClick={() => void start()}>Restart demo ↻</button></section>
    </>}
    <div className={styles.previewFootnote}>PLAYABLE LOCAL PREVIEW <span>Five picks is this demo’s format. Ranked play, competition rules and prizes are inactive. Nothing is saved to an account.</span></div>
    <span className="visually-hidden" role="status">{state.phase === "drawing" ? "Drawing your NBA team. You can skip the animation." : state.phase === "revealed" && currentTeam ? `${currentTeam.city} ${currentTeam.name} drawn. Choose one player from their roster.` : state.phase === "locked" && shownPlayer ? `${shownPlayer.firstName} ${shownPlayer.lastName} locked in. ${state.picks.length} of ${demo.pickCount} picks complete.` : state.phase === "complete" ? "Demo lineup complete. Your poster is ready to save." : ""}</span>
  </div>;
}
