import Link from "next/link";
import type { LeagueStats, MatchupHighlight, StatLeader, StreakInfo } from "@/domain";
import styles from "./Spotlight.module.css";

function fmtMargin(m: number): string {
  return `+${m.toFixed(1)}`;
}

/** One spotlight story — a lead item with a huge number, a kicker,
 * and the team. Editorial, not a stat cell. */
function Story({
  kicker,
  value,
  teamId,
  teamName,
  note,
}: {
  kicker: string;
  value: string;
  teamId: string;
  teamName: string;
  note: string;
}) {
  return (
    <article className={styles.story}>
      <p className={styles.kicker}>{kicker}</p>
      <p className={styles.value}>{value}</p>
      <Link href={`/teams/${teamId}`} className={styles.team}>
        {teamName}
      </Link>
      <p className={styles.note}>{note}</p>
    </article>
  );
}

function BlowoutStory({ highlight }: { highlight: MatchupHighlight }) {
  const { matchup: m, margin } = highlight;
  const homeWon = (m.homePoints as number) >= (m.awayPoints as number);
  const winner = homeWon ? m.home : m.away;
  const loser = homeWon ? m.away : m.home;
  return (
    <article className={styles.story}>
      <p className={styles.kicker}>Biggest blowout · Week {m.week}</p>
      <p className={styles.value}>{fmtMargin(margin)}</p>
      <p className={styles.scoreline}>
        <Link href={`/teams/${winner.id}`}>{winner.name}</Link>
        <span className={styles.vs}> over </span>
        <Link href={`/teams/${loser.id}`}>{loser.name}</Link>
      </p>
      <p className={styles.note}>A demolition. The rest of the league took notes.</p>
    </article>
  );
}

function PointsStory({ leader }: { leader: StatLeader }) {
  return (
    <Story
      kicker="Points leader"
      value={leader.displayValue}
      teamId={leader.team.id}
      teamName={leader.team.name}
      note="The team to beat. Everyone's chasing this number."
    />
  );
}

function StreakStory({ streak }: { streak: StreakInfo }) {
  return (
    <Story
      kicker="Hottest team"
      value={`${streak.wins}W`}
      teamId={streak.team.id}
      teamName={streak.team.name}
      note={
        streak.wins >= 3
          ? "On an absolute tear. Someone stop them."
          : "Winners of their last outing. Momentum's a thing."
      }
    />
  );
}

/**
 * Spotlight — the home page's lead stories.
 *
 * Three editorial modules: points leader, hottest team, biggest blowout.
 * Set like newspaper leads — huge condensed numbers, serif kickers —
 * not stat-grid cells. In the preseason (null data) each renders an
 * honest, designed empty state: the desk is set, the season hasn't
 * started.
 */
export function Spotlight({ stats }: { stats: LeagueStats }) {
  const stories: React.ReactNode[] = [];
  if (stats.pointsForLeader) stories.push(<PointsStory key="pf" leader={stats.pointsForLeader} />);
  if (stats.longestWinStreak) stories.push(<StreakStory key="streak" streak={stats.longestWinStreak} />);
  if (stats.biggestBlowout) stories.push(<BlowoutStory key="blowout" highlight={stats.biggestBlowout} />);

  return (
    <section className={styles.spotlight} aria-label="League leaders">
      <div className={styles.head}>
        <p className={styles.sectionKicker}>The lead stories</p>
        <h2 className={styles.sectionTitle}>League leaders</h2>
      </div>
      {stories.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyKicker}>Preseason</p>
          <p className={styles.emptyTitle}>The desk is set.</p>
          <p className={styles.emptyNote}>
            Points leaders, hot streaks, and blowouts will live here once
            the season tips off. Check back after Week 1.
          </p>
        </div>
      ) : (
        <div className={styles.grid}>{stories}</div>
      )}
    </section>
  );
}
