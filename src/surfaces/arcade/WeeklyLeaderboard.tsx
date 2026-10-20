"use client";

import type { ReactNode } from "react";
import type { WeeklyLeaderboardEntry, WeeklyLeaderboardScope, WeeklyLeaderboardState } from "@/domain/arcade/weekly-leaderboard";
import { Card } from "@/ui/Card";
import { SectionHeading } from "@/ui/SectionHeading";
import styles from "./WeeklyLeaderboard.module.css";

const accuracy = (value: number | null) => value === null ? "—" : `${Math.round(value * 100)}%`;
const date = (time: number, timeZone: string, includeTime = false) => new Intl.DateTimeFormat("en-US", {
  timeZone, month: "short", day: "numeric", ...(includeTime ? { hour: "numeric", minute: "2-digit", timeZoneName: "short" } as const : {}),
}).format(time);

function Player({ entry }: { entry: WeeklyLeaderboardEntry }) {
  return <li className={styles.entry} data-leading={entry.rank <= 3} data-current={entry.isCurrentUser}>
    <span className={styles.rank} data-rank={entry.rank} aria-label={`Rank ${entry.rank}`}>{entry.rank.toString().padStart(2, "0")}</span>
    <div className={styles.identity}>
      <strong className={styles.username}>{entry.username}</strong>
      {entry.isCurrentUser && <span className={styles.you}>You</span>}
    </div>
    <div className={styles.score}><strong>{entry.score}</strong><span>makes</span></div>
    <dl className={styles.stats}>
      <div><dt>Shots</dt><dd>{entry.makes}/{entry.attempts}</dd></div>
      <div><dt>Accuracy</dt><dd>{accuracy(entry.accuracy)}</dd></div>
      <div><dt>Best streak</dt><dd>{entry.longestStreak}</dd></div>
    </dl>
  </li>;
}

/** Pure presentation: accepts an injected, validated board and never loads data. */
export function WeeklyLeaderboard({ state, scope = "everyone", onScopeChange, onRetry, headingLevel = 2, limit, closedTiming }: {
  state: WeeklyLeaderboardState;
  scope?: WeeklyLeaderboardScope;
  onScopeChange?: (scope: WeeklyLeaderboardScope) => void;
  onRetry?: () => void;
  headingLevel?: 1 | 2;
  limit?: number;
  closedTiming?: ReactNode;
}) {
  const board = state.status === "ready" ? state.board : null;
  const selectedScope = board?.scope ?? scope;
  const closed = state.status === "closed";
  return <section className={styles.wrap} aria-label="Weekly leaderboard">
    <Card className={styles.card}>
      <div className={styles.header}>
        <SectionHeading eyebrow="Free throws · Weekly competition" title="Leaderboard" level={headingLevel} />
        <span className={styles.status}>{closed ? "Competition closed" : board ? board.period.week : "This week"}</span>
      </div>
      <div className={styles.toolbar}>
        <div className={styles.scopes} role="group" aria-label="Leaderboard scope">
          {(["everyone", "league"] as const).map(value => <button key={value} className={styles.scope} type="button" aria-pressed={selectedScope === value}
            disabled={closed || !onScopeChange} onClick={() => { if (value !== selectedScope) onScopeChange?.(value); }}>
            {value === "everyone" ? "Everyone" : "League"}
          </button>)}
        </div>
        {board && <p className={styles.period}>{date(board.period.startsAtMs, board.calendar.timeZone)} – {date(board.period.endsAtMs - 1, board.calendar.timeZone)}</p>}
      </div>
      {closed ? <div className={styles.notice}>
        <p className={styles.noticeTitle}>The weekly board is not open yet.</p>
        <p>{state.message ?? "Ranked play is closed while the competition rules are finalized. Practice is available; practice scores do not appear here."}</p>
        {closedTiming}
      </div> : state.status === "loading" ? <div className={styles.notice} role="status"><p className={styles.noticeTitle}>Loading rankings…</p><p>Checking validated scores for this scope.</p></div>
        : state.status === "error" ? <div className={styles.notice} role="status">
          <p className={styles.noticeTitle}>Rankings are unavailable.</p><p>The board could not be loaded. No scores are being shown.</p>
          {onRetry && <button className={styles.retry} type="button" onClick={onRetry}>Reload rankings</button>}
        </div> : board && <>
          {board.entries.length === 0 ? <div className={styles.notice} role="status"><p className={styles.noticeTitle}>No validated scores in this scope yet.</p>
            <p>{selectedScope === "league" ? "League includes players currently linked to a GOAT Hoopers team. Everyone also includes other verified accounts." : "A completed, validated ranked round is needed to join the board. Local practice does not count."}</p>
          </div> : <ol className={styles.rankings} aria-label="Weekly rankings" data-leader-count={Math.min(board.entries.length, 3)}>
            {board.entries.map(entry => <Player key={entry.rank} entry={entry} />)}
          </ol>}
          <div className={styles.rules}>
            <p>Best final score per person. Equal scores use earliest server acceptance, then a stable score ID. League includes currently linked teams.</p>
            <p>Weekly cutoff: <time dateTime={new Date(board.period.endsAtMs).toISOString()}>{date(board.period.endsAtMs, board.calendar.timeZone, true)}</time> · {board.calendar.timeZone}.</p>
            {limit !== undefined && <p>Showing up to {limit} players.</p>}
          </div>
        </>}
    </Card>
  </section>;
}
