/* eslint-disable @next/next/no-img-element -- Edition portraits resolve through the page's portrait map, served directly. */
import Link from "next/link";
import type { WeeklyEdition } from "@/domain/weekly-spotlight";
import { SectionHeading } from "@/ui/SectionHeading";
import { cs } from "./CourtsideStyles";

type Spotlight = WeeklyEdition["playerSpotlights"][number];

/**
 * Last season's notebook: the edition's player-of-week and underperformer
 * spotlights as STUD and CHUD panels — oversized outline type behind the
 * portrait for those two words ONLY, period subtitles small, every number
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
    <article className={cs("studchud-panel")} data-studchud={word.toLowerCase()}>
      <p className={cs("studchud-outline")} aria-hidden="true">{word}</p>
      <div className={cs("studchud-media")}>
        {portraits[player.playerId] ? (
          <img src={portraits[player.playerId]} alt="" width="300" height="200" loading="lazy" />
        ) : (
          <span className={cs("portrait-initials")}>
            {player.name.split(" ").map((name) => name[0]).join("")}
          </span>
        )}
      </div>
      <p className={cs("notebook-eyebrow")}>{player.periodLabel}</p>
      <h3>
        <Link href={`/player/${player.playerId}`} prefetch={false}>{player.name}</Link>
      </h3>
      <p className={cs("studchud-headline")}>{player.headline}</p>
      <p>{player.opinion}</p>
      <dl className={cs("player-stats")}>
        {player.stats.map((stat) => (
          <div key={stat.label}>
            <dt>{stat.label}</dt>
            <dd>{stat.value}</dd>
          </div>
        ))}
      </dl>
      <p className={cs("stat-period")}>{player.statPeriod}</p>
      <p className={cs("studchud-source")}>
        <a href={player.source.url} target="_blank" rel="noreferrer">Source: {player.source.label}</a>
        <span className={cs("caption")}> · checked {player.source.checkedAt}</span>
      </p>
      <details className={cs("watchlist-basis")}>
        <summary>Why this pick</summary>
        <p className={cs("caption")}>{player.selectionReason}</p>
      </details>
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
    <section className={cs("studchud")} data-stud-chud aria-label="Last season's notebook">
      <SectionHeading eyebrow="Last season’s notebook" title="The good. The rough." />
      <div className={cs("studchud-layout")}>
        {stud && <StudChudPanel player={stud} word="STUD" portraits={portraits} />}
        {chud && <StudChudPanel player={chud} word="CHUD" portraits={portraits} />}
      </div>
      <p className={cs("caption", "notebook-foot")}>
        {edition.status === "draft" ? "Sample editorial for the current edition" : `Editorial from the ${edition.dateLabel} edition`}, grounded in the cited sources — not a computed award, a verified ranking, or a completed 2026 fantasy week.
      </p>
    </section>
  );
}
