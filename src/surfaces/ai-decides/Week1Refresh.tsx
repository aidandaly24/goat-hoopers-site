"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { AiDecidesData, AiWeeklySlate } from "@/domain/ai-decider";
import { postWeek1Refresh, readWeek1RefreshResponse, type WeeklyTransport } from "./client";
import styles from "./AiDecides.module.css";

/** Private weekly operator control; independent of the personal decision draft. */
export function Week1Refresh({ metadata, weekly, canRun, signedIn, authUnavailable, onReady, refresh = postWeek1Refresh }: {
  metadata: AiDecidesData["week1Refresh"];
  weekly: AiWeeklySlate;
  canRun: boolean;
  signedIn: boolean;
  authUnavailable: boolean;
  onReady: (weekly: AiWeeklySlate) => void;
  refresh?: WeeklyTransport;
}) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "pending" | "published" | "failed">("idle");
  const [message, setMessage] = useState("");
  const [reloadMetadata, setReloadMetadata] = useState<typeof metadata | null>(null);
  const controller = useRef<AbortController | null>(null);
  const status = useRef<HTMLParagraphElement>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const reloadOpener = useRef<HTMLButtonElement | null>(null);
  const completeWeek1 = weekly.week === 1 && weekly.status === "ready" && weekly.matchups.length === 5 && new Set(weekly.matchups.map(p => p.matchupId)).size === 5 && new Set(weekly.matchups.flatMap(p => p.teamIds)).size === 10;
  // Next preserves local state on router.refresh(). Only a deliberate reread
  // followed by a new server metadata object can clear the local failure lock.
  const reread = reloadMetadata !== null && metadata !== reloadMetadata;
  const effectiveState = state === "failed" && reread ? "idle" : state;
  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => {
    if (state === "published" || state === "failed") {
      if (opener.current && (document.activeElement === opener.current || document.activeElement === document.body)) status.current?.focus();
      opener.current = null;
    }
  }, [state]);
  useEffect(() => {
    if (reread && reloadOpener.current) {
      if (document.activeElement === reloadOpener.current || document.activeElement === document.body) status.current?.focus();
      reloadOpener.current = null;
    }
  }, [reread, metadata]);

  async function run(event: React.MouseEvent<HTMLButtonElement>) {
    if (!canRun || metadata?.status !== "available" || !completeWeek1 || effectiveState !== "idle" || controller.current) return;
    const button = event.currentTarget;
    const abort = new AbortController(); controller.current = abort;
    setReloadMetadata(null); setState("pending"); setMessage("Refreshing all five Week 1 predictions. Current picks remain visible.");
    try {
      const response = readWeek1RefreshResponse(await refresh(abort.signal), weekly);
      if (abort.signal.aborted) return;
      opener.current = document.activeElement === button ? button : null;
      if (response.status === "ready") {
        onReady(response.weekly); setState("published");
        setMessage("Week 1 refreshed: all five saved replacements are now displayed. The original batch remains archived.");
      } else {
        setState("failed");
        setMessage(response.code === "refresh_sealed" ? `${response.message} The one-time attempt is sealed. Review is required; current picks are retained.` : `${response.message} Current picks are retained. Reload to check the one-time attempt state; it may already be sealed or saved.`);
      }
    } catch {
      if (!abort.signal.aborted) {
        opener.current = document.activeElement === button ? button : null;
        setState("failed"); setMessage("No verified replacement was received. Current picks are retained. Reload to check the one-time attempt state; it may already be sealed or saved.");
      }
    } finally { if (controller.current === abort) controller.current = null; }
  }

  if (!metadata || !signedIn || authUnavailable) return null;
  const available = metadata.status === "available" && effectiveState === "idle";
  const published = state === "published" || metadata.status === "published";
  const displayedMessage = reread && state === "failed" ? metadata.message : state === "pending" || state === "published" || metadata.status === "available" ? message || metadata.message : metadata.message;
  return <section className={styles.publication} aria-label="One-time Week 1 refresh">
    {available || state === "pending" ? <>
      <button type="button" aria-disabled={!canRun || state === "pending" || !completeWeek1} aria-describedby="ai-week1-refresh-note" onClick={run}>{state === "pending" ? "Refreshing Week 1 predictions…" : "Refresh Week1 predictions"}</button>
      <p id="ai-week1-refresh-note" className={styles.helper}>One-time paid model batch for all five Week 1 matchups, using the shared daily token budget. Current picks stay visible until all five replacements are verified. The original batch remains archived.</p>
    </> : null}
    <p ref={status} tabIndex={-1} className={styles.publicationStatus} role="status" aria-live="polite">{displayedMessage}{!canRun && available && " AI decisions are currently unavailable."}{(effectiveState === "failed" || metadata.status === "sealed") && !published && <> <button type="button" className={styles.quiet} onClick={event => { reloadOpener.current = document.activeElement === event.currentTarget ? event.currentTarget : null; setReloadMetadata(metadata); router.refresh(); }}>Reload saved picks</button></>}</p>
  </section>;
}
