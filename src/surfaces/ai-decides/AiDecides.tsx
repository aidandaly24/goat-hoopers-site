"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AiDecideRequest, AiDecideResponse, AiDecidesData, AiWeeklySlate } from "@/domain/ai-decider";
import { AiWeekly, ChoiceLabel, ProbabilityRows, type AiTeam } from "./AiWeekly";
import { comparisonLabel, draftError, percent, periodLabel, postDecision, postWeeklyPreviews, readDecisionResponse, readWeeklyPublishResponse, timestamp, type DecisionTransport, type WeeklyTransport } from "./client";
import { createPickerHistory } from "./pickerHistory";
import { restorePickerFocus } from "./pickerFocus";
import styles from "./AiDecides.module.css";

type State = Exclude<AiDecideResponse, { status: "ready" }> | (Extract<AiDecideResponse, { status: "ready" }> & { teamIds?: [string, string] }) | { status: "idle" } | { status: "pending" };
type Picker = { mode: "wins" | "edge"; opener: HTMLElement; ids: [string, string]; path: string };

/** Public surface. The optional transport is an offline fixture seam, never a provider client. */
export function AiDecides({ data, teams, signedIn, authUnavailable = false, decide = postDecision, publishWeekly = postWeeklyPreviews }: { data: AiDecidesData; teams: AiTeam[]; signedIn: boolean; authUnavailable?: boolean; decide?: DecisionTransport; publishWeekly?: WeeklyTransport }) {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [choices, setChoices] = useState(["", ""]);
  const [matchup, setMatchup] = useState<[string, string] | null>(null);
  const [state, setState] = useState<State>({ status: "idle" });
  const [validation, setValidation] = useState("");
  const [saved, setSaved] = useState("");
  const [picker, setPicker] = useState<Picker | null>(null);
  const [teamIds, setTeamIds] = useState<[string, string]>([teams[0]?.id ?? "", teams[1]?.id ?? ""]);
  const [pickerError, setPickerError] = useState("");
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [visible, setVisible] = useState(true);
  const [replay, setReplay] = useState(0);
  const [publication, setPublication] = useState<"idle" | "pending" | "ready" | "failed">("idle");
  const [publicationMessage, setPublicationMessage] = useState("");
  const [savedWeekly, setSavedWeekly] = useState<{ source: AiWeeklySlate; slate: AiWeeklySlate } | null>(null);
  const publicationController = useRef<AbortController | null>(null);
  const publicationStatus = useRef<HTMLParagraphElement>(null);
  const publicationOpener = useRef<HTMLButtonElement | null>(null);
  const question = useRef<HTMLTextAreaElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const firstTeam = useRef<HTMLSelectElement>(null);
  const resultArea = useRef<HTMLElement>(null);
  const controller = useRef<AbortController | null>(null);
  const sequence = useRef(0);
  const restoredFocus = useRef<HTMLElement | null>(null);
  const cancelFocusRestore = useRef<(() => void) | null>(null);
  const pickerHistory = useRef<ReturnType<typeof createPickerHistory<Picker>> | null>(null);
  const canRun = !authUnavailable && signedIn && data.availability.status === "available";
  const weekly = savedWeekly?.source === data.weekly ? savedWeekly.slate : data.weekly;

  useEffect(() => () => { sequence.current++; controller.current?.abort(); publicationController.current?.abort(); }, []);
  useEffect(() => {
    if ((publication === "ready" || publication === "failed") && publicationOpener.current && (document.activeElement === publicationOpener.current || document.activeElement === document.body)) publicationStatus.current?.focus();
    if (publication === "ready" || publication === "failed") publicationOpener.current = null;
  }, [publication]);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(media.matches);
    sync(); media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  useEffect(() => {
    let intersecting = true;
    const sync = () => setVisible(intersecting && !document.hidden);
    const observer = new IntersectionObserver(entries => { intersecting = entries[0].isIntersecting; sync(); });
    if (resultArea.current) observer.observe(resultArea.current);
    document.addEventListener("visibilitychange", sync); sync();
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", sync); };
  }, []);

  useEffect(() => {
    const history = createPickerHistory<Picker>({
      state: () => window.history.state,
      path: () => window.location.pathname,
      url: () => window.location.pathname + window.location.search + window.location.hash,
      push: (state, url) => window.history.pushState(state, "", url),
      replace: (state, url) => window.history.replaceState(state, "", url),
      back: () => window.history.back(),
      subscribe: sync => { window.addEventListener("popstate", sync); return () => window.removeEventListener("popstate", sync); },
    }, entry => { setPicker(entry); if (entry) { restoredFocus.current = null; setTeamIds(entry.ids); setPickerError(""); } }, () => crypto.randomUUID());
    pickerHistory.current = history;
    return () => { pickerHistory.current = null; history.dispose(); };
  }, []);
  useEffect(() => {
    if (!picker) return;
    cancelFocusRestore.current?.();
    const node = dialog.current;
    if (!node) return;
    node.showModal(); firstTeam.current?.focus();
    return () => {
      node.close();
      const target = restoredFocus.current ?? picker.opener;
      cancelFocusRestore.current = restorePickerFocus(target, picker.path, node);
      restoredFocus.current = null;
    };
  }, [picker]);
  useEffect(() => () => { cancelFocusRestore.current?.(); }, []);

  function invalidate() { sequence.current++; controller.current?.abort(); controller.current = null; setState({ status: "idle" }); setSaved(""); }
  function editPrompt(value: string) { invalidate(); setMatchup(null); setPrompt(value); }
  function editChoices(value: string[]) { invalidate(); setMatchup(null); setChoices(value); }
  function reset() { invalidate(); setMatchup(null); setPrompt(""); setChoices(["", ""]); setValidation(""); question.current?.focus(); }
  function closePicker() { pickerHistory.current?.close(); }
  function openPicker(mode: Picker["mode"], opener: HTMLElement, ids?: [string, string]) {
    setPickerError("");
    pickerHistory.current?.open({ mode, opener, ids: ids ?? [teams[0]?.id ?? "", teams[1]?.id ?? ""], path: window.location.pathname });
  }
  function selectTeams(ids: [string, string]) {
    setTeamIds(ids);
    if (picker) pickerHistory.current?.update({ ...picker, ids });
  }
  function savePair() {
    const [a, b] = teamIds.map(id => teams.find(t => t.id === id));
    if (!a || !b || a.id === b.id) { setPickerError("Pick two different available teams."); return; }
    invalidate(); setPrompt(picker?.mode === "edge" ? `Which team has the stronger long-term roster: ${a.name} or ${b.name}?` : `Who wins: ${a.name} or ${b.name}?`);
    setChoices([a.name, b.name]); setMatchup(picker?.mode === "wins" ? [a.id, b.id] : null);
    setValidation(""); setSaved("Pairing saved to your editable draft."); restoredFocus.current = question.current; closePicker();
  }
  async function run(event: React.FormEvent) {
    event.preventDefault();
    const error = draftError(prompt, choices); setValidation(error ?? "");
    if (error) { question.current?.focus(); return; }
    if (!canRun || state.status === "pending") return;
    const request: AiDecideRequest = matchup ? { kind: "matchup", teamIds: matchup } : { kind: "custom", prompt: prompt.trim(), choices: choices.map(c => c.trim()) };
    const id = ++sequence.current, abort = new AbortController(); controller.current = abort; setState({ status: "pending" });
    try {
      const response = await decide(request, abort.signal);
      const verified = readDecisionResponse(response, request.kind === "matchup" ? request.teamIds : request.choices);
      if (id === sequence.current && !abort.signal.aborted) setState(verified.status === "ready" ? { ...verified, ...(request.kind === "matchup" ? { teamIds: request.teamIds } : {}) } : verified);
    } catch {
      if (id === sequence.current && !abort.signal.aborted) setState({ status: "unavailable", code: "connection", message: "The request could not return a result. Your draft is preserved." });
    } finally { if (id === sequence.current) controller.current = null; }
  }

  const resultMatchup = state.status === "ready" && state.teamIds ? { teamIds: state.teamIds, teams } : undefined;

  async function publish(event: React.MouseEvent<HTMLButtonElement>) {
    if (!canRun || weekly.status === "ready" || publication !== "idle" || publicationController.current) return;
    const opener = event.currentTarget;
    const abort = new AbortController(); publicationController.current = abort; setPublication("pending"); setPublicationMessage("Publishing one shared batch. Keep this page open.");
    try {
      const response = readWeeklyPublishResponse(await publishWeekly(abort.signal));
      if (abort.signal.aborted) return;
      publicationOpener.current = document.activeElement === opener ? opener : null;
      if (response.status === "ready") {
        setSavedWeekly({ source: data.weekly, slate: response.weekly }); setPublication("ready");
        setPublicationMessage("Saved slate loaded: 5 of 5 previews available.");
      } else { setPublication("failed"); setPublicationMessage(response.message); }
    } catch {
      if (!abort.signal.aborted) { publicationOpener.current = document.activeElement === opener ? opener : null; setPublication("failed"); setPublicationMessage("Publication did not return a verified slate. Review the attempt before retrying; it may already be saved."); }
    } finally { if (publicationController.current === abort) publicationController.current = null; }
  }

  return <div className={styles.page} data-paused={paused || reduced} data-visible={visible}>
    <div className={styles.pageHeading}><div><h1>AI Decides</h1><p>Saved weekly picks up top. Your question and choices below.</p></div><span className={styles.experimental}>Experimental</span></div>
    <AiWeekly data={{ ...data, weekly }} teams={teams} onPair={(ids, opener) => openPicker("wins", opener, ids)} />
    {canRun && weekly.status !== "ready" && <div className={styles.publication}>
      <button type="button" aria-disabled={publication !== "idle"} onClick={publish}>{publication === "pending" ? "Publishing previews…" : publication === "failed" ? "Publication needs review" : "Publish weekly previews"}</button>
      <p className={styles.helper}>Generates one shared batch of five previews within the existing model budget. Incomplete attempts need review before retrying.</p>
    </div>}
    <p ref={publicationStatus} tabIndex={-1} className={styles.publicationStatus} role="status" aria-live="polite">{publicationMessage}{publication === "failed" && <> <button type="button" className={styles.quiet} onClick={() => router.refresh()}>Refresh saved picks</button></>}</p>
    <section className={styles.workspace} aria-labelledby="ai-draft-title">
      <form className={styles.composer} onSubmit={run} noValidate>
        <h2 id="ai-draft-title">Your turn. Make the call.</h2>
        <p className={styles.intro}>Start with a preset, or ask your own question.</p>
        <div className={styles.presets}><button type="button" disabled={teams.length < 2} onClick={e => openPicker("wins", e.currentTarget)}>Who wins?</button><button type="button" disabled={teams.length < 2} onClick={e => openPicker("edge", e.currentTarget)}>Who has the edge?</button><button type="button" onClick={reset}>Custom question +</button></div>
        <label htmlFor="ai-question">The question</label><textarea ref={question} id="ai-question" value={prompt} onChange={e => editPrompt(e.target.value)} maxLength={2000} rows={2} placeholder="What should we decide?" />
        <p className={styles.helper}>{matchup ? "Hypothetical pairing from verified weekly inputs. Edit to make it custom." : "Custom uses only your prompt and choices; no live research."}</p>
        <div className={styles.choicesHeading}><strong>The choices</strong><span>{choices.length} / 8</span></div>
        <div>{choices.map((choice, index) => <div className={styles.option} key={index}>
          <span className={styles.optionNumber} aria-hidden="true">0{index + 1}</span><label className={styles.sr} htmlFor={`ai-choice-${index}`}>Choice {index + 1}</label><input id={`ai-choice-${index}`} value={choice} maxLength={120} placeholder="Add your choice" onChange={e => editChoices(choices.map((c, i) => i === index ? e.target.value : c))} />
          <button type="button" aria-label={`Remove choice ${index + 1}`} disabled={choices.length <= 2} onClick={() => editChoices(choices.filter((_, i) => i !== index))}>×</button>
        </div>)}</div>
        <button type="button" className={styles.addChoice} disabled={choices.length >= 8} onClick={() => editChoices([...choices, ""])}>+ Add a choice</button>
        {validation && <p role="alert" className={styles.validation}>{validation}</p>}
        <div className={styles.formActions}><button className={styles.primary} disabled={!canRun || state.status === "pending"}>{state.status === "pending" ? "Making the call…" : state.status === "ready" ? "Decide again" : "Let AI decide"}</button><button type="button" className={styles.quiet} onClick={reset}>Reset</button></div>
        <p className={styles.saved} aria-live="polite">{saved}</p>
        <p className={styles.limits}>{authUnavailable ? "Session verification unavailable. Runs are disabled; cached picks and draft editing remain available." : !signedIn ? <><Link href="/login">Sign in</Link> to run. You can edit the draft now.</> : data.availability.status !== "available" ? data.availability.message : "Runs use the current site session and server limits."}</p>
      </form>
      <aside ref={resultArea} className={styles.resultArea} aria-label="Personal experiment">
        <div className={styles.resultHeading}><h2>Your result</h2><button type="button" className={styles.quiet} aria-pressed={paused} disabled={reduced} onClick={() => setPaused(v => !v)}>{reduced ? "Reduced motion" : paused ? "Resume motion" : "Pause motion"}</button></div>
        <div aria-live="polite" aria-atomic="true" className={styles.result} key={replay}>
          {state.status === "idle" ? <><span className={styles.resultStatus}>Your experiment · private draft</span><h3>Make a call.</h3><p>Your choice and every option probability will appear here.</p></> : state.status === "pending" ? <><span className={styles.resultStatus}>Request pending</span><h3>Weighing your options.</h3><p>Reset or edit to cancel this draft.</p><div className={styles.pendingTrack} aria-hidden="true"><i /></div></> : state.status === "ready" ? <><span className={styles.resultStatus}>Model choice</span><h3><ChoiceLabel choice={state.result.choice} matchup={resultMatchup} /></h3><ProbabilityRows result={state.result} matchup={resultMatchup} /><div className={styles.confidence}><strong>API confidence</strong><span>{percent(state.result.confidence)}</span></div><p className={styles.helper}>Separate from the option probabilities.</p><p className={styles.provenance}>{state.result.probabilityLabel}. Percentages are rounded for display.</p><details className={styles.source}><summary>Source &amp; model details</summary><p>{state.result.model} · {state.result.promptVersion}<br />{state.result.snapshot ? `Snapshot captured ${timestamp(state.result.snapshot.capturedAt)}` : "Custom text only · no live research or league facts supplied"}</p><ul>{state.result.evidence.map((e, i) => <li key={i}>{e}</li>)}</ul>{state.result.snapshot && <p>{comparisonLabel(state.result.snapshot) && <>{comparisonLabel(state.result.snapshot)}<br /></>}Cutoff {timestamp(state.result.snapshot.cutoffAt)}<br />{periodLabel(state.result.snapshot)}<br />Prior stats: {state.result.snapshot.statsSeason} · Scoring mode: {state.result.snapshot.scoringMode} · {state.result.snapshot.baselineVersion}</p>}</details><button type="button" className={styles.quiet} disabled={paused || reduced} onClick={() => setReplay(v => v + 1)}>Replay bars</button></> : <><span className={styles.resultStatus}>{state.status.replaceAll("_", " ")}</span><h3>No result available.</h3><p>{state.message}</p>{state.retryAfterSeconds !== undefined && <p>Try again after {Math.ceil(state.retryAfterSeconds)} seconds.</p>}<button type="button" onClick={() => question.current?.focus()}>Edit draft</button></>}
        </div>
      </aside>
    </section>
    <dialog ref={dialog} className={styles.dialog} aria-labelledby="ai-picker-title" onCancel={e => { e.preventDefault(); closePicker(); }}>
      <div className={styles.modalHeading}><h2 id="ai-picker-title">{picker?.mode === "edge" ? "Who has the edge?" : "Who wins?"}</h2><button type="button" className={styles.quiet} aria-label="Close team picker" onClick={closePicker}>×</button></div>
      <p className={styles.helper}>Two different teams · current names. Save fills an editable draft.</p>
      <div className={styles.teamFields}>{[0, 1].map(index => <div key={index}><label htmlFor={`ai-team-${index}`}>Team {index === 0 ? "one" : "two"}</label><select ref={index === 0 ? firstTeam : undefined} id={`ai-team-${index}`} value={teamIds[index]} onChange={e => selectTeams(index === 0 ? [e.target.value, teamIds[1]] : [teamIds[0], e.target.value])}>{teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>)}</div>
      {pickerError && <p className={styles.validation} role="alert">{pickerError}</p>}
      <div className={styles.modalActions}><button type="button" onClick={closePicker}>Cancel</button><button type="button" className={styles.primary} onClick={savePair}>Save to draft</button></div>
    </dialog>
  </div>;
}
