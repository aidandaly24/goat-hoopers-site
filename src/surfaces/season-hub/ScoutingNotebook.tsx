import Link from "next/link";
import type { WeeklyEdition } from "@/domain/weekly-spotlight";
import type { HomeTeamFace, HomeTeamSummary } from "@/domain/personalized-home";
import { PlayerHeadshot } from "@/ui/PlayerHeadshot";
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
export function ScoutingNotebook({ summary, faces, pairTeamIds, edition, portraits }: {
  summary: HomeTeamSummary | null;
  faces: HomeTeamFace[];
  pairTeamIds: [string, string] | null;
  edition: WeeklyEdition | null;
  portraits: Record<string, string>;
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
          ? `Up ${topWatch.value.toFixed(1)}% in the preseason market — the sharpest riser on your roster. ${watch.message}`
          : `${topWatch.value.toFixed(1)} FPPG${topWatch.games !== null ? ` across ${topWatch.games} observed games` : ""} — the form watch on your roster. ${watch.message}`,
      };
    } else if (summary.players[0]) {
      const top = summary.players[0];
      featured = {
        key: `own-${top.id}`,
        eyebrow: "On your team",
        player: top,
        teamId: summary.team.id,
        teamName: summary.team.name,
        copy: `Highest modeled value on your roster at $${top.value.toFixed(2)} — the anchor the rest of the rotation prices against.`,
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
        copy: `Highest modeled value on ${homeFace.team.name} at $${homeFace.player.value.toFixed(2)} — the anchor for the featured matchup.`,
      };
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
        copy: `Highest modeled value on ${face.team.name} at $${face.player.value.toFixed(2)}.`,
      });
    }
  }
  const watchSpotlight = edition?.playerSpotlights.find((player) => player.role === "one-to-watch");
  if (watchSpotlight && watchSpotlight.playerId !== featured?.player.id && !entries.some((entry) => entry.player.id === watchSpotlight.playerId)) {
    const owner = faces.find((face) => face.team.id === watchSpotlight.teamId);
    entries.push({
      key: `spotlight-${watchSpotlight.playerId}`,
      eyebrow: `Around the league · ${owner?.team.name ?? "League watch"}`,
      player: { id: watchSpotlight.playerId, name: watchSpotlight.name, espnId: null },
      teamId: watchSpotlight.teamId,
      teamName: owner?.team.name ?? "",
      copy: `${watchSpotlight.headline} ${watchSpotlight.opinion}`,
      source: watchSpotlight.source,
    });
  }

  if (!featured && !entries.length) return null;
  return (
    <section className={cs("notebook")} data-scouting-notebook aria-label="The scouting notebook">
      <SectionHeading eyebrow="The scouting notebook" title="Keep an eye on these." />
      <div className={cs("notebook-layout")}>
        {featured && (
          <article className={cs("notebook-featured")}>
            <Link href={`/player/${featured.player.id}`} prefetch={false} className={cs("notebook-featured-media")}>
              <PlayerHeadshot portraitSrc={portraits[featured.player.id]} espnId={featured.player.espnId} name={featured.player.name} teamId={featured.teamId} size={220} />
            </Link>
            <p className={cs("notebook-eyebrow")}>{featured.eyebrow}</p>
            <h3>
              <Link href={`/player/${featured.player.id}`} prefetch={false}>{featured.player.name}</Link>
            </h3>
            <p className={cs("notebook-team")}>
              <TeamAvatar name={featured.teamName} avatar={faces.find((face) => face.team.id === featured.teamId)?.team.avatar ?? null} isChampion={faces.find((face) => face.team.id === featured.teamId)?.champion ?? false} />
              {featured.teamName}
            </p>
            <p>{featured.copy}</p>
            <Link className={cs("text-link")} href={`/player/${featured.player.id}`} prefetch={false}>Player profile</Link>
          </article>
        )}
        {!!entries.length && (
          <ul className={cs("notebook-rows")}>
            {entries.slice(0, 3).map((entry) => (
              <li key={entry.key} className={cs("notebook-row")}>
                <PlayerHeadshot portraitSrc={portraits[entry.player.id]} espnId={entry.player.espnId} name={entry.player.name} teamId={entry.teamId} size={72} />
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
      <p className={cs("caption", "notebook-foot")}>
        Watches are named on a stated basis only — a guide basis, top modeled value, or the edition’s sourced editorial pick. Nothing here is a ranking or a promise about a player’s role.
      </p>
    </section>
  );
}
