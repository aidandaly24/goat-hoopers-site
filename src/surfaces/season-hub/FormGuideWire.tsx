import Link from "next/link";
import type { HomeTeamSummary } from "@/domain/personalized-home";
import type { GuideRow } from "@/domain/team-player-guide";
import { PlayerHeadshot } from "@/ui/PlayerHeadshot";
import { SectionHeading } from "@/ui/SectionHeading";
import { cs } from "./CourtsideStyles";
import { formatHomeStamp } from "./homeFormat";
import styles from "./FormGuideWire.module.css";

/**
 * What happened for my players? Only verified completed-week rows supply
 * points/GP. Small cohorts appear once; larger cohorts show highest and
 * lowest totals, without inferring underperformance from playing volume.
 * Preseason/missing evidence gets a compact status instead of an empty
 * results column. Narrow layouts retain source periods and every real
 * headline/move. Player profiles and the transaction wire remain actions.
 */
export function FormGuideWire({ summary, portraits }: {
  summary: HomeTeamSummary;
  portraits: Record<string, string>;
}) {
  const guide = summary.playerGuide;
  const hasRecap = guide.best.length > 0;
  const hasNews = summary.news.length > 0;
  const hasMoves = summary.moves.length > 0;
  const hasWire = hasNews || hasMoves || !summary.newsAvailable;
  const smallCohort = guide.eligiblePlayed < 6;
  const sharedExtremes = guide.best.some(row => guide.rough.some(other => other.id === row.id));
  const combinedCohort = smallCohort || sharedExtremes;
  const cohort = combinedCohort ? [...new Map([...guide.best, ...guide.rough].map(row => [row.id, row])).values()]
    .sort((a, b) => b.value - a.value || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)) : [];

  const guideRow = (row: GuideRow, value: string, note: string | null) => (
    <li key={row.id} className={styles.performer} data-recap-player={row.id}>
      <PlayerHeadshot portraitSrc={portraits[row.id]} espnId={row.espnId} name={row.name} teamId={summary.team.id} size={44} />
      <span className={styles.player}>
        <Link href={`/player/${row.id}`} prefetch={false}>{row.name}</Link>
        <strong className="gh-num">{value}</strong>
        {note && <span className={cs("riser-note")}>{note}</span>}
      </span>
    </li>
  );
  const recapValue = (row: GuideRow) => `${row.value.toFixed(1)} pts${row.games !== null ? ` · ${row.games} GP` : ""}`;

  return (
    <section className={`${styles.layout} ${hasRecap && hasWire ? styles.withWire : ""}`} data-form-wire aria-label="Your form guide and team wire">
      {hasRecap ? (
        <div className={styles.guide}>
          <SectionHeading eyebrow="Your form guide" title="Weekly performers." />
          <div data-guide-recap>
            {combinedCohort ? (
              <div data-guide-cohort>
                <p className={cs("recap-label")}>{smallCohort ? "Recorded performers" : "Highest / lowest totals · ties"} · Week {guide.previousWeek}</p>
                <ol className={cs("riser-rows")}>
                  {cohort.map(row => guideRow(row, recapValue(row), row.note || null))}
                </ol>
              </div>
            ) : <div className={styles.groups}>
              <div>
                <p className={cs("recap-label")}>Highest totals · Week {guide.previousWeek}</p>
                <ol className={cs("riser-rows")}>
                  {guide.best.map((row) => guideRow(row, recapValue(row), row.note || null))}
                </ol>
              </div>
              <div>
                <p className={cs("recap-label")}>Lowest totals · Week {guide.previousWeek}</p>
                <ol className={cs("riser-rows")}>
                  {guide.rough.map((row) => guideRow(row, recapValue(row), row.note || null))}
                </ol>
              </div>
            </div>}
            <p className={cs("caption")}>{guide.period} — {guide.recapMessage}</p>
            <p className={cs("caption")}>{smallCohort && cohort.length === guide.eligiblePlayed
              ? `${guide.eligiblePlayed} current roster players have verified games; each appears once. DNP, no-game and unknown records are excluded.`
              : sharedExtremes
                ? `${cohort.length} distinct players shown from ${guide.eligiblePlayed} with verified games. Tied totals share the highest and lowest selections; each selected player appears once.`
                : guide.coverage}</p>
            <p className={cs("caption")}>Compare totals alongside games played; fewer games can mean fewer points.</p>
          </div>
        </div>
      ) : (
        <p className={styles.status} data-guide-recap-status>
          <strong>Your form guide</strong> · {guide.period} · {guide.recapMessage}
        </p>
      )}
      {hasWire && <div className={styles.wire} data-team-news>
        <SectionHeading
          eyebrow="Your team wire"
          title="News & recent moves."
          action={<Link className={cs("text-link")} href="/transactions" prefetch={false}>Full transaction wire</Link>}
        />
        {hasNews ? (
          <ul className={cs("team-news-list")}>
            {summary.news.slice(0, 3).map((item) => (
              <li key={item.id}>
                <a href={item.url} target="_blank" rel="noreferrer">{item.headline}</a>
                <span className={cs("caption")}>{item.outlet.name} · {formatHomeStamp(item.publishedAt)}</span>
              </li>
            ))}
          </ul>
        ) : !summary.newsAvailable ? (
          <p className={cs("caption")} data-team-news="unavailable">Team news is temporarily unavailable.</p>
        ) : null}
        {hasMoves && (
          <ul className={cs("team-moves-list")}>
            {summary.moves.slice(0, 3).map((move) => (
              <li key={move.id}>
                <span>{move.summary}</span>
                <span className={cs("caption")}>{formatHomeStamp(move.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>}
    </section>
  );
}
