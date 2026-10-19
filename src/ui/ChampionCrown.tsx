"use client";

import { useState } from "react";
import styles from "./ChampionCrown.module.css";

function CrownArtwork() {
  return (
    <svg viewBox="0 0 24 19" className={styles.svg} focusable="false">
      <path
        d="M3 14.5 2 5.5 7 9.5 12 3 17 9.5 22 5.5 21 14.5Z"
        fill="var(--gh-gold)"
        stroke="var(--gh-gold-deep)"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      <rect
        x="3"
        y="14.5"
        width="18"
        height="2.8"
        rx="1.4"
        fill="var(--gh-gold-deep)"
      />
      <circle cx="2" cy="5" r="1.3" fill="var(--gh-gold-soft)" />
      <circle cx="12" cy="2.6" r="1.3" fill="var(--gh-gold-soft)" />
      <circle cx="22" cy="5" r="1.3" fill="var(--gh-gold-soft)" />
      <circle cx="12" cy="9.6" r="1.5" fill="var(--gh-gold-deep)" />
      <circle cx="7.4" cy="11.4" r="1" fill="var(--gh-gold-deep)" />
      <circle cx="16.6" cy="11.4" r="1" fill="var(--gh-gold-deep)" />
    </svg>
  );
}

/**
 * ChampionCrown — the defending champion's crown, perched on a team
 * avatar (see TeamAvatar's `isChampion` prop). Crisp inline SVG in the
 * site's gold — sharper than any raster at avatar sizes. Deliberately
 * tilted a few degrees and nudged off-center so it reads hand-placed,
 * not stamped by a template.
 *
 * Two presentations of the same artwork:
 * - `interactive` (default): a real button — clicking (or Enter/Space)
 *   fires a satisfying 360° spin with an overshoot-and-settle easing.
 *   Clicks never leak to a parent link (stopPropagation + preventDefault),
 *   and prefers-reduced-motion users get no spin. Only use it where it is
 *   NOT nested inside another link or button.
 * - non-interactive badge: a plain aria-hidden span for avatars that live
 *   inside links/buttons (matchup buttons, team rows) — nested interactive
 *   content is invalid HTML and breaks hydration. The champion status is
 *   conveyed by TeamAvatar's visually-hidden status text (plus any visible
 *   text the surface prints nearby, e.g. "2025 champion"), never by the
 *   badge itself.
 */
export function ChampionCrown({
  label = "Defending champion",
  interactive = true,
}: {
  /** Accessible name, e.g. "Defending champion". */
  label?: string;
  /** False renders the non-interactive badge (safe inside links/buttons). */
  interactive?: boolean;
}) {
  const [spins, setSpins] = useState(0);
  if (!interactive) {
    return (
      <span className={`${styles.crown} ${styles.badge}`} aria-hidden="true" data-champion-crown="badge">
        <span className={styles.still}>
          <CrownArtwork />
        </span>
      </span>
    );
  }
  return (
    <button
      type="button"
      className={styles.crown}
      aria-label={`${label} — activate to spin the crown`}
      data-champion-crown="interactive"
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        setSpins((s) => s + 1);
      }}
    >
      {/* key remounts the spinner so every click restarts the animation */}
      <span
        key={spins}
        className={spins > 0 ? styles.spinner : styles.still}
        aria-hidden="true"
      >
        <CrownArtwork />
      </span>
    </button>
  );
}
