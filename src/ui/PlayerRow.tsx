import Link from "next/link";
import type { Player } from "@/domain";
import { Badge } from "@/ui/Badge";
import { PlayerHeadshot } from "@/ui/PlayerHeadshot";
import styles from "./PlayerRow.module.css";

/**
 * PlayerRow — one player as a linked identity: headshot, name, position
 * pill, NBA team. Every player name site-wide renders through this (or
 * PlayerName below) so names are links to /player/[sleeperId], never
 * dead text.
 */
export function PlayerRow({
  player,
  teamId = null,
}: {
  player: Player;
  /** Owning team's roster id — tints the headshot fallback ring. */
  teamId?: string | null;
}) {
  return (
    <Link
      href={`/player/${player.id}`}
      className={styles.row}
      aria-label={`View ${player.fullName}`}
    >
      <PlayerHeadshot playerId={player.id} name={player.fullName} teamId={teamId} />
      <span className={styles.identity}>
        <span className={styles.name}>{player.fullName}</span>
        <span className={styles.meta}>
          {player.position && <Badge>{player.position}</Badge>}
          {player.nbaTeam && <span className={styles.nbaTeam}>{player.nbaTeam}</span>}
        </span>
      </span>
    </Link>
  );
}

/**
 * PlayerName — just the linked name (for dense contexts like transaction
 * summaries where a full row would be too much chrome).
 */
export function PlayerName({ player }: { player: { id: string; fullName: string } }) {
  return (
    <Link href={`/player/${player.id}`} className={styles.nameLink}>
      {player.fullName}
    </Link>
  );
}
