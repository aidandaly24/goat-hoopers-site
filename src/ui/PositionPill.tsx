import styles from "./PositionPill.module.css";

/**
 * PositionPill — a tiny colored position badge (PG/SG/SF/PF/C) in the
 * Sleeper visual dialect. Colors come from the --gh-pos-* tokens; the
 * pill text is always dark ink for contrast.
 *
 * Null (picks, unknowns) renders a neutral dash so rows never have a
 * missing slot — "no pill" would read as a loading bug.
 */
export function PositionPill({ position }: { position: string | null }) {
  const key = (position ?? "").toUpperCase().split(/[^A-Z]/)[0];
  const tone =
    key === "PG" || key === "SG" || key === "SF" || key === "PF" || key === "C"
      ? key.toLowerCase()
      : "na";
  return (
    <span className={`${styles.pill} ${styles[tone]}`} title={position ?? "Position unknown"}>
      {tone === "na" ? "–" : key}
    </span>
  );
}
