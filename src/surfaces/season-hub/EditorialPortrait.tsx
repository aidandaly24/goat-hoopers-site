import { PlayerHeadshot } from "@/ui/PlayerHeadshot";
import styles from "./EditorialPortrait.module.css";

/** Editorial image treatment over the existing approved-photo → ESPN →
 * labelled-initials recovery chain. Surface-local styling keeps compact
 * team/player avatars elsewhere unchanged. Receives identity and sources;
 * never loads data or crosses the server/client boundary with callbacks. */
export function EditorialPortrait({
  name, espnId, portraitSrc, teamId, size = 340, panel = false,
}: {
  name: string;
  espnId: string | null;
  portraitSrc?: string;
  teamId?: string;
  size?: number;
  panel?: boolean;
}) {
  return (
    <span className={`${styles.frame}${panel ? ` ${styles.panel}` : ""}`} data-editorial-portrait>
      <PlayerHeadshot name={name} espnId={espnId} portraitSrc={portraitSrc} teamId={teamId} size={size} />
    </span>
  );
}
