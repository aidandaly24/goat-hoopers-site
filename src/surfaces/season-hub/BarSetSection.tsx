import Link from "next/link";
import type { HomeTeamFace } from "@/domain/personalized-home";
import { EditorialPortrait } from "./EditorialPortrait";
import styles from "./BarSetSection.module.css";
import { SectionHeading } from "@/ui/SectionHeading";
import { TeamAvatar } from "@/ui/TeamAvatar";
import { cs } from "./CourtsideStyles";

/**
 * The signed-out answer to the member's roster-value section: the featured
 * pairing's two roster anchors LARGE. Faces only — per Aidan's clarification
 * the homepage carries no dedicated champion content at all (no showcase
 * section, no champion record panel); champions live on the history page,
 * and the champion appears here only through the avatar crown badge exactly
 * as the avatar system renders it. Renders nothing when the featured faces
 * cannot be resolved.
 */
export function BarSetSection({ faces, pairTeamIds, portraits }: {
  faces: HomeTeamFace[];
  pairTeamIds: [string, string] | null;
  portraits: Record<string, string>;
}) {
  if (!pairTeamIds) return null;
  const featured = pairTeamIds
    .map((id) => faces.find((face) => face.team.id === id))
    .filter((face) => !!face);
  if (!featured.length) return null;
  return (
    <section className={cs("value-section")} data-bar-set aria-label="The people behind the matchup">
      <SectionHeading
        eyebrow="The people behind the matchup"
        title="Behind the matchup."
        action={<Link className={cs("text-link")} href="/teams" prefetch={false}>Meet all ten teams</Link>}
      />
      <div className={cs("value-layout", "bar-layout")}>
        <div className={cs("value-faces")}>
          <ul className={cs("value-face-list")}>
            {featured.map((face) => (
              <li key={face.team.id}>
                <Link href={face.player ? `/player/${face.player.id}` : `/teams/${face.team.id}`} prefetch={false} className={cs("value-face")}>
                  <span className={styles.portrait}>
                    {face.player
                      ? <EditorialPortrait portraitSrc={portraits[face.player.id]} espnId={face.player.espnId} name={face.player.name} teamId={face.team.id} size={188} />
                      : <TeamAvatar name={face.team.name} avatar={face.team.avatar} isChampion={face.champion} />}
                  </span>
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
          <p className={cs("caption")}>Top modeled player value on each featured roster.</p>
        </div>
      </div>
    </section>
  );
}
