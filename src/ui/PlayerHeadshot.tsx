"use client";

import { useState, type CSSProperties } from "react";
import { teamColorVar } from "./teamColors";
import styles from "./PlayerHeadshot.module.css";

/**
 * PlayerHeadshot — every player gets a face. Sleeper CDN headshot by
 * player id; on error (Sleeper 403s nonexistent ids) falls back to the
 * player's initials in a disc ringed with the team color.
 *
 * Client component: the onError fallback needs state. Props are plain
 * domain values — no data fetching inside (rule 6).
 */
export function PlayerHeadshot({
  playerId,
  name,
  teamId = null,
  size = 40,
}: {
  /** Sleeper player_id — maps to sleepercdn.com/content/nba/players/{id}.jpg. */
  playerId: string;
  /** Full name, for alt text and the fallback initials. */
  name: string;
  /** Sleeper roster id of the owning team — colors the fallback ring. */
  teamId?: string | null;
  /** Diameter in px. */
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  const ring = teamId ? teamColorVar(teamId) : "var(--gh-gold)";
  const frame: CSSProperties = {
    width: size,
    height: size,
    "--ph-ring": ring,
  } as CSSProperties;

  if (!failed) {
    return (
      <img
        className={styles.headshot}
        style={frame}
        src={`https://sleepercdn.com/content/nba/players/${playerId}.jpg`}
        alt={`${name} headshot`}
        loading="lazy"
        onError={() => setFailed(true)}
      />
    );
  }

  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div
      className={styles.fallback}
      style={frame}
      aria-label={`${name} headshot unavailable`}
      role="img"
    >
      <span className={styles.initials} style={{ fontSize: size * 0.36 }}>
        {initials}
      </span>
    </div>
  );
}
