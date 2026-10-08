import { test } from "vitest";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import manifest from "../../../../public/3d/free-throw/ASSET_MANIFEST.json";
import { PRACTICE_ASSETS, PRACTICE_COURT } from "../../../domain/arcade/free-throw";

type Gltf = {
  asset: { version: string };
  buffers: { uri?: string }[];
  images: { uri?: string; bufferView?: number }[];
  extensionsRequired?: string[];
  nodes: { name?: string; translation?: number[]; scale?: number[] }[];
  meshes: { primitives: { indices: number; attributes: { POSITION: number }; mode?: number }[] }[];
  accessors: { count: number; min?: number[]; max?: number[] }[];
  materials: {
    alphaMode?: string;
    pbrMetallicRoughness: { baseColorTexture?: { index: number }; metallicRoughnessTexture?: { index: number }; baseColorFactor?: number[] };
    normalTexture?: { index: number };
    occlusionTexture?: { index: number };
  }[];
};
const near = (a: number, b: number, tolerance = 1e-5) => assert.ok(Math.abs(a - b) < tolerance, `${a} differs from ${b}`);
function readGlb(name: string): Gltf {
  const bytes = readFileSync(`public/3d/free-throw/${name}`);
  assert.equal(bytes.readUInt32LE(0), 0x46546c67);
  assert.equal(bytes.readUInt32LE(4), 2);
  assert.equal(bytes.readUInt32LE(8), bytes.length);
  assert.equal(bytes.readUInt32LE(16), 0x4e4f534a);
  return JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString());
}

test("shipped GLBs are self-contained, bounded meshes with original PBR maps", () => {
  const files = [["GOAT_HOOPERS_Basketball.glb", 3968], [manifest.court.file, 576], [manifest.hoop.file, 3866]] as const;
  for (const [file, expected] of files) {
    const gltf = readGlb(file);
    assert.equal(gltf.asset.version, "2.0");
    assert.deepEqual(gltf.extensionsRequired ?? [], []);
    assert.ok(gltf.buffers.every(buffer => !buffer.uri));
    assert.ok(gltf.images.every(image => !image.uri && image.bufferView !== undefined));
    const count = gltf.meshes.flatMap(mesh => mesh.primitives).reduce((triangles, primitive) => {
      assert.equal(primitive.mode ?? 4, 4);
      return triangles + gltf.accessors[primitive.indices].count / 3;
    }, 0);
    assert.equal(count, expected);
    assert.ok(gltf.nodes.every(node => !node.scale || node.scale.every(value => value === 1)));
  }
  for (const file of ["GOAT_HOOPERS_Basketball.glb", manifest.court.file]) {
    const material = readGlb(file).materials[0];
    assert.ok(material.pbrMetallicRoughness.baseColorTexture);
    assert.ok(material.pbrMetallicRoughness.metallicRoughnessTexture);
    assert.ok(material.normalTexture);
    assert.ok(material.occlusionTexture);
  }
  const glass = readGlb(manifest.hoop.file).materials.find(material => material.alphaMode === "BLEND");
  assert.ok(glass);
  near(glass.pbrMetallicRoughness.baseColorFactor![3], 0.16);
});

test("exported ball bounds and hoop anchors match the physics contract", () => {
  const ball = readGlb("GOAT_HOOPERS_Basketball.glb");
  const bounds = ball.accessors[ball.meshes[0].primitives[0].attributes.POSITION];
  // Tessellated sphere extrema may fall just inside the nominal radius.
  bounds.min!.forEach(value => near(value, -PRACTICE_COURT.ballRadius, 0.001));
  bounds.max!.forEach(value => near(value, PRACTICE_COURT.ballRadius, 0.001));
  const hoop = readGlb(manifest.hoop.file);
  for (const [name, position] of Object.entries(manifest.hoop.anchors)) {
    const anchor = hoop.nodes.find(node => node.name === name);
    assert.ok(anchor?.translation, `Missing ${name}`);
    anchor.translation.forEach((value, axis) => near(value, position[axis]));
  }
  near(PRACTICE_COURT.rim.radius - PRACTICE_COURT.rim.tubeRadius, manifest.hoop.rim_inner_radius);
  near(PRACTICE_COURT.rim.scoringHeight, manifest.hoop.rim_top_center[1]);
});

test("near-hoop court translation puts the release on the exported free-throw line", () => {
  assert.equal(manifest.units, "meters");
  assert.equal(manifest.gltf_axes.up, "+Y");
  near(PRACTICE_ASSETS.courtOffset.z, 12.7248);
  near(PRACTICE_COURT.release.z, manifest.court.free_throw_line_z[0] + PRACTICE_ASSETS.courtOffset.z);
  const court = readGlb(manifest.court.file);
  const bounds = court.accessors[court.meshes[0].primitives[0].attributes.POSITION];
  near(bounds.max![0] - bounds.min![0], manifest.court.width_m);
  near(bounds.max![2] - bounds.min![2], manifest.court.length_m);
});
