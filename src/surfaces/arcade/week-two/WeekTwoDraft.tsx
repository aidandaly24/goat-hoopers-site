"use client";

/* eslint-disable @next/next/no-img-element -- Existing same-origin portraits; no optimizer or remote image requests. */
import Link from "next/link";
import { useEffect, useReducer, useRef, useState } from "react";
import { Badge } from "@/ui/Badge";
import {
  EMPTY_DRAFT, shuffleDemoTeams, transitionDraft,
  type DraftAction, type DraftDemo, type DraftPick, type DraftPlayer, type DraftState,
} from "@/domain/arcade/roster-draft";
import "@/ui/week-two-draft-tokens.css";
import styles from "./WeekTwoDraft.module.css";

function Arrow({ back = false }: { back?: boolean }) {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"
    style={back ? { transform: "rotate(180deg)" } : undefined}>
    <path d="M4 12h15m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.6" />
  </svg>;
}

function Lock() {
  return <svg width="13" height="14" viewBox="0 0 16 18" fill="none" aria-hidden="true">
    <path d="M4 8V5a4 4 0 0 1 8 0v3M2 8h12v9H2z" stroke="currentColor" strokeWidth="1.5" />
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

function Portrait({ player, className = "" }: { player: DraftPlayer; className?: string }) {
  const [failed, setFailed] = useState(false);
  return <span className={`${styles.portrait} ${className}`} aria-hidden="true">
    {failed ? <span className={styles.portraitFallback}>{player.firstName[0]}{player.lastName[0]}</span>
      : <img src={player.portrait} alt="" onError={() => setFailed(true)} draggable={false} />}
  </span>;
}

function getPick(demo: DraftDemo, pick: DraftPick) {
  const team = demo.teams.find(team => team.id === pick.teamId)!;
  return { team, player: team.players.find(player => player.id === pick.playerId)! };
}

/** Public surface entrypoint: local state and approved local art only; no game services. */
export function WeekTwoDraft({ demo }: { demo: DraftDemo }) {
  const [state, dispatch] = useReducer((state: DraftState, action: DraftAction) => transitionDraft(state, action, demo), EMPTY_DRAFT);
  const heading = useRef<HTMLHeadingElement>(null);
  const mounted = useRef(false);
  const [exportState, setExportState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const exportBusy = useRef(false);
  const active = useRef(true);
  const currentTeam = demo.teams.find(team => team.id === state.order[state.picks.length]);
  const selected = currentTeam?.players.find(player => player.id === state.selectedId);
  const lockedPick = state.phase === "locked" ? getPick(demo, state.picks[state.picks.length - 1]) : null;
  const shownTeam = lockedPick?.team ?? currentTeam;
  const shownPlayer = lockedPick?.player ?? selected;
  const start = () => { setExportState("idle"); dispatch({ type: "start", order: shuffleDemoTeams(demo.teams, Math.random) }); };

  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    heading.current?.focus({ preventScroll: true });
    heading.current?.scrollIntoView({ block: "start", behavior: "instant" });
  }, [state.phase]);
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);

  const saveLineup = async () => {
    if (exportBusy.current) return;
    exportBusy.current = true;
    setExportState("saving");
    try {
      const { downloadLineup } = await import("./lineup-poster");
      await downloadLineup(demo, state.picks);
      if (active.current) setExportState("saved");
    } catch {
      if (active.current) setExportState("error");
    } finally { exportBusy.current = false; }
  };

  return <div className={`gh-week-two-draft ${styles.root}`} data-draft-phase={state.phase}>
    <div className={styles.topline}>
      <Link href="/arcade" className={styles.back}><Arrow back /> Arcade</Link>
      <span className={styles.edition}>THE GAME ROOM <span>/</span> VOL. 02</span>
      <Badge>Design preview</Badge>
    </div>

    {state.phase === "teaser" ? <>
      <section className={styles.teaser} aria-labelledby="draft-title">
        <div className={styles.teaserCopy}>
          <div className={styles.kicker}><span className={styles.dot} /> WEEK 02 <span className={styles.locked}><Lock /> LOCKED</span></div>
          <h1 id="draft-title" ref={heading} tabIndex={-1} className={styles.teaserTitle}>Chase<br /><em>perfect.</em></h1>
          <p className={styles.lede}>A team, revealed at random.<br />{" "}A player, chosen by you.<br />{" "}A lineup worth arguing about.</p>
          <button className={styles.primary} onClick={start}>Enter the demo <Arrow /></button>
          <p className={styles.ctaNote}>A first look. Week 2 competition stays locked.</p>
        </div>
        <div className={styles.teaserPoster} aria-label="82–0 roster draft concept artwork">
          <CourtLines />
          <div className={styles.posterMast}><span>GOAT HOOPERS</span><span>THE ROSTER DRAFT</span></div>
          <div className={styles.bigRecord}>82<span>–</span>0<span className={styles.recordStar}><Burst /></span></div>
          <div className={styles.posterRule}><span>BUILD YOUR</span><span>PERFECT FIVE</span></div>
          <div className={styles.heroPlayers}>
            <div className={styles.heroLeft} data-draft-team="lakers"><Portrait player={demo.teams[0].players[0]} /></div>
            <div className={styles.heroRight} data-draft-team="magic"><Portrait player={demo.teams[2].players[0]} /></div>
            <div className={styles.heroCenter} data-draft-team="thunder"><Portrait player={demo.teams[1].players[0]} /></div>
          </div>
          <div className={styles.posterFooter}><span>ONE REVEAL.<br />ONE BIG DECISION.</span><span className={styles.posterNumber}>02</span></div>
          <div className={styles.artLabel}>ILLUSTRATIVE PLAYER POOL · DEMO ART</div>
        </div>
      </section>
      <div className={styles.editorialFooter}>
        <span className={styles.footerIndex}>THE IDEA <Arrow /></span>
        <p><strong>Reveal. Choose. Make it yours.</strong> This preview uses five picks and an illustrative player pool. Final roster size, scoring and ranked-play schedule are still open.</p>
        <span className={styles.noForecast}>82–0 is the challenge.<br />{" "}No season forecast is generated.</span>
      </div>
    </> : state.phase === "complete" ? <>
      <header className={styles.resultHeader}>
        <div><p className={styles.kicker}>THE FINAL SELECTION</p><h1 ref={heading} tabIndex={-1}>Meet your five<span>.</span></h1></div>
        <p>You made the calls.<br />Now let the group chat decide.</p>
      </header>
      <div className={styles.resultGrid}>
        <section className={styles.lineupPoster} aria-label="Your completed demo lineup">
          <div className={styles.lineupMast}><span>GOAT HOOPERS / THE ROSTER DRAFT</span><strong>82–0<span><Burst /></span></strong></div>
          <div className={styles.lineupHeadline}>BUILT<br /><em>DIFFERENT.</em></div>
          <ol className={styles.finalPicks}>{state.picks.map((pick, index) => {
            const { team, player } = getPick(demo, pick);
            return <li key={player.id} data-draft-team={team.id}>
              <span className={styles.pickNumber}>0{index + 1}</span>
              <div className={styles.finalName}><span>{player.firstName}</span><strong>{player.lastName}</strong><small>{team.abbreviation} / {player.position}</small></div>
              <Portrait player={player} />
            </li>;
          })}</ol>
          <div className={styles.lineupFooter}><span>WEEK 02 / UNRANKED DEMO</span><span>LINEUP CONCEPT · NO PREDICTION</span></div>
        </section>
        <aside className={styles.resultActions}>
          <span className={styles.resultMark}><Burst /></span>
          <h2>Put your<br />{" "}name on it.</h2>
          <p>Your lineup, ready for the chat. Save a portrait-format poster with all five picks.</p>
          <button className={styles.primary} onClick={saveLineup} disabled={exportState === "saving"}>
            {exportState === "saving" ? "Making your poster…" : "Save lineup poster"}<Arrow />
          </button>
          <p className={styles.exportStatus} role="status">{exportState === "saved" ? "Poster downloaded. Ready when you are." : exportState === "error" ? "Couldn’t save the poster. Try again." : "PNG · 1080 × 1350 · saved on your device"}</p>
          <button className={styles.textButton} onClick={start}>Draft another five <Arrow /></button>
          <button className={styles.textButton} onClick={() => dispatch({ type: "teaser" })}>Back to the Week 2 teaser</button>
          <p className={styles.resultDisclaimer}>Unranked demo. Illustrative team pairings, no scoring or season prediction. Competition rules remain under review.</p>
        </aside>
      </div>
    </> : <>
      <header className={styles.draftHeader}>
        <div><p className={styles.kicker}>82–0 / THE ROSTER DRAFT</p><h1 ref={heading} tabIndex={-1}>{state.phase === "sealed" ? "Trust the draw." : state.phase === "locked" ? "Good call." : "Your call."}</h1></div>
        <div className={styles.round}><span>{state.phase === "locked" ? "PICKS LOCKED" : "ON THE CLOCK"}</span><strong>0{Math.min(state.picks.length + (state.phase === "locked" ? 0 : 1), demo.pickCount)}<small> / 0{demo.pickCount}</small></strong></div>
      </header>
      <div className={styles.draftGrid}>
        <section className={`${styles.revealStage} ${state.phase === "locked" ? styles.lockedStage : ""}`}
          data-draft-team={state.phase === "sealed" ? undefined : shownTeam?.id} key={`${state.picks.length}-${state.phase}`}
          aria-label={state.phase === "sealed" ? "Sealed team reveal" : `${shownTeam?.city} ${shownTeam?.name}`}>
          <CourtLines />
          <div className={styles.stageRail}><span>GOAT HOOPERS DRAFT ROOM</span><span>WEEK 02</span></div>
          {state.phase === "sealed" ? <div className={styles.sealedContent}>
            <div className={styles.sealedArt} aria-hidden="true"><span>?</span><span>?</span><span>?</span></div>
            <h2>Who’s on<br />{" "}the board?</h2><p>Let the team come to you.</p>
            <button className={styles.revealButton} onClick={() => dispatch({ type: "reveal" })}>Reveal NBA team <Arrow /></button>
          </div> : <>
            <div className={styles.teamTypography}>
              <span>{shownTeam?.city}</span><h2>{shownTeam?.name}</h2>
            </div>
            <div className={styles.teamAbbreviation} aria-hidden="true">{shownTeam?.abbreviation}</div>
            {shownPlayer && <Portrait key={shownPlayer.id} player={shownPlayer} className={styles.stagePortrait} />}
            <div className={styles.stageBottom}>
              <div><span>{state.phase === "locked" ? "THE PICK IS IN" : shownPlayer ? "YOUR SELECTION" : "TEAM REVEALED"}</span>
                <strong>{shownPlayer ? `${shownPlayer.firstName} ${shownPlayer.lastName}` : "Make your move."}</strong></div>
              <span className={styles.seal} aria-hidden="true">{state.phase === "locked" ? "✓" : <Burst />}</span>
            </div>
            {state.phase === "locked" && <span className={styles.lockStamp}>LOCKED IN</span>}
          </>}
        </section>
        <div className={styles.decision}>
          {state.phase === "sealed" ? <div className={styles.decisionIntro}><span className={styles.bigStep}>01<span>—</span></span><h2>First, the team.<br />Then, the talent.</h2><p>Reveal a random NBA team, then choose one player from its demo pool. Each pick joins your final lineup.</p></div>
            : state.phase === "locked" ? <div className={styles.lockedCopy}><span className={styles.bigStep}>✓</span><h2>{shownPlayer?.lastName}.<br />{" "}On your side.</h2><p>One more piece of your perfect lineup. A different team is waiting behind the next reveal.</p><button className={styles.primary} onClick={() => dispatch({ type: "next" })}>Next team <Arrow /></button></div>
              : <>
                <div className={styles.choiceHeading}><h2>Who are you taking?</h2><span>CHOOSE ONE</span></div>
                <div className={styles.playerChoices} role="group" aria-label={`Choose one ${currentTeam?.name} player`}>
                  {currentTeam?.players.map(player => <button key={player.id} aria-pressed={state.selectedId === player.id}
                    className={styles.playerChoice} onClick={() => dispatch({ type: "select", playerId: player.id })}>
                    <Portrait player={player} /><span className={styles.choiceName}><span>{player.firstName}</span><strong>{player.lastName}</strong><small>{player.position}</small></span>
                    <span className={styles.choiceIndicator} aria-hidden="true">{state.selectedId === player.id ? "✓" : "+"}</span>
                  </button>)}
                </div>
                <div className={styles.lockAction}>
                  <p>{selected ? `${selected.firstName} ${selected.lastName}. Your call?` : "Pick a player to continue."}</p>
                  <button className={styles.primary} disabled={!selected} onClick={() => dispatch({ type: "lock" })}>Lock in pick <Lock /></button>
                </div>
              </>}
          <div className={styles.poolNote}>UNRANKED PREVIEW <span>Illustrative team pairings. No ratings or scoring.</span></div>
        </div>
      </div>
      <section className={styles.rosterRail} aria-label="Your demo lineup progress">
        <div className={styles.rosterRailTitle}><span>YOUR LINEUP</span><strong>{state.picks.length} / {demo.pickCount}<small> DEMO PICKS</small></strong></div>
        <ol>{Array.from({ length: demo.pickCount }, (_, index) => {
          const pick = state.picks[index] ? getPick(demo, state.picks[index]) : null;
          return <li key={index} data-draft-team={pick?.team.id} className={pick ? styles.filledSlot : ""}>
            {pick ? <><Portrait player={pick.player} /><span>{pick.player.lastName}</span></> : <><span className={styles.emptySlot}>0{index + 1}</span><span>OPEN</span></>}
          </li>;
        })}</ol>
        <button className={styles.textButton} onClick={start}>Restart demo ↻</button>
      </section>
    </>}
    <div className={styles.previewFootnote}>LOCAL DESIGN PREVIEW <span>Five picks is a demo format. Ranked play and scoring are proposals. Nothing is saved to an account.</span></div>
    <span className="visually-hidden" role="status">{state.phase === "locked" && shownPlayer ? `${shownPlayer.firstName} ${shownPlayer.lastName} locked in. ${state.picks.length} of ${demo.pickCount} picks complete.` : state.phase === "complete" ? "Demo lineup complete. Your poster is ready to save." : ""}</span>
  </div>;
}
