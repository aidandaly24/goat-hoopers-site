"use client";

import { useState } from "react";
import Link from "next/link";
import type { Standing } from "@/domain";
import { Card } from "@/ui/Card";
import { SectionHeading } from "@/ui/SectionHeading";
import { TeamAvatar } from "@/ui/TeamAvatar";
import styles from "./StandingsTable.module.css";
import { nextSort, sortStandings, standingInitialDirection, type StandingSortKey, type SortOrder } from "./homepageSorting";

function fmtPoints(p: number): string {
  return Number.isFinite(p) ? (p / 100).toFixed(1) : "—";
}
const fmtCount = (value: number) => Number.isFinite(value) ? value : "—";

const columns: { key: StandingSortKey; label: string; short: string }[] = [
  { key: "rank", label: "Rank", short: "#" },
  { key: "team", label: "Team", short: "Team" },
  { key: "wins", label: "Wins", short: "W" },
  { key: "losses", label: "Losses", short: "L" },
  { key: "points", label: "Points for", short: "PF" },
];

/** Sort only supplied standings. Displayed ranks always remain the league's ranks. */
export function StandingsTable({ standings }: { standings: Standing[] }) {
  const [order, setOrder] = useState<SortOrder<StandingSortKey>>({ key: "rank", direction: "asc" });
  const sorted = sortStandings(standings, order);
  return (
    <Card>
      <SectionHeading eyebrow="League table" title="Standings" />
      <div className={styles.table} role="table" aria-label="League standings">
        <div className={styles.head} role="row">
          {columns.map(({ key, label, short }) => (
            <span key={key} role="columnheader" aria-sort={order.key === key ? order.direction === "asc" ? "ascending" : "descending" : "none"}>
              <button
                type="button"
                className={styles.sort}
                aria-label={`${label}: sort ${nextSort(order, key, standingInitialDirection(key)).direction === "asc" ? "ascending" : "descending"}`}
                onClick={() => setOrder((current) => nextSort(current, key, standingInitialDirection(key)))}
              >
                <span className={styles.short}>{short}</span>
                <span className={styles.full}>{label}</span>
                <span aria-hidden="true">{order.key === key ? order.direction === "asc" ? "↑" : "↓" : "↕"}</span>
              </button>
            </span>
          ))}
        </div>
        {sorted.map((s) => (
          <Link
            key={s.team.id}
            href={`/teams/${s.team.id}`}
            className={styles.row}
            role="row"
            aria-label={`View ${s.team.name}`}
          >
            <span
              role="cell"
              className={`${styles.rank} ${
                s.rank === 1
                  ? styles.medal1
                  : s.rank === 2
                    ? styles.medal2
                    : s.rank === 3
                      ? styles.medal3
                      : ""
              }`}
            >
              {fmtCount(s.rank)}
            </span>
            <span role="cell" className={styles.team}>
              <TeamAvatar name={s.team.name} avatar={s.team.avatar} />
              <span>
                <span className={styles.name}>{s.team.name}</span>
                <span className={styles.manager}>{s.team.managerName}</span>
              </span>
            </span>
            <span role="cell" className={`${styles.num} ${styles.w} gh-num`} data-label="W">{fmtCount(s.wins)}</span>
            <span role="cell" className={`${styles.num} ${styles.l} gh-num`} data-label="L">{fmtCount(s.losses)}</span>
            <span role="cell" className={`${styles.num} ${styles.pf} gh-num`} data-label="PF">{fmtPoints(s.pointsFor)}</span>
          </Link>
        ))}
      </div>
      <p className={styles.status} role="status">
        Sorted by {columns.find((column) => column.key === order.key)!.label.toLowerCase()}, {order.direction === "asc" ? "ascending" : "descending"}. Select again to reverse.
      </p>
    </Card>
  );
}
