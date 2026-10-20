import Link from "next/link";
import type { WeeklyEdition } from "@/domain/weekly-spotlight";
import { SectionHeading } from "@/ui/SectionHeading";
import { cs } from "./CourtsideStyles";
import { EditorialPortrait } from "./EditorialPortrait";
import styles from "./StudChud.module.css";

type Spotlight = WeeklyEdition["playerSpotlights"][number];

/**
 * Last season's notebook: the edition's player-of-week and underperformer
 * spotlights as compact STUD and CHUD panels with unframed portraits,
 * period subtitles small, every number
 * the spotlight's own sourced stat line. These are the edition's editorial
 * picks grounded in their cited sources, never computed award winners:
 * each panel carries its source and a "why this pick" disclosure with the
 * full selection reason. A role the edition doesn't support doesn't
 * render.
 */
function StudChudPanel({ player, word, portraits }: {
  player: Spotlight;
  word: "STUD" | "CHUD";
  portraits: Record<string, string>;
}) {
  return (
    <article className={styles.panel} data-studchud={word.toLowerCase()}>
      <div className={styles.art} aria-hidden="true">
        <p className={styles.word}>{word}</p>
        <EditorialPortrait name={player.name} espnId={null} portraitSrc={portraits[player.playerId]} size={160} />
      </div>
      <div className={styles.body}>
      <p className={styles.period}>{player.periodLabel}</p>
      <h3 className={styles.name}>
        <Link href={`/player/${player.playerId}`} prefetch={false}>{player.name}</Link>
      </h3>
      <dl className={styles.stats}>
        {player.stats.map((stat) => (
          <div key={stat.label}>
            <dt>{stat.label}</dt>
            <dd>{stat.value}</dd>
          </div>
        ))}
      </dl>
      <p className={styles.source}>{player.statPeriod}</p>
      <p className={styles.source}>
        <a href={player.source.url} target="_blank" rel="noreferrer">Source: {player.source.label}</a>
        <span className={cs("caption")}> · checked {player.source.checkedAt}</span>
      </p>
      <details className={styles.details}>
        <summary>Why this pick</summary>
        <p><strong>{player.headline}</strong></p>
        <p>{player.opinion}</p>
        <p className={cs("caption")}>{player.selectionReason}</p>
      </details>
      </div>
    </article>
  );
}

export function StudChud({ edition, portraits }: {
  edition: WeeklyEdition;
  portraits: Record<string, string>;
}) {
  const stud = edition.playerSpotlights.find((player) => player.role === "player-of-week");
  const chud = edition.playerSpotlights.find((player) => player.role === "underperformer");
  if (!stud && !chud) return null;
  return (
    <section className={cs("studchud")} data-stud-chud aria-label="Player spotlights">
      <SectionHeading eyebrow="Editorial notes" title="Player spotlights." />
      <div className={styles.layout}>
        {stud && <StudChudPanel player={stud} word="STUD" portraits={portraits} />}
        {chud && <StudChudPanel player={chud} word="CHUD" portraits={portraits} />}
      </div>
      <p className={cs("caption", "notebook-foot")}>
        {edition.status === "draft" ? "Sample editorial" : `${edition.dateLabel} edition · editorial picks`}. Source periods and selection notes are shown for each player.
      </p>
    </section>
  );
}
