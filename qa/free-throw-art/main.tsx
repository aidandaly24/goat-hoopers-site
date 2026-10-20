import { createRoot } from "react-dom/client";
import { FreeThrowPractice } from "@/surfaces/arcade/free-throw/FreeThrowPractice";
import { PRACTICE_ASSETS, PRACTICE_COURT } from "@/domain/arcade/free-throw";
import { createFreeThrowScene } from "@/three/FreeThrowScene";
import { readyBall } from "@/surfaces/arcade/free-throw/physics";
import { shootingPositions } from "@/surfaces/arcade/free-throw/positions";
import "@/ui/tokens.css";
import "./review.css";

const params = new URLSearchParams(location.search);
const gpu = { calls: 0, triangles: 0 };
const contexts = new Set<WebGL2RenderingContext>();
const nativeGetContext = HTMLCanvasElement.prototype.getContext;
Object.defineProperty(HTMLCanvasElement.prototype, "getContext", { value: function(this: HTMLCanvasElement, ...args: unknown[]) {
  const result = Reflect.apply(nativeGetContext, this, args);
  if (args[0] === "webgl2" && result) contexts.add(result as WebGL2RenderingContext);
  return result;
} });
const visibility = { inView: null as boolean | null };
const NativeIntersectionObserver = window.IntersectionObserver;
window.IntersectionObserver = class extends NativeIntersectionObserver {
  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    super((entries, observer) => { visibility.inView = entries[0]?.isIntersecting ?? false; callback(entries, observer); }, options);
  }
};
// Fixture-only measurement, shared with the unchanged #206 baseline renderer.
for (const method of ["drawElements", "drawArrays", "drawElementsInstanced", "drawArraysInstanced"] as const) {
  const original = WebGL2RenderingContext.prototype[method];
  Object.defineProperty(WebGL2RenderingContext.prototype, method, { value: function(this: WebGL2RenderingContext, ...values: number[]) {
    const count = method.startsWith("drawElements") ? values[1] : values[2];
    const instances = method === "drawElementsInstanced" ? values[4] : method === "drawArraysInstanced" ? values[3] : 1;
    if (count > 0 && instances > 0) { gpu.calls++; if (values[0] === this.TRIANGLES) gpu.triangles += count / 3 * instances; }
    return Reflect.apply(original, this, values);
  } });
}
Object.assign(window, { qaGpu: gpu, qaContexts: contexts, qaVisibility: visibility });
if (params.get("mode") === "scene") {
  const mount = document.getElementById("root")!;
  mount.className = "scene";
  const view = await createFreeThrowScene(mount, PRACTICE_COURT, PRACTICE_ASSETS, () => { mount.dataset.contextLost = "true"; });
  let ball = readyBall(PRACTICE_COURT);
  const draw = () => view.draw(ball, null, false);
  draw();
  Object.assign(window, { artQA: {
    stats: () => view.inspect?.(),
    draw,
    capture: () => {
      draw(); mount.querySelector("canvas")!.getContext("webgl2")!.finish();
      return mount.querySelector("canvas")!.toDataURL("image/png");
    },
    spot: (index: number) => { ball = readyBall(PRACTICE_COURT, shootingPositions(PRACTICE_COURT)[index]); draw(); },
    react: (outcome: "made" | "miss", streak = 1, reduced = false) => {
      ball = { ...ball, finished: true }; draw(); view.react({ outcome, streak }, reduced);
    },
    reset: () => { ball = { ...ball, finished: false }; draw(); },
    dispose: view.dispose,
    bench: async (count = 20) => {
      const gl = mount.querySelector("canvas")!.getContext("webgl2")!;
      const pixel = new Uint8Array(4);
      const times = [], submission = []; let sample = { calls: 0, triangles: 0 };
      const samplingStarted = performance.now();
      for (let i = 0; i < count; i++) {
        if (i >= 3 && performance.now() - samplingStarted > 5000) break;
        // Measure on-demand draws, not headless compositor/vsync scheduling.
        await new Promise(resolve => setTimeout(resolve, 0));
        const before = { ...gpu };
        const start = performance.now(); draw(); submission.push(performance.now() - start);
        gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel); times.push(performance.now() - start);
        sample = { calls: gpu.calls - before.calls, triangles: gpu.triangles - before.triangles };
      }
      const sorted = times.toSorted((a, b) => a - b);
      const cpu = submission.toSorted((a, b) => a - b);
      return { samples: times.length, method: "Completed draw plus one-pixel readback; GPU/CPU readback cost included, not an FPS measurement",
        medianMs: sorted[Math.floor(sorted.length / 2)], p95Ms: sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * .95))],
        cpuSubmissionMedianMs: cpu[Math.floor(cpu.length / 2)],
        renderer: gl.getParameter(gl.getExtension("WEBGL_debug_renderer_info")?.UNMASKED_RENDERER_WEBGL ?? gl.RENDERER),
        drawingBuffer: [gl.drawingBufferWidth, gl.drawingBufferHeight], sample, stats: view.inspect?.() };
    },
  } });
  mount.dataset.ready = "true";
} else {
  const root = createRoot(document.getElementById("root")!);
  Object.assign(window, { artGameQA: { unmount: () => root.unmount() } });
  root.render(<FreeThrowPractice court={PRACTICE_COURT} assets={PRACTICE_ASSETS} />);
}
