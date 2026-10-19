import { test } from "vitest";
import assert from "node:assert/strict";
import * as THREE from "three";
import { createFreeThrowEnvironment, crowdPose, CROWD_REACTION_MS, SPECTATOR_COUNT } from "./FreeThrowEnvironment";

const palette = { skyTop: new THREE.Color("slateblue"), horizon: new THREE.Color("silver"),
  ground: new THREE.Color("darkslategray"), structure: new THREE.Color("gray"),
  distant: new THREE.Color("dimgray"), crowd: new THREE.Color("silver"), accent: new THREE.Color("orange") };

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

test("environment stays within the geometry/call budget without lights, shadow maps or external assets", () => {
  const scene = new THREE.Scene();
  const environment = createFreeThrowEnvironment(scene, palette);
  let calls = 1; // Fullscreen sky background.
  let triangles = 0;
  scene.traverse(object => {
    assert.equal(object instanceof THREE.Light, false);
    if (!(object instanceof THREE.Mesh)) return;
    calls++;
    triangles += (object.geometry.index?.count ?? object.geometry.attributes.position.count) / 3 * (object instanceof THREE.InstancedMesh ? object.count : 1);
    assert.equal(object.castShadow, false);
    assert.equal(object.receiveShadow, false);
  });
  assert.ok(calls <= 10, `${calls} calls`);
  assert.ok(triangles <= 5000, `${triangles} triangles`);
  assert.equal(SPECTATOR_COUNT, 72);
  assert.ok(scene.background instanceof THREE.DataTexture);
  environment.dispose();
  assert.equal(scene.background, null);
});

test("crowd stays outside the playable court for all poses and never changes a camera", () => {
  const scene = new THREE.Scene();
  const environment = createFreeThrowEnvironment(scene, palette);
  const camera = new THREE.PerspectiveCamera(53, 1.5, 0.05, 40);
  camera.position.set(0, 2.5, 6.8);
  const before = camera.clone();
  environment.face(camera.position);
  for (const result of [null, { outcome: "made", streak: 3 }, { outcome: "miss", streak: 0 }] as const) {
    environment.pose(result, 0.5);
    for (const mesh of scene.children[0].children) {
      if (!(mesh instanceof THREE.InstancedMesh) || mesh.count < SPECTATOR_COUNT) continue;
      const matrix = new THREE.Matrix4(), position = new THREE.Vector3();
      for (let i = 0; i < mesh.count; i++) {
        mesh.getMatrixAt(i, matrix); position.setFromMatrixPosition(matrix);
        assert.ok(position.z < -3.5 || Math.abs(position.x) > 8.5);
        assert.ok(matrix.elements.every(Number.isFinite));
      }
    }
  }
  assert.deepEqual(camera.position, before.position);
  assert.equal(camera.fov, before.fov);
  environment.dispose();
});
