import Link from "next/link";
import type { GuideRow, TeamPlayerGuide as Guide } from "@/domain/team-player-guide";
import { PlayerHeadshot } from "@/ui/PlayerHeadshot";
import styles from "./PersonalizedHome.module.css";

function Rows({ rows, basis, teamId, portraits }: { rows: GuideRow[]; basis: "market" | "form" | "points"; teamId: string; portraits: Record<string, string> }) {
  return <ol className={styles.guideRows}>{rows.map(row => <li key={row.id}>
    <PlayerHeadshot portraitSrc={portraits[row.id]} name={row.name} espnId={row.espnId} teamId={teamId} size={32} />
    <div><Link href={`/player/${row.id}`} prefetch={false}>{row.name}</Link>
      <p className={styles.caption}><strong className="gh-num">{basis === "market" ? `Up ${row.value.toFixed(1)}%` : `${row.value.toFixed(1)} ${basis === "form" ? "FPPG" : "fantasy pts"}`}</strong>{row.games !== null ? ` · ${row.games} observed game${row.games === 1 ? "" : "s"}` : ""}</p>
      <p className={styles.caption}>{row.note}</p>
    </div>
  </li>)}</ol>;
}

/** The viewer's form guide: actual period/basis only, no guessed participation. */
export function TeamPlayerGuide({ guide, teamId, portraits = {}, embedded = false }: { guide: Guide; teamId: string; portraits?: Record<string, string>; embedded?: boolean }) {
  const populated = guide.watch.rows.length > 0 || guide.best.length > 0 || guide.rough.length > 0;
  const content = <div className={styles.guideColumns}>
      <section aria-labelledby="watch-team-players"><h4 id="watch-team-players">Players to Watch · {guide.currentWeek ? `Week ${guide.currentWeek}` : "period unavailable"}</h4>
        <p className={styles.caption}>{guide.watch.label}</p>
        {!!guide.watch.rows.length && <Rows rows={guide.watch.rows} basis={guide.watch.basis === "form" ? "form" : "market"} teamId={teamId} portraits={portraits} />}
        <p className={styles.caption}>{guide.watch.message}</p>
        <p className={styles.caption}>Known Out, IR, Suspended, Doubtful and verified no-game players are omitted. Unknown availability stays labelled; no schedule forecast is implied.</p>
      </section>
      <section aria-labelledby="last-week-team-players"><h4 id="last-week-team-players">Last week’s performers</h4>
        <p className={styles.caption}>{guide.period}</p><p className={styles.caption}>{guide.recapMessage}</p>
        <h5>Your Best</h5>
        {guide.best.length ? <Rows rows={guide.best} basis="points" teamId={teamId} portraits={portraits} /> : <p className={styles.caption}>No verified weekly performance ranking available.</p>}
        <h5>The Rough Week</h5>
        <p className={styles.caption}>Lowest recorded fantasy points among players with verified games; game counts and supplied injury context remain visible.</p>
        {guide.rough.length ? <Rows rows={guide.rough} basis="points" teamId={teamId} portraits={portraits} /> : <p className={styles.caption}>No verified played games are available for a rough-week ranking.</p>}
        <p className={styles.caption}>{guide.coverage}</p>
      </section>
    </div>;
  return <section className={styles.formGuide} aria-labelledby={embedded ? undefined : "your-form-guide"} aria-label={embedded ? "Your form guide" : undefined} data-team-form-guide>
    {!embedded && <h3 id="your-form-guide">Your form guide</h3>}
    {embedded ? <>
      {!!guide.watch.rows.length && <section aria-label="Your players to watch"><h4>Players to Watch · {guide.currentWeek ? `Week ${guide.currentWeek}` : "period unavailable"}</h4><p className={styles.caption}>{guide.watch.label}</p><Rows rows={guide.watch.rows} basis={guide.watch.basis === "form" ? "form" : "market"} teamId={teamId} portraits={portraits} /></section>}
      <details className={styles.notes}><summary>{populated ? "Weekly recap & source coverage" : "Watch & weekly recap status"}</summary>{content}</details>
    </> : populated ? content : <>
      <p className={styles.caption}>Weekly player rankings are not available from verified participation and period data yet. No-game or missing records are not poor performances.</p>
      <details className={styles.notes}><summary>Watch & weekly recap status</summary>{content}</details>
    </>}
  </section>;
}
