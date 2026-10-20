import { ChampionCrown } from "./ChampionCrown";
import styles from "./TeamAvatar.module.css";

/**
 * Team avatar: Sleeper avatar image when available, otherwise initials.
 * Keeps every surface's team rows visually consistent.
 *
 * `isChampion` perches the champion's crown on the avatar as a
 * NON-interactive badge — avatars routinely sit inside links and matchup
 * buttons, where a nested button would be invalid. Surfaces derive the
 * champion from previous-season data (the directory's finish === 1), the
 * same source that prints the "2025 champion" label nearby. The spinnable
 * button variant of the crown is for standalone placements only.
 */
export function TeamAvatar({
  name,
  avatar,
  isChampion = false,
}: {
  name: string;
  avatar: string | null;
  /** True for the defending champion's team. */
  isChampion?: boolean;
}) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const face = avatar ? (
    <img
      className={styles.avatar}
      src={`https://sleepercdn.com/avatars/thumbs/${avatar}`}
      alt={`${name} avatar`}
      loading="lazy"
    />
  ) : (
    <div className={styles.avatar} aria-hidden="true">
      <span className={styles.initials}>{initials}</span>
    </div>
  );

  if (!isChampion) return face;

  return (
    <span className={styles.champWrap}>
      {face}
      <ChampionCrown interactive={false} />
    </span>
  );
}
