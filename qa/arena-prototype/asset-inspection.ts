import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import "@/ui/tokens.css";
import "@/app/globals.css";

const host = document.querySelector<HTMLElement>("#asset-stage")!;
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(host.clientWidth, host.clientHeight); host.append(renderer.domElement);
const style = getComputedStyle(document.documentElement);
const scene = new THREE.Scene(); scene.background = new THREE.Color(style.getPropertyValue("--gh-bg-hover").trim());
const lightColor = style.getPropertyValue("--gh-scene-text").trim();
scene.add(new THREE.HemisphereLight(lightColor, style.getPropertyValue("--gh-control").trim(), 3));
const key = new THREE.DirectionalLight(lightColor, 3); key.position.set(3, 8, 7); scene.add(key);
const camera = new THREE.PerspectiveCamera(35, host.clientWidth / host.clientHeight, .1, 100);
camera.position.set(7, 5, 18); camera.lookAt(0, 2.2, 0);
const loader = new GLTFLoader();
const ids = ["yard-basketball-post-b71ee3", "match-scoreboard-58f51e", "trophy-cabinet-e963ac"];
const urls = import.meta.glob("./assets/polyfork/*.glb", { eager: true, query: "?url", import: "default" }) as unknown as Record<string, string>;
const records = [];
for (const [index, id] of ids.entries()) {
  const url = urls[`./assets/polyfork/${id}.glb`];
  const gltf = await loader.loadAsync(url);
  gltf.scene.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(gltf.scene);
  let triangles = 0, geometryBytes = 0, meshes = 0;
  const materials = new Set<THREE.Material>();
  gltf.scene.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    meshes++; triangles += object.geometry.index ? object.geometry.index.count / 3 : object.geometry.attributes.position.count / 3;
    for (const name of Object.keys(object.geometry.attributes)) geometryBytes += object.geometry.getAttribute(name).array.byteLength;
    geometryBytes += object.geometry.index?.array.byteLength ?? 0;
    (Array.isArray(object.material) ? object.material : [object.material]).forEach(material => materials.add(material));
  });
  records.push({ id, bounds: { min: bounds.min.toArray(), max: bounds.max.toArray(), size: bounds.getSize(new THREE.Vector3()).toArray() }, meshes, materials: materials.size, triangles, geometryBytes,
    clips: gltf.animations.map(clip => ({ name: clip.name, duration: clip.duration, tracks: clip.tracks.map(track => track.name) })), animationPlayback: false });
  gltf.scene.position.x = (index - 1) * 4;
  scene.add(gltf.scene);
}
renderer.render(scene, camera);
const receipt = { records, renderer: { calls: renderer.info.render.calls, triangles: renderer.info.render.triangles, geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures } };
document.querySelector("#asset-receipt")!.textContent = JSON.stringify(receipt, null, 2);
Object.assign(window, { goatAssetInspection: receipt });
