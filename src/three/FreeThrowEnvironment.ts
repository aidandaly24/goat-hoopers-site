import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export type CrowdResult = { outcome: "made" | "miss"; streak: number };
export const CROWD_REACTION_MS = 420;
export const SPECTATOR_COUNT = 416;
const ROOT = "/3d/free-throw/environment/";

/** One bounded settle, never an idle loop or a source of gameplay state. */
export function crowdPose(result: CrowdResult | null, progress: number, still = false) {
  if (!result) return { lift: 0, arms: 0, lean: 0 };
  const made = result.outcome === "made";
  const strength = made && result.streak >= 3 ? 1 : 0.65;
  const beat = still ? 0.45 : Math.sin(Math.PI * Math.max(0, Math.min(1, progress)));
  return { lift: made ? beat * strength * 0.13 : 0,
    arms: made ? beat * strength : 0,
    lean: made ? 0 : -beat * 0.09 };
}

export type Spectator = { variant: string; position: number[]; rotation: number; scale: number[]; group: number };
export type OutdoorManifest = { version: number; source_spectator_count: number; spectators: Spectator[] };
type Batch = { mesh: THREE.InstancedMesh; source: THREE.Mesh; variant: string; group: number;
  lod: "near" | "far"; people: Spectator[]; target: number; weight: number };

/** Kept pure for export-contract and every-shot-position coverage checks. */
export function spectatorLod(person: Spectator, camera: THREE.Vector3, portrait = false) {
  const [x, y, z] = person.position;
  return Math.hypot(x - camera.x, y + 0.8 - camera.y, z - camera.z) < (portrait ? 11.5 : 14) ? "near" : "far";
}

async function loadGeometry(loader: GLTFLoader, signal: AbortSignal) {
  // Explicit gzip asset: no reliance on the host compressing GLB binaries.
  const compressed = typeof DecompressionStream !== "undefined";
  const response = await fetch(ROOT + (compressed ? "outdoor.glb.gz" : "outdoor.glb"), { signal });
  if (!response.ok) throw new Error("Outdoor geometry unavailable");
  const bytes = await response.arrayBuffer();
  const header = new Uint8Array(bytes, 0, Math.min(2, bytes.byteLength));
  const buffer = compressed && header[0] === 31 && header[1] === 139
    ? await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"))).arrayBuffer()
    : bytes; // A host may already have applied Content-Encoding.
  return loader.parseAsync(buffer, ROOT);
}

async function loadSky(signal: AbortSignal) {
  const response = await fetch(ROOT + "sky.jpg", { signal });
  if (!response.ok) throw new Error("Outdoor sky unavailable");
  const url = URL.createObjectURL(await response.blob());
  try { return await new THREE.TextureLoader().loadAsync(url); }
  finally { URL.revokeObjectURL(url); }
}

function release(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>();
  root.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    geometries.add(object.geometry);
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material);
  });
  for (const geometry of geometries) geometry.dispose();
  for (const material of materials) material.dispose();
}

/** Original Blender art, derived LODs, baked occlusion and instanced cohorts.
 * No lights, camera movement, physics, scoring or frame scheduling is owned here.
 */
export async function createFreeThrowEnvironment(scene: THREE.Scene, signal = new AbortController().signal) {
  let source: THREE.Object3D | null = null, sky: THREE.Texture | null = null;
  let active = true;
  const cancelled = () => signal.reason ?? new DOMException("Outdoor scenery cancelled", "AbortError");
  const cleanup = () => {
    active = false;
    if (source) { release(source); source = null; }
    if (sky) { sky.dispose(); sky = null; }
  };
  let onAbort = () => {};
  const aborted = new Promise<never>((_, reject) => {
    onAbort = () => { cleanup(); reject(cancelled()); };
    signal.addEventListener("abort", onAbort, { once: true });
  });
  try {
    signal.throwIfAborted();
    const loaded = await Promise.race([Promise.all([
      loadGeometry(new GLTFLoader(), signal).then(value => {
        if (!active) { release(value.scene); throw cancelled(); }
        source = value.scene; return source;
      }),
      loadSky(signal).then(value => {
        if (!active) { value.dispose(); throw cancelled(); }
        sky = value; return sky;
      }),
      fetch(ROOT + "manifest.json", { signal }).then(response => {
        if (!response.ok) throw new Error("Outdoor placement manifest unavailable");
        return response.json() as Promise<OutdoorManifest>;
      }),
    ]), aborted]);
    signal.throwIfAborted();
    // Mount takes ownership, including cleanup if construction itself throws.
    source = null; sky = null;
    const mobile = window.matchMedia("(max-width: 40rem), (pointer: coarse)").matches;
    const environment = mountFreeThrowEnvironment(scene, loaded[0], loaded[1], loaded[2], mobile);
    // Keep cancellation owning the mounted result through the promise handoff:
    // a required-load failure can abort before its caller's .then runs.
    const dispose = () => {
      signal.removeEventListener("abort", dispose); environment.dispose();
    };
    signal.addEventListener("abort", dispose, { once: true });
    return { ...environment, dispose };
  } catch (error) {
    cleanup(); throw error;
  } finally {
    active = false; signal.removeEventListener("abort", onAbort);
  }
}

/** The loading seam is separate so offline checks exercise the shipped GLB. */
export function mountFreeThrowEnvironment(scene: THREE.Scene, source: THREE.Object3D, sky: THREE.Texture, manifest: OutdoorManifest, mobile = false) {
  const group = new THREE.Group(); group.name = "practice-environment";
  const skyGeometry = new THREE.SphereGeometry(200, 64, 32);
  const skyMaterial = new THREE.MeshBasicMaterial({ map: sky, side: THREE.BackSide, depthWrite: false, depthTest: false, toneMapped: false });
  const skyDome = new THREE.Mesh(skyGeometry, skyMaterial);
  skyDome.name = "Outdoor_Sky"; skyDome.renderOrder = -1000; skyDome.frustumCulled = false;
  skyDome.rotation.y = Math.PI / 2; // Center of the original Blender panorama faces the hoop.
  const batches: Batch[] = [];
  const arrays = new Set<object>(); let geometryBytes = 0;
  const account = (attribute: THREE.BufferAttribute | THREE.InterleavedBufferAttribute) => {
    const array = attribute instanceof THREE.InterleavedBufferAttribute ? attribute.data.array : attribute.array;
    if (!arrays.has(array)) { arrays.add(array); geometryBytes += array.byteLength; }
  };
  source.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    const geometry = object.geometry as THREE.BufferGeometry;
    for (const attribute of Object.values(geometry.attributes)) account(attribute);
    if (geometry.index) account(geometry.index);
    for (const attributes of Object.values(geometry.morphAttributes)) for (const attribute of attributes) account(attribute);
  });
  try {
    if (manifest.version !== 1 || manifest.source_spectator_count !== SPECTATOR_COUNT || manifest.spectators.length !== SPECTATOR_COUNT) throw new Error("Outdoor asset version mismatch");
    source.updateMatrixWorld(true);
    if (mobile) {
      const lightweight = new Map<THREE.Material, THREE.MeshLambertMaterial>();
      source.traverse(object => {
        if (!(object instanceof THREE.Mesh)) return;
        const simplify = (original: THREE.Material) => {
          if (!(original instanceof THREE.MeshStandardMaterial)) return original;
          let material = lightweight.get(original);
          if (!material) {
            material = new THREE.MeshLambertMaterial({ color: original.color, vertexColors: original.vertexColors,
              side: original.side, opacity: original.opacity, transparent: original.transparent });
            material.name = original.name + " · phone vertex lighting"; lightweight.set(original, material);
          }
          return material;
        };
        object.material = Array.isArray(object.material) ? object.material.map(simplify) : simplify(object.material);
      });
      for (const original of lightweight.keys()) original.dispose();
    }
    // Retain the source's window/metal/skin/cloth surfaces in one draw material.
    const materials = new Set<THREE.MeshStandardMaterial | THREE.MeshLambertMaterial>();
    source.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return;
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
        if (material instanceof THREE.MeshStandardMaterial || material instanceof THREE.MeshLambertMaterial) materials.add(material);
      }
    });
    for (const material of materials) {
      material.onBeforeCompile = shader => {
        shader.vertexShader = "attribute vec3 _surface; varying vec3 vSurface;\n" + shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\nvSurface = _surface;");
        shader.fragmentShader = "varying vec3 vSurface;\n" + shader.fragmentShader;
        shader.fragmentShader = shader.fragmentShader.replace("#include <roughnessmap_fragment>", "#include <roughnessmap_fragment>\nroughnessFactor = max(0.04, vSurface.x);");
        shader.fragmentShader = shader.fragmentShader.replace("#include <metalnessmap_fragment>", "#include <metalnessmap_fragment>\nmetalnessFactor = vSurface.y;");
        shader.fragmentShader = shader.fragmentShader.replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\ntotalEmissiveRadiance += vSurface.z * diffuseColor.rgb;");
      };
      material.customProgramCacheKey = () => "goat-outdoor-source-surfaces-v1";
    }
    const staticModel = source.getObjectByName("Outdoor_Static");
    if (!(staticModel instanceof THREE.Mesh)) throw new Error("Outdoor architecture missing");
    group.add(staticModel.clone());
    const cohorts = new Map(manifest.spectators.map(person => [person.variant + ":" + person.group, { variant: person.variant, group: person.group }]));
    const lods: ("near" | "far")[] = mobile ? ["far"] : ["near", "far"];
    for (const { variant, group: reactionGroup } of cohorts.values()) for (const lod of lods) {
      const model = source.getObjectByName(variant + "_" + lod);
      if (!(model instanceof THREE.Mesh) || !model.morphTargetInfluences || !model.morphTargetDictionary
        || !["Applause", "Cheer", "Disappointment"].every(name => name in model.morphTargetDictionary!)) throw new Error("Outdoor crowd model missing");
      const capacity = manifest.spectators.filter(person => person.variant === variant && person.group === reactionGroup).length;
      // Blend once per shared cohort only during the finite result cue. The GPU
      // then renders ordinary instancing, without per-instance morph textures.
      const sourceGeometry = model.geometry as THREE.BufferGeometry;
      const geometry = new THREE.BufferGeometry(); geometry.setIndex(sourceGeometry.index);
      for (const [name, attribute] of Object.entries(sourceGeometry.attributes)) {
        const value = name === "position" || name === "normal" ? attribute.clone() : attribute;
        if (name === "position" || name === "normal") {
          if (value instanceof THREE.InterleavedBufferAttribute) value.data.setUsage(THREE.DynamicDrawUsage);
          else value.setUsage(THREE.DynamicDrawUsage);
          account(value);
        }
        geometry.setAttribute(name, value);
      }
      const mesh = new THREE.InstancedMesh(geometry, model.material, capacity);
      mesh.name = variant + "_" + lod + "_g" + reactionGroup;
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      mesh.count = 0;
      group.add(mesh); batches.push({ mesh, source: model, variant, group: reactionGroup, lod, people: [], target: -1, weight: 0 });
    }
    sky.mapping = THREE.UVMapping; sky.colorSpace = THREE.SRGBColorSpace;
    // Direct sampling avoids a large automatic background cubemap allocation.
    group.add(skyDome); scene.background = null; scene.fog = null;
    scene.add(group);
    let currentResult: CrowdResult | null = null, currentProgress = 0, currentStill = false;
    const stamp = new THREE.Object3D();
    const pose = (result: CrowdResult | null, progress: number, still = false) => {
      currentResult = result; currentProgress = progress; currentStill = still;
      const reaction = crowdPose(result, progress, still);
      for (const batch of batches) {
        if (!batch.people.length) continue;
        const variation = 0.86 + batch.group * 0.025;
        const weight = result?.outcome === "made" ? reaction.arms * variation : result ? Math.abs(reaction.lean) / .09 * variation : 0;
        const name = result?.outcome === "made" ? batch.group % 3 ? "Cheer" : "Applause" : "Disappointment";
        const target = weight > 1e-12 ? batch.source.morphTargetDictionary![name] : -1;
        if (target !== batch.target || weight !== batch.weight) {
          for (const attributeName of ["position", "normal"] as const) {
            const base = batch.source.geometry.getAttribute(attributeName) as THREE.BufferAttribute;
            const delta = target >= 0 ? batch.source.geometry.morphAttributes[attributeName]?.[target] as THREE.BufferAttribute | undefined : undefined;
            const output = batch.mesh.geometry.getAttribute(attributeName) as THREE.BufferAttribute;
            const values = output.array as Float32Array, original = base.array as Float32Array;
            if (!delta || target < 0) values.set(original);
            else for (let i = 0; i < values.length; i++) values[i] = original[i] + (batch.source.geometry.morphTargetsRelative ? delta.array[i] : delta.array[i] - original[i]) * weight;
            output.needsUpdate = true;
          }
          batch.target = target; batch.weight = weight;
        }
        for (let i = 0; i < batch.people.length; i++) {
          const person = batch.people[i];
          stamp.position.fromArray(person.position); stamp.position.y += reaction.lift * variation;
          stamp.rotation.set(0, person.rotation, 0); stamp.scale.fromArray(person.scale); stamp.updateMatrix();
          batch.mesh.setMatrixAt(i, stamp.matrix);
        }
        batch.mesh.instanceMatrix.needsUpdate = true;
      }
    };
    const face = (camera: THREE.PerspectiveCamera) => {
      camera.updateMatrixWorld();
      skyDome.position.copy(camera.position);
      const frustum = new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
      const sphere = new THREE.Sphere(); sphere.radius = 1.4;
      for (const batch of batches) batch.people = [];
      for (const person of manifest.spectators) {
        sphere.center.fromArray(person.position); sphere.center.y += 1;
        if (!frustum.intersectsSphere(sphere)) continue;
        const lod = mobile ? "far" : spectatorLod(person, camera.position, camera.aspect < 1);
        const batch = batches.find(value => value.variant === person.variant && value.group === person.group && value.lod === lod)!;
        batch.people.push(person);
      }
      for (const batch of batches) {
        batch.mesh.count = batch.people.length; batch.mesh.visible = batch.people.length > 0;
        batch.mesh.frustumCulled = false;
      }
      pose(currentResult, currentProgress, currentStill);
    };
    let disposed = false;
    return { sky, pose, face,
      inspect: () => ({ sourceSpectators: SPECTATOR_COUNT, lighting: mobile ? "vertex-lit" : "pbr", geometryBytes: disposed ? 0 : geometryBytes,
        visibleSpectators: batches.reduce((sum, batch) => sum + batch.people.length, 0),
        near: batches.filter(batch => batch.lod === "near").reduce((sum, batch) => sum + batch.people.length, 0),
        far: batches.filter(batch => batch.lod === "far").reduce((sum, batch) => sum + batch.people.length, 0) }),
      dispose: () => {
        if (disposed) return; disposed = true;
        scene.remove(group);
        for (const batch of batches) { batch.mesh.dispose(); batch.mesh.geometry.dispose(); }
        release(source); source.clear(); group.clear(); batches.length = 0;
        skyGeometry.dispose(); skyMaterial.dispose(); sky.dispose();
      } };
  } catch (error) {
    scene.remove(group); for (const batch of batches) { batch.mesh.dispose(); batch.mesh.geometry.dispose(); }
    release(source); skyGeometry.dispose(); skyMaterial.dispose(); sky.dispose(); throw error;
  }
}
