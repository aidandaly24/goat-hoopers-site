"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import type { PracticeAim, PracticeAssetPack, PracticeCourt, PracticeVector } from "@/domain/arcade/free-throw";
import { Badge } from "@/ui/Badge";
import { boundAim, DEFAULT_AIM, FIXED_STEP, launchBall, readyBall, stepBall, trajectory } from "./physics";
import { createCharge } from "./charge";
import { nextShootingPosition } from "./positions";
import styles from "./FreeThrowPractice.module.css";

type Phase = "loading" | "ready" | "flight" | "result" | "unavailable";
type Stats = { makes: number; attempts: number; streak: number; bestStreak: number };
type Controller = {
  shoot: () => void;
  aim: (aim: PracticeAim, guide: boolean) => void;
  next: (resetStats?: boolean) => void;
  beginCharge: () => void;
  releaseCharge: () => void;
  cancelCharge: () => void;
};
const EMPTY_STATS: Stats = { makes: 0, attempts: 0, streak: 0, bestStreak: 0 };

/** Local-only free-throw practice. Receives a court/collider adapter;
 * owns transient controls and scores. No actions, accounts or GameStore.
 */
export function FreeThrowPractice({ court, assets }: { court: PracticeCourt; assets: PracticeAssetPack }) {
  const mount = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const controller = useRef<Controller | null>(null);
  const aimRef = useRef<PracticeAim>({ ...DEFAULT_AIM });
  const spotRef = useRef<PracticeVector>({ ...court.release });
  const [spot, setSpot] = useState<PracticeVector>({ ...court.release });
  const guideRef = useRef(true);
  const drag = useRef<{ id: number; x: number; y: number; start: PracticeAim; moved: boolean } | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [aim, setAim] = useState<PracticeAim>({ ...DEFAULT_AIM });
  const [guide, setGuide] = useState(true);
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);
  const [status, setStatus] = useState("Getting the court ready…");
  const [dragging, setDragging] = useState(false);
  const [charging, setCharging] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [help, setHelp] = useState(false);
  const [outcome, setOutcome] = useState<"made" | "miss" | null>(null);

  useEffect(() => {
    const element = mount.current;
    if (!element) return;
    setCharging(false);
    setDragging(false);
    drag.current = null;
    spotRef.current = { ...court.release };
    setSpot(spotRef.current);
    let disposed = false;
    let raf = 0;
    let chargeRaf = 0;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    const charge = createCharge();
    let priorPower = DEFAULT_AIM.power;
    let ball = readyBall(court);
    let flying = false;
    let resolved = false;
    let previousFrame = 0;
    let accumulator = 0;
    let view: import("@/three/FreeThrowScene").PracticeView | null = null;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduceMotion = media.matches;
    const failed = () => {
      if (disposed) return;
      flying = false;
      cancelAnimationFrame(raf);
      cancelAnimationFrame(chargeRaf);
      if (retryTimer !== null) clearTimeout(retryTimer);
      charge.cancel();
      setCharging(false);
      controller.current = null;
      setPhase("unavailable");
      setStatus("The 3D court could not load. Try reloading with WebGL enabled.");
    };
    import("@/three/FreeThrowScene").then(async ({ createFreeThrowScene, guideVectors }) => {
      if (disposed) return;
      const created = await createFreeThrowScene(element, court, assets, failed);
      if (disposed) { created.dispose(); return; }
      view = created;
      setReduced(reduceMotion);
      const draw = () => view?.draw(ball,
        !flying && !resolved && guideRef.current
          ? { aim: aimRef.current, points: guideVectors(trajectory(court, aimRef.current, ball.origin)) }
          : null, reduceMotion);
      const simulate = () => {
        const events = stepBall(ball, court);
        if (events.includes("basket")) {
          resolved = true;
          setOutcome("made");
          setStats(old => {
            const streak = old.streak + 1;
            return { ...old, makes: old.makes + 1, streak, bestStreak: Math.max(old.bestStreak, streak) };
          });
          setStatus(ball.hitRim || ball.hitBackboard ? "Made it!" : "Swish!");
        } else if (events.includes("floor") && !resolved) {
          resolved = true;
          setOutcome("miss");
          setStats(old => ({ ...old, streak: 0 }));
          const contact = ball.hitRim ? "Off the rim." : ball.hitBackboard ? "Off the backboard." : "Miss.";
          setStatus(contact);
        } else if (!resolved && events.includes("backboard")) {
          setStatus("Backboard contact…");
        } else if (!resolved && events.includes("rim")) {
          setStatus("On the rim…");
        }
        if (ball.finished) {
          flying = false;
          if (!resolved) {
            resolved = true;
            setOutcome("miss");
            setStats(old => ({ ...old, streak: 0 }));
            setStatus("Miss.");
          }
          setPhase("result");
          // A short result beat, then the next ball is ready without a form
          // or retry click. Reset/unmount always clears this pending retry.
          retryTimer = setTimeout(() => {
            retryTimer = null;
            if (!disposed) controller.current?.next();
          }, reduceMotion ? 1400 : 700);
        }
      };
      const finishStill = () => {
        while (!ball.finished) simulate();
        draw();
      };
      const frame = (now: number) => {
        if (disposed || !flying) return;
        // Discard excess wall time after a slow frame/background tab.
        accumulator += Math.min((now - previousFrame) / 1000, 0.05);
        previousFrame = now;
        while (accumulator >= FIXED_STEP && flying) {
          simulate();
          accumulator -= FIXED_STEP;
        }
        draw();
        if (flying) raf = requestAnimationFrame(frame);
      };
      const setChargePower = (power: number) => {
        aimRef.current = boundAim({ ...aimRef.current, power });
        setAim(aimRef.current);
        draw();
      };
      const cancelCharge = () => {
        if (!charge.active()) return;
        charge.cancel();
        cancelAnimationFrame(chargeRaf);
        setCharging(false);
        setChargePower(priorPower);
        setStatus("Charge cancelled.");
      };
      const chargeFrame = (now: number) => {
        if (disposed || !charge.active()) return;
        setChargePower(charge.power(now));
        if (charge.power(now) < 100) chargeRaf = requestAnimationFrame(chargeFrame);
      };
      const motionChanged = () => {
        reduceMotion = media.matches;
        setReduced(reduceMotion);
        if (reduceMotion && flying) { cancelAnimationFrame(raf); finishStill(); }
        else draw();
      };
      media.addEventListener("change", motionChanged);
      const visibilityChanged = () => {
        previousFrame = performance.now();
        accumulator = 0;
        if (document.hidden) {
          cancelCharge();
          const active = drag.current;
          if (active) {
            drag.current = null;
            aimRef.current = active.start;
            setAim(active.start);
            setDragging(false);
            if (stage.current?.hasPointerCapture(active.id)) stage.current.releasePointerCapture(active.id);
            setStatus("Shot cancelled. Ready to try again.");
            draw();
          }
        }
      };
      document.addEventListener("visibilitychange", visibilityChanged);
      window.addEventListener("blur", cancelCharge);
      controller.current = {
        shoot: () => {
          if (flying || resolved || disposed || charge.active()) return;
          ball = launchBall(court, aimRef.current, spotRef.current);
          flying = true;
          resolved = false;
          accumulator = 0;
          setOutcome(null);
          setStats(old => ({ ...old, attempts: old.attempts + 1 }));
          setPhase("flight");
          setStatus("Shot away");
          if (reduceMotion) finishStill();
          else { previousFrame = performance.now(); raf = requestAnimationFrame(frame); }
        },
        aim: () => draw(),
        next: (resetStats = false) => {
          cancelCharge();
          cancelAnimationFrame(raf);
          if (retryTimer !== null) { clearTimeout(retryTimer); retryTimer = null; }
          if (flying && !resolved) setStats(old => ({ ...old, streak: 0 }));
          flying = false;
          resolved = false;
          spotRef.current = nextShootingPosition(court, spotRef.current);
          setSpot(spotRef.current);
          aimRef.current = { ...DEFAULT_AIM };
          setAim(aimRef.current);
          ball = readyBall(court, spotRef.current);
          accumulator = 0;
          if (resetStats) setStats(EMPTY_STATS);
          setOutcome(null);
          setPhase("ready");
          setStatus(resetStats ? "Fresh session · new shooting spot" : "Next ball ready · new shooting spot");
          draw();
        },
        beginCharge: () => {
          if (flying || resolved || disposed || !charge.begin(performance.now())) return;
          priorPower = aimRef.current.power;
          setCharging(true);
          setChargePower(0);
          setStatus("Release to shoot");
          chargeRaf = requestAnimationFrame(chargeFrame);
        },
        releaseCharge: () => {
          const power = charge.release(performance.now());
          if (power === null) return;
          cancelAnimationFrame(chargeRaf);
          setCharging(false);
          setChargePower(power);
          controller.current?.shoot();
        },
        cancelCharge,
      };
      // Dispose listeners with the view, including during Strict Mode remounts.
      const disposeView = view.dispose;
      view.dispose = () => {
        media.removeEventListener("change", motionChanged);
        document.removeEventListener("visibilitychange", visibilityChanged);
        window.removeEventListener("blur", cancelCharge);
        disposeView();
      };
      draw();
      setPhase("ready");
      setStatus("Find your touch");
    }).catch(failed);
    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      cancelAnimationFrame(chargeRaf);
      if (retryTimer !== null) clearTimeout(retryTimer);
      charge.cancel();
      controller.current = null;
      view?.dispose();
    };
  }, [court, assets]);

  const updateAim = (input: PracticeAim) => {
    const next = boundAim(input);
    aimRef.current = next;
    setAim(next);
    controller.current?.aim(next, guideRef.current);
  };
  const cancelDrag = (restore = true) => {
    const active = drag.current;
    drag.current = null;
    if (active && restore) updateAim(active.start);
    if (active && stage.current?.hasPointerCapture(active.id)) stage.current.releasePointerCapture(active.id);
    setDragging(false);
  };
  const pointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("button, a, input, summary, details")) return;
    if (phase !== "ready" || charging || drag.current || !event.isPrimary || event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, start: { ...aimRef.current }, moved: false };
    setDragging(true);
    setStatus("Release to shoot");
  };
  const pointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const active = drag.current;
    if (!active || active.id !== event.pointerId) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const dx = event.clientX - active.x, dy = event.clientY - active.y;
    if (Math.hypot(dx, dy) > 8) active.moved = true;
    updateAim({ direction: active.start.direction + dx / rect.width * 40, power: active.start.power + dy / rect.height * 100 });
  };
  const pointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const active = drag.current;
    if (!active || active.id !== event.pointerId) return;
    pointerMove(event);
    cancelDrag(false);
    if (active.moved) controller.current?.shoot();
    else setStatus("Hold Space or the shoot button");
  };
  const nextShot = (resetStats = false) => {
    cancelDrag();
    controller.current?.next(resetStats);
  };
  const keyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === "Escape") { cancelDrag(); controller.current?.cancelCharge(); return; }
    if (event.key.toLowerCase() === "r") { event.preventDefault(); nextShot(); return; }
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " ", "Enter"].includes(event.key) || ["a", "d"].includes(event.key.toLowerCase())) event.preventDefault();
    if (phase !== "ready" || drag.current) return;
    const current = aimRef.current;
    if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") updateAim({ ...current, direction: current.direction - 0.5 });
    if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") updateAim({ ...current, direction: current.direction + 0.5 });
    if (event.key === "ArrowUp") updateAim({ ...current, power: current.power + 1 });
    if (event.key === "ArrowDown") updateAim({ ...current, power: current.power - 1 });
    if (event.key === " " && !event.repeat) controller.current?.beginCharge();
    if (event.key === "Enter" && !event.repeat) controller.current?.shoot();
  };
  const keyUp = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.key !== " ") return;
    event.preventDefault();
    controller.current?.releaseCharge();
  };
  const ready = phase === "ready";
  const available = phase !== "loading" && phase !== "unavailable";
  const quiet = ready && !charging && !dragging && (status === "Find your touch" || status.startsWith("Next ball ready") || status.startsWith("Fresh session"));

  return (
    <main className={styles.surface}>
      <section ref={stage} className={`${styles.stage} ${dragging ? styles.dragging : ""}`}
        data-shot-state={phase} data-charging={charging} tabIndex={available ? 0 : -1}
        role="group" aria-label="Court controls" aria-describedby="court-instructions"
        onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp}
        onContextMenu={event => event.preventDefault()}
        onPointerCancel={() => { cancelDrag(); setStatus("Shot cancelled"); }}
        onLostPointerCapture={() => { if (drag.current) cancelDrag(); }}
        onKeyDown={keyDown} onKeyUp={keyUp}
        onBlur={event => { if (drag.current) cancelDrag(); if (event.target === event.currentTarget || !event.currentTarget.contains(event.relatedTarget)) controller.current?.cancelCharge(); }}>
        <div ref={mount} className={styles.canvas} />
        <div className={styles.topHud}>
          <div className={styles.identity}>
            <Link className={styles.back} href="/arcade" aria-label="Back to the arcade"><HudIcon name="back" /></Link>
            <div><h1>Free throws</h1><span className={styles.sceneLabel}>Local practice · {phase === "loading" ? "Loading court" : phase === "unavailable" ? "Court unavailable" : "Practice court"}</span></div>
          </div>
          <div className={styles.hudActions}>
            <button className={styles.iconButton} disabled={!available} aria-label="Reset session" title="Reset session"
              onClick={() => { nextShot(true); updateAim(DEFAULT_AIM); }}><HudIcon name="reset" /></button>
            <button className={styles.iconButton} aria-label="Controls and help" title="Controls and help" aria-expanded={help}
              onClick={() => setHelp(!help)}><HudIcon name="help" /></button>
          </div>
        </div>
        <div className={styles.scoreHud} aria-label="Practice score">
          <div><span>Made / shots</span><strong className="gh-num" aria-label="Makes and shots">{stats.makes}<span> / </span>{stats.attempts}</strong></div>
          <div><span>Streak</span><strong className="gh-num">{stats.streak}</strong></div>
          <div><span>Best</span><strong className="gh-num">{stats.bestStreak}</strong></div>
        </div>
        <div className={`${styles.feedback} ${outcome ? styles.result : ""} ${quiet ? styles.quiet : ""}`} data-outcome={outcome ?? "none"}
          role="status" aria-live="polite" aria-atomic="true">{status}</div>
        <div className={styles.bottomHud}>
          <output className={`${styles.aimReadout} gh-num`} aria-label="Aim direction">
            <HudIcon name="left" />{aim.direction === 0 ? "CENTER" : `${Math.abs(aim.direction).toFixed(1)}° ${aim.direction < 0 ? "LEFT" : "RIGHT"}`}<HudIcon name="right" />
            <span aria-label="Shooting distance">{Math.hypot(spot.x - court.rim.center.x, spot.z - court.rim.center.z).toFixed(1)} m</span>
          </output>
          <div className={styles.powerReadout}><span>{charging || dragging ? "Release to shoot" : "Power"}</span><output className="gh-num" aria-label="Shot power">{Math.round(aim.power)}%</output></div>
          <div className={styles.powerTrack} role="meter" aria-label="Shot power meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(aim.power)}>
            <span style={{ width: `${aim.power}%` }} />
          </div>
          <button className={styles.fireButton} disabled={!ready || dragging} aria-label="Hold to charge, release to shoot"
            onContextMenu={event => event.preventDefault()}
            onPointerDown={event => { if (!event.isPrimary || event.button !== 0) return; event.preventDefault(); event.currentTarget.focus({ preventScroll: true }); event.currentTarget.setPointerCapture(event.pointerId); controller.current?.beginCharge(); }}
            onPointerUp={event => { if (!event.currentTarget.hasPointerCapture(event.pointerId)) return; controller.current?.releaseCharge(); event.currentTarget.releasePointerCapture(event.pointerId); }}
            onPointerCancel={() => controller.current?.cancelCharge()} onLostPointerCapture={() => controller.current?.cancelCharge()}
            onBlur={() => controller.current?.cancelCharge()}
            onKeyDown={event => { if (event.key === " ") { event.preventDefault(); if (!event.repeat) controller.current?.beginCharge(); } if (event.key === "Escape") controller.current?.cancelCharge(); }}
            onKeyUp={event => { if (event.key === " ") { event.preventDefault(); controller.current?.releaseCharge(); } }}
            onClick={event => { if (event.detail === 0) controller.current?.shoot(); }}>
            {phase === "flight" ? "In flight" : phase === "result" ? "Next ball…" : charging ? "Release" : "Hold to shoot"}
          </button>
          <p className={styles.keyboardHint}><kbd>A</kbd><kbd>D</kbd> aim <span>·</span> Hold <kbd>Space</kbd> and release</p>
          <p className={styles.touchHint}>Drag to aim · Hold to shoot</p>
        </div>
        <p id="court-instructions" className={styles.srOnly}>Focus the court. Left/Right arrows or A/D aim. Hold Space for power; release to shoot. Up/Down adjust selected power. Enter fires selected power. R retries; Escape cancels. On touch, drag on the court and release, or hold the shoot button. Each settled shot or reset moves to a new shooting spot. Adjust power for the distance. Scores stay on this page only.</p>
        {help && <section className={styles.help} aria-label="Practice controls">
          <header><h2>Find your touch</h2><button className={styles.iconButton} aria-label="Close help" onClick={() => { setHelp(false); stage.current?.focus({ preventScroll: true }); }}><HudIcon name="close" /></button></header>
          <p>Focus the court. <kbd>A</kbd> / <kbd>D</kbd> or the arrow keys aim. Hold <kbd>Space</kbd> to build power, then release. Start near 50% at the free-throw line.</p>
          <p>Each finished shot or reset moves you to a new spot. Center points toward the basket; adjust power for the distance shown by the ball.</p>
          <p>On touch, drag the court and release, or hold the shoot button. The next ball returns automatically.</p>
          <p><kbd>R</kbd> retries. <kbd>Esc</kbd> cancels. Practice scores stay on this page; league rewards are inactive.</p>
          {reduced && <p>Reduced motion: shots resolve to a still result.</p>}
          <details className={styles.fineControls}>
            <summary>Fine controls</summary>
            <label className={styles.field} htmlFor="shot-aim">Aim<input id="shot-aim" type="range" min="-14" max="14" step="0.5" value={aim.direction} disabled={!ready || dragging || charging} onChange={event => updateAim({ ...aimRef.current, direction: Number(event.target.value) })} /></label>
            <label className={styles.field} htmlFor="shot-power">Power<input id="shot-power" type="range" min="0" max="100" step="1" value={aim.power} disabled={!ready || dragging || charging} onChange={event => updateAim({ ...aimRef.current, power: Number(event.target.value) })} /></label>
            <label className={styles.check}><input type="checkbox" checked={guide} onChange={event => { guideRef.current = event.target.checked; setGuide(event.target.checked); controller.current?.aim(aimRef.current, guideRef.current); }} /> Aim guide</label>
            <button className={styles.secondary} disabled={!ready || charging} onClick={() => controller.current?.shoot()}>Shoot at selected power</button>
            <button className={styles.secondary} disabled={!ready || charging} onClick={() => updateAim(DEFAULT_AIM)}>Center aim &amp; power</button>
          </details>
        </section>}
        {phase === "loading" && <div className={styles.overlay}>Opening the court…</div>}
        {phase === "unavailable" && <div className={styles.overlay}><p>3D court unavailable</p><p>Check your connection and WebGL support.</p><button className={styles.secondary} onClick={() => window.location.reload()}>Reload practice</button></div>}
        <span className={styles.prototype}><Badge>Prototype</Badge></span>
      </section>
    </main>
  );
}

function HudIcon({ name }: { name: "back" | "reset" | "help" | "close" | "left" | "right" }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    {name === "back" && <path d="m14 5-7 7 7 7M7 12h13" />}
    {name === "reset" && <path d="M4 10a8 8 0 1 1 1 8M4 4v6h6" />}
    {name === "help" && <><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 1 1 4 2c-1 .5-1.5 1-1.5 2M12 16h.01" /></>}
    {name === "close" && <path d="m6 6 12 12M6 18 18 6" />}
    {name === "left" && <path d="m14 7-5 5 5 5" />}
    {name === "right" && <path d="m10 7 5 5-5 5" />}
  </svg>;
}
