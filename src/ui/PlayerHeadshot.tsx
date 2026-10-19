"use client";

/* eslint-disable @next/next/no-img-element -- Direct approved portraits/headshots avoid the image-optimizer quota. */

import { useState, type CSSProperties } from "react";
import { headshotUrl } from "@/data/espn";
import { teamColorVar } from "./teamColors";
import styles from "./PlayerHeadshot.module.css";

/**
 * PlayerHeadshot — every player gets a face. ESPN CDN headshot by ESPN
 * athlete id, after an approved local portrait when supplied (plain <img>,
 * never next/image — Hobby's image-optimization quota); when no image
 * resolves, or both image sources fail (two-way /
 * G League fringe players with no ESPN headshot), falls back to the
 * player's initials in a disc ringed with the team color.
 *
 * Client component: the onError fallback needs state. Props are plain
 * domain values — no data fetching inside (rule 6).
 */
export function PlayerHeadshot({
  espnId,
  portraitSrc = null,
  name,
  teamId = null,
  size = 40,
}: {
  /** ESPN athlete id — used after the optional approved local portrait. */
  espnId: string | null;
  /** Existing approved local portrait, when supplied by the owning surface. */
  portraitSrc?: string | null;
  /** Full name, for alt text and the fallback initials. */
  name: string;
  /** Sleeper roster id of the owning team — colors the fallback ring. */
  teamId?: string | null;
  /** Diameter in px. */
  size?: number;
}) {
  const [failedSources, setFailedSources] = useState<string[]>([]);
  const source = [portraitSrc, espnId ? headshotUrl(espnId) : null]
    .find((candidate): candidate is string => !!candidate && !failedSources.includes(candidate));
  const ring = teamId ? teamColorVar(teamId) : "var(--gh-gold)";
  const frame: CSSProperties = {
    width: size,
    height: size,
    "--ph-ring": ring,
  } as CSSProperties;

  if (source) {
    return (
      <img
        key={source}
        className={styles.headshot}
        style={frame}
        src={source}
        alt={`${name} headshot`}
        loading="lazy"
        onError={() => setFailedSources(previous => [...previous, source])}
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
