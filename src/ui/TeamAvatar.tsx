import styles from "./TeamAvatar.module.css";

/**
 * Team avatar: Sleeper avatar image when available, otherwise initials.
 * Keeps every surface's team rows visually consistent.
 */
export function TeamAvatar({ name, avatar }: { name: string; avatar: string | null }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  if (avatar) {
    return (
      <img
        className={styles.avatar}
        src={`https://sleepercdn.com/avatars/thumbs/${avatar}`}
        alt={`${name} avatar`}
        loading="lazy"
      />
    );
  }
  return (
    <div className={styles.avatar} aria-hidden="true">
      <span className={styles.initials}>{initials}</span>
    </div>
  );
}
