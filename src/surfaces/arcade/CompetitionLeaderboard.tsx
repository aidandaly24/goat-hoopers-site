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

type BoardRead = { key: string } & ({ status: "loading" | "held" | "unavailable" } | { status: "ready"; board: CompetitionBoard });

/** Slim public read only. No score writes, upstream fetch or fantasy standings. */
export function CompetitionLeaderboard({ kind = "weekly", periodId, gameId = "free-throw", titleLevel = 2 }: {
  kind?: "weekly" | "all-time" | "archive"; periodId?: string; gameId?: string; titleLevel?: 1 | 2;
}) {
  const [read, setRead] = useState<BoardRead>({ key: "", status: "loading" }), [retry, setRetry] = useState(0);
  const [scope, setScope] = useState<"everyone" | "league">("everyone");
  const generation = useRef(0);
  const supported = gameId === "free-throw";
  const requestKey = JSON.stringify([kind, gameId, periodId ?? null, scope, retry]);
  useEffect(() => {
    if (!supported) return;
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
          (!data.board || data.board.gameId !== gameId || data.board.kind !== kind || !Array.isArray(data.board.entries) || data.board.entries.length > 100)) throw new Error("invalid_board");
        const decoded = data.status === "ready" ? decodeCompetitionBoard(data.board) : null;
        if (data.status === "ready" && (!decoded || kind === "archive" && decoded.periodId !== periodId)) throw new Error("invalid_board");
        setRead(decoded ? { key: requestKey, status: "ready", board: decoded } : { key: requestKey, status: data.status });
        if (kind !== "archive" && data.status === "ready") timer = setTimeout(load, 60000);
      } catch { if (!stopped && !controller.signal.aborted) setRead({ key: requestKey, status: "unavailable" }); }
      finally { if (pending === controller) pending = null; }
    };
    const visibility = () => { if (timer) clearTimeout(timer); pending?.abort(); pending = null; if (!document.hidden) void load(); };
    const restore = (e: PageTransitionEvent) => { if (e.persisted) visibility(); };
    void load(); document.addEventListener("visibilitychange", visibility); window.addEventListener("pageshow", restore);
    return () => { stopped = true; pending?.abort(); if (timer) clearTimeout(timer); document.removeEventListener("visibilitychange", visibility); window.removeEventListener("pageshow", restore); };
  }, [kind, gameId, periodId, scope, requestKey, supported]);
  // A retained client component may receive a different route's props before
  // its effect runs. Never label the old request's rows as the new board.
  const status = read.key === requestKey ? read.status : "loading";
  const board = read.key === requestKey && read.status === "ready" ? read.board : null;
  const game = getGame(gameId), heading = kind === "weekly" ? "This week’s leaderboard" : kind === "all-time" ? `${game?.name ?? gameId} · all-time` : "Weekly final";
  if (!supported) return <section className={styles.wrap} aria-label={`${game?.name ?? gameId} rankings`}>
    <Card><SectionHeading eyebrow="Unranked game" title={`${game?.name ?? gameId} has no ranked leaderboard`} level={titleLevel} />
      <p>{game?.play ? <>This game is {game.play.mode === "preview" ? "an unranked preview" : "local practice"}. Its scores do not enter weekly or all-time rankings.</>
        : "This game is not playable yet and has no ranked scores."}</p>
      <nav className={styles.links} aria-label="Game options"><Link href={`/arcade/${gameId}`}>{!game?.play ? "View game details" : game.play.mode === "preview" ? "Open preview" : "Play local practice"}</Link>
        <Link href="/arcade/leaderboard">Free Throw weekly leaderboard</Link><Link href="/arcade">All games</Link></nav>
    </Card>
  </section>;
  return <section className={styles.wrap} aria-label={heading}>
    <Card><SectionHeading eyebrow="Ranked Free Throw" title={heading} level={titleLevel} />
      <p>{kind === "weekly" ? "This competition week only. Saved ranked rounds count; local practice does not."
        : kind === "all-time" ? "Best saved ranked round per account across weeks using this same scoring format. Local practice does not count."
          : "Saved results from a completed competition week."}</p>
      <div className={styles.filters} role="group" aria-label="Rankings scope">{(["everyone", "league"] as const).map(value =>
        <button key={value} type="button" className={controls.secondary} aria-pressed={scope === value} onClick={() => { if (scope !== value) setScope(value); }}>{value === "everyone" ? "Everyone" : "League"}</button>)}</div>
      <p className={styles.caption}>{scope === "everyone" ? "Everyone includes all eligible verified personal accounts."
        : kind === "archive" ? "League includes accounts eligible for the league when this week was finalized." : "League includes verified accounts currently linked to a GOAT Hoopers team."}</p>
      {status === "held" ? <><p role="status">Ranked leaderboards are not enabled or ready. This is not an empty leaderboard.</p>
        <p>You can still play local practice. Practice results stay in that session.</p><button type="button" className={controls.secondary} onClick={() => setRetry(n => n + 1)}>Check rankings again</button>
        {kind === "weekly" && <WeeklyChallengeCountdown />}</>
        : status === "loading" ? <p role="status">Loading rankings…</p> : status === "unavailable" ? <><p role="status">Rankings could not be loaded. No scores are being shown.</p><button type="button" className={controls.secondary} onClick={() => setRetry(n => n + 1)}>Reload rankings</button></>
          : board && <><p className={styles.period}>{board.label}</p>
            {kind !== "all-time" && <p>{board.phase === "blocked" ? "New rounds are paused while game status or the previous week's finalization is verified. Saved scores remain below."
              : board.phase === "open" ? "Ranked rounds are open. This board refreshes while visible."
                : board.phase === "upcoming" ? "This competition week has not opened yet."
                  : board.phase === "final" ? "Final results. This week is complete." : "Ranked rounds are not available for this period."}</p>}
            {kind === "weekly" && board.phase === "open" && <Link className={controls.primary} href="/arcade/ranked-free-throw">Play ranked free throws</Link>}
            {board.entries.length ? <ol className={styles.rows} aria-label={kind === "all-time" ? "All-time ranked scores" : kind === "archive" ? "Final ranked scores" : "Weekly ranked scores"}>{board.entries.map(entry => <li key={entry.rank} data-current={entry.isCurrentUser}>
              <span>{entry.rank}</span><strong>{entry.username}{entry.isCurrentUser ? " · You" : ""}</strong><span>{entry.score} makes</span>
              <small>{entry.makes}/{entry.attempts} · best round streak {entry.longestStreak}</small></li>)}</ol>
              : <p>{kind === "archive" ? "No completed scores in this final." : scope === "league" ? "No validated league scores in this board yet. Try Everyone to include other verified accounts." : "No validated scores in this board yet. Complete and save a ranked round to enter."}</p>}
            <p>Best valid completed round per account. Equal scores use earlier server acceptance, then a stable score ID. Different games and incompatible formats are separate.</p>
            {kind === "archive" && <p>Final scores and ordering are preserved; league eligibility is frozen at finalization. Names reflect current profiles where available.</p>}</>}
      <nav className={styles.links} aria-label="Competition views"><Link href="/arcade/leaderboard" aria-current={kind === "weekly" ? "page" : undefined}>Current week</Link>
        <Link href={`/arcade/${gameId}/leaderboard`} aria-current={kind === "all-time" ? "page" : undefined}>Game all-time</Link><Link href="/arcade/history">Weekly history</Link>
        <Link href={`/arcade/${gameId}`}>Local practice</Link><Link href="/arcade">All games</Link></nav>
    </Card>
  </section>;
}
