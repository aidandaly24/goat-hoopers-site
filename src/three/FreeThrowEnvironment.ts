import * as THREE from "three";

/** A completed practice result, supplied by the existing score owner. */
export type CrowdResult = { outcome: "made" | "miss"; streak: number };
export const CROWD_REACTION_MS = 420;
export const SPECTATOR_COUNT = 72;

/** One bounded settle, never a loop or a source of gameplay state. */
export function crowdPose(result: CrowdResult | null, progress: number, still = false) {
  if (!result) return { lift: 0, arms: 0, lean: 0 };
  const made = result.outcome === "made";
  const strength = made && result.streak >= 3 ? 1 : 0.65;
  const beat = still ? 0.45 : Math.sin(Math.PI * Math.max(0, Math.min(1, progress)));
  return { lift: made ? beat * strength * 0.13 : 0,
    arms: made ? beat * strength : 0,
    lean: made ? 0 : -beat * 0.09 };
}

type Spectator = { x: number; y: number; z: number; scale: number };
type Palette = { skyTop: THREE.Color; horizon: THREE.Color; ground: THREE.Color;
  structure: THREE.Color; distant: THREE.Color; crowd: THREE.Color; accent: THREE.Color };

/** Static outdoor context and tiny, instanced spectators. No lights, assets,
 * camera changes, frame scheduling or physics are owned by this helper. */
export function createFreeThrowEnvironment(scene: THREE.Scene, palette: Palette) {
  const group = new THREE.Group();
  group.name = "practice-environment";
  scene.add(group);
  const sky = new Uint8Array(64 * 4);
  const shade = new THREE.Color();
  for (let y = 0; y < 64; y++) {
    shade.copy(palette.horizon).lerp(palette.skyTop, Math.min(1, y / 42));
    sky.set([Math.round(shade.r * 255), Math.round(shade.g * 255), Math.round(shade.b * 255), 255], y * 4);
  }
  const background = new THREE.DataTexture(sky, 1, 64, THREE.RGBAFormat);
  background.magFilter = THREE.LinearFilter;
  background.needsUpdate = true;
  scene.background = background;
  scene.fog = new THREE.Fog(palette.horizon, 18, 37);

  const material = (color: THREE.Color) => new THREE.MeshBasicMaterial({ color });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(70, 70), material(palette.ground));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.025;
  group.add(ground);

  // All scenery stays outside the authored court (half-width 7.62m,
  // near baseline z=-1.6m). The open center keeps the hoop silhouette clear.
  const structures = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), material(palette.structure), 9);
  const stamp = new THREE.Object3D();
  let structure = 0;
  const box = (x: number, y: number, z: number, width: number, height: number, depth: number) => {
    stamp.position.set(x, y, z); stamp.rotation.set(0, 0, 0); stamp.scale.set(width, height, depth);
    stamp.updateMatrix(); structures.setMatrixAt(structure++, stamp.matrix);
  };
  for (let row = 0; row < 3; row++) {
    box(0, (row + 1) * 0.24, -4.4 - row * 0.85, 17, (row + 1) * 0.48, 1.1);
    box(-9.2 - row * 0.85, (row + 1) * 0.24, 5, 1.1, (row + 1) * 0.48, 12);
    box(9.2 + row * 0.85, (row + 1) * 0.24, 5, 1.1, (row + 1) * 0.48, 12);
  }
  group.add(structures);
  const skyline = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), material(palette.distant), 18);
  for (let i = 0; i < 18; i++) {
    const height = 3.2 + ((i * 7) % 9) * 0.35;
    stamp.position.set((i - 8.5) * 2.7, height / 2 - 0.05, -18 - (i % 3) * 2);
    stamp.scale.set(2 + (i % 3) * 0.3, height, 1.7);
    stamp.updateMatrix(); skyline.setMatrixAt(i, stamp.matrix);
  }
  group.add(skyline);

  // Low, irregular tree crowns break up the skyline without a new model or
  // transparent texture. Shared meshes keep the complete scene to 8 calls.
  const trees = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 6, 4), material(palette.ground), 14);
  for (let i = 0; i < 14; i++) {
    stamp.position.set((i - 6.5) * 3.5, 0.9 + (i % 3) * 0.25, -11.5 - (i % 2) * 1.5);
    stamp.scale.set(1.8 + (i % 3) * 0.2, 1.4 + (i % 2) * 0.2, 1.1);
    stamp.updateMatrix(); trees.setMatrixAt(i, stamp.matrix);
  }
  group.add(trees);

  const people: Spectator[] = [];
  for (let row = 0; row < 2; row++) for (let i = 0; i < 24; i++) {
    people.push({ x: (i - 11.5) * 0.65, y: 0.46 + row * 0.49, z: -4.2 - row * 1.1, scale: 0.88 + (i % 4) * 0.04 });
  }
  for (const side of [-1, 1]) for (let i = 0; i < 12; i++) {
    people.push({ x: side * (9.1 + (i % 2) * 0.85), y: 0.46 + (i % 2) * 0.49, z: i * 0.8, scale: 0.88 + (i % 3) * 0.05 });
  }
  const bodyShape = new THREE.Shape();
  bodyShape.moveTo(-0.12, 0.1); bodyShape.lineTo(-0.17, 0.43);
  bodyShape.quadraticCurveTo(-0.18, 0.58, -0.08, 0.59);
  bodyShape.lineTo(0.08, 0.59); bodyShape.quadraticCurveTo(0.18, 0.58, 0.17, 0.43);
  bodyShape.lineTo(0.12, 0.1); bodyShape.lineTo(0.11, -0.17); bodyShape.lineTo(0.04, -0.17);
  bodyShape.lineTo(0, 0.08); bodyShape.lineTo(-0.04, -0.17); bodyShape.lineTo(-0.11, -0.17); bodyShape.closePath();
  const crowdMaterial = material(palette.crowd); crowdMaterial.side = THREE.DoubleSide;
  const bodies = new THREE.InstancedMesh(new THREE.ShapeGeometry(bodyShape, 3), crowdMaterial, SPECTATOR_COUNT);
  const heads = new THREE.InstancedMesh(new THREE.CircleGeometry(0.115, 10), crowdMaterial, SPECTATOR_COUNT);
  const arms = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.075, 0.36).translate(0, -0.14, 0), crowdMaterial, SPECTATOR_COUNT * 2);
  for (let i = 0; i < people.length; i++) {
    shade.copy(palette.crowd).lerp(palette.accent, (i % 5) * 0.18).offsetHSL((i % 3) * 0.04, 0.08, 0);
    bodies.setColorAt(i, shade); arms.setColorAt(i * 2, shade); arms.setColorAt(i * 2 + 1, shade);
    heads.setColorAt(i, shade.copy(palette.accent).lerp(palette.crowd, 0.25 + (i % 4) * 0.14));
  }
  for (const mesh of [bodies, heads, arms]) { mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); mesh.frustumCulled = false; group.add(mesh); }
  let facing = 0;
  const pose = (result: CrowdResult | null, progress: number, still = false) => {
    const reaction = crowdPose(result, progress, still);
    for (let i = 0; i < people.length; i++) {
      const person = people[i];
      const lift = reaction.lift * (0.8 + (i % 3) * 0.1);
      stamp.position.set(person.x, person.y + lift, person.z + reaction.lean);
      stamp.rotation.set(0, facing, 0); stamp.scale.setScalar(person.scale);
      stamp.updateMatrix(); bodies.setMatrixAt(i, stamp.matrix);
      stamp.translateY(0.76); stamp.updateMatrix(); heads.setMatrixAt(i, stamp.matrix);
      for (const side of [-1, 1]) {
        stamp.position.set(person.x, person.y + lift + person.scale * 0.53, person.z + reaction.lean);
        stamp.rotation.set(0, facing, 0); stamp.translateX(side * person.scale * 0.18);
        stamp.rotateZ(side * (0.2 + reaction.arms * 2.5));
        stamp.updateMatrix(); arms.setMatrixAt(i * 2 + (side === -1 ? 0 : 1), stamp.matrix);
      }
    }
    for (const mesh of [bodies, heads, arms]) mesh.instanceMatrix.needsUpdate = true;
  };
  pose(null, 0);
  return { pose, face: (position: THREE.Vector3) => { facing = Math.atan2(position.x, position.z + 5); },
    dispose: () => { if (scene.background === background) scene.background = null; background.dispose(); } };
}
