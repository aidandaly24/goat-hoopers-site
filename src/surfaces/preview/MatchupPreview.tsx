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

function PreviewCard({ preview }: { preview: MatchupPreview }) {
  const { matchup, projectedHome, projectedAway, homeWinPct, pick } =
    preview;
  const homePct = Math.round(homeWinPct * 100);
  const week = matchup.week;

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
    <li className={styles.card}>
      <div className={styles.head}>
        <span className={styles.week}>Week {week}</span>
        <Badge tone="gold">Model pick: {pick.name}</Badge>
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
          VS
        </span>
        {side(
          matchup.away.id,
          matchup.away.name,
          matchup.away.avatar,
          `${matchup.away.wins}–${matchup.away.losses}`,
          100 - homePct,
          "right"
        )}
      </div>
      <div className={styles.bar} aria-hidden="true">
        <span className={styles.fill} style={{ width: `${homePct}%` }} />
      </div>
      <p className={styles.projection}>
        Projected {fmtPts(projectedHome)} — {fmtPts(projectedAway)} · a
        projection, not a lock
      </p>
    </li>
  );
}

/**
 * preview — this week's head-to-heads with projections and a model pick.
 *
 * Self-contained for homepage embedding: receives `previews`
 * (MatchupPreview[] | null) and renders. The projection model is
 * documented in src/domain/matchup-preview.ts; math in
 * src/data/analytics.ts. Null = preseason, honest empty state.
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
        title={week ? `Week ${week} Preview` : "Matchup Preview"}
      />
      {previews === null || previews.length === 0 ? (
        <p className={styles.empty}>
          No matchups to preview yet — the schedule drops when the season
          tips off.
        </p>
      ) : (
        <ul className={styles.list}>
          {previews.map((p) => (
            <PreviewCard
              key={`${p.matchup.week}-${p.matchup.home.id}`}
              preview={p}
            />
          ))}
        </ul>
      )}
    </Card>
  );
}
