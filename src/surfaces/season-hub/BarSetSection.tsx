import Link from "next/link";
import type { HomeTeamFace } from "@/domain/personalized-home";
import { PlayerHeadshot } from "@/ui/PlayerHeadshot";
import { SectionHeading } from "@/ui/SectionHeading";
import { TeamAvatar } from "@/ui/TeamAvatar";
import { cs } from "./CourtsideStyles";
import { recordLine, type PairEntry } from "./weekPairs";

/**
 * The signed-out answer to the member's roster-value section: the featured
 * pairing's two roster anchors LARGE over outline type, beside the
 * reigning champion's verified record. This is a faces-and-record layout —
 * the homepage carries no champion showcase section; the champion appears
 * here only as the record the featured teams are chasing, with the crown
 * badge on their avatar exactly as the avatar system renders it.
 * Renders nothing when the featured faces cannot be resolved.
 */
export function BarSetSection({ faces, pairTeamIds, entries, portraits, preseason }: {
  faces: HomeTeamFace[];
  pairTeamIds: [string, string] | null;
  entries: PairEntry[];
  portraits: Record<string, string>;
  preseason: boolean;
}) {
  if (!pairTeamIds) return null;
  const featured = pairTeamIds
    .map((id) => faces.find((face) => face.team.id === id))
    .filter((face) => !!face);
  if (!featured.length) return null;
  const championFace = faces.find((face) => face.champion) ?? null;
  const championEntry = championFace ? entries.find((entry) => entry.identity.id === championFace.team.id) : undefined;
  const championRecord = recordLine(championEntry, preseason);
  const championPrior = preseason ? championEntry?.previousSeason : null;
  return (
    <section className={cs("value-section")} data-bar-set aria-label="The people behind the matchup">
      <SectionHeading
        eyebrow="The people behind the matchup"
        title="The bar is set."
        action={<Link className={cs("text-link")} href="/teams" prefetch={false}>Meet all ten teams</Link>}
      />
      <div className={cs("value-layout")}>
        <div className={cs("value-faces")}>
          <p className={cs("value-outline")} aria-hidden="true">THE CHAMP</p>
          <ul className={cs("value-face-list")}>
            {featured.map((face) => (
              <li key={face.team.id}>
                <Link href={face.player ? `/player/${face.player.id}` : `/teams/${face.team.id}`} prefetch={false} className={cs("value-face")}>
                  {face.player
                    ? <PlayerHeadshot portraitSrc={portraits[face.player.id]} espnId={face.player.espnId} name={face.player.name} teamId={face.team.id} size={188} />
                    : <TeamAvatar name={face.team.name} avatar={face.team.avatar} isChampion={face.champion} />}
                  <span className={cs("value-face-pos")}>{face.player?.position ?? "Team"}</span>
                  <span className={cs("value-face-name")}>{face.player?.name ?? face.team.name}</span>
                  <span className={cs("value-face-team")}>
                    <TeamAvatar name={face.team.name} avatar={face.team.avatar} isChampion={face.champion} />
                    {face.team.name}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <p className={cs("chip", "value-faces-chip")}>Opening-week roster anchors · Not a ranking</p>
        </div>
        {championFace && (
          <div className={cs("value-panel", "bar-panel")}>
            <p className={cs("desk-label")}>The reigning champion{championPrior ? ` · ${championPrior.season}` : ""}</p>
            <p className={cs("bar-team")}>
              <TeamAvatar name={championFace.team.name} avatar={championFace.team.avatar} isChampion />
              <Link href={`/teams/${championFace.team.id}`} prefetch={false}>{championFace.team.name}</Link>
            </p>
            {championRecord.text && <p className={cs("value-big", "gh-num")}>{championRecord.text}</p>}
            <p className={cs("value-meta")}>
              {championRecord.label} · verified from the {championPrior ? `${championPrior.season} ` : ""}league archive — the record every featured team above is chasing.
            </p>
            <Link className={cs("text-link")} href="/teams" prefetch={false}>Get to know the league</Link>
          </div>
        )}
      </div>
    </section>
  );
}
