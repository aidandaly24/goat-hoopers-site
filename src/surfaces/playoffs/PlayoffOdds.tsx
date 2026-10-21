import Link from "next/link";
import type { DataToolsState, PlayoffOdds } from "@/domain";
import { Card } from "@/ui/Card";
import { SectionHeading } from "@/ui/SectionHeading";
import { TeamAvatar } from "@/ui/TeamAvatar";
import styles from "./PlayoffOdds.module.css";

/**
 * playoffs — simulated postseason chances.
 *
 * Self-contained for homepage embedding: receives `odds`
 * (PlayoffOdds[] | null) and renders. The Monte Carlo model is documented
 * in src/domain/playoff-odds.ts; the math in src/data/analytics.ts.
 * Null = no completed-week evidence yet, rendered as an honest empty state.
 */
export function PlayoffOdds({
  odds,
  championTeamId,
  dataState,
}: {
  /** From getPlayoffOdds(). Null when it has no data — before
   * tip-off, before any week closes, or when its feed failed. */
  odds: PlayoffOdds[] | null;
  /** Reigning champion's roster id — from reigningChampionRosterId (previous-season finish). */
  championTeamId?: string | null;
  /** From getDataToolsState(): the PROVEN reason odds may be null.
   * The empty state describes only that world; omitted =
   * "unavailable", the claim-free default. */
  dataState?: DataToolsState;
}) {
  return (
    <Card>
      <SectionHeading eyebrow="The crystal ball" title="Playoff Odds" />
      {odds === null || odds.length === 0 ? (
        <p className={styles.empty}>
          {dataState === "pre-tipoff"
            ? "Odds go live when games do — simulating a season with no data is just arithmetic wearing a costume."
            : dataState === "no-closed-week"
              ? "No odds yet — the simulation runs on completed finals, and no week has closed yet. Anything sooner is just arithmetic wearing a costume."
              : "Odds are unavailable right now — the data feed did not answer, and simulating missing data is just arithmetic wearing a costume."}
        </p>
      ) : (
        <>
          <ol className={styles.list}>
            {odds.map((o) => (
              <li key={o.team.id} className={styles.row}>
                <TeamAvatar name={o.team.name} avatar={o.team.avatar} isChampion={o.team.id === championTeamId} />
                <Link href={`/teams/${o.team.id}`} className={styles.name}>
                  {o.team.name}
                </Link>
                <span className={styles.bar} aria-hidden="true">
                  <span
                    className={styles.fill}
                    style={{ width: `${Math.round(o.makePlayoffPct * 100)}%` }}
                  />
                </span>
                <span className={styles.pct}>
                  {(o.makePlayoffPct * 100).toFixed(0)}%
                </span>
                <span className={styles.exp}>
                  {o.expectedWins.toFixed(1)} exp. wins
                </span>
              </li>
            ))}
          </ol>
          <p className={styles.note}>
            10,000 simulated seasons · Elo-based · ties break on points for
          </p>
        </>
      )}
    </Card>
  );
}
