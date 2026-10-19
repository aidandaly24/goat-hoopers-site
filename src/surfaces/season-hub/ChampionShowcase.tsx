import Link from "next/link";
import type { LiveClubhouseDirectoryEntry } from "@/domain/clubhouse-directory";
import { TeamAvatar } from "@/ui/TeamAvatar";
import { PropViewer } from "@/three/PropViewer";
import { cs } from "./CourtsideStyles";

/**
 * The reigning champion's showcase: the one place the 3D crown mounts on
 * the homepage (click it — it spins). The champion is whoever the clubhouse
 * directory's previous-season data says finished 1st; when a new champion
 * is crowned, this band and the avatar crowns move on their own.
 */
export function ChampionShowcase({ entry }: { entry: LiveClubhouseDirectoryEntry }) {
  const prior = entry.previousSeason;
  if (!prior) return null;
  const team = entry.identity;
  return (
    <section className={cs("champion")} aria-labelledby="champion-title" data-champion-showcase>
      <div className={cs("wrap", "champion-layout")}>
        <div className={cs("champion-crown")}>
          <PropViewer
            prop="crown"
            ariaLabel={`3D crown of the reigning champions, ${team.name}. Activate to spin it.`}
          />
        </div>
        <div className={cs("champion-copy")}>
          <p className={cs("champion-eyebrow")}>Reigning champion · {prior.season}</p>
          <h2 id="champion-title">{team.name}</h2>
          <p>
            {team.managerName} took the {prior.season} title at {prior.wins}–{prior.losses}. The crown
            sits on their avatar all season — until someone takes it.
          </p>
          <div className={cs("champion-teamline")}>
            <TeamAvatar name={team.name} avatar={team.avatar} isChampion />
            <Link className={cs("text-link")} href={`/teams/${team.id}`} prefetch={false}>
              Open the champions
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
