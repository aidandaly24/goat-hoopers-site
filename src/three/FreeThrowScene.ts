import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import type { PracticeAim, PracticeAssetPack, PracticeBall, PracticeCourt } from "@/domain/arcade/free-throw";
import { createFreeThrowEnvironment, CROWD_REACTION_MS, type CrowdResult } from "./FreeThrowEnvironment";

export type PracticeView = {
  draw: (ball: PracticeBall, guide: { aim: PracticeAim; points: THREE.Vector3[] } | null, reduced: boolean) => void;
  react: (result: CrowdResult | null, reduced: boolean) => void;
  dispose: () => void;
  inspect?: () => { calls: number; triangles: number; frame: number; geometries: number; textures: number;
    programs: number; inView: boolean; reflectionBytes: number; contextLost: boolean;
    crowd: { sourceSpectators: number; lighting: string; geometryBytes: number; visibleSpectators: number; near: number; far: number } | null };
};

/** Metre-scale render adapter. Authored GLB materials/transforms are kept;
 * colliders arrive separately from the manifest, never from mesh triangles.
 */
export async function createFreeThrowScene(
  mount: HTMLElement, court: PracticeCourt, assets: PracticeAssetPack, onContextLost: () => void,
): Promise<PracticeView> {
  const tokens = getComputedStyle(mount);
  const color = (name: string) => new THREE.Color(tokens.getPropertyValue(name).trim());
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.AgXToneMapping;
  renderer.setClearColor(color("--gh-bg"));
  renderer.domElement.setAttribute("aria-hidden", "true");
  mount.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#b8ccd9");
  let scenery: Awaited<ReturnType<typeof createFreeThrowEnvironment>> | null = null;
  const camera = new THREE.PerspectiveCamera(53, 1, 0.05, 260);
  camera.position.set(0, 2.5, 6.8);
  camera.lookAt(0, 2.5, 0);
  scene.add(new THREE.HemisphereLight(0xc9dfef, 0x675e4b, 2));
  const keyLight = new THREE.DirectionalLight(0xffe0b9, 2.2);
  keyLight.position.set(-8, 14, 10);
  scene.add(keyLight);

  let disposed = false;
  let lost = false;
  let observer: ResizeObserver | null = null;
  let intersection: IntersectionObserver | null = null;
  let environment: THREE.WebGLRenderTarget | null = null;
  let reactionRaf = 0;
  let reactionDeadline: ReturnType<typeof setTimeout> | null = null;
  let reaction: CrowdResult | null = null;
  let reactionProgress = 0;
  let reactionStill = false;
  let inView = true;
  let visibilityChanged = () => {};
  const stopReaction = () => {
    cancelAnimationFrame(reactionRaf); reactionRaf = 0;
    if (reactionDeadline !== null) clearTimeout(reactionDeadline);
    reactionDeadline = null;
  };
  const contextLost = (event: Event) => { event.preventDefault(); lost = true; stopReaction(); onContextLost(); };
  renderer.domElement.addEventListener("webglcontextlost", contextLost);
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    stopReaction();
    observer?.disconnect();
    intersection?.disconnect();
    document.removeEventListener("visibilitychange", visibilityChanged);
    renderer.domElement.removeEventListener("webglcontextlost", contextLost);
    scenery?.dispose();
    scenery = null;
    disposeResources(scene);
    environment?.dispose();
    environment = null; scene.clear(); scene.environment = null;
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement.remove();
  };
  try {
    const loader = new GLTFLoader();
    const [ballResult, courtResult, hoopResult, sceneryResult] = await Promise.allSettled([
      loader.loadAsync(assets.ball), loader.loadAsync(assets.court), loader.loadAsync(assets.hoop),
      createFreeThrowEnvironment(scene),
    ]);
    if (sceneryResult.status === "fulfilled") scenery = sceneryResult.value;
    // Collect successful siblings even on failure so decoded textures are
    // disposed rather than leaking when one of the three files cannot load.
    for (const result of [ballResult, courtResult, hoopResult]) {
      if (result.status === "fulfilled") scene.add(result.value.scene);
    }
    if (ballResult.status === "rejected") throw ballResult.reason;
    if (courtResult.status === "rejected") throw courtResult.reason;
    if (hoopResult.status === "rejected") throw hoopResult.reason;
    if (lost || renderer.getContext().isContextLost()) throw new Error("WebGL context lost during asset loading");

    const ball = ballResult.value.scene;
    const courtModel = courtResult.value.scene;
    courtModel.position.set(assets.courtOffset.x, assets.courtOffset.y, assets.courtOffset.z);
    // The standalone hoop stays at local origin. Neither it nor the ball
    // is resized or re-centered; their exported units are already metres.
    const room = new RoomEnvironment();
    const pmrem = new THREE.PMREMGenerator(renderer);
    try {
      if (scenery) {
        // Keep the original 2K sky background; reflections need less resolution.
        const image = document.createElement("canvas");
        image.width = mount.clientWidth < mount.clientHeight ? 512 : 1024; image.height = image.width / 2;
        const context = image.getContext("2d");
        if (context) {
          context.drawImage(scenery.sky.image as CanvasImageSource, 0, 0, image.width, image.height);
          const reflection = new THREE.CanvasTexture(image); reflection.colorSpace = THREE.SRGBColorSpace;
          try { environment = pmrem.fromEquirectangular(reflection); } finally { reflection.dispose(); }
        } else environment = pmrem.fromEquirectangular(scenery.sky);
      } else environment = pmrem.fromScene(room, 0.04);
      scene.environment = environment.texture;
    }
    finally { room.dispose(); pmrem.dispose(); }

    const shadow = new THREE.Mesh(new THREE.CircleGeometry(court.ballRadius * 1.5, 24),
      new THREE.MeshBasicMaterial({ color: color("--gh-bg"), transparent: true, opacity: 0.3, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2;
    scene.add(shadow);
    const guideLine = new THREE.Line(new THREE.BufferGeometry(),
      new THREE.LineDashedMaterial({ color: color("--gh-gold-soft"), dashSize: 0.06, gapSize: 0.065, transparent: true, opacity: 0.65 }));
    scene.add(guideLine);
    const reticle = new THREE.Mesh(new THREE.RingGeometry(0.055, 0.068, 32),
      new THREE.MeshBasicMaterial({ color: color("--gh-gold-soft"), depthTest: false, transparent: true, opacity: 0.8 }));
    reticle.renderOrder = 2;
    scene.add(reticle);

    // Available to browser QA without exposing engine details in the HUD.
    renderer.domElement.dataset.assets = "basketball court hoop";
    renderer.domElement.dataset.courtOffsetZ = String(assets.courtOffset.z);
    let lastBall: PracticeBall | null = null;
    let lastGuide: Parameters<PracticeView["draw"]>[1] = null;
    let lastReduced = false;
    let guideKey = "";
    let originKey = "";
    const draw: PracticeView["draw"] = (state, guide, reduced) => {
      if (disposed || lost) return;
      lastBall = state; lastGuide = guide; lastReduced = reduced;
      if (!state.finished && reaction) {
        stopReaction(); reaction = null; reactionProgress = 0; reactionStill = false;
        scenery?.pose(null, 0);
        renderer.domElement.dataset.crowdReaction = "none";
        renderer.domElement.dataset.crowdMotion = "idle";
      } else if (reduced && reaction && !reactionStill) {
        stopReaction(); reactionStill = true;
        scenery?.pose(reaction, reactionProgress, true);
        renderer.domElement.dataset.crowdMotion = "still";
      }
      const newOrigin = [state.origin.x, state.origin.y, state.origin.z].join(",");
      if (newOrigin !== originKey) {
        originKey = newOrigin;
        const away = new THREE.Vector3(state.origin.x - court.rim.center.x, 0, state.origin.z - court.rim.center.z).normalize();
        camera.position.set(state.origin.x + away.x * 2.609, state.origin.y + 0.6, state.origin.z + away.z * 2.609);
        camera.lookAt(court.rim.center.x, state.origin.y + 0.6, court.rim.center.z);
        scenery?.face(camera);
        scenery?.pose(reaction, reactionProgress, reactionStill);
        renderer.domElement.dataset.shotOrigin = newOrigin;
      }
      ball.position.set(state.position.x, state.position.y, state.position.z);
      ball.rotation.set(reduced ? 0 : -state.time * 4, 0, reduced ? 0 : state.time * 0.4);
      shadow.position.set(state.position.x, 0.003, state.position.z);
      shadow.scale.setScalar(1 + state.position.y * 0.14);
      guideLine.visible = !!guide;
      reticle.visible = !!guide;
      if (guide) {
        const [start, next] = guide.points;
        const fraction = (court.rim.center.z + 0.05 - start.z) / (next.z - start.z);
        reticle.position.set(start.x + (next.x - start.x) * fraction, court.rim.scoringHeight, court.rim.center.z + 0.05);
        const key = originKey + ":" + guide.aim.direction + ":" + guide.aim.power;
        if (key !== guideKey) {
          guideKey = key;
          guideLine.geometry.dispose();
          guideLine.geometry = new THREE.BufferGeometry().setFromPoints(guide.points);
          guideLine.computeLineDistances();
        }
      }
      renderer.render(scene, camera);
    };
    const redraw = () => { if (lastBall) draw(lastBall, lastGuide, lastReduced); };
    const completeReaction = () => {
      stopReaction();
      if (disposed || lost || !reaction) return;
      reactionProgress = 1;
      scenery?.pose(reaction, 1);
      renderer.domElement.dataset.crowdMotion = "idle";
      if (!document.hidden && inView) redraw();
    };
    const settleReaction = () => {
      stopReaction(); reactionStill = true;
      scenery?.pose(reaction, reactionProgress, true);
      renderer.domElement.dataset.crowdMotion = reaction ? "still" : "idle";
    };
    // The React score owner calls this only for a completed result. The
    // renderer cannot alter score, shot timing, retry or the simulation.
    const react: PracticeView["react"] = (result, reduced) => {
      if (disposed || lost) return;
      stopReaction();
      reaction = lastBall?.finished ? result : null;
      reactionProgress = 0; reactionStill = reduced || document.hidden || !inView;
      // First paint belongs to the same finite budget, including a slow GPU.
      const started = performance.now();
      renderer.domElement.dataset.crowdReaction = !reaction ? "none" : reaction.outcome === "made" && reaction.streak >= 3 ? "streak" : reaction.outcome;
      renderer.domElement.dataset.crowdMotion = !reaction ? "idle" : reactionStill ? "still" : "animated";
      scenery?.pose(reaction, 0, reactionStill);
      if (!document.hidden && inView) redraw();
      if (!reaction || reactionStill) return;
      const remaining = CROWD_REACTION_MS - (performance.now() - started);
      if (remaining <= 0) { completeReaction(); return; }
      reactionDeadline = setTimeout(completeReaction, remaining);
      const frame = () => {
        reactionRaf = 0;
        if (disposed || lost || !reaction || document.hidden || !inView) return;
        reactionProgress = Math.min(1, (performance.now() - started) / CROWD_REACTION_MS);
        scenery?.pose(reaction, reactionProgress);
        redraw();
        if (reactionProgress < 1 && performance.now() - started < CROWD_REACTION_MS) reactionRaf = requestAnimationFrame(frame);
        else completeReaction();
      };
      reactionRaf = requestAnimationFrame(frame);
    };
    const resize = () => {
      if (disposed || lost) return;
      const width = Math.max(mount.clientWidth, 1), height = Math.max(mount.clientHeight, 1);
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.fov = camera.aspect < 1 ? 62 : 53;
      camera.updateProjectionMatrix();
      scenery?.face(camera);
      if (lastBall) draw(lastBall, lastGuide, lastReduced);
    };
    observer = new ResizeObserver(resize);
    observer.observe(mount);
    visibilityChanged = () => {
      if (document.hidden) settleReaction();
      else if (inView) redraw();
    };
    document.addEventListener("visibilitychange", visibilityChanged);
    intersection = new IntersectionObserver(entries => {
      inView = entries[0]?.isIntersecting ?? false;
      if (!inView) settleReaction();
      else if (!document.hidden) redraw();
    });
    intersection.observe(mount);
    renderer.domElement.dataset.environment = scenery ? "blender-outdoor" : "unavailable";
    renderer.domElement.dataset.crowdMotion = "idle";
    resize();
    return { draw, react, dispose, inspect: () => ({ calls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles, frame: renderer.info.render.frame,
      geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures,
      programs: renderer.info.programs?.length ?? 0, inView,
      contextLost: renderer.getContext().isContextLost(),
      reflectionBytes: environment ? environment.width * environment.height * 4 * (environment.texture.type === THREE.HalfFloatType ? 2 : 1) : 0,
      crowd: scenery?.inspect() ?? null }) };
  } catch (error) {
    dispose();
    throw error;
  }
}

function disposeResources(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  root.traverse(object => {
    if (object instanceof THREE.InstancedMesh) object.dispose();
    const mesh = object as THREE.Mesh;
    if (mesh.geometry) geometries.add(mesh.geometry);
    if (mesh.material) (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach(material => {
      materials.add(material);
      for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value);
    });
  });
  geometries.forEach(geometry => geometry.dispose());
  materials.forEach(material => material.dispose());
  textures.forEach(texture => {
    texture.dispose();
    if (typeof ImageBitmap !== "undefined" && texture.image instanceof ImageBitmap) texture.image.close();
  });
}

export const guideVectors = (points: { x: number; y: number; z: number }[]) =>
  points.map(point => new THREE.Vector3(point.x, point.y, point.z));
