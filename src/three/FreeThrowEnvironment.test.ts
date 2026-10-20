import { test } from "vitest";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import manifest from "../../public/3d/free-throw/environment/manifest.json";
import { PRACTICE_COURT } from "@/domain/arcade/free-throw";
import { shootingPositions } from "@/surfaces/arcade/free-throw/positions";
import { mountFreeThrowEnvironment, spectatorLod, crowdPose, CROWD_REACTION_MS, SPECTATOR_COUNT } from "./FreeThrowEnvironment";

test("completed-result cues are finite, bounded, distinct and neutral at both ends", () => {
  assert.ok(CROWD_REACTION_MS <= 450);
  for (const result of [{ outcome: "made", streak: 1 }, { outcome: "made", streak: 3 }, { outcome: "miss", streak: 0 }] as const) {
    assert.deepEqual(crowdPose(result, -1), { lift: 0, arms: 0, lean: result.outcome === "miss" ? -0 : 0 });
    for (const progress of [0, 0.1, 0.5, 0.9, 1, 5]) {
      const pose = crowdPose(result, progress);
      assert.ok(pose.lift >= 0 && pose.lift <= 0.13);
      assert.ok(pose.arms >= 0 && pose.arms <= 1);
      assert.ok(pose.lean >= -0.09 && pose.lean <= 0);
    }
    assert.ok(Math.abs(crowdPose(result, 1).lift) < 1e-12);
    assert.ok(Math.abs(crowdPose(result, 1).arms) < 1e-12);
    assert.ok(Math.abs(crowdPose(result, 1).lean) < 1e-12);
  }
  assert.ok(crowdPose({ outcome: "made", streak: 3 }, 0.5).arms > crowdPose({ outcome: "made", streak: 2 }, 0.5).arms);
  assert.equal(crowdPose({ outcome: "miss", streak: 0 }, 0.5).arms, 0);
  assert.deepEqual(crowdPose(null, 0.5), { lift: 0, arms: 0, lean: 0 });
});

test("reduced motion uses a stable distinct pose instead of a timeline", () => {
  for (const outcome of ["made", "miss"] as const) {
    assert.deepEqual(crowdPose({ outcome, streak: 4 }, 0, true), crowdPose({ outcome, streak: 4 }, 1, true));
  }
  assert.ok(crowdPose({ outcome: "made", streak: 4 }, 0, true).arms > 0);
  assert.ok(crowdPose({ outcome: "miss", streak: 0 }, 0, true).lean < 0);
});
test("compressed geometry is byte-identical to the standard GLB fallback", () => {
  const raw = readFileSync("public/3d/free-throw/environment/outdoor.glb");
  const gzip = readFileSync("public/3d/free-throw/environment/outdoor.glb.gz");
  assert.deepEqual(gunzipSync(gzip), raw);
  assert.equal(raw.byteLength, manifest.asset_bytes);
  assert.equal(gzip.byteLength, manifest.gzip_bytes);
});

async function fixture(mobile = false) {
  const bytes = readFileSync("public/3d/free-throw/environment/outdoor.glb");
  const gltf = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), "");
  const scene = new THREE.Scene(), sky = new THREE.Texture();
  const environment = mountFreeThrowEnvironment(scene, gltf.scene, sky, manifest, mobile);
  return { scene, environment, source: gltf.scene, sky };
}

test("shipped Blender LODs stay within the measured geometry/call envelope at all nine origins", async () => {
  const { scene, environment } = await fixture();
  for (const portrait of [false, true]) for (const origin of shootingPositions(PRACTICE_COURT)) {
    const camera = new THREE.PerspectiveCamera(portrait ? 62 : 53, portrait ? 390 / 844 : 1.5, .05, 260);
    const away = new THREE.Vector3(origin.x, 0, origin.z).normalize();
    camera.position.set(origin.x + away.x * 2.609, origin.y + .6, origin.z + away.z * 2.609);
    camera.lookAt(0, origin.y + .6, 0);
    const before = camera.clone();
    environment.face(camera);
    let calls = 1, triangles = 0;
    scene.traverse(object => {
      assert.equal(object instanceof THREE.Light, false);
      if (!(object instanceof THREE.Mesh)) return;
      const count = object instanceof THREE.InstancedMesh ? object.count : 1;
      if (!count) return;
      calls++; triangles += (object.geometry.index?.count ?? object.geometry.attributes.position.count) / 3 * count;
      if (object.name !== "Outdoor_Sky") assert.ok(object.geometry.attributes.color);
      assert.equal(object.castShadow, false);
    });
    assert.ok(calls <= 52, String(calls));
    assert.ok(triangles <= 650_000, String(triangles));
    const counts = environment.inspect();
    assert.equal(counts.sourceSpectators, 416);
    assert.ok(counts.visibleSpectators > 30 && counts.visibleSpectators <= 416);
    assert.deepEqual(camera.position, before.position); assert.equal(camera.fov, before.fov);
  }
  environment.dispose();
}, 15000);

test("source placements stay outside the court and near/far LOD decisions follow camera distance", () => {
  assert.equal(manifest.spectators.length, SPECTATOR_COUNT);
  for (const person of manifest.spectators) {
    assert.ok(person.position[2] < -3.5 || Math.abs(person.position[0]) > 8.5);
    assert.ok([...person.position, ...person.scale, person.rotation].every(Number.isFinite));
    assert.equal(spectatorLod(person, new THREE.Vector3(...person.position)), "near");
    assert.equal(spectatorLod(person, new THREE.Vector3(0, 2.5, 100)), "far");
  }
});

test("actual morphs change only for a completed visual cue and settle; disposal owns every derived resource", async () => {
  const { scene, environment, source, sky } = await fixture();
  const camera = new THREE.PerspectiveCamera(53, 1.5, .05, 260);
  camera.position.set(0, 2.5, 6.8); camera.lookAt(0, 2.5, 0); environment.face(camera);
  const meshes: THREE.InstancedMesh[] = [];
  scene.traverse(object => { if (object instanceof THREE.InstancedMesh && object.count) meshes.push(object); });
  const positions = (mesh: THREE.Mesh) => (mesh.geometry.getAttribute("position") as THREE.BufferAttribute).array;
  const rest = meshes.map(m => Float32Array.from(positions(m)));
  const weight = () => meshes.reduce((sum, m, j) => sum + Array.from(positions(m)).reduce((s, n, i) => s + Math.abs(n - rest[j][i]), 0), 0);
  assert.ok(meshes.every(mesh => mesh.morphTexture === null));
  environment.pose(null, .5); assert.equal(weight(), 0);
  environment.pose({ outcome: "made", streak: 3 }, .5); assert.ok(weight() > 1);
  environment.pose({ outcome: "miss", streak: 0 }, .5); assert.ok(weight() > 1);
  environment.pose(null, 0); assert.equal(weight(), 0);
  const geometries = new Set<THREE.BufferGeometry>(); source.traverse(o => { if (o instanceof THREE.Mesh) geometries.add(o.geometry); });
  let disposed = 0, skyDisposed = 0;
  for (const geometry of geometries) geometry.addEventListener("dispose", () => disposed++);
  sky.addEventListener("dispose", () => skyDisposed++);
  environment.dispose(); environment.dispose();
  assert.equal(scene.children.length, 0); assert.equal(scene.background, null);
  assert.equal(disposed, geometries.size); assert.equal(skyDisposed, 1);
}, 15000);

test("phone scenery uses far instancing and vertex lighting while retaining all source placements", async () => {
  const { scene, environment } = await fixture(true);
  const camera = new THREE.PerspectiveCamera(62, 390 / 844, .05, 260);
  camera.position.set(0, 2.5, 6.8); camera.lookAt(0, 2.5, 0); environment.face(camera);
  assert.equal(environment.inspect().near, 0); assert.equal(environment.inspect().lighting, "vertex-lit");
  assert.equal(environment.inspect().sourceSpectators, 416);
  scene.traverse(object => {
    if (object instanceof THREE.Mesh && object.name !== "Outdoor_Sky") assert.ok(object.material instanceof THREE.MeshLambertMaterial);
  });
  environment.dispose();
}, 15000);
