import { afterEach, test, vi } from "vitest";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as THREE from "three";
import { GLTFLoader, type GLTF } from "three/addons/loaders/GLTFLoader.js";
import { createFreeThrowEnvironment } from "./FreeThrowEnvironment";
import manifest from "../../public/3d/free-throw/environment/manifest.json";

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => { resolve = done; });
  return { promise, resolve };
}

function loadingFixture() {
  const geometry = new THREE.BoxGeometry(), material = new THREE.MeshStandardMaterial();
  const source = new THREE.Group(); source.add(new THREE.Mesh(geometry, material));
  const texture = new THREE.Texture<HTMLImageElement>();
  const geometryDisposed = vi.fn(), materialDisposed = vi.fn(), textureDisposed = vi.fn();
  geometry.addEventListener("dispose", geometryDisposed);
  material.addEventListener("dispose", materialDisposed);
  texture.addEventListener("dispose", textureDisposed);
  const parsed = deferred<GLTF>(), decoded = deferred<THREE.Texture<HTMLImageElement>>();
  const parse = vi.spyOn(GLTFLoader.prototype, "parseAsync").mockReturnValue(parsed.promise);
  const decode = vi.spyOn(THREE.TextureLoader.prototype, "loadAsync").mockReturnValue(decoded.promise);
  const revoke = vi.spyOn(URL, "revokeObjectURL");
  // Deliberately ignore the manifest's signal: cancellation must not wait for
  // a transport or decoder that never settles, nor adopt its late siblings.
  const fetch = vi.fn((url: string) => url.endsWith("manifest.json")
    ? new Promise<Response>(() => {}) : Promise.resolve(new Response(new Uint8Array([1, 2, 3]))));
  vi.stubGlobal("fetch", fetch);
  const result = { scene: source } as unknown as GLTF;
  return { parsed, decoded, parse, decode, revoke, fetch, result, texture,
    geometryDisposed, materialDisposed, textureDisposed };
}

test("aborting a never-settling manifest releases already decoded scenery immediately", async () => {
  const f = loadingFixture(), controller = new AbortController(), scene = new THREE.Scene();
  f.parsed.resolve(f.result); f.decoded.resolve(f.texture);
  const loading = createFreeThrowEnvironment(scene, controller.signal);
  await vi.waitFor(() => assert.equal(f.decode.mock.calls.length, 1));
  await Promise.resolve();
  controller.abort();
  await assert.rejects(loading, { name: "AbortError" });
  assert.equal(f.geometryDisposed.mock.calls.length, 1);
  assert.equal(f.materialDisposed.mock.calls.length, 1);
  assert.equal(f.textureDisposed.mock.calls.length, 1);
  assert.equal(f.revoke.mock.calls.length, 1);
  assert.equal(scene.children.length, 0);
});

test("late geometry and image decodes after cancellation are disposed without mounting", async () => {
  const f = loadingFixture(), controller = new AbortController(), scene = new THREE.Scene();
  const loading = createFreeThrowEnvironment(scene, controller.signal);
  await vi.waitFor(() => { assert.equal(f.parse.mock.calls.length, 1); assert.equal(f.decode.mock.calls.length, 1); });
  controller.abort(); await assert.rejects(loading, { name: "AbortError" });
  f.parsed.resolve(f.result); f.decoded.resolve(f.texture);
  await vi.waitFor(() => assert.equal(f.textureDisposed.mock.calls.length, 1));
  assert.equal(f.geometryDisposed.mock.calls.length, 1);
  assert.equal(f.materialDisposed.mock.calls.length, 1);
  assert.equal(f.revoke.mock.calls.length, 1);
  assert.equal(scene.children.length, 0);
});

test("an already aborted creation starts no scenery requests", async () => {
  const f = loadingFixture(), controller = new AbortController(); controller.abort();
  await assert.rejects(createFreeThrowEnvironment(new THREE.Scene(), controller.signal), { name: "AbortError" });
  assert.equal(f.fetch.mock.calls.length, 0);
  assert.equal(f.parse.mock.calls.length, 0); assert.equal(f.decode.mock.calls.length, 0);
});

test("an optional request failure also disposes siblings that decode later", async () => {
  const f = loadingFixture(), scene = new THREE.Scene();
  f.fetch.mockImplementation(url => Promise.resolve(url.endsWith("manifest.json")
    ? new Response(null, { status: 503 }) : new Response(new Uint8Array([1, 2, 3]))));
  await assert.rejects(createFreeThrowEnvironment(scene), /manifest unavailable/);
  f.parsed.resolve(f.result); f.decoded.resolve(f.texture);
  await vi.waitFor(() => assert.equal(f.textureDisposed.mock.calls.length, 1));
  assert.equal(f.geometryDisposed.mock.calls.length, 1);
  assert.equal(f.materialDisposed.mock.calls.length, 1);
  assert.equal(scene.children.length, 0);
});

test("cancellation owns a fully mounted result through handoff and dispose remains idempotent", async () => {
  const bytes = readFileSync("public/3d/free-throw/environment/outdoor.glb");
  const gltf = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), "");
  const geometries = new Set<THREE.BufferGeometry>();
  gltf.scene.traverse(object => { if (object instanceof THREE.Mesh) geometries.add(object.geometry); });
  const disposed = vi.fn(); for (const geometry of geometries) geometry.addEventListener("dispose", disposed);
  const f = loadingFixture(), controller = new AbortController(), scene = new THREE.Scene();
  f.parsed.resolve(gltf); f.decoded.resolve(f.texture);
  f.fetch.mockImplementation(url => Promise.resolve(url.endsWith("manifest.json")
    ? new Response(JSON.stringify(manifest)) : new Response(new Uint8Array([1, 2, 3]))));
  vi.stubGlobal("window", { matchMedia: () => ({ matches: false }) });
  const environment = await createFreeThrowEnvironment(scene, controller.signal);
  assert.ok(scene.children.length > 0);
  controller.abort();
  assert.equal(scene.children.length, 0);
  assert.equal(disposed.mock.calls.length, geometries.size); assert.equal(f.textureDisposed.mock.calls.length, 1);
  environment.dispose(); environment.dispose();
  assert.equal(disposed.mock.calls.length, geometries.size); assert.equal(f.textureDisposed.mock.calls.length, 1);
});
