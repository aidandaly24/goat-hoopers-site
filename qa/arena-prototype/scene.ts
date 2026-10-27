import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

type Status = "ready" | "unavailable";
type Metrics = { active: boolean; frames: number; drawCalls: number; triangles: number; pixelRatio: number; props: number; failedProps: number; contexts: number };
declare global { interface Window { goatArenaMetrics?: Metrics } }

// These files appear ONLY after fetch-assets.py structurally inspects the GLBs.
// No downloaded code or remote ES modules are imported/executed.
const assets = import.meta.glob("./assets/*.glb", { eager: true, query: "?url", import: "default" }) as unknown as Record<string, string>;

export async function mountArena(host: HTMLElement, onStatus: (status: Status) => void) {
  const renderer = new THREE.WebGLRenderer({ alpha: false, antialias: true, powerPreference: "low-power", preserveDrawingBuffer: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  host.append(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-30, 30, 22, -22, .1, 180);
  camera.position.set(29, 31, 35);
  camera.lookAt(0, 0, 0);
  const rootStyle = getComputedStyle(document.documentElement);
  const role = (token: string) => rootStyle.getPropertyValue(token).trim();
  const palette = {
    bg: role("--gh-scene-bg"), raised: role("--gh-scene-raised"), floor: role("--gh-scene-control"),
    paint: role("--gh-scene-hover"), line: role("--gh-scene-muted"), text: role("--gh-scene-text"),
    accent: role("--gh-accent"), muted: role("--gh-scene-faint"), rim: role("--gh-scene-accent"),
  };
  scene.background = new THREE.Color(palette.bg);
  scene.fog = new THREE.Fog(palette.bg, 60, 112);
  scene.add(new THREE.HemisphereLight(palette.text, palette.bg, 2.4));
  const light = new THREE.DirectionalLight(palette.text, 3.2);
  light.position.set(-15, 30, 20);
  scene.add(light);
  const fill = new THREE.DirectionalLight(palette.accent, 2);
  fill.position.set(20, 10, -20);
  scene.add(fill);
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  const geometries = new Set<THREE.BufferGeometry>();
  function material(color: string, emissive = false) {
    const value = new THREE.MeshStandardMaterial({ color, roughness: .85,
      ...(emissive ? { emissive: color, emissiveIntensity: .45 } : {}) });
    materials.add(value); return value;
  }
  const steel = material(palette.paint), aisle = material(palette.floor), seats = material(palette.raised);
  const strip = material(palette.accent, true), white = material(palette.text), rim = material(palette.rim);
  function box(w: number, h: number, d: number, x: number, y: number, z: number, mat: THREE.Material) {
    const geometry = new THREE.BoxGeometry(w, h, d); geometries.add(geometry);
    const mesh = new THREE.Mesh(geometry, mat); mesh.position.set(x, y, z); scene.add(mesh); return mesh;
  }
  // Original lightweight arena and full court. No catalog claim for geometry.
  box(57, .4, 44, 0, -.45, 0, steel);
  box(35, .22, 23, 0, -.12, 0, aisle);
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = 2048; textureCanvas.height = 1024;
  const context = textureCanvas.getContext("2d")!;
  context.fillStyle = palette.floor; context.fillRect(0, 0, 2048, 1024);
  // Subtle timber board rhythm, in the site's slate material palette.
  for (let row = 0; row < 40; row++) {
    context.fillStyle = row % 2 ? palette.paint : palette.line;
    context.globalAlpha = .08; context.fillRect(0, row * 25.6, 2048, 1.5);
    for (let col = 0; col < 9; col++) context.fillRect(col * 245 + row % 3 * 70, row * 25.6, 1, 25.6);
  }
  context.globalAlpha = 1;
  const sx = 2048 / 28, sy = 1024 / 15;
  context.save(); context.scale(sx, sy);
  context.fillStyle = palette.paint;
  context.fillRect(0, 5.05, 5.8, 4.9); context.fillRect(22.2, 5.05, 5.8, 4.9);
  context.strokeStyle = palette.line; context.lineWidth = .055;
  const line = (x1: number, y1: number, x2: number, y2: number) => { context.beginPath(); context.moveTo(x1, y1); context.lineTo(x2, y2); context.stroke(); };
  const arc = (x: number, y: number, r: number, start = 0, end = Math.PI * 2) => { context.beginPath(); context.arc(x, y, r, start, end); context.stroke(); };
  context.strokeRect(.15, .15, 27.7, 14.7); line(14, .15, 14, 14.85);
  arc(14, 7.5, 1.8); context.strokeRect(.15, 5.05, 5.65, 4.9); context.strokeRect(22.2, 5.05, 5.65, 4.9);
  arc(5.8, 7.5, 1.8); arc(22.2, 7.5, 1.8);
  arc(1.6, 7.5, 6.75, -Math.PI / 2, Math.PI / 2); arc(26.4, 7.5, 6.75, Math.PI / 2, Math.PI * 1.5);
  arc(1.6, 7.5, 1.25, -Math.PI / 2, Math.PI / 2); arc(26.4, 7.5, 1.25, Math.PI / 2, Math.PI * 1.5);
  line(.15, .75, 1.6, .75); line(.15, 14.25, 1.6, 14.25); line(26.4, .75, 27.85, .75); line(26.4, 14.25, 27.85, 14.25);
  context.restore();
  context.fillStyle = palette.floor; context.beginPath(); context.ellipse(1024, 512, 115, 105, 0, 0, Math.PI * 2); context.fill();
  context.fillStyle = palette.text; context.textAlign = "center"; context.font = "800 82px Inter, sans-serif"; context.fillText("GOAT", 1024, 536);
  context.font = "600 17px Inter, sans-serif"; context.fillText("H O O P E R S", 1024, 565);
  const floorTexture = new THREE.CanvasTexture(textureCanvas); floorTexture.colorSpace = THREE.SRGBColorSpace;
  textures.add(floorTexture);
  const floorMaterial = new THREE.MeshStandardMaterial({ map: floorTexture, roughness: .76 }); materials.add(floorMaterial);
  const floorGeometry = new THREE.PlaneGeometry(28, 15); geometries.add(floorGeometry);
  const floor = new THREE.Mesh(floorGeometry, floorMaterial); floor.rotation.x = -Math.PI / 2; floor.position.y = .015; scene.add(floor);

  // Shared geometry + instanced seats: the whole audience uses two draw calls.
  const seatGeometry = new THREE.BoxGeometry(.42, .5, .48); geometries.add(seatGeometry);
  const backsGeometry = new THREE.BoxGeometry(.42, .55, .09); geometries.add(backsGeometry);
  const count = 6 * 64 * 2;
  const seatInstances = new THREE.InstancedMesh(seatGeometry, seats, count);
  const backs = new THREE.InstancedMesh(backsGeometry, aisle, count);
  const matrix = new THREE.Matrix4(); let seatIndex = 0;
  for (const side of [-1, 1]) for (let row = 0; row < 6; row++) {
    const z = side * (12 + row * .9), y = .65 + row * .62;
    box(40, .35, .9, 0, y - .4, z, aisle);
    for (let column = 0; column < 64; column++) {
      const x = (column - 31.5) * .58 + (column > 31 ? .7 : -.7);
      matrix.makeTranslation(x, y, z); seatInstances.setMatrixAt(seatIndex, matrix);
      matrix.makeTranslation(x, y + .45, z + side * .23); backs.setMatrixAt(seatIndex++, matrix);
    }
  }
  scene.add(seatInstances, backs);
  for (const side of [-1, 1]) {
    box(42, .9, .25, 0, .5, side * 10.5, steel);
    box(42, .08, .28, 0, 1, side * 10.5, strip);
    box(45, 1.2, .5, 0, 5, side * 18, steel);
    for (let column = 0; column < 7; column++) box(.16, 12, .16, -24 + column * 8, 6, side * 19, aisle);
    for (let beam = 0; beam < 5; beam++) box(.14, .14, 40, -20 + beam * 10, 12, 0, aisle);
  }
  // Original static backboards provide an honest court while optional props are unavailable.
  for (const side of [-1, 1]) {
    box(.25, 3, .25, side * 15, 1.5, 0, steel);
    box(1.6, .14, .15, side * 14.3, 3, 0, steel);
    box(.08, 1.05, 1.8, side * 12.95, 3.5, 0, white);
    const geometry = new THREE.TorusGeometry(.24, .027, 5, 20); geometries.add(geometry);
    const hoop = new THREE.Mesh(geometry, rim); hoop.rotation.x = Math.PI / 2; hoop.position.set(side * 12.55, 3.05, 0); scene.add(hoop);
  }
  // A wide, restrained arena ribbon, never a fake live scoreboard.
  const signCanvas = document.createElement("canvas"); signCanvas.width = 1024; signCanvas.height = 128;
  const sign = signCanvas.getContext("2d")!; sign.fillStyle = palette.paint; sign.fillRect(0, 0, 1024, 128);
  sign.fillStyle = palette.text; sign.font = "600 42px Inter, sans-serif"; sign.textAlign = "center"; sign.fillText("GOAT   /   HOME OF THE HOOPERS", 512, 80);
  const signTexture = new THREE.CanvasTexture(signCanvas); signTexture.colorSpace = THREE.SRGBColorSpace; textures.add(signTexture);
  const signMaterial = new THREE.MeshBasicMaterial({ map: signTexture }); materials.add(signMaterial);
  box(18, 1.8, .1, 0, 6.3, -18, signMaterial);

  const metrics: Metrics = { active: true, frames: 0, drawCalls: 0, triangles: 0, pixelRatio: 1, props: 0, failedProps: 0, contexts: 1 };
  window.goatArenaMetrics = metrics;
  let disposed = false, frame: number | null = null;
  const abort = new AbortController();
  function render() {
    frame = null;
    if (disposed || document.hidden) return;
    const width = window.innerWidth, height = window.innerHeight;
    const ratio = Math.min(devicePixelRatio, 1.5, Math.sqrt(1_600_000 / (width * height)));
    renderer.setPixelRatio(ratio); renderer.setSize(width, height);
    const halfWidth = width / height < .8 ? 23 : 31;
    const halfHeight = halfWidth * height / width;
    camera.left = -halfWidth; camera.right = halfWidth; camera.top = halfHeight; camera.bottom = -halfHeight;
    camera.updateProjectionMatrix(); renderer.render(scene, camera);
    metrics.frames++; metrics.drawCalls = renderer.info.render.calls; metrics.triangles = renderer.info.render.triangles; metrics.pixelRatio = ratio;
    // Reuse this one still-rendered scene as the full-page material, including
    // screenshot capture below the viewport. No second renderer or scroll loop.
    document.documentElement.style.setProperty("--arena-poster", `url("${renderer.domElement.toDataURL("image/webp", .84)}")`);
    onStatus("ready");
  }
  function requestFrame() { if (!disposed && frame === null && !document.hidden) frame = requestAnimationFrame(render); }
  const resize = new ResizeObserver(requestFrame); resize.observe(host);
  const theme = new MutationObserver(requestFrame); theme.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  const visible = () => { if (document.hidden && frame !== null) { cancelAnimationFrame(frame); frame = null; } else if (!document.hidden) requestFrame(); };
  document.addEventListener("visibilitychange", visible);
  function disposeObject(object: THREE.Object3D) {
    object.traverse(child => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        for (const mat of Array.isArray(child.material) ? child.material : [child.material]) {
          for (const value of Object.values(mat)) if (value instanceof THREE.Texture) value.dispose();
          mat.dispose();
        }
      }
    });
  }
  function dispose() {
    if (disposed) return;
    disposed = true; abort.abort();
    if (frame !== null) cancelAnimationFrame(frame);
    resize.disconnect(); theme.disconnect(); document.removeEventListener("visibilitychange", visible);
    renderer.domElement.removeEventListener("webglcontextlost", contextLost);
    disposeObject(scene); geometries.forEach(geometry => geometry.dispose()); materials.forEach(value => value.dispose()); textures.forEach(value => value.dispose());
    renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
    document.documentElement.style.removeProperty("--arena-poster"); metrics.active = false;
  }
  function contextLost(event: Event) { event.preventDefault(); dispose(); onStatus("unavailable"); }
  renderer.domElement.addEventListener("webglcontextlost", contextLost);
  requestFrame();
  const loader = new GLTFLoader();
  // All optional prop files are reviewed local binary data; parse no external URLs.
  for (const [path, url] of Object.entries(assets)) {
    void fetch(url, { signal: abort.signal }).then(response => {
      if (!response.ok) throw new Error("Local asset unavailable"); return response.arrayBuffer();
    }).then(buffer => loader.parseAsync(buffer, "")).then(gltf => {
      if (disposed) { disposeObject(gltf.scene); return; }
      const object = gltf.scene;
      if (path.includes("basketball-post")) { object.position.set(-15, 0, -5); object.rotation.y = Math.PI / 2; }
      else if (path.includes("scoreboard")) { object.position.set(0, 1.5, -19); object.scale.setScalar(2.5); }
      else if (path.includes("cabinet")) { object.position.set(20, 0, -5); object.rotation.y = -Math.PI / 2; object.scale.setScalar(2); }
      scene.add(object); metrics.props++; requestFrame();
    }).catch(error => { if (!disposed && error.name !== "AbortError") metrics.failedProps++; });
  }
  return { dispose, redraw: requestFrame };
}
