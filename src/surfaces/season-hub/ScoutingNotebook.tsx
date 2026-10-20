import Link from "next/link";
import type { WeeklyEdition } from "@/domain/weekly-spotlight";
import type { HomeTeamFace, HomeTeamSummary } from "@/domain/personalized-home";
import type { LiveClubhouseDirectoryEntry } from "@/domain/clubhouse-directory";
import { EditorialPortrait } from "./EditorialPortrait";
import styles from "./ScoutingNotebook.module.css";
import { SectionHeading } from "@/ui/SectionHeading";
import { TeamAvatar } from "@/ui/TeamAvatar";
import { cs } from "./CourtsideStyles";

type NotebookPlayer = { id: string; name: string; espnId: string | null };
type NotebookEntry = {
  key: string;
  eyebrow: string;
  player: NotebookPlayer;
  teamId: string;
  teamName: string;
  copy: string;
  source?: { label: string; url: string };
};

/**
 * The scouting notebook: one featured watch LARGE and the around-the-league
 * watches beside it. Every entry is named on a stated basis — the guide's
 * named watch basis for the member's own player, top modeled value for the
 * league faces, the edition's sourced editorial watch for the spotlight.
 * Nothing renders without a basis; when no entry has one, the section is
 * omitted rather than filled.
 */
export function ScoutingNotebook({ summary, faces, pairTeamIds, edition, portraits, directory }: {
  summary: HomeTeamSummary | null;
  faces: HomeTeamFace[];
  pairTeamIds: [string, string] | null;
  edition: WeeklyEdition | null;
  portraits: Record<string, string>;
  directory: readonly LiveClubhouseDirectoryEntry[];
}) {
  const entries: NotebookEntry[] = [];
  let featured: NotebookEntry | null = null;

  if (summary) {
    const watch = summary.playerGuide.watch;
    const topWatch = watch.basis !== "unavailable" ? watch.rows[0] : undefined;
    if (topWatch) {
      featured = {
        key: `own-${topWatch.id}`,
        eyebrow: "On your team",
        player: topWatch,
        teamId: summary.team.id,
        teamName: summary.team.name,
        copy: watch.basis === "market"
          ? `Up ${topWatch.value.toFixed(1)}% from the previous price snapshot.`
          : `${topWatch.value.toFixed(1)} FPPG (EMA)${topWatch.games !== null ? ` across ${topWatch.games} observed games` : ""}.`,
      };
    } else if (summary.players[0]) {
      const top = summary.players[0];
      featured = {
        key: `own-${top.id}`,
        eyebrow: "On your team",
        player: top,
        teamId: summary.team.id,
        teamName: summary.team.name,
        copy: `Current modeled value: $${top.value.toFixed(2)} FAAB.`,
      };
    }
  } else if (pairTeamIds) {
    const homeFace = faces.find((face) => face.team.id === pairTeamIds[0]);
    if (homeFace?.player) {
      featured = {
        key: `face-${homeFace.player.id}`,
        eyebrow: "Opening-week watch",
        player: homeFace.player,
        teamId: homeFace.team.id,
        teamName: homeFace.team.name,
        copy: `Highest modeled value on ${homeFace.team.name}: $${homeFace.player.value.toFixed(2)} FAAB.`,
      };
    }
  }

  // Additional watch rows already carry the guide's verified basis and
  // observed-game counts. Never turn missing form into invented picks.
  if (summary && summary.playerGuide.watch.basis !== "unavailable") {
    const watch = summary.playerGuide.watch;
    for (const row of watch.rows) {
      if (row.id === featured?.player.id) continue;
      entries.push({ key: `own-${row.id}`, eyebrow: "On your team", player: row,
        teamId: summary.team.id, teamName: summary.team.name,
        copy: watch.basis === "market"
          ? `Up ${row.value.toFixed(1)}% from the previous price snapshot.`
          : `${row.value.toFixed(1)} EMA FPPG${row.games !== null ? ` · ${row.games} observed games` : ""}.`,
      });
    }
  }

  // Around the league: the other featured team's anchor face, then the
  // edition's one-to-watch. The member's opponent is whichever featured
  // side is not theirs; signed-out readers already feature one side.
  const aroundIds = pairTeamIds
    ? pairTeamIds.filter((id) => id !== summary?.team.id && id !== featured?.teamId)
    : [];
  for (const id of aroundIds) {
    const face = faces.find((candidate) => candidate.team.id === id);
    if (face?.player) {
      entries.push({
        key: `around-${face.player.id}`,
        eyebrow: `Around the league · ${face.team.name}`,
        player: face.player,
        teamId: face.team.id,
        teamName: face.team.name,
        copy: `Current modeled value: $${face.player.value.toFixed(2)} FAAB.`,
      });
    }
  }
  const watchSpotlight = edition?.playerSpotlights.find((player) => player.role === "one-to-watch");
  if (watchSpotlight && watchSpotlight.playerId !== featured?.player.id && !entries.some((entry) => entry.player.id === watchSpotlight.playerId)) {
    // The editorial source retains its original period, but a current watch
    // must not assign the player to the source snapshot's former roster.
    const owners = directory.filter(entry => entry.players.some(player => player.id === watchSpotlight.playerId));
    const owner = owners.length === 1 ? owners[0] : null;
    const identity = owner?.players.find(player => player.id === watchSpotlight.playerId);
    entries.push({
      key: `spotlight-${watchSpotlight.playerId}`,
      eyebrow: owner ? `Around the league · ${owner.identity.name}` : "Editorial watch · current team unavailable",
      player: { id: watchSpotlight.playerId, name: identity?.fullName ?? watchSpotlight.name, espnId: identity?.espnId ?? null },
      teamId: owner?.identity.id ?? "",
      teamName: owner?.identity.name ?? "",
      copy: `${watchSpotlight.periodLabel}. ${watchSpotlight.headline} ${watchSpotlight.opinion}`,
      source: watchSpotlight.source,
    });
  }

  if (!featured && !entries.length) return null;
  return (
    <section className={cs("notebook")} data-scouting-notebook aria-label="The scouting notebook">
      <SectionHeading eyebrow="Scouting notebook" title="Players to watch." />
      <div className={styles.layout}>
        {featured && (
          <article className={styles.featured}>
            <Link href={`/player/${featured.player.id}`} prefetch={false} className={styles.featuredMedia}>
              <EditorialPortrait portraitSrc={portraits[featured.player.id]} espnId={featured.player.espnId} name={featured.player.name} teamId={featured.teamId} size={180} panel />
            </Link>
            <div className={styles.featuredBody}>
            <p className={cs("notebook-eyebrow")}>{featured.eyebrow}</p>
            <h3>
              <Link href={`/player/${featured.player.id}`} prefetch={false}>{featured.player.name}</Link>
            </h3>
            <div className={cs("notebook-team")}>
              <TeamAvatar name={featured.teamName} avatar={faces.find((face) => face.team.id === featured.teamId)?.team.avatar ?? null} isChampion={faces.find((face) => face.team.id === featured.teamId)?.champion ?? false} />
              {featured.teamName}
            </div>
            <p>{featured.copy}</p>
            <Link className={cs("text-link")} href={`/player/${featured.player.id}`} prefetch={false}>Player profile</Link>
            </div>
          </article>
        )}
        {!!entries.length && (
          <ul className={styles.rows}>
            {entries.slice(0, 5).map((entry) => (
              <li key={entry.key} className={styles.row}>
                <span className={styles.rowMedia}><EditorialPortrait portraitSrc={portraits[entry.player.id]} espnId={entry.player.espnId} name={entry.player.name} teamId={entry.teamId} size={72} /></span>
                <div>
                  <p className={cs("notebook-eyebrow")}>{entry.eyebrow}</p>
                  <h3>
                    <Link href={`/player/${entry.player.id}`} prefetch={false}>{entry.player.name}</Link>
                  </h3>
                  <p>{entry.copy}</p>
                  <p className={cs("notebook-row-links")}>
                    <Link className={cs("text-link")} href={`/player/${entry.player.id}`} prefetch={false}>Profile</Link>
                    {entry.source && <a href={entry.source.url} target="_blank" rel="noreferrer">Source: {entry.source.label}</a>}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <details className={cs("watchlist-basis")}>
        <summary>How these players were selected</summary>
        <p className={cs("caption")}>{summary?.playerGuide.watch.message ?? "Featured matchup players use current modeled values; editorial watches retain their cited source."}</p>
      </details>
    </section>
  );
}
