import { GLBViewer } from "./GLBViewer";
import { teamColorVar } from "@/ui/teamColors";
import styles from "./HooperViewer.module.css";

export type HooperViewerProps = {
  /**
   * Sleeper roster id (1–10) — loads `/3d/hooper-{rosterId}.glb`.
   * Pass null for the neutral generic figurine.
   */
  rosterId: number | null;
  className?: string;
  ariaLabel?: string;
  teamName?: string;
};

const HOOPER_CLICKS = ["spin", "jump", "dunk"];

/**
 * HooperViewer — the clickable 3D team figurine. Plays the ambient idle
 * bounce; each click/tap cycles through spin → jump → dunk one-shots.
 */
export function HooperViewer({ rosterId, className, ariaLabel, teamName }: HooperViewerProps) {
  const src =
    rosterId !== null ? `/3d/hooper-${rosterId}.glb` : "/3d/hooper-generic.glb";
  return (
    <GLBViewer
      src={src}
      clickClips={HOOPER_CLICKS}
      className={className}
      ariaLabel={ariaLabel ?? "Team figurine. Activate for a trick."}
      fallback={
        <div
          className={styles.fallback}
          role="img"
          aria-label={`${teamName ?? "Team"} jersey. 3D preview unavailable.`}
        >
          <svg viewBox="0 0 100 110" aria-hidden="true" className={styles.jersey}>
            <path
              d="M25 5 38 5 Q50 22 62 5 L75 5 78 30 94 43 80 60 73 54 73 105 27 105 27 54 20 60 6 43 22 30Z"
              fill="var(--gh-bg-raised)"
              stroke={rosterId === null ? "var(--gh-gold)" : teamColorVar(rosterId)}
              strokeWidth="4"
              strokeLinejoin="round"
            />
            <text x="50" y="58" textAnchor="middle" className={styles.wordmark}>GOAT</text>
            <text x="50" y="88" textAnchor="middle" className={styles.number}>
              {rosterId !== null && Number.isFinite(rosterId) ? rosterId : "GH"}
            </text>
          </svg>
          <span aria-hidden="true" className={styles.caption}>3D preview unavailable</span>
        </div>
      }
    />
  );
}
