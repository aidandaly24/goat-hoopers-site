"use client";

import { useEffect, useRef, useState } from "react";
import { clockSampleNeedsReconciliation, formatServerRemaining, projectServerRemaining,
  type ServerClockAnchor } from "@/domain/server-clock";
import styles from "./ServerCountdown.module.css";
import controls from "./controls.module.css";
export type { ServerClockAnchor } from "@/domain/server-clock";

/** Controlled display only: no transport, scheduling, admission or automatic retry. */
export function ServerCountdown({ clock, deadlineMs, label, endedLabel, uncertaintyLabel = "Time unconfirmed", onRequestReconciliation }: {
  clock: ServerClockAnchor | null;
  deadlineMs: number | null;
  label: string;
  endedLabel: string;
  uncertaintyLabel?: string;
  onRequestReconciliation?: () => void;
}) {
  const [sample, setSample] = useState<{ mono: number; sequence: number; certified: boolean } | null>(null);
  const reconciliation = useRef(onRequestReconciliation);
  useEffect(() => { reconciliation.current = onRequestReconciliation; }, [onRequestReconciliation]);
  const invalidatedSequence = useRef(-1);
  useEffect(() => {
    if (!clock || deadlineMs === null) return;
    let timer: ReturnType<typeof setInterval> | undefined;
    let last = { mono: performance.now(), wall: Date.now() };
    let uncertain = clock.exchange.sequence <= invalidatedSequence.current, requested = false;
    const pause = () => { if (timer !== undefined) clearInterval(timer); timer = undefined; };
    const invalidate = (notify = true) => {
      pause();
      if (!uncertain) {
        uncertain = true; invalidatedSequence.current = Math.max(invalidatedSequence.current, clock.exchange.sequence);
        setSample({ mono: performance.now(), sequence: clock.exchange.sequence, certified: false });
      }
      if (notify && !requested && !document.hidden) { requested = true; reconciliation.current?.(); }
    };
    const tick = () => {
      const next = { mono: performance.now(), wall: Date.now() };
      if (clockSampleNeedsReconciliation(last, next)) { invalidate(); return; }
      last = next;
      setSample({ mono: next.mono, sequence: clock.exchange.sequence, certified: !uncertain });
      if (projectServerRemaining(clock, deadlineMs, next.mono) === 0) pause();
    };
    const visibility = () => invalidate(!document.hidden);
    const pageShow = (event: PageTransitionEvent) => { if (event.persisted) invalidate(); };
    setSample({ mono: last.mono, sequence: clock.exchange.sequence, certified: !uncertain && !document.hidden });
    if (!uncertain && !document.hidden && projectServerRemaining(clock, deadlineMs, last.mono) !== 0) timer = setInterval(tick, 1000);
    else if (document.hidden) invalidate(false);
    else if (uncertain) invalidate();
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("pageshow", pageShow);
    return () => { pause(); document.removeEventListener("visibilitychange", visibility); window.removeEventListener("pageshow", pageShow); };
  }, [clock, deadlineMs]);
  const remaining = projectServerRemaining(clock, deadlineMs, sample?.mono ?? NaN,
    !sample?.certified || sample.sequence !== clock?.exchange.sequence);
  const status = remaining === null ? uncertaintyLabel : remaining === 0 ? endedLabel : "";
  return <div className={styles.clock} data-server-clock={remaining === null ? "uncertain" : remaining === 0 ? "ended" : "running"}>
    <span>{label}</span>
    <strong aria-live="off">{remaining === null ? "—" : formatServerRemaining(remaining)}</strong>
    <p role="status" aria-live="polite" aria-atomic="true">{status}</p>
    {remaining === null && onRequestReconciliation && <button className={controls.secondary} onClick={onRequestReconciliation}>Refresh clock status</button>}
  </div>;
}
