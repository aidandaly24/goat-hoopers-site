import { GLBViewer } from "./GLBViewer";

export type HooperViewerProps = {
  /**
   * Sleeper roster id (1–10) — loads `/3d/hooper-{rosterId}.glb`.
   * Pass null for the neutral generic figurine.
   */
  rosterId: number | null;
  className?: string;
  ariaLabel?: string;
};

const HOOPER_CLICKS = ["spin", "jump", "dunk"];

/**
 * HooperViewer — the clickable 3D team figurine. Plays the ambient idle
 * bounce; each click/tap cycles through spin → jump → dunk one-shots.
 */
export function HooperViewer({ rosterId, className, ariaLabel }: HooperViewerProps) {
  const src =
    rosterId !== null ? `/3d/hooper-${rosterId}.glb` : "/3d/hooper-generic.glb";
  return (
    <GLBViewer
      src={src}
      clickClips={HOOPER_CLICKS}
      className={className}
      ariaLabel={ariaLabel ?? "Team figurine. Activate for a trick."}
    />
  );
}
