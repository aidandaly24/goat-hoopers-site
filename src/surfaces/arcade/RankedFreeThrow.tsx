"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createRankedClient, type RankedClient } from "@/data/ranked-free-throw/client";
import { PRACTICE_ASSETS } from "@/domain/arcade/free-throw";
import { RankedRoundRecorder } from "@/domain/arcade/ranked-round";
import type { RankedAdmission, RankedAvailability, RankedBoard, RankedScore, RankedScope } from "@/domain/arcade/ranked-free-throw";
import type { RankedRecordFeedback } from "@/domain/arcade/ranked-record-feedback";
import { rankedId, rankedPhysics, rankedPositions } from "@/domain/arcade/ranked-free-throw";
import { safeLoginDestination } from "@/domain/login-navigation";
import { Card } from "@/ui/Card";
import { SectionHeading } from "@/ui/SectionHeading";
import { FreeThrowPractice } from "./free-throw/FreeThrowPractice";
import { WeeklyLeaderboard } from "./WeeklyLeaderboard";
import styles from "./RankedFreeThrow.module.css";

const defaultClient = createRankedClient();
const failure = (status: string) => ({
  busy: "You already have an open round. Wait for it to expire before starting again.",
  quota: "You have used your rounds for this week.",
  week_closing: "This competition is not open for a new round. Check the weekly board for its current status.",
  unauthenticated: "Sign in to your verified personal account again.",
  invalid_run: "This round is no longer open. Check for a saved result before starting again.",
  disabled: "Ranked play is currently closed.",
  rate_limited: "Too many requests. Please try again later.",
}[status] ?? "The request could not be completed. Your result has not been confirmed.");
const accuracy = (value: number | null) => value === null ? "—" : `${Math.round(value * 100)}%`;

/** Carry only this route and a validated run through the existing login contract. */
export function rankedLoginHref(runId?: string): string {
  const destination = safeLoginDestination(`/arcade/ranked-free-throw${rankedId(runId) ? `?run=${encodeURIComponent(runId)}` : ""}`);
  return `/account/login?next=${encodeURIComponent(destination)}`;
}

/** Mark before rendering, so repeated accepted responses cannot replay a notice. */
export function claimAcceptedScore(id: string, seen: Set<string>, storage?: Pick<Storage, "getItem" | "setItem">): boolean {
  if (seen.has(id)) return false;
  seen.add(id);
  try {
    const key = `goat:ranked:accepted:${id}`;
    if (storage?.getItem(key)) return false;
    storage?.setItem(key, "shown");
  } catch { /* Storage can be unavailable; this mounted session still dedupes. */ }
  return true;
}

/** Comparisons come only from the validated first accepted POST, never a board. */
export function SavedRoundFeedback({ score, justAccepted, feedback }: { score: RankedScore; justAccepted: boolean; feedback?: RankedRecordFeedback | null }) {
  const records = justAccepted && feedback?.scoreId === score.id ? feedback : null;
  const beaten = records && [records.personalBest, records.weeklyRecord, records.allTimeRecord].some(item => item.outcome === "beaten");
  const labels = records ? [
    { comparison: records.personalBest, first: "First personal score", beaten: "New personal best", tied: "Personal best tied", below: "Personal best" },
    { comparison: records.weeklyRecord, first: "First weekly score · Everyone", beaten: "Weekly record beaten · Everyone", tied: "Weekly record tied · Everyone", below: "Weekly record · Everyone" },
    { comparison: records.allTimeRecord, first: "First compatible all-time score · Everyone", beaten: "All-time record beaten · Everyone", tied: "All-time record tied · Everyone", below: "Compatible all-time record · Everyone" },
  ] : [];
  return <div className={styles.confirmation} data-just-accepted={justAccepted} data-record-beaten={!!beaten} role={justAccepted ? "status" : undefined}>
    <strong>{beaten ? "Record beaten!" : justAccepted ? "Round saved" : "Saved result"}</strong>
    <span>{score.makes} of {score.attempts} makes · server validated</span>
    {records && <>
      <ul className={styles.recordComparisons} aria-label="Server-confirmed score comparisons">{labels.map(item => <li key={item.first} data-outcome={item.comparison.outcome}>
        <b>{item[item.comparison.outcome]}</b>
        <span>{item.comparison.outcome === "first" ? "No earlier score in this comparison" : item.comparison.outcome === "beaten" ? `${item.comparison.previousScore} to ${score.score} makes` : `${item.comparison.previousScore} makes`}</span>
      </li>)}</ul>
      <p>Confirmed at acceptance. Weekly means this competition period; all-time includes compatible score formats. Everyone records include verified personal accounts. This is not a current rank or a League award.</p>
    </>}
    <p>Your best eligible round counts on the weekly and compatible all-time boards.</p>
  </div>;
}

/** Documented composite: public court + private result + bounded weekly board. */
export function RankedFreeThrow({ availability, initialRunId, client = defaultClient }: {
  availability: RankedAvailability; initialRunId?: string; client?: RankedClient;
}) {
  const [admission, setAdmission] = useState<RankedAdmission | null>(null);
  const recorder = useRef<RankedRoundRecorder | null>(null);
  const request = useRef<AbortController | null>(null);
  const [phase, setPhase] = useState<"idle" | "starting" | "playing" | "saving" | "saved" | "uncertain">("idle");
  const [roundStatus, setRoundStatus] = useState<ReturnType<RankedRoundRecorder["status"]> | null>(null);
  const [saved, setSaved] = useState<RankedScore | null>(null);
  const [justAcceptedId, setJustAcceptedId] = useState<string | null>(null);
  const seenAcceptedScores = useRef(new Set<string>());
  const [recordFeedback, setRecordFeedback] = useState<RankedRecordFeedback | null>(null);
  const [message, setMessage] = useState("");
  const [checking, setChecking] = useState((availability.status === "available" || availability.status === "recovery") && !!initialRunId);
  const [scope, setScope] = useState<RankedScope>("everyone");
  const [board, setBoard] = useState<RankedBoard | null>(null);
  const [boardState, setBoardState] = useState<"loading" | "ready" | "error">("loading");
  const [refresh, setRefresh] = useState(0);
  const [authRequired, setAuthRequired] = useState(false);
  const needsSignIn = availability.status === "sign_in" || authRequired;
  const enabled = availability.status === "available" && !authRequired;
  const recoverable = (enabled || availability.status === "recovery") && !authRequired;
  const continuationRun = admission?.run.id ?? initialRunId;

  useEffect(() => () => { request.current?.abort(); }, []);
  useEffect(() => {
    if (!admission || phase === "saved") return;
    const timer = setInterval(() => setRoundStatus(recorder.current?.status(performance.now()) ?? null), 200);
    return () => clearInterval(timer);
  }, [admission, phase]);
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    client.leaderboard(scope, controller.signal).then(result => {
      if (controller.signal.aborted) return;
      if (result.ok) { setBoard(result.value); setBoardState("ready"); }
      else setBoardState("error");
    });
    return () => controller.abort();
  }, [client, enabled, scope, refresh]);
  useEffect(() => {
    if (!recoverable || !initialRunId) return;
    const controller = new AbortController();
    request.current = controller;
    client.result(initialRunId, controller.signal).then(result => {
      if (controller.signal.aborted) return;
      request.current = null; setChecking(false);
      if (result.ok) { setJustAcceptedId(null); setRecordFeedback(null); setSaved(result.value); setPhase("saved"); }
      else {
        if (result.status === "unauthenticated") setAuthRequired(true);
        setMessage(result.status === "not_found" ? "No saved result was found for this account and round." : failure(result.status));
      }
    });
    return () => { controller.abort(); if (request.current === controller) request.current = null; };
  }, [client, recoverable, initialRunId]);

  function rememberResult(score: RankedScore) {
    setSaved(score); setPhase("saved"); setMessage("Round saved and validated."); setBoardState("loading"); setRefresh(value => value + 1);
  }
  async function start() {
    if (!enabled || request.current) return;
    const controller = new AbortController(); request.current = controller;
    setPhase("starting"); setMessage("");
    const sent = performance.now(), result = await client.start(controller.signal);
    request.current = null;
    if (controller.signal.aborted) return;
    if (!result.ok) { if (result.status === "unauthenticated") setAuthRequired(true); setPhase(saved ? "saved" : "idle"); setMessage(failure(result.status)); return; }
    const received = performance.now();
    recorder.current = new RankedRoundRecorder(result.value, sent, received);
    setAdmission(result.value); setSaved(null); setJustAcceptedId(null); setRecordFeedback(null); setRoundStatus(recorder.current.status(received)); setPhase("playing");
    const url = new URL(window.location.href); url.searchParams.set("run", result.value.run.id);
    // Let Next synchronize its canonical URL and copy its own history metadata.
    // Passing the existing __NA state bypasses that integration and loses ?run.
    window.history.replaceState(null, "", url);
  }
  async function save() {
    const payload = recorder.current?.submission(performance.now());
    if (!enabled || !payload || request.current) return;
    const controller = new AbortController(); request.current = controller; setPhase("saving"); setMessage("");
    const result = await client.submit(payload, controller.signal);
    request.current = null;
    if (controller.signal.aborted) return;
    if (result.ok) {
      let storage: Storage | undefined;
      try { storage = window.sessionStorage; } catch { /* In-memory dedupe remains available. */ }
      const first = claimAcceptedScore(result.value.id, seenAcceptedScores.current, storage);
      setJustAcceptedId(first ? result.value.id : null);
      setRecordFeedback(first ? result.value.recordFeedback ?? null : null);
      rememberResult(result.value);
    }
    else { if (result.status === "unauthenticated") setAuthRequired(true); setPhase("uncertain"); setMessage(`${failure(result.status)} Check the saved result before retrying.`); }
  }
  async function checkSaved() {
    const id = admission?.run.id ?? initialRunId;
    if (!recoverable || !id || request.current) return;
    const controller = new AbortController(); request.current = controller; setChecking(true);
    const result = await client.result(id, controller.signal);
    request.current = null;
    if (controller.signal.aborted) return;
    setChecking(false);
    if (result.ok) { setJustAcceptedId(null); setRecordFeedback(null); rememberResult(result.value); }
    else if (result.status === "not_found") { setPhase(admission ? "playing" : "idle"); setMessage("No saved result found. You can retry saving this round while its timer is open."); }
    else { if (result.status === "unauthenticated") setAuthRequired(true); setMessage(failure(result.status)); }
  }
  const status = roundStatus;
  const active = admission && (phase === "playing" || phase === "saving" || phase === "uncertain");
  const rules = admission?.rules ?? (availability.status === "available" ? availability.rules : null);

  return <div className={styles.wrap}>
    <Card className={styles.card}>
      <SectionHeading eyebrow="The Arcade" title="Ranked free throws" level={1} />
      <p><Link href="/arcade/free-throw">Play local practice</Link></p>
      {!enabled ? <>
        <p>{needsSignIn ? "Sign in to a verified personal account to play ranked rounds or view your saved result." : availability.status === "recovery" ? availability.reason === "closed" ? "New rounds are closed. Your saved results remain available." : "New rounds are temporarily unavailable. You can still check your saved result."
          : availability.status === "unavailable" ? "Ranked play is temporarily unavailable." : "Ranked play is closed until the competition schedule and storage are enabled."}</p>
        {needsSignIn && <Link className={styles.button} href={rankedLoginHref(continuationRun)}>{rankedId(continuationRun) ? "Sign in to check this round" : "Sign in"}</Link>}
        {authRequired && <p>Your sign-in has expired. Signing in returns here to check for a saved result; it does not resubmit your shots.</p>}
      </> : <>
        <p>Around the court · one point per make. Everyone gets the same positions. Your best valid completed round counts. Rewards are off.</p>
        {rules && <p>{rules.shots} shots · {rules.durationMs / 1000} seconds · {rules.maxRunsPerWeek === null ? "unlimited attempts while open" : `maximum ${rules.maxRunsPerWeek} rounds per week`}.</p>}
        <button className={styles.button} onClick={start} disabled={phase === "starting" || phase === "saving" || checking || !!active && !status?.expired}>
          {phase === "starting" ? "Starting…" : "Start ranked round"}
        </button>
      </>}
      <p role="status" aria-live="polite">{message}</p>
      {recoverable && initialRunId && !saved && <button className={styles.button} disabled={checking} onClick={checkSaved}>{checking ? "Checking saved result…" : "Check saved result"}</button>}
    </Card>
    {enabled && active && status && <section aria-label="Active ranked round">
      <Card className={styles.card}>
        <p className={styles.roundStatus}>{status.attempts} / {admission.rules.shots} shots · {status.expired ? "Time expired" : `${Math.ceil(status.remainingMs / 1000)} seconds left`}</p>
        <p>Finish every shot and save before time expires. Displayed court stats are provisional until validated.</p>
        <div className={styles.actions}>
          <button className={styles.button} onClick={save} disabled={phase !== "playing" || !status.canSubmit}>Save completed round</button>
          {(phase === "uncertain" || status.expired) && <button className={styles.button} disabled={checking} onClick={checkSaved}>{checking ? "Checking…" : "Check saved result"}</button>}
        </div>
      </Card>
      <FreeThrowPractice key={admission.run.id} court={admission.replayContext.court} assets={PRACTICE_ASSETS} round={{
        blocked: phase !== "playing" || !status.canShoot,
        positions: rankedPositions(admission.replayContext), physics: rankedPhysics(admission.replayContext),
        beforeShot: aim => {
          if (phase !== "playing" || !recorder.current?.shoot(aim, performance.now())) return false;
          setRoundStatus(recorder.current.status(performance.now())); return true;
        },
        onSettled: () => { recorder.current?.settle(); setRoundStatus(recorder.current?.status(performance.now()) ?? null); },
      }} />
    </section>}
    {recoverable && saved && <Card className={styles.card}>
      <SavedRoundFeedback key={saved.id} score={saved} justAccepted={justAcceptedId === saved.id} feedback={recordFeedback} />
      <SectionHeading eyebrow={`Saved · ${saved.week}`} title={`Final score: ${saved.score}`} />
      <dl className={styles.stats}>
        <div><dt>Makes / attempts</dt><dd>{saved.makes} / {saved.attempts}</dd></div>
        <div><dt>Accuracy</dt><dd>{accuracy(saved.accuracy)}</dd></div>
        <div><dt>Longest streak</dt><dd>{saved.longestStreak}</dd></div>
        <div><dt>Ending streak</dt><dd>{saved.endingStreak}</dd></div>
      </dl>
      <ol className={styles.outcomes} aria-label="Validated shots in order">{saved.outcomes.map((made, index) => <li key={index} aria-label={`Shot ${index + 1}: ${made ? "make" : "miss"}`}>{made}</li>)}</ol>
      <p>1 = make · 0 = miss. Saved {new Date(saved.achievedAtMs).toISOString()}.</p>
      <nav className={styles.actions} aria-label="Saved score leaderboards"><Link className={styles.button} href="/arcade/leaderboard">Weekly leaderboard</Link>
        <Link className={styles.button} href="/arcade/free-throw/leaderboard">All-time ranked leaderboard</Link></nav>
    </Card>}
    {enabled && <WeeklyLeaderboard scope={scope} limit={50}
      state={boardState === "ready" && board ? { status: "ready", board } : { status: boardState === "ready" ? "error" : boardState }}
      onScopeChange={value => { setScope(value); setBoard(null); setBoardState("loading"); }}
      onRetry={() => { setBoardState("loading"); setRefresh(value => value + 1); }} />}
  </div>;
}
