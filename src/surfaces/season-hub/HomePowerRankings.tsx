import Link from "next/link";
import type { HomeLineupPower } from "@/domain/home-lineup-power";
import { lineupPowerRanks } from "@/domain/lineup-power";
import { SectionHeading } from "@/ui/SectionHeading";
import { TeamAvatar } from "@/ui/TeamAvatar";
import styles from "./HomePowerRankings.module.css";

/** Which legal starting lineups project strongest? Compare the projected week,
 * then open a team. Complete/partial/unavailable stay explicit; narrow rows wrap.
 * No standings/price substitute, projected game-volume multiplier or invented prior. */
export function HomePowerRankings({ data }: { data?: HomeLineupPower }) {
  if (!data || data.status === "unavailable") {
    return (
      <section className={styles.section} data-home-power="unavailable" aria-label="Lineup Power">
        <SectionHeading eyebrow="Next matchup week" title="Lineup Power" />
        <p>{data?.message ?? "Rankings unavailable. Verified projections for all 11 legal starting slots are not ready yet."}</p>
        <p className={styles.note}>One counted game per slot for the next matchup week. Rank movement will appear when a comparable prior snapshot exists.</p>
      </section>
    );
  }
  const { snapshot, context } = data;
  const ranks = lineupPowerRanks(snapshot);
  const identities = new Map(data.teams.map(team => [team.id, team]));
  const teams = [...snapshot.teams].sort((a, b) => {
    const aRank = ranks[a.rosterId], bRank = ranks[b.rosterId];
    return (aRank ?? Infinity) - (bRank ?? Infinity) || Number(a.rosterId) - Number(b.rosterId);
  });
  return <section className={styles.section} data-home-power="available" aria-label="Lineup Power">
    <SectionHeading eyebrow={`${context.season} · Projected Week ${snapshot.week}`} title="Lineup Power" />
    <p>One projected counted game per legal starter, under the league’s scoring. Tied totals share a rank.</p>
    {!teams.some(team => team.projectedCountedPoints !== null) && <p>No team has an evidenced 11-slot total. Every team remains unranked.</p>}
    <ul className={styles.rows} role="list" aria-label={`Projected Week ${snapshot.week} lineup Power`}>
      {teams.map(team => {
        const identity = identities.get(team.rosterId)!;
        const rank = ranks[team.rosterId];
        return <li className={styles.row} key={team.rosterId} data-power-team={team.rosterId} data-power-coverage={team.coverage}>
          <span className={styles.rank} aria-label={rank === null ? "Unranked" : `Power rank ${rank}`}>{rank ?? "—"}</span>
          <Link className={styles.identity} href={`/teams/${team.rosterId}`} prefetch={false}>
            <TeamAvatar name={identity.name} avatar={identity.avatar} /><strong>{identity.name}</strong>
          </Link>
          <div className={styles.total}>
            <span className={styles.points}>{team.projectedCountedPoints === null ? "Unavailable" : team.projectedCountedPoints.toFixed(2)}</span>
            {team.projectedCountedPoints !== null && <span className={styles.note}>projected pts</span>}
          </div>
          <p className={styles.coverage}>{team.coverage === "partial"
            ? `Partial evidence · 11/11 slots · includes ${context.priorStatsSeason} prior-season statistics`
            : team.coverage === "unavailable"
              ? `${team.slotsProjected}/11 slots evidenced · no total or rank inferred`
              : "Complete evidence · 11/11 slots · no prior-only projections"}</p>
        </li>;
      })}
    </ul>
    <p className={styles.note} data-power-movement="unavailable">Rank movement unavailable: no stored comparable prior snapshot.</p>
    <details className={styles.sources}>
      <summary>Power sources & coverage</summary>
      <p>Calculated <time dateTime={snapshot.asOf}>{snapshot.asOf}</time>. This is calculation time, not the provider’s statistics-update time.</p>
      <p>Source: Sleeper’s declared legal starting lineups and season statistics, scored with the league settings. Each of the 11 slots contributes one projected counted game at observed fantasy points per game; games are not multiplied into the projection. The live producer uses {context.season} statistics, falling back to {context.priorStatsSeason} when current-season evidence is missing.</p>
      <p>Lineups, league and season state use the existing five-minute cache; season statistics use the existing daily cache. Partial means a full 11-slot total includes prior-season-only evidence. Unavailable means the legal 11-slot total cannot be established. These are performance estimates; no prices, pick values or standings enter the ranking.</p>
      <p className={styles.note}>Source leg {context.sourceLeg}; explicit projected Week {snapshot.week}; horizon {snapshot.horizon}. Snapshot <code>{snapshot.snapshotId}</code>. No prior is stored or reconstructed for movement.</p>
    </details>
  </section>;
}
