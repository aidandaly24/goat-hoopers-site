import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import type { PracticeAim, PracticeAssetPack, PracticeBall, PracticeCourt } from "@/domain/arcade/free-throw";

export type PracticeView = {
  draw: (ball: PracticeBall, guide: { aim: PracticeAim; points: THREE.Vector3[] } | null, reduced: boolean) => void;
  dispose: () => void;
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
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.setClearColor(color("--gh-bg"));
  renderer.domElement.setAttribute("aria-hidden", "true");
  mount.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(color("--gh-bg"), 13, 23);
  const camera = new THREE.PerspectiveCamera(53, 1, 0.05, 40);
  camera.position.set(0, 2.5, 6.8);
  camera.lookAt(0, 2.5, 0);
  scene.add(new THREE.HemisphereLight(color("--gh-text"), color("--gh-bg-raised"), 1.8));
  const keyLight = new THREE.DirectionalLight(color("--gh-text"), 3);
  keyLight.position.set(-3, 8, 4);
  scene.add(keyLight);

  let disposed = false;
  let lost = false;
  let observer: ResizeObserver | null = null;
  let environment: THREE.WebGLRenderTarget | null = null;
  const contextLost = (event: Event) => { event.preventDefault(); lost = true; onContextLost(); };
  renderer.domElement.addEventListener("webglcontextlost", contextLost);
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    observer?.disconnect();
    renderer.domElement.removeEventListener("webglcontextlost", contextLost);
    disposeResources(scene);
    environment?.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  };
  try {
    const loader = new GLTFLoader();
    const [ballResult, courtResult, hoopResult] = await Promise.allSettled([
      loader.loadAsync(assets.ball), loader.loadAsync(assets.court), loader.loadAsync(assets.hoop),
    ]);
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
    try { environment = pmrem.fromScene(room, 0.04); scene.environment = environment.texture; }
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
      const newOrigin = [state.origin.x, state.origin.y, state.origin.z].join(",");
      if (newOrigin !== originKey) {
        originKey = newOrigin;
        const away = new THREE.Vector3(state.origin.x - court.rim.center.x, 0, state.origin.z - court.rim.center.z).normalize();
        camera.position.set(state.origin.x + away.x * 2.609, state.origin.y + 0.6, state.origin.z + away.z * 2.609);
        camera.lookAt(court.rim.center.x, state.origin.y + 0.6, court.rim.center.z);
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
    const resize = () => {
      if (disposed || lost) return;
      const width = Math.max(mount.clientWidth, 1), height = Math.max(mount.clientHeight, 1);
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.fov = camera.aspect < 1 ? 62 : 53;
      camera.updateProjectionMatrix();
      if (lastBall) draw(lastBall, lastGuide, lastReduced);
    };
    observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();
    return { draw, dispose };
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
