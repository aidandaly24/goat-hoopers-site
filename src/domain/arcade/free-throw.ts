import manifest from "../../../public/3d/free-throw/ASSET_MANIFEST.json";

/** Local practice coordinates: metres, +Y up, shot travels toward -Z. */
export type PracticeVector = { x: number; y: number; z: number };

/** Render assets and physics share this contract; GLB geometry never collides. */
export type PracticeCourt = {
  release: PracticeVector;
  ballRadius: number;
  rim: { center: PracticeVector; radius: number; tubeRadius: number; scoringHeight: number };
  backboard: { center: PracticeVector; halfSize: PracticeVector };
};

export type PracticeAssetPack = {
  ball: string;
  court: string;
  hoop: string;
  courtOffset: PracticeVector;
};

/** Horizontal aim in degrees; power is a bounded percentage. */
export type PracticeAim = { direction: number; power: number };

/** One transient ball. scored is latched for the lifetime of this shot. */
export type PracticeBall = {
  /** Fixed for a whole attempt, so the camera never follows a flying ball. */
  origin: PracticeVector;
  position: PracticeVector;
  velocity: PracticeVector;
  time: number;
  scored: boolean;
  hitRim: boolean;
  hitBackboard: boolean;
  hitFloor: boolean;
  finished: boolean;
};

/** Events from the deterministic simulation; there is no persistence. */
export type PracticeEvent = "rim" | "backboard" | "basket" | "floor" | "finished";

const vector = (values: number[]): PracticeVector => ({ x: values[0], y: values[1], z: values[2] });
const near = manifest.placements.find(placement => placement.name === "near")!;

/** The near hoop is local origin. Move the court into that same frame;
 * imported geometry keeps its metre scale and authored transforms. */
export const PRACTICE_ASSETS: PracticeAssetPack = {
  ball: "/3d/free-throw/GOAT_HOOPERS_Basketball.glb",
  court: `/3d/free-throw/${manifest.court.file}`,
  hoop: `/3d/free-throw/${manifest.hoop.file}`,
  courtOffset: { x: -near.position[0], y: -near.position[1], z: -near.position[2] },
};

/** Render assets and physics use the supplied manifest as source of truth. */
export const PRACTICE_COURT: PracticeCourt = {
  release: { x: 0, y: 1.9, z: manifest.court.free_throw_line_z[0] - near.position[2] },
  ballRadius: manifest.ball_sphere_collider_radius,
  rim: {
    center: vector(manifest.hoop.rim_tube_center),
    radius: manifest.hoop.rim_major_radius,
    tubeRadius: manifest.hoop.rim_tube_radius,
    scoringHeight: manifest.hoop.scoring_plane_y,
  },
  backboard: {
    center: vector(manifest.hoop.backboard.collision_box_center),
    halfSize: vector(manifest.hoop.backboard.collision_box_half_extents),
  },
};
