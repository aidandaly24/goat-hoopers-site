import type { CSSProperties } from "react";
import Link from "next/link";
import type { HomeTeamFace } from "@/domain/personalized-home";
import { EditorialPortrait } from "./EditorialPortrait";
import styles from "./FacesStrip.module.css";
import { TeamAvatar } from "@/ui/TeamAvatar";
import { teamColorVar } from "@/ui/teamColors";
import { cs } from "./CourtsideStyles";

/**
 * Faces of the league: every team's top player by current modeled value,
 * linked to their player page. Teams without a priced player are omitted;
 * with fewer than two faces the strip does not render at all. The reigning
 * champion's team avatar wears the crown here too.
 */
export function FacesStrip({
  faces,
  portraits,
}: {
  faces: HomeTeamFace[];
  portraits: Record<string, string>;
}) {
  const shown = faces.filter((face) => face.player);
  if (shown.length < 2) return null;
  return (
    <section className={cs("faces")} aria-labelledby="faces-title" data-faces-strip>
      <div className={cs("section-head")}>
        <h2 id="faces-title">Faces of the league</h2>
        <span className={cs("faces-note")}>Every team’s top player by modeled value</span>
      </div>
      <ol className={cs("faces-strip")}>
        {shown.map((face) => {
          const player = face.player!;
          return (
            <li
              key={face.team.id}
              className={cs("face-card")}
              style={{ "--card-glow": teamColorVar(face.team.id) } as CSSProperties}
            >
              <Link href={`/player/${player.id}`} prefetch={false} className={cs("face-link")}>
                <span className={styles.portrait}><EditorialPortrait
                  portraitSrc={portraits[player.id]}
                  espnId={player.espnId}
                  name={player.name}
                  teamId={face.team.id}
                  size={120}
                /></span>
                <span className={cs("face-name")}>{player.name}</span>
                <span className={cs("face-team")}>
                  <TeamAvatar name={face.team.name} avatar={face.team.avatar} isChampion={face.champion} />
                  <span style={{ color: teamColorVar(face.team.id) }}>{face.team.name}</span>
                </span>
                <span className={cs("face-price", "gh-num")}>${player.value.toFixed(1)}</span>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
