"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { CompetitionBoard } from "@/domain/arcade/competition-period";
import { decodeCompetitionBoard } from "@/domain/arcade/competition-board";
import { getGame } from "@/domain/arcade/games";
import { Card } from "@/ui/Card";
import { SectionHeading } from "@/ui/SectionHeading";
import controls from "@/ui/controls.module.css";
import { WeeklyChallengeCountdown } from "./WeeklyChallengeCountdown";
import styles from "./CompetitionLeaderboard.module.css";

/** Slim public read only. No score writes, upstream fetch or fantasy standings. */
export function CompetitionLeaderboard({ kind = "weekly", periodId, gameId = "free-throw", titleLevel = 2 }: {
  kind?: "weekly" | "all-time" | "archive"; periodId?: string; gameId?: string; titleLevel?: 1 | 2;
}) {
  const [board, setBoard] = useState<CompetitionBoard | null>(null), [status, setStatus] = useState("loading"), [retry, setRetry] = useState(0);
  const [scope, setScope] = useState<"everyone" | "league">("everyone");
  const generation = useRef(0);
  useEffect(() => {
    const current = ++generation.current;
    let pending: AbortController | null = null, timer: ReturnType<typeof setTimeout> | undefined, stopped = false;
    const load = async () => {
      if (stopped || document.hidden || pending) return;
      const controller = new AbortController(); pending = controller;
      try {
        const query = new URLSearchParams({ kind, gameId, scope, ...(periodId ? { periodId } : {}) });
        const response = await fetch(`/api/arcade/competition?${query}`, { credentials: "same-origin", cache: "no-store", signal: controller.signal });
        const data = await response.json();
        if (stopped || controller.signal.aborted || current !== generation.current) return;
        if (!response.ok || !["held", "unavailable", "ready"].includes(data.status) || data.status === "ready" &&
          (!data.board || kind === "all-time" && data.board.gameId !== gameId || data.board.kind !== kind || !Array.isArray(data.board.entries) || data.board.entries.length > 100)) throw new Error("invalid_board");
        const decoded = data.status === "ready" ? decodeCompetitionBoard(data.board) : null;
        if (data.status === "ready" && (!decoded || kind === "archive" && decoded.periodId !== periodId)) throw new Error("invalid_board");
        setStatus(data.status); setBoard(decoded);
        if (kind !== "archive" && data.status === "ready") timer = setTimeout(load, 60000);
      } catch { if (!stopped && !controller.signal.aborted) { setStatus("unavailable"); setBoard(null); } }
      finally { if (pending === controller) pending = null; }
    };
    const visibility = () => { if (timer) clearTimeout(timer); pending?.abort(); pending = null; if (!document.hidden) void load(); };
    const restore = (e: PageTransitionEvent) => { if (e.persisted) visibility(); };
    void load(); document.addEventListener("visibilitychange", visibility); window.addEventListener("pageshow", restore);
    return () => { stopped = true; pending?.abort(); if (timer) clearTimeout(timer); document.removeEventListener("visibilitychange", visibility); window.removeEventListener("pageshow", restore); };
  }, [kind, gameId, periodId, scope, retry]);
  const activeGame = board?.gameId ?? gameId, game = getGame(activeGame), heading = kind === "weekly" ? "This week’s leaderboard" : kind === "all-time" ? `${game?.name ?? gameId} · all-time` : "Weekly final";
  return <section className={styles.wrap} aria-label={heading}>
    <Card><SectionHeading eyebrow="Mini games" title={heading} level={titleLevel} />
      <div className={styles.filters} role="group" aria-label="Rankings scope">{(["everyone", "league"] as const).map(value =>
        <button key={value} className={controls.secondary} aria-pressed={scope === value} onClick={() => { if (scope !== value) { setStatus("loading"); setBoard(null); setScope(value); } }}>{value === "everyone" ? "Everyone" : "League"}</button>)}</div>
      {status === "held" ? <><p>Ranked competition is held. Practice scores do not enter rankings.</p>{gameId === "free-throw" && kind === "weekly" && <WeeklyChallengeCountdown />}</>
        : status === "loading" ? <p role="status">Loading competition…</p> : status === "unavailable" ? <><p role="status">Rankings could not be verified.</p><button className={controls.secondary} onClick={() => setRetry(n => n + 1)}>Reload rankings</button></>
          : board && <><p>{board.label} · {board.phase === "blocked" ? "Awaiting verified game status or prior-week finalization" : board.phase}</p>
            {kind === "weekly" && board.phase === "open" && board.gameId === "free-throw" && <Link className={controls.primary} href="/arcade/ranked-free-throw">Play ranked free throws</Link>}
            {board.entries.length ? <ol className={styles.rows}>{board.entries.map(entry => <li key={entry.rank} data-current={entry.isCurrentUser}>
              <span>{entry.rank}</span><strong>{entry.username}{entry.isCurrentUser ? " · You" : ""}</strong><span>{"metric" in entry ? entry.metric.kind === "modeled-record" ? `${entry.metric.wins}–${entry.metric.losses}` : `${entry.score} points` : `${entry.score} makes`}</span>
              <small>{"metric" in entry ? entry.metric.kind === "modeled-record" ? "Modeled entertainment record" : `${entry.metric.correct}/${entry.metric.rounds} correct` : `${entry.makes}/${entry.attempts} · best round streak ${entry.longestStreak}`}</small></li>)}</ol>
              : <p>{kind === "archive" ? "No completed scores in this final." : "No validated scores in this board yet."}</p>}
            <p>Best valid completed round per account. Equal scores use earlier server acceptance, then a stable score ID. Different games and incompatible formats are separate.</p>
            {kind === "archive" && <p>Final scores and ordering are preserved; league eligibility is frozen at finalization. Names reflect current profiles where available.</p>}</>}
      <nav className={styles.links} aria-label="Competition views"><Link href="/arcade/leaderboard">Current week</Link>
        <Link href={`/arcade/${activeGame}/leaderboard`}>Game all-time</Link><Link href="/arcade/history">Weekly history</Link>
        <Link href={`/arcade/${activeGame}`}>Practice / preview</Link></nav>
    </Card>
  </section>;
}
