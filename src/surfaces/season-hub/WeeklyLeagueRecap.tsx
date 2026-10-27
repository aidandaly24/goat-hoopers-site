import Link from "next/link";
import type { HomeWeeklyRecap, RecapPlayer, WeeklyRecapTeam } from "@/domain/home-weekly-recap";
import { SectionHeading } from "@/ui/SectionHeading";
import { TeamAvatar } from "@/ui/TeamAvatar";
import styles from "./WeeklyLeagueRecap.module.css";

const points = (value: number) => value.toFixed(1);

/** Who delivered last week? Expand a team to inspect all counted starters.
 * States: official totals; exact/estimated/unavailable players; missing period.
 * Narrow: wrapping rows, native disclosures. No inferred ownership or DNP verdict. */
function PlayerContribution({ player, value, estimated }: {
  player: RecapPlayer; value: number | null; estimated: boolean;
}) {
  return <li className={styles.player}>
    <div>
      <Link href={`/player/${player.id}`} prefetch={false}>{player.name}</Link>
      <span className={styles.note}>{player.gamesPlayed} GP this week · {value === null
        ? "No counted game; no points recorded"
        : player.locked ? "Locked game" : "Final played game"}
        {value !== null && player.gamesPlayed === 0 ? " · proven zero without an appearance" : ""}
        {player.gamesPlayed === 1 ? " · one-game sample" : ""}
      </span>
    </div>
    <span className={styles.score}>{value === null ? "Unavailable" : `${estimated ? "Est. " : ""}${points(value)} pts`}</span>
  </li>;
}

function TeamBreakdown({ team }: { team: WeeklyRecapTeam }) {
  const { breakdown } = team;
  return <details className={styles.team} data-weekly-team={team.id}>
    <summary>
      <span className={styles.identity}><TeamAvatar name={team.name} avatar={team.avatar} /><strong>{team.name}</strong></span>
      <span className={styles.total}><span className={styles.score}>{points(team.officialPoints)} pts</span><span className={styles.note}>Official team total</span></span>
      <span className={styles.status}>{breakdown.basis === "verified" ? "Exact player points" : breakdown.basis === "estimated" ? "Estimated player points" : "Player breakdown unavailable"}</span>
    </summary>
    <div className={styles.detail}>
      <Link className={styles.profile} href={`/teams/${team.id}`} prefetch={false}>View {team.name}</Link>
      {breakdown.basis === "unavailable" ? <p>Player contributions are not yet verified against this official total. No player points or performance verdict are inferred.</p> : <>
        {breakdown.basis === "estimated" ? <p data-estimate-disclosure>
          Box-score estimates sum to {points(breakdown.computedPoints)} pts, {points(breakdown.residual)} above the official total.
          Un-itemised technical/flagrant fouls may explain this gap; it cannot be assigned to individual players. Every player value below is an estimate.
        </p> : <p>Exact counted fantasy points, reconciled to the official team total.</p>}
        <p className={styles.note}>These are this team’s starters in the completed week. Names use current directory references; today’s roster may differ. GP counts all verified appearances that week; points come from one counted game per starter. No-game and missing points are not poor performance.</p>
        <ul className={styles.players}>
          {breakdown.basis === "verified"
            ? breakdown.players.map(player => <PlayerContribution key={player.id} player={player} value={player.fantasyPoints} estimated={false} />)
            : breakdown.players.map(player => <PlayerContribution key={player.id} player={player} value={player.estimatedPoints} estimated />)}
        </ul>
      </>}
    </div>
  </details>;
}

export function WeeklyLeagueRecap({ recap }: { recap: HomeWeeklyRecap }) {
  if (recap.status === "unavailable") return <section className={styles.section} data-weekly-recap="unavailable" aria-label="Completed-week league recap">
    <SectionHeading eyebrow="Completed-week recap" title="Last week around the league" />
    <p>{recap.message}</p>
  </section>;
  return <section className={styles.section} data-weekly-recap="available" aria-label={`Week ${recap.week} league recap`}>
    <SectionHeading eyebrow={`${recap.season} · Completed Week ${recap.week}`} title={`Week ${recap.week}, in the books.`} />
    <p className={styles.note}>{recap.startsAt} to {recap.endsAt} · end exclusive · UTC</p>
    {recap.totalsComplete ? <div className={styles.highlights}>
      {([['Stud', recap.studTeamIds, 'Highest'], ['Chud', recap.chudTeamIds, 'Lowest']] as const).map(([label, ids, extreme]) =>
        <div key={label} data-weekly-award={label.toLowerCase()}>
          <h3>{label}{ids.length > 1 ? ' · tied' : ''}</h3>
          <p className={styles.note}>{extreme} official team total</p>
          {ids.map(id => { const team = recap.teams.find(team => team.id === id)!; return <p key={id}>
            <Link href={`/teams/${id}`} prefetch={false}>{team.name}</Link>{' '}
            <span className={styles.score}>{points(team.officialPoints)} pts</span>
          </p>; })}
        </div>)}
    </div> : <p>Team-total coverage is partial. League Stud/Chud awaits all official totals.</p>}
    <p>Expand a team for its counted players and source coverage.</p>
    <div>{recap.teams.map(team => <TeamBreakdown key={team.id} team={team} />)}</div>
    <details className={styles.sources}>
      <summary>Recap sources & scoring</summary>
      <p>{recap.source}. Receipt generated <time dateTime={recap.generatedAt}>{recap.generatedAt}</time>.</p>
      <p>Team labels are current display names. Stud/Chud compares official totals, with ties shared; it is a completed-week result, not a Power projection. Exact player points reconcile with the official total. Estimates and unavailable breakdowns stay separate.</p>
    </details>
  </section>;
}
