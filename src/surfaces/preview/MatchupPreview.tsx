import Link from "next/link";
import type { MatchupPreview } from "@/domain";
import { Badge } from "@/ui/Badge";
import { Card } from "@/ui/Card";
import { SectionHeading } from "@/ui/SectionHeading";
import { TeamAvatar } from "@/ui/TeamAvatar";
import styles from "./MatchupPreview.module.css";

function fmtPts(p: number): string {
  return (p / 100).toFixed(1);
}

type Storyline = {
  label: string;
  tone: "gold" | undefined;
};

/** Data-driven storylines: game of the week, shootout, mismatch. */
function storylineFor(
  preview: MatchupPreview,
  all: MatchupPreview[]
): Storyline | null {
  const margin = Math.abs(preview.projectedHome - preview.projectedAway);
  const total = preview.projectedHome + preview.projectedAway;
  const margins = all.map((p) => Math.abs(p.projectedHome - p.projectedAway));
  const totals = all.map((p) => p.projectedHome + p.projectedAway);
  if (margin === Math.min(...margins) && all.length > 1)
    return { label: "Game of the week", tone: "gold" };
  if (total === Math.max(...totals) && all.length > 1)
    return { label: "Shootout alert", tone: undefined };
  if (margin === Math.max(...margins) && all.length > 1)
    return { label: "Mismatch", tone: undefined };
  return null;
}

function PreviewCard({
  preview,
  all,
}: {
  preview: MatchupPreview;
  all: MatchupPreview[];
}) {
  const { matchup, projectedHome, projectedAway, homeWinPct, pick } = preview;
  const homePct = Math.round(homeWinPct * 100);
  const awayPct = 100 - homePct;
  const story = storylineFor(preview, all);

  const side = (
    teamId: string,
    name: string,
    avatar: string | null,
    record: string,
    pct: number,
    align: "left" | "right"
  ) => (
    <Link
      href={`/teams/${teamId}`}
      className={`${styles.side} ${align === "right" ? styles.right : ""}`}
    >
      <TeamAvatar name={name} avatar={avatar} />
      <span className={styles.sideText}>
        <span className={styles.sideName}>{name}</span>
        <span className={styles.sideRecord}>{record}</span>
      </span>
      <span className={styles.sidePct}>{pct}%</span>
    </Link>
  );

  return (
    <li className={`${styles.card} ${story?.tone === "gold" ? styles.gameOfWeek : ""}`}>
      <div className={styles.head}>
        <span className={styles.week}>Week {matchup.week}</span>
        <span className={styles.badges}>
          {story && <Badge tone={story.tone}>{story.label}</Badge>}
          <Badge>Model: {pick.name}</Badge>
        </span>
      </div>
      <div className={styles.vs}>
        {side(
          matchup.home.id,
          matchup.home.name,
          matchup.home.avatar,
          `${matchup.home.wins}–${matchup.home.losses}`,
          homePct,
          "left"
        )}
        <span className={styles.vsBadge} aria-hidden="true">
          vs
        </span>
        {side(
          matchup.away.id,
          matchup.away.name,
          matchup.away.avatar,
          `${matchup.away.wins}–${matchup.away.losses}`,
          awayPct,
          "right"
        )}
      </div>
      {/* Tug-of-war probability bar */}
      <div
        className={styles.bar}
        role="img"
        aria-label={`${matchup.home.name} ${homePct} percent, ${matchup.away.name} ${awayPct} percent`}
      >
        <span className={styles.fillHome} style={{ width: `${homePct}%` }} />
        <span className={styles.fillAway} style={{ width: `${awayPct}%` }} />
        <span className={styles.midline} aria-hidden="true" />
      </div>
      <p className={styles.projection}>
        Projected <span className="gh-num">{fmtPts(projectedHome)}</span> —{" "}
        <span className="gh-num">{fmtPts(projectedAway)}</span>
        <span className={styles.caveat}> · a projection, not a lock</span>
      </p>
    </li>
  );
}

/**
 * preview — this week's head-to-heads with projections, storylines,
 * and a model pick.
 *
 * Richer than win%: each card carries a data-driven storyline (game of
 * the week, shootout alert, mismatch) and a tug-of-war probability bar.
 * Self-contained for homepage embedding. Null = preseason.
 */
export function MatchupPreview({
  previews,
}: {
  /** From getMatchupPreviews(). Null before the season tips off. */
  previews: MatchupPreview[] | null;
}) {
  const week = previews?.[0]?.matchup.week;
  return (
    <Card>
      <SectionHeading
        eyebrow="This week"
        title={week ? `Week ${week} preview` : "Matchup preview"}
      />
      {previews === null || previews.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>No lines yet.</p>
          <p className={styles.emptyNote}>
            Matchup previews drop with the schedule — projections, picks,
            and the game of the week, every week.
          </p>
        </div>
      ) : (
        <ul className={styles.list}>
          {previews.map((p) => (
            <PreviewCard
              key={`${p.matchup.week}-${p.matchup.home.id}`}
              preview={p}
              all={previews}
            />
          ))}
        </ul>
      )}
    </Card>
  );
}
