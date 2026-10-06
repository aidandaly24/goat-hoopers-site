"use client";

import { useState } from "react";
import styles from "./ChampionCrown.module.css";

/**
 * ChampionCrown — the defending champion's crown, perched on a team
 * avatar (see TeamAvatar's `isChampion` prop). Crisp inline SVG in the
 * site's gold — sharper than any raster at avatar sizes. Deliberately
 * tilted a few degrees and nudged off-center so it reads hand-placed,
 * not stamped by a template.
 *
 * It's a real button, not decoration: clicking (or Enter/Space) fires a
 * satisfying 360° spin with an overshoot-and-settle easing. Clicks never
 * leak to a parent link (stopPropagation + preventDefault), and
 * prefers-reduced-motion users get no spin. Keyboard-focusable with a
 * visible gold focus ring.
 */
export function ChampionCrown({
  label = "Defending champion",
}: {
  /** Accessible name, e.g. "Defending champion". */
  label?: string;
}) {
  const [spins, setSpins] = useState(0);
  return (
    <button
      type="button"
      className={styles.crown}
      aria-label={`${label} — activate to spin the crown`}
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
      </span>
    </button>
  );
}
