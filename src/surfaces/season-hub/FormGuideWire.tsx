import Link from "next/link";
import type { HomeTeamSummary } from "@/domain/personalized-home";
import type { GuideRow } from "@/domain/team-player-guide";
import { PlayerHeadshot } from "@/ui/PlayerHeadshot";
import { SectionHeading } from "@/ui/SectionHeading";
import { cs } from "./CourtsideStyles";
import { formatHomeStamp } from "./homeFormat";

/**
 * The member's two-column form guide + team wire. The form guide prints
 * Best & rough week ONLY from the guide's verified completed-week rows
 * (players who actually played; absence is never scored as zero) — before
 * any completed week it says exactly that, and carries the watchlist basis
 * disclosure instead of an invented ranking. The wire pairs the team's
 * real news headlines with its own recent moves from the league check.
 * A column with nothing true to show renders its honest status line, and
 * the section disappears only when both are empty and available.
 */
export function FormGuideWire({ summary, portraits }: {
  summary: HomeTeamSummary;
  portraits: Record<string, string>;
}) {
  const guide = summary.playerGuide;
  const watch = guide.watch;
  const hasRecap = guide.best.length > 0;
  const hasNews = summary.news.length > 0;
  const hasMoves = summary.moves.length > 0;
  if (!hasRecap && !hasNews && !hasMoves && summary.newsAvailable && watch.basis === "unavailable") return null;

  const designationNote = (row: GuideRow) => row.note.startsWith("Status: ") ? row.note : null;
  const guideRow = (row: GuideRow, value: string, note: string | null) => (
    <li key={row.id} className={cs("riser-row")}>
      <PlayerHeadshot portraitSrc={portraits[row.id]} espnId={row.espnId} name={row.name} teamId={summary.team.id} size={44} />
      <span className={cs("riser-main")}>
        <Link href={`/player/${row.id}`} prefetch={false}>{row.name}</Link>
        {note && <span className={cs("riser-note")}>{note}</span>}
      </span>
      <strong className="gh-num">{value}</strong>
    </li>
  );
  const recapValue = (row: GuideRow) => `${row.value.toFixed(1)} pts${row.games !== null ? ` · ${row.games} GP` : ""}`;

  return (
    <section className={cs("form-wire")} data-form-wire aria-label="Your form guide and team wire">
      <div className={cs("form-guide")}>
        <SectionHeading eyebrow="Your form guide" title="Best & rough week." />
        {hasRecap ? (
          <div data-guide-recap>
            <div className={cs("recap-groups")}>
              <div>
                <p className={cs("recap-label")}>Your best · Week {guide.previousWeek}</p>
                <ol className={cs("riser-rows")}>
                  {guide.best.map((row) => guideRow(row, recapValue(row), row.note || null))}
                </ol>
              </div>
              <div>
                <p className={cs("recap-label")}>The rough week</p>
                <ol className={cs("riser-rows")}>
                  {guide.rough.map((row) => guideRow(row, recapValue(row), row.note || null))}
                </ol>
              </div>
            </div>
            <p className={cs("caption")}>{guide.period} — {guide.recapMessage}</p>
            <p className={cs("caption")}>{guide.coverage}</p>
          </div>
        ) : (
          <>
            <p className={cs("form-status")} data-guide-recap-status>
              {guide.period} · {guide.recapMessage}
            </p>
            {watch.basis !== "unavailable" && !!watch.rows.length && (
              <details className={cs("watchlist-basis")}>
                <summary>Watchlist basis</summary>
                <p className={cs("caption")}>{watch.label} — {watch.message}</p>
                <ol className={cs("riser-rows")}>
                  {watch.rows.map((row) => guideRow(
                    row,
                    watch.basis === "market" ? `Up ${row.value.toFixed(1)}%` : `${row.value.toFixed(1)} FPPG${row.games !== null ? ` · ${row.games} GP` : ""}`,
                    designationNote(row),
                  ))}
                </ol>
              </details>
            )}
          </>
        )}
      </div>
      <div className={cs("team-wire")} data-team-news>
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
        {!hasNews && summary.newsAvailable && !hasMoves && (
          <p className={cs("caption")}>No headlines or moves for your team in the current league check.</p>
        )}
      </div>
    </section>
  );
}
