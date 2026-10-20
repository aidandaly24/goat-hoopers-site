import Link from "next/link";
import type { WeeklyEdition } from "@/domain/weekly-spotlight";
import type { HomeTeamFace, HomeTeamSummary } from "@/domain/personalized-home";
import type { LiveClubhouseDirectoryEntry } from "@/domain/clubhouse-directory";
import { PlayerHeadshot } from "@/ui/PlayerHeadshot";
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
  basis: string;
  copy: string;
  note?: string;
  source?: { label: string; url: string };
};

/**
 * What deserves a closer look? Compact player rows link to profiles and
 * distinguish market movement, observed form, current value and editorial
 * selections. Preseason and missing form reuse only supplied facts. Narrow
 * layouts retain the same rows, reasons, periods and sources; no large
 * fallback portrait or unsupported performance ranking fills missing data.
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

  if (summary) {
    const watch = summary.playerGuide.watch;
    if (watch.basis !== "unavailable" && watch.rows.length) {
      for (const row of watch.rows) entries.push({
        key: `own-${row.id}`,
        eyebrow: "On your team",
        player: row,
        teamId: summary.team.id,
        teamName: summary.team.name,
        basis: watch.basis === "market" ? "Rising modeled value" : `${summary.playerGuide.season} observed form`,
        copy: watch.basis === "market"
          ? `Up ${row.value.toFixed(1)}% from the previous price snapshot.`
          : `${row.value.toFixed(1)} FPPG (EMA)${row.games !== null ? ` across ${row.games} observed games` : ""}.`,
        note: row.note.startsWith("Status: ") ? row.note : undefined,
      });
    } else {
      for (const player of summary.players) entries.push({
        key: `own-${player.id}`,
        eyebrow: "On your team",
        player,
        teamId: summary.team.id,
        teamName: summary.team.name,
        basis: "Highest modeled value",
        copy: `$${player.value.toFixed(2)} FAAB · current player quote.`,
      });
    }
  } else if (pairTeamIds) {
    const homeFace = faces.find((face) => face.team.id === pairTeamIds[0]);
    if (homeFace?.player) {
      entries.push({
        key: `face-${homeFace.player.id}`,
        eyebrow: "Featured matchup",
        player: homeFace.player,
        teamId: homeFace.team.id,
        teamName: homeFace.team.name,
        basis: "Highest modeled value",
        copy: `$${homeFace.player.value.toFixed(2)} FAAB · current player quote.`,
      });
    }
  }

  // Around the league: the other featured team's anchor face, then the
  // edition's one-to-watch. The member's opponent is whichever featured
  // side is not theirs; signed-out readers already feature one side.
  const aroundIds = pairTeamIds
    ? pairTeamIds.filter((id) => id !== summary?.team.id && !entries.some(entry => entry.teamId === id))
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
        basis: "Highest modeled value",
        copy: `$${face.player.value.toFixed(2)} FAAB · current player quote.`,
      });
    }
  }
  const watchSpotlight = edition?.playerSpotlights.find((player) => player.role === "one-to-watch");
  if (watchSpotlight && !entries.some((entry) => entry.player.id === watchSpotlight.playerId)) {
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
      basis: "Editorial watch",
      copy: `${watchSpotlight.periodLabel}. ${watchSpotlight.headline} ${watchSpotlight.opinion}`,
      source: watchSpotlight.source,
    });
  }

  if (!entries.length) return null;
  return (
    <section className={cs("notebook")} data-scouting-notebook aria-label="The scouting notebook">
      <SectionHeading eyebrow="Scouting notebook" title="Players to watch." />
      <ul className={styles.rows}>
        {entries.slice(0, 6).map((entry) => (
          <li key={entry.key} className={styles.row} data-watch-player={entry.player.id}>
            <div className={styles.portrait}>
              <PlayerHeadshot portraitSrc={portraits[entry.player.id]} espnId={entry.player.espnId} name={entry.player.name} teamId={entry.teamId} size={44} />
            </div>
            <div className={styles.body}>
              <p className={styles.context}>{entry.eyebrow} · <strong>{entry.basis}</strong></p>
              <h3><Link href={`/player/${entry.player.id}`} prefetch={false}>{entry.player.name}</Link></h3>
              {entry.teamName && <div className={styles.team}>
                <TeamAvatar name={entry.teamName} avatar={faces.find(face => face.team.id === entry.teamId)?.team.avatar ?? null} isChampion={faces.find(face => face.team.id === entry.teamId)?.champion ?? false} />
                <span>{entry.teamName}</span>
              </div>}
              <p className={entry.source ? undefined : "gh-num"}>{entry.copy}</p>
              {entry.note && <p>{entry.note}</p>}
              {entry.source && <a className={styles.source} href={entry.source.url} target="_blank" rel="noreferrer">Source: {entry.source.label}</a>}
            </div>
          </li>
        ))}
      </ul>
      <details className={cs("watchlist-basis")}>
        <summary>How these players were selected</summary>
        <p className={cs("caption")}>{summary?.playerGuide.watch.message ?? "Featured matchup players use current modeled values; editorial watches retain their cited source."}</p>
        <p className={cs("caption")}>Current modeled value is an asset price, not observed form or a weekly points forecast. Editorial selections keep their original source period.</p>
      </details>
    </section>
  );
}
