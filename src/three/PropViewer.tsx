import { GLBViewer } from "./GLBViewer";

export type PropKind = "basketball" | "trophy" | "crown" | "hoop";

export type PropViewerProps = {
  prop: PropKind;
  className?: string;
  ariaLabel?: string;
};

const PROP_SRC: Record<PropKind, string> = {
  basketball: "/3d/basketball.glb",
  trophy: "/3d/trophy.glb",
  crown: "/3d/crown.glb",
  hoop: "/3d/hoop.glb",
};

/** One-shot click clips per prop. The hoop is static decor (no clips). */
const PROP_CLICKS: Record<PropKind, string[]> = {
  basketball: ["bounce"],
  trophy: ["celebrate"],
  crown: ["spin"],
  hoop: [],
};

/**
 * PropViewer — clickable 3D props. Basketball bounces, the trophy throws
 * confetti, the crown spins. The hoop is static decoration.
 */
export function PropViewer({ prop, className, ariaLabel }: PropViewerProps) {
  return (
    <GLBViewer
      src={PROP_SRC[prop]}
      clickClips={PROP_CLICKS[prop]}
      className={className}
      ariaLabel={ariaLabel ?? `3D ${prop}. Activate for an animation.`}
    />
  );
}
