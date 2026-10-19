"use client";

import { useState, type KeyboardEvent } from "react";
import Link from "next/link";
import type { TableLeagueRow, TableValueRow, TheTableData } from "@/domain";
import { formatSeasonStatus } from "@/domain";
import { Card } from "@/ui/Card";
import { SectionHeading } from "@/ui/SectionHeading";
import { TeamAvatar } from "@/ui/TeamAvatar";
import { teamColorVar } from "@/ui/teamColors";
import styles from "./TheTable.module.css";

type Lens = "league" | "value" | "power" | "arcade";

const LENSES: { id: Lens; label: string }[] = [
  { id: "league", label: "League" },
  { id: "value", label: "Value" },
  { id: "power", label: "Power" },
  { id: "arcade", label: "Arcade" },
];

/** Sleeper points are stored x100 (see Team.pointsFor). */
const fmtPoints = (p: number): string =>
  Number.isFinite(p) ? (p / 100).toFixed(1) : "—";

/** Modeled FAAB dollars, formatted like the stock board's prices. */
const fmtMoney = (v: number): string => `$${v.toFixed(2)}`;

const fmtRecord = (w: number, l: number, t: number): string =>
  t > 0 ? `${w}–${l}–${t}` : `${w}–${l}`;

const fmtStreak = (streak: number | null): string => {
  if (streak === null || streak === 0) return "—";
  return streak > 0 ? `W${streak}` : `L${Math.abs(streak)}`;
};

/** Deterministic UTC stamp (no locale-dependent rendering). */
const fmtComputedAt = (iso: string): string =>
  new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(iso));

function PinnedStrip({
  teamId,
  teamName,
  avatar,
  detail,
}: {
  teamId: string;
  teamName: string;
  avatar: string | null;
  detail: string;
}) {
  return (
    <div
      className={styles.pinned}
      style={{ borderLeftColor: teamColorVar(teamId) }}
    >
      <span className={styles.pinnedLabel}>Your team</span>
      <TeamAvatar name={teamName} avatar={avatar} />
      <span className={styles.pinnedName}>{teamName}</span>
      <span className={`${styles.pinnedDetail} gh-num`}>{detail}</span>
      <Link href={`/teams/${teamId}`} className={styles.pinnedLink}>
        View team
      </Link>
    </div>
  );
}

function LeaguePanel({
  data,
  viewerTeamId,
}: {
  data: TheTableData;
  viewerTeamId: string | null;
}) {
  const rows = data.league;
  return (
    <Card>
      <SectionHeading eyebrow="The Table · League" title="League standings" />
      {rows === null ? (
        <p className={styles.empty}>
          Standings are unavailable right now — league data didn&rsquo;t load.
          The board returns when it does.
        </p>
      ) : (
        <>
          {!data.hasResults && (
            <p className={styles.note} role="status">
              No final results yet — every team is level at 0–0, so the board
              lists teams without a rank order. Real ranks and the No. 1
              nameplate arrive with the first final week.
            </p>
          )}
          {data.hasResults &&
            (() => {
              const mine = rows.find((r) => r.standing.team.id === viewerTeamId);
              return mine ? (
                <PinnedStrip
                  teamId={mine.standing.team.id}
                  teamName={mine.standing.team.name}
                  avatar={mine.standing.team.avatar}
                  detail={`#${mine.standing.rank} · ${fmtRecord(mine.standing.wins, mine.standing.losses, mine.standing.ties)} · ${fmtStreak(mine.streak)}`}
                />
              ) : null;
            })()}
          <div className={styles.board} role="table" aria-label="League standings">
            <div className={`${styles.head} ${styles.leagueGrid}`} role="row">
              <span role="columnheader">#</span>
              <span role="columnheader">Team</span>
              <span role="columnheader" className={styles.numHead}>W</span>
              <span role="columnheader" className={styles.numHead}>L</span>
              <span role="columnheader" className={styles.numHead}>PF</span>
              <span role="columnheader" className={styles.numHead}>GB</span>
              <span role="columnheader" className={styles.numHead}>Streak</span>
            </div>
            {rows.map((row) => (
              <LeagueRow key={row.standing.team.id} row={row} ranked={data.hasResults} viewerTeamId={viewerTeamId} />
            ))}
          </div>
        </>
      )}
      <p className={styles.footnote}>
        Source: Sleeper league standings — wins, losses, points for and games
        back, refreshed on the site&rsquo;s five-minute league cache. Streak
        counts consecutive wins or losses ending with the latest final week.
      </p>
    </Card>
  );
}

function LeagueRow({
  row,
  ranked,
  viewerTeamId,
}: {
  row: TableLeagueRow;
  ranked: boolean;
  viewerTeamId: string | null;
}) {
  const { standing } = row;
  const team = standing.team;
  const isViewer = viewerTeamId !== null && team.id === viewerTeamId;
  const isLeader = ranked && standing.rank === 1;
  return (
    <Link
      href={`/teams/${team.id}`}
      role="row"
      aria-label={`View ${team.name}`}
      className={`${styles.row} ${styles.leagueGrid} ${isViewer ? styles.viewer : ""} ${isLeader ? styles.leader : ""}`}
    >
      <span role="cell" className={styles.rank}>
        {ranked ? standing.rank : "–"}
      </span>
      <span role="cell" className={styles.team}>
        <TeamAvatar name={team.name} avatar={team.avatar} />
        <span className={styles.teamText}>
          <span
            className={`${styles.name} ${isLeader ? styles.leaderName : ""}`}
            style={
              isLeader
                ? { boxShadow: `inset 0 -0.22em 0 ${teamColorVar(team.id)}` }
                : undefined
            }
          >
            {team.name}
            {isViewer && <span className={styles.you}>You</span>}
          </span>
          <span className={styles.manager}>{team.managerName}</span>
        </span>
      </span>
      <span role="cell" className={`${styles.num} gh-num`} data-label="W">{standing.wins}</span>
      <span role="cell" className={`${styles.num} gh-num`} data-label="L">{standing.losses}</span>
      <span role="cell" className={`${styles.num} gh-num`} data-label="PF">{fmtPoints(standing.pointsFor)}</span>
      <span role="cell" className={`${styles.num} gh-num`} data-label="GB">{standing.gamesBack.toFixed(1)}</span>
      <span
        role="cell"
        className={`${styles.num} ${row.streak !== null && row.streak > 0 ? styles.win : row.streak !== null && row.streak < 0 ? styles.loss : ""} gh-num`}
        data-label="Streak"
      >
        {fmtStreak(row.streak)}
      </span>
    </Link>
  );
}

function ValuePanel({
  data,
  viewerTeamId,
}: {
  data: TheTableData;
  viewerTeamId: string | null;
}) {
  const value = data.value;
  return (
    <Card>
      <SectionHeading eyebrow="The Table · Value" title="Roster value" />
      {value === null ? (
        <p className={styles.empty}>
          Roster values are unavailable right now — the market didn&rsquo;t
          load. Totals return with the next market computation.
        </p>
      ) : (
        <>
          {(() => {
            const mine = value.rows.find((r) => r.team.id === viewerTeamId);
            return mine ? (
              <PinnedStrip
                teamId={mine.team.id}
                teamName={mine.team.name}
                avatar={mine.team.avatar}
                detail={`#${mine.rank} · ${mine.totalValue !== null ? fmtMoney(mine.totalValue) : "not priced yet"}`}
              />
            ) : null;
          })()}
          <div className={styles.board} role="table" aria-label="Roster values">
            <div className={`${styles.head} ${styles.valueGrid}`} role="row">
              <span role="columnheader">#</span>
              <span role="columnheader">Team</span>
              <span role="columnheader" className={styles.numHead}>Total value</span>
              <span role="columnheader" className={styles.numHead}>Priced</span>
            </div>
            {value.rows.map((row) => (
              <ValueRow key={row.team.id} row={row} viewerTeamId={viewerTeamId} />
            ))}
          </div>
          <p className={styles.footnote}>
            Source: modeled FAAB prices from the Player Stock Market — the
            same StockQuote prices as the stocks board — summed across each
            team&rsquo;s current Sleeper roster. Pricing basis:{" "}
            {value.pricingBasis === "preseason"
              ? "preseason — trailing production and draft pedigree, before in-season games accumulate"
              : "in-season"}
            . Market computed {fmtComputedAt(value.computedAt)} UTC. Players
            with no league market footprint are unpriced: they count toward
            neither the total nor the priced count.
          </p>
        </>
      )}
    </Card>
  );
}

function ValueRow({
  row,
  viewerTeamId,
}: {
  row: TableValueRow;
  viewerTeamId: string | null;
}) {
  const isViewer = viewerTeamId !== null && row.team.id === viewerTeamId;
  const isLeader = row.rank === 1 && row.totalValue !== null;
  return (
    <Link
      href={`/teams/${row.team.id}`}
      role="row"
      aria-label={`View ${row.team.name}`}
      className={`${styles.row} ${styles.valueGrid} ${isViewer ? styles.viewer : ""} ${isLeader ? styles.leader : ""}`}
    >
      <span role="cell" className={styles.rank}>{row.rank}</span>
      <span role="cell" className={styles.team}>
        <TeamAvatar name={row.team.name} avatar={row.team.avatar} />
        <span className={styles.teamText}>
          <span
            className={`${styles.name} ${isLeader ? styles.leaderName : ""}`}
            style={
              isLeader
                ? { boxShadow: `inset 0 -0.22em 0 ${teamColorVar(row.team.id)}` }
                : undefined
            }
          >
            {row.team.name}
            {isViewer && <span className={styles.you}>You</span>}
          </span>
          <span className={styles.manager}>{row.team.managerName}</span>
        </span>
      </span>
      <span role="cell" className={`${styles.num} gh-num`} data-label="Total">
        {row.totalValue !== null ? fmtMoney(row.totalValue) : "—"}
      </span>
      <span role="cell" className={`${styles.num} gh-num`} data-label="Priced">
        {row.pricedPlayers} of {row.rosterPlayers}
      </span>
    </Link>
  );
}

function PowerPanel() {
  return (
    <Card>
      <SectionHeading eyebrow="The Table · Power" title="Power movement" />
      <p className={styles.empty}>
        Power movement compares this week&rsquo;s table with last week&rsquo;s
        saved table. No two weekly snapshots exist yet, so there is no honest
        movement to show — this lens opens once weekly tables have been saved
        for two straight weeks. No placeholder arrows in the meantime.
      </p>
      <p className={styles.footnote}>
        Source: saved weekly tables. None have been recorded yet.
      </p>
    </Card>
  );
}

function ArcadePanel() {
  return (
    <Card>
      <SectionHeading eyebrow="The Table · Arcade" title="Arcade points" />
      <p className={styles.empty}>
        Arcade points arrive with the arcade season structure — the daily
        free-throw streak, the weekly 82-0 board, Priced In, and You vs The
        Model. Until scoring exists, this lens stays empty: practice games
        don&rsquo;t post to The Table.
      </p>
      <p className={styles.footnote}>
        Source: arcade scoring (issue #185). Not live yet.
      </p>
    </Card>
  );
}

/**
 * the-table — "Where does everyone stand?" (issue #184)
 *
 * One leaderboard with four lenses over the same ten teams. Receives
 * TheTableData (League + Value lenses) and the signed-in viewer's team id
 * as props from the /table page; never fetches. Power and Arcade render
 * honest unavailable states until weekly table snapshots and arcade
 * scoring exist. The viewer's row is highlighted in place and pinned in a
 * strip above the board; signed-out visitors get the plain table.
 * Lens switching is local state with a short ease-out panel transition,
 * disabled under prefers-reduced-motion.
 */
export function TheTable({
  data,
  viewerTeamId,
}: {
  data: TheTableData;
  /** The signed-in manager's roster id, or null when signed out. */
  viewerTeamId: string | null;
}) {
  const [lens, setLens] = useState<Lens>("league");

  const onTabKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    const tabs = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]')
    );
    const current = tabs.findIndex((t) => t.getAttribute("aria-selected") === "true");
    const next =
      event.key === "ArrowRight"
        ? (current + 1) % tabs.length
        : (current - 1 + tabs.length) % tabs.length;
    tabs[next]?.focus();
    setLens(LENSES[next].id);
  };

  return (
    <div className={styles.wrap}>
      <SectionHeading
        level={1}
        eyebrow="League tools"
        title="The Table"
        action={
          data.season ? (
            <span className={styles.seasonLine}>
              {data.season.leagueName} · {data.season.seasonYear} ·{" "}
              {formatSeasonStatus(data.season.status)}
            </span>
          ) : undefined
        }
      />
      <p className={styles.intro}>
        One board, four lenses — the standings, the money, the movement, and
        the games. Every lens names its source; a lens with nothing honest to
        show says so instead of inventing numbers.
      </p>
      <div
        className={styles.tabs}
        role="tablist"
        aria-label="Leaderboard lens"
        onKeyDown={onTabKeyDown}
      >
        {LENSES.map((l) => (
          <button
            key={l.id}
            type="button"
            role="tab"
            id={`table-tab-${l.id}`}
            aria-selected={lens === l.id}
            aria-controls={`table-panel-${l.id}`}
            tabIndex={lens === l.id ? 0 : -1}
            className={`${styles.tab} ${lens === l.id ? styles.tabActive : ""}`}
            onClick={() => setLens(l.id)}
          >
            {l.label}
          </button>
        ))}
      </div>
      <div
        key={lens}
        role="tabpanel"
        id={`table-panel-${lens}`}
        aria-labelledby={`table-tab-${lens}`}
        className={styles.panel}
      >
        {lens === "league" && <LeaguePanel data={data} viewerTeamId={viewerTeamId} />}
        {lens === "value" && <ValuePanel data={data} viewerTeamId={viewerTeamId} />}
        {lens === "power" && <PowerPanel />}
        {lens === "arcade" && <ArcadePanel />}
      </div>
    </div>
  );
}
