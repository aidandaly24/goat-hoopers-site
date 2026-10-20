import Link from "next/link";
import type { HomeTeamSummary } from "@/domain/personalized-home";
import { EditorialPortrait } from "./EditorialPortrait";
import styles from "./RosterPortraitStage.module.css";

/** The approved below-court roster montage: one leading current player
 * overlaps two supporting cutouts against the current team's name.
 * Membership, ordering and identities come from the existing summary;
 * this leaf only positions them. Names remain real focusable profile links. */
export function RosterPortraitStage({ team, players, portraits }: {
  team: HomeTeamSummary["team"];
  players: HomeTeamSummary["players"];
  portraits: Record<string, string>;
}) {
  const featured = players.slice(0, 3);
  const positions = featured.length === 1 ? ["center"] : featured.length === 2 ? ["left", "right"] : ["left", "center", "right"];
  return (
    <div className={styles.wrap} data-roster-portraits data-count={featured.length}>
      <div className={`${styles.stage}${featured.length ? "" : ` ${styles.empty}`}`}>
        <p className={styles.backdrop} aria-hidden="true">{team.name}</p>
        {featured.map((player, index) => (
          <span key={player.id} className={styles.portrait} data-position={positions[index]} aria-hidden="true">
            <EditorialPortrait name={player.name} espnId={player.espnId} portraitSrc={portraits[player.id]} teamId={team.id} />
          </span>
        ))}
        {!!featured.length && <span className={styles.caption}>Your roster</span>}
      </div>
      {!!featured.length && (
        <ul className={styles.names}>
          {featured.map((player, index) => (
            <li key={player.id} data-position={positions[index]}>
              <Link href={`/player/${player.id}`} prefetch={false}>
                <span className={styles.position}>{player.position ?? "Position unavailable"}</span>
                <strong>{player.name}</strong>
                <span className={styles.price}>${player.value.toFixed(2)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
