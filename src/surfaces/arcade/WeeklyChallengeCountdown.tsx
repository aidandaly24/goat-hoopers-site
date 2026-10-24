"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createArcadeClockReader, type ArcadeClockReader, type ArcadeClockReply } from "@/data/arcade-clock-client";
import { WEEK_ONE_RANKED_OPENING } from "@/domain/arcade/challenge-opening";
import { reconcileServerClock, type ServerClockAnchor } from "@/domain/server-clock";
import { ServerCountdown } from "@/ui/ServerCountdown";
import styles from "./WeeklyChallengeCountdown.module.css";

const defaultReader = createArcadeClockReader();
const openingLabel = new Intl.DateTimeFormat("en-US", { timeZone: WEEK_ONE_RANKED_OPENING.timeZone,
  month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" }).format(WEEK_ONE_RANKED_OPENING.startsAtMs);

/** A held opening display only. It never admits a round, changes board state or imports gameplay. */
export function WeeklyChallengeCountdown({ readClock = defaultReader }: { readClock?: ArcadeClockReader }) {
  const [clock, setClock] = useState<ServerClockAnchor | null>(null), [failed, setFailed] = useState(false);
  const previous = useRef<ServerClockAnchor | null>(null), sequence = useRef(0), pending = useRef<AbortController | null>(null);
  const refresh = useCallback(async () => {
    if (document.hidden || pending.current) return;
    const controller = new AbortController(), current = ++sequence.current, sentAtMonoMs = performance.now();
    pending.current = controller;
    let reply: ArcadeClockReply;
    try { reply = await readClock(controller.signal); } catch { reply = { ok: false as const }; }
    const receivedAtMonoMs = performance.now();
    if (pending.current === controller) pending.current = null;
    if (controller.signal.aborted || current !== sequence.current) return;
    if (reply.ok) {
      const result = reconcileServerClock(reply.value.asOfMs, { sequence: current, sentAtMonoMs, receivedAtMonoMs }, current, previous.current);
      if (result.status === "ignored") return;
      if (result.status === "accepted") { previous.current = result.anchor; setClock(result.anchor); setFailed(false); return; }
    }
    setClock(null); setFailed(true);
  }, [readClock]);
  useEffect(() => {
    void refresh();
    const invalidate = () => { pending.current?.abort(); pending.current = null; sequence.current += 1; };
    const visibility = () => { if (document.hidden) invalidate(); else void refresh(); };
    const restored = (event: PageTransitionEvent) => { if (event.persisted) void refresh(); };
    document.addEventListener("visibilitychange", visibility); window.addEventListener("pageshow", restored);
    return () => { invalidate(); document.removeEventListener("visibilitychange", visibility); window.removeEventListener("pageshow", restored); };
  }, [refresh]);
  useEffect(() => {
    if (!clock || clock.asOfMs >= WEEK_ONE_RANKED_OPENING.startsAtMs) return;
    // Reconfirm the held state once the announced time passes; never infer admission from elapsed time.
    const remaining = WEEK_ONE_RANKED_OPENING.startsAtMs - clock.upperServerNowAtReceiptMs;
    const timer = setTimeout(() => { void refresh(); }, Math.max(0, remaining) + 1000);
    return () => clearTimeout(timer);
  }, [clock, refresh]);
  return <HeldRankedOpening clock={clock} failed={failed} refresh={refresh} />;
}

/** Private client-subtree presentation. A past launch announcement is not an active competition clock. */
export function HeldRankedOpening({ clock, failed, refresh }: {
  clock: ServerClockAnchor | null; failed: boolean; refresh: () => void;
}) {
  if (clock && clock.asOfMs >= WEEK_ONE_RANKED_OPENING.startsAtMs) return <section className={styles.timing} aria-label="Ranked status">
    <p role="status">Ranked rounds are currently closed.</p>
    <p>The leaderboard will show when the competition is open. Local practice remains available.</p>
  </section>;
  return <section className={styles.timing} aria-label="Ranked opening countdown">
    {clock && <p>Scheduled ranked opening: <time dateTime={new Date(WEEK_ONE_RANKED_OPENING.startsAtMs).toISOString()}>{openingLabel}</time>.</p>}
    <ServerCountdown clock={clock} deadlineMs={WEEK_ONE_RANKED_OPENING.startsAtMs}
      label="Ranked opening in" endedLabel="Scheduled opening reached · ranked remains held"
      uncertaintyLabel={failed ? "Server clock unavailable · ranked remains held" : "Checking server clock…"}
      onRequestReconciliation={refresh} />
    <p>Check the leaderboard for competition availability. Reaching zero does not open entries.</p>
  </section>;
}
