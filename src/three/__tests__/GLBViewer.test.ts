import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { type ReactElement } from "react";
import * as THREE from "three";
import type { GLTF } from "three/addons/loaders/GLTFLoader.js";
import { GLBViewer, type GLBViewerProps } from "../GLBViewer";
import { PropViewer } from "../PropViewer";

// Exercise the component's actual effect with browser/renderer fakes, without
// adding a DOM package. Effect replay is modeled explicitly below; this suite
// does not claim real React/browser mounting or physical WebGL verification.
const hooks = vi.hoisted(() => ({
  mount: null as unknown,
  failed: false,
  effect: undefined as (() => void | (() => void)) | undefined,
  setFailed: vi.fn(),
}));
const fakes = vi.hoisted(() => ({ renderer: vi.fn(), load: vi.fn() }));
vi.mock("react", async (original) => ({
  ...await original<typeof import("react")>(),
  useRef: (initial: unknown) => ({ current: initial === null ? hooks.mount : initial }),
  useState: () => [hooks.failed, hooks.setFailed],
  useEffect: (effect: () => void | (() => void)) => { hooks.effect = effect; },
}));
vi.mock("three", async (original) => ({
  ...await original<typeof import("three")>(),
  WebGLRenderer: fakes.renderer,
}));
vi.mock("three/addons/loaders/GLTFLoader.js", () => ({
  GLTFLoader: class { loadAsync = fakes.load; },
}));

class Canvas extends EventTarget {
  parentElement: unknown = null;
  tabIndex = -1;
  style: Record<string, string> = {};
  attributes: Record<string, string> = {};
  setAttribute(name: string, value: string) { this.attributes[name] = value; }
}

class MotionPreference extends EventTarget {
  matches = false;
  change(matches: boolean) {
    this.matches = matches;
    this.dispatchEvent(new Event("change"));
  }
}
class PageVisibility extends EventTarget {
  hidden = false;
  change(hidden: boolean) {
    this.hidden = hidden;
    this.dispatchEvent(new Event("visibilitychange"));
  }
}

let canvas: Canvas;
let renderer: { domElement: Canvas; setPixelRatio: ReturnType<typeof vi.fn>; setSize: ReturnType<typeof vi.fn>; render: ReturnType<typeof vi.fn>; dispose: ReturnType<typeof vi.fn> };
let mount: { clientWidth: number; clientHeight: number; appendChild: ReturnType<typeof vi.fn>; removeChild: ReturnType<typeof vi.fn> };
let resize: () => void;
let disconnect: ReturnType<typeof vi.fn>;
let observe: ReturnType<typeof vi.fn>;
let frames: Map<number, FrameRequestCallback>;
let nextFrame: number;
let resolveLoad: (asset: GLTF) => void;
let rejectLoad: (error: Error) => void;
let motion: MotionPreference;
let page: PageVisibility;
let windowEvents: EventTarget;
let intersect: (visible: boolean) => void;
let intersectionDisconnect: ReturnType<typeof vi.fn>;
let frameTime: number;

function component(props: Partial<GLBViewerProps> = {}) {
  const element = GLBViewer({ src: "/offline.glb", clickClips: ["spin", "jump", "dunk"], fallback: "Static jersey", ...props });
  const render = () => (element.type as (props: GLBViewerProps) => ReactElement<{ children: unknown }>)(element.props);
  render();
  const cleanup = hooks.effect!() as () => void;
  return { cleanup, render };
}

function asset() {
  const geometry = new THREE.BoxGeometry();
  const texture = new THREE.Texture();
  const material = new THREE.MeshStandardMaterial({ map: texture });
  const model = new THREE.Group();
  // Shared resources must be disposed once, even through multiple scenes.
  model.add(new THREE.Mesh(geometry, material), new THREE.Mesh(geometry, [material, material]));
  const unusedScene = new THREE.Group();
  unusedScene.add(new THREE.Mesh(geometry, material));
  const skeleton = new THREE.Skeleton([]);
  const boneTexture = new THREE.DataTexture();
  skeleton.boneTexture = boneTexture;
  const skinned = new THREE.SkinnedMesh(geometry, material);
  skinned.skeleton = skeleton;
  skinned.boundingBox = new THREE.Box3(new THREE.Vector3(-0.5, -0.5, -0.5), new THREE.Vector3(0.5, 0.5, 0.5));
  model.add(skinned);
  const disposers = [geometry, material, texture, skeleton, boneTexture].map((resource) => vi.spyOn(resource, "dispose"));
  const animations = ["idle", "spin", "jump", "dunk"].map((name) => new THREE.AnimationClip(name, 0.1, []));
  return {
    gltf: { scene: model, scenes: [model, unusedScene], animations } as GLTF,
    disposers,
  };
}

async function load(gltf = asset().gltf) {
  resolveLoad(gltf);
  await Promise.resolve();
  await Promise.resolve();
}

function frame(time = frameTime + 50) {
  const [id, callback] = [...frames][0];
  frames.delete(id);
  frameTime = time;
  callback(time);
}

function settle() {
  for (let limit = 0; frames.size && limit < 40; limit++) frame();
  expect(frames.size).toBe(0);
}

beforeEach(() => {
  hooks.failed = false;
  hooks.effect = undefined;
  hooks.setFailed.mockReset().mockImplementation((failed: boolean) => { hooks.failed = failed; });
  canvas = new Canvas();
  renderer = { domElement: canvas, setPixelRatio: vi.fn(), setSize: vi.fn(), render: vi.fn(), dispose: vi.fn() };
  mount = {
    clientWidth: 144, clientHeight: 144,
    appendChild: vi.fn(() => { canvas.parentElement = mount; }),
    removeChild: vi.fn(() => { canvas.parentElement = null; }),
  };
  hooks.mount = mount;
  fakes.renderer.mockReset().mockImplementation(function () { return renderer; });
  fakes.load.mockReset().mockImplementation(() => new Promise<GLTF>((resolve, reject) => {
    resolveLoad = resolve;
    rejectLoad = reject;
  }));
  frames = new Map();
  nextFrame = 0;
  frameTime = 0;
  motion = new MotionPreference();
  page = new PageVisibility();
  windowEvents = new EventTarget();
  vi.stubGlobal("document", page);
  vi.stubGlobal("window", {
    devicePixelRatio: 3, matchMedia: () => motion,
    addEventListener: windowEvents.addEventListener.bind(windowEvents),
    removeEventListener: windowEvents.removeEventListener.bind(windowEvents),
  });
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    frames.set(++nextFrame, callback);
    return nextFrame;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => { frames.delete(id); });
  disconnect = vi.fn();
  observe = vi.fn();
  vi.stubGlobal("ResizeObserver", class {
    constructor(callback: () => void) { resize = callback; }
    observe = observe;
    disconnect = disconnect;
  });
  intersectionDisconnect = vi.fn();
  vi.stubGlobal("IntersectionObserver", class {
    constructor(callback: IntersectionObserverCallback) {
      intersect = (visible) => callback([{ target: mount, isIntersecting: visible } as unknown as IntersectionObserverEntry], this as unknown as IntersectionObserver);
    }
    observe() { intersect(true); }
    disconnect = intersectionDisconnect;
  });
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("viewer failure containment", () => {
  it("contains an unavailable WebGL constructor and renders the supplied fallback", () => {
    fakes.renderer.mockImplementation(function () { throw new Error("No WebGL context"); });
    const viewer = component();
    expect(viewer.render().props.children).toBe("Static jersey");
    expect(fakes.load).not.toHaveBeenCalled();
    expect(frames.size).toBe(0);
    expect(() => viewer.cleanup()).not.toThrow();
    expect(hooks.setFailed).toHaveBeenCalledExactlyOnceWith(true);
  });

  it.each(["pixel ratio", "observer construction", "observe", "initial resize", "loader"])("cleans partial setup after %s failure", (stage) => {
    if (stage === "pixel ratio") renderer.setPixelRatio.mockImplementation(() => { throw new Error(stage); });
    if (stage === "observer construction") vi.stubGlobal("ResizeObserver", class { constructor() { throw new Error(stage); } });
    if (stage === "observe") observe.mockImplementation(() => { throw new Error(stage); });
    if (stage === "initial resize") renderer.setSize.mockImplementation(() => { throw new Error(stage); });
    if (stage === "loader") fakes.load.mockImplementation(() => { throw new Error(stage); });
    const viewer = component();
    expect(viewer.render().props.children).toBe("Static jersey");
    viewer.cleanup();
    expect(renderer.dispose).toHaveBeenCalledTimes(1);
    expect(canvas.parentElement).toBeNull();
    expect(frames.size).toBe(0);
  });

  it("cleans up on asynchronous load rejection", async () => {
    const viewer = component();
    rejectLoad(new Error("Invalid GLB"));
    await Promise.resolve();
    await Promise.resolve();
    expect(viewer.render().props.children).toBe("Static jersey");
    viewer.cleanup();
    expect(renderer.dispose).toHaveBeenCalledTimes(1);
    expect(disconnect).toHaveBeenCalledTimes(1);
  });

  it.each(["model setup", "first render", "later render", "mixer update", "resize", "pointer animation"])("contains %s failure and releases assets once", async (stage) => {
    const owned = asset();
    if (stage === "model setup") vi.spyOn(THREE.Box3.prototype, "setFromObject").mockImplementation(() => { throw new Error(stage); });
    if (stage === "first render") renderer.render.mockImplementation(() => { throw new Error(stage); });
    const stop = vi.spyOn(THREE.AnimationMixer.prototype, "stopAllAction");
    const uncache = vi.spyOn(THREE.AnimationMixer.prototype, "uncacheRoot");
    const viewer = component();
    await load(owned.gltf);
    if (stage === "later render") {
      renderer.render.mockImplementation(() => { throw new Error(stage); });
      canvas.dispatchEvent(new Event("pointerdown"));
      expect(frame).not.toThrow();
    }
    if (stage === "mixer update") {
      vi.spyOn(THREE.AnimationMixer.prototype, "update").mockImplementation(() => { throw new Error(stage); });
      canvas.dispatchEvent(new Event("pointerdown"));
      expect(frame).not.toThrow();
    }
    if (stage === "resize") {
      renderer.setSize.mockImplementation(() => { throw new Error(stage); });
      expect(resize).not.toThrow();
    }
    if (stage === "pointer animation") {
      vi.spyOn(THREE.AnimationMixer.prototype, "clipAction").mockImplementation(() => { throw new Error(stage); });
      canvas.dispatchEvent(new Event("pointerdown"));
    }
    expect(viewer.render().props.children).toBe("Static jersey");
    viewer.cleanup();
    for (const dispose of owned.disposers) expect(dispose).toHaveBeenCalledTimes(1);
    expect(renderer.dispose).toHaveBeenCalledTimes(1);
    expect(disconnect).toHaveBeenCalledTimes(1);
    expect(frames.size).toBe(0);
    if (stage !== "model setup") {
      // Pointer activation intentionally cancels actions before the failed
      // clip setup; disposal makes the separate final stopAllAction call.
      expect(stop).toHaveBeenCalledTimes(["pointer animation", "later render", "mixer update"].includes(stage) ? 2 : 1);
      expect(uncache).toHaveBeenCalledTimes(2);
    }
    const renderCount = renderer.render.mock.calls.length;
    resize();
    canvas.dispatchEvent(new Event("pointerdown"));
    expect(renderer.render).toHaveBeenCalledTimes(renderCount);
    expect(hooks.setFailed).toHaveBeenCalledTimes(1);
  });

  it.each([false, true])("handles context loss with loaded=%s and ignores restoration", async (loaded) => {
    const owned = asset();
    const viewer = component();
    if (loaded) await load(owned.gltf);
    const loss = new Event("webglcontextlost", { cancelable: true });
    canvas.dispatchEvent(loss);
    expect(loss.defaultPrevented).toBe(true);
    expect(viewer.render().props.children).toBe("Static jersey");
    canvas.dispatchEvent(new Event("webglcontextrestored"));
    if (!loaded) await load(owned.gltf);
    viewer.cleanup();
    for (const dispose of owned.disposers) expect(dispose).toHaveBeenCalledTimes(1);
    expect(renderer.dispose).toHaveBeenCalledTimes(1);
    expect(frames.size).toBe(0);
    expect(fakes.renderer).toHaveBeenCalledTimes(1);
  });

  it("disposes a stale completion after unmount without updating state", async () => {
    const owned = asset();
    const viewer = component();
    viewer.cleanup();
    viewer.cleanup();
    await load(owned.gltf);
    for (const dispose of owned.disposers) expect(dispose).toHaveBeenCalledTimes(1);
    expect(renderer.dispose).toHaveBeenCalledTimes(1);
    expect(renderer.render).not.toHaveBeenCalled();
    expect(hooks.setFailed).not.toHaveBeenCalled();
    expect(frames.size).toBe(0);
  });

  it("keeps cleaning up when a resource disposer throws", async () => {
    const owned = asset();
    owned.disposers[0].mockImplementation(() => { throw new Error("Lost GPU"); });
    const viewer = component();
    await load(owned.gltf);
    expect(viewer.cleanup).not.toThrow();
    viewer.cleanup();
    for (const dispose of owned.disposers) expect(dispose).toHaveBeenCalledTimes(1);
    expect(renderer.dispose).toHaveBeenCalledTimes(1);
    expect(canvas.parentElement).toBeNull();
  });

  it("closes a shared GLTF image bitmap once as well as releasing its texture", async () => {
    const close = vi.fn();
    vi.stubGlobal("ImageBitmap", class { close = close; });
    const owned = asset();
    const material = (owned.gltf.scene.children[0] as THREE.Mesh).material as THREE.MeshStandardMaterial;
    material.map!.image = new ImageBitmap();
    const viewer = component();
    await load(owned.gltf);
    viewer.cleanup();
    viewer.cleanup();
    expect(close).toHaveBeenCalledTimes(1);
    for (const dispose of owned.disposers) expect(dispose).toHaveBeenCalledTimes(1);
  });

  it("does not render after a nested animation-finished failure disposes the viewer", async () => {
    const actions = vi.spyOn(THREE.AnimationMixer.prototype, "clipAction");
    const viewer = component();
    await load();
    canvas.dispatchEvent(new Event("pointerdown"));
    const spin = actions.mock.results.at(-1)!.value;
    vi.spyOn(THREE.AnimationAction.prototype, "crossFadeTo").mockImplementation(() => { throw new Error("Animation callback"); });
    vi.spyOn(THREE.AnimationMixer.prototype, "update").mockImplementation(function (this: THREE.AnimationMixer) {
      this.dispatchEvent({ type: "finished", action: spin, direction: 1 });
      return this;
    });
    frame();
    expect(viewer.render().props.children).toBe("Static jersey");
    expect(renderer.render).toHaveBeenCalledTimes(1);
    expect(frames.size).toBe(0);
    viewer.cleanup();
    expect(renderer.dispose).toHaveBeenCalledTimes(1);
  });
});

describe("supported behavior", () => {
  it.each([
    { clips: ["spin", "jump"], interrupt: "before completion" },
    { clips: ["spin"], interrupt: "before completion" },
    { clips: ["spin", "jump"], interrupt: "during fade-back" },
    { clips: ["spin"], interrupt: "during fade-back" },
  ])("returns fully to idle after $clips interrupted $interrupt", async ({ clips, interrupt }) => {
    const owned = asset();
    const poses = { idle: [2, 2], spin: [10, 20], jump: [30, 40] };
    owned.gltf.animations = Object.entries(poses).map(([name, values]) =>
      new THREE.AnimationClip(name, name === "idle" ? 1 : 0.4, [
        new THREE.NumberKeyframeTrack(".position[x]", [0, name === "idle" ? 1 : 0.4], values),
      ]),
    );
    const clipAction = vi.spyOn(THREE.AnimationMixer.prototype, "clipAction");
    const transition = vi.spyOn(THREE.AnimationAction.prototype, "crossFadeTo");
    const viewer = component({ clickClips: clips });
    await load(owned.gltf);
    const mixer = clipAction.mock.contexts[0] as THREE.AnimationMixer;
    const idle = clipAction.mock.results[0].value as THREE.AnimationAction;
    const finishedEvents = vi.fn();
    mixer.addEventListener("finished", finishedEvents);

    canvas.dispatchEvent(new Event("pointerdown"));
    if (interrupt === "during fade-back") {
      mixer.update(0.41);
      mixer.update(0.1);
      expect(transition).toHaveBeenCalledTimes(1);
      expect(idle.isScheduled()).toBe(true);
      expect(idle.paused).toBe(true);
    } else {
      mixer.update(0.15);
      expect(transition).not.toHaveBeenCalled();
    }
    const transitionsBeforeRestart = transition.mock.calls.length;
    const finishesBeforeRestart = finishedEvents.mock.calls.length;
    canvas.dispatchEvent(new Event("pointerdown"));
    const latest = clipAction.mock.results.at(-1)!.value as THREE.AnimationAction;
    expect(latest.time).toBe(0);

    mixer.update(0.1);
    const expectedPose = clips[1 % clips.length] === "spin" ? 12.5 : 32.5;
    expect(owned.gltf.scene.position.x).toBeCloseTo(expectedPose);
    expect(idle.isScheduled()).toBe(false);
    mixer.update(0.31);
    mixer.update(0.26);
    expect(transition).toHaveBeenCalledTimes(transitionsBeforeRestart + 1);
    expect(transition.mock.calls.at(-1)).toEqual([idle, 0.25, false]);
    expect(finishedEvents).toHaveBeenCalledTimes(finishesBeforeRestart + 1);
    expect(idle.isScheduled()).toBe(true);
    expect(idle.paused).toBe(true);
    expect(idle.getEffectiveWeight()).toBe(1);
    expect(owned.gltf.scene.position.x).toBeCloseTo(2);
    for (const clip of owned.gltf.animations.filter((clip) => clip.name !== "idle")) {
      const action = mixer.existingAction(clip);
      const influence = action?.isScheduled() ? action.getEffectiveWeight() : 0;
      expect(influence).toBe(0);
    }
    mixer.update(1);
    expect(owned.gltf.scene.position.x).toBeCloseTo(2);
    expect(transition).toHaveBeenCalledTimes(transitionsBeforeRestart + 1);
    expect(finishedEvents).toHaveBeenCalledTimes(finishesBeforeRestart + 1);
    viewer.cleanup();
    viewer.cleanup();
    expect(renderer.dispose).toHaveBeenCalledTimes(1);
    for (const dispose of owned.disposers) expect(dispose).toHaveBeenCalledTimes(1);
  });

  it("preserves camera, capped pixel ratio, still idle pose and keyboard/pointer cycling", async () => {
    const clipAction = vi.spyOn(THREE.AnimationMixer.prototype, "clipAction");
    const addListener = vi.spyOn(THREE.AnimationMixer.prototype, "addEventListener");
    const viewer = component({ ariaLabel: "Offline team figurine" });
    await load();
    expect(renderer.setPixelRatio).toHaveBeenCalledWith(2);
    expect(renderer.setSize).toHaveBeenCalledWith(144, 144);
    const [, camera] = renderer.render.mock.calls[0];
    expect(camera.fov).toBe(35);
    expect(camera.position.z).toBeGreaterThan(0);
    expect(canvas.attributes).toMatchObject({ role: "button", "aria-label": "Offline team figurine" });
    expect(canvas.tabIndex).toBe(0);
    expect(canvas.style.outline).toBeUndefined();
    canvas.dispatchEvent(new Event("pointerdown"));
    for (const key of ["Enter", " ", "Enter"]) {
      const event = new Event("keydown", { cancelable: true });
      Object.assign(event, { key });
      canvas.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(true);
    }
    expect(clipAction.mock.calls.map(([clip]) => (clip as THREE.AnimationClip).name)).toEqual(["idle", "spin", "jump", "dunk", "spin"]);
    const [type, listener] = addListener.mock.calls.at(-1)!;
    expect(type).toBe("finished");
    const action = clipAction.mock.results.at(-1)!.value;
    listener({ action } as never);
    expect(clipAction.mock.results[0].value.paused).toBe(true);
    frame();
    expect(renderer.render).toHaveBeenCalledTimes(2);
    expect(frames.size).toBe(1);
    expect(hooks.failed).toBe(false);
    viewer.cleanup();
    expect(frames.size).toBe(0);
  });

  it("honors reduced motion and the prop viewer's static no-clip caller", async () => {
    motion.matches = true;
    const clipAction = vi.spyOn(THREE.AnimationMixer.prototype, "clipAction");
    const update = vi.spyOn(THREE.AnimationMixer.prototype, "update");
    const viewer = component({ clickClips: [] });
    await load();
    canvas.dispatchEvent(new Event("pointerdown"));
    // The old test consumed a continuously queued frame. A still pose now
    // needs one load render and no idle RAF, while evaluating its idle pose.
    expect(clipAction.mock.calls.map(([clip]) => (clip as THREE.AnimationClip).name)).toEqual(["idle"]);
    expect(update).toHaveBeenCalledExactlyOnceWith(0);
    expect(renderer.render).toHaveBeenCalledTimes(1);
    expect(frames.size).toBe(0);
    expect(canvas.style.cursor).toBe("default");
    const prop = PropViewer({ prop: "hoop" });
    expect(prop.props).toMatchObject({ src: "/3d/hoop.glb", clickClips: [] });
    viewer.cleanup();
  });

  it("uses asset identity for fresh failure state on change/remount", () => {
    expect(GLBViewer({ src: "/one.glb", clickClips: [] }).key).toBe("/one.glb");
    expect(GLBViewer({ src: "/two.glb", clickClips: [] }).key).toBe("/two.glb");
    fakes.renderer.mockImplementationOnce(function () { throw new Error("Unavailable"); });
    component().cleanup();
    // Model the fresh state React provides for a new keyed instance.
    hooks.failed = false;
    const retry = component({ src: "/two.glb" });
    expect(retry.render().props.children).toBeNull();
    expect(fakes.load).toHaveBeenCalledTimes(1);
    retry.cleanup();
  });
});

describe("demand rendering and live preferences", () => {
  it("keeps an evaluated idle pose static with zero pending frames", async () => {
    const owned = asset();
    owned.gltf.animations[0] = new THREE.AnimationClip("idle", 1, [
      new THREE.NumberKeyframeTrack(".position[x]", [0, 1], [2, 9]),
    ]);
    const viewer = component();
    await load(owned.gltf);
    expect(owned.gltf.scene.position.x).toBe(2);
    expect(renderer.render).toHaveBeenCalledTimes(1);
    expect(frames.size).toBe(0);
    resize();
    expect(renderer.render).toHaveBeenCalledTimes(2);
    expect(frames.size).toBe(0);
    expect(fakes.load).toHaveBeenCalledExactlyOnceWith("/offline.glb");
    viewer.cleanup();
  });

  it.each([false, true])("leaves a no-animation model static with reduced motion=%s", async (reduce) => {
    motion.matches = reduce;
    const owned = asset();
    owned.gltf.animations = [];
    const viewer = component();
    await load(owned.gltf);
    canvas.dispatchEvent(new Event("pointerdown"));
    expect(renderer.render).toHaveBeenCalledTimes(1);
    expect(frames.size).toBe(0);
    viewer.cleanup();
  });

  it.each([true, false])("settles a manual animation with idle=%s and wakes on the next activation", async (withIdle) => {
    const owned = asset();
    owned.gltf.animations = [
      ...(withIdle ? [new THREE.AnimationClip("idle", 1, [
        new THREE.NumberKeyframeTrack(".position[x]", [0, 1], [2, 9]),
      ])] : []),
      new THREE.AnimationClip("spin", 0.1, [
        new THREE.NumberKeyframeTrack(".position[x]", [0, 0.1], [10, 20]),
      ]),
    ];
    const transition = vi.spyOn(THREE.AnimationAction.prototype, "crossFadeTo");
    const viewer = component({ clickClips: ["spin"] });
    await load(owned.gltf);
    expect(frames.size).toBe(0);
    for (let activation = 0; activation < 2; activation++) {
      canvas.dispatchEvent(new Event("pointerdown"));
      expect(frames.size).toBe(1);
      frame();
      expect(frames.size).toBe(1);
      frame();
      expect(owned.gltf.scene.position.x).toBeCloseTo(15);
      settle();
      expect(owned.gltf.scene.position.x).toBeCloseTo(withIdle ? 2 : 20);
      expect(frames.size).toBe(0);
    }
    expect(transition).toHaveBeenCalledTimes(withIdle ? 2 : 0);
    viewer.cleanup();
  });

  it.each(["before load", "during one-shot", "during fade-back"])("responds to reduced motion %s without an automatic restart", async (stage) => {
    const actions = vi.spyOn(THREE.AnimationMixer.prototype, "clipAction");
    const transition = vi.spyOn(THREE.AnimationAction.prototype, "crossFadeTo");
    const viewer = component();
    if (stage === "before load") motion.change(true);
    await load();
    if (stage !== "before load") {
      canvas.dispatchEvent(new Event("pointerdown"));
      frame();
      frame();
      if (stage === "during fade-back") {
        frame();
        expect(transition).toHaveBeenCalledTimes(1);
      }
      motion.change(true);
    }
    expect(frames.size).toBe(0);
    const renders = renderer.render.mock.calls.length;
    const actionCalls = actions.mock.calls.length;
    canvas.dispatchEvent(new Event("pointerdown"));
    const enter = new Event("keydown", { cancelable: true });
    Object.assign(enter, { key: "Enter" });
    canvas.dispatchEvent(enter);
    expect(enter.defaultPrevented).toBe(true);
    expect(canvas.tabIndex).toBe(0);
    expect(actions).toHaveBeenCalledTimes(actionCalls);
    expect(renderer.render).toHaveBeenCalledTimes(renders);
    motion.change(false);
    expect(frames.size).toBe(0);
    canvas.dispatchEvent(new Event("pointerdown"));
    expect(frames.size).toBe(1);
    settle();
    expect(fakes.load).toHaveBeenCalledTimes(1);
    viewer.cleanup();
  });

  it("starts reduced, returns to the idle pose and resumes only on manual interaction", async () => {
    motion.matches = true;
    const viewer = component();
    await load();
    expect(frames.size).toBe(0);
    motion.change(false);
    expect(frames.size).toBe(0);
    canvas.dispatchEvent(new Event("pointerdown"));
    expect(frames.size).toBe(1);
    settle();
    expect(frames.size).toBe(0);
    viewer.cleanup();
  });

  it.each(["hidden", "offscreen"])("defers load rendering while %s and redraws once on return", async (reason) => {
    const viewer = component();
    if (reason === "hidden") page.change(true);
    else intersect(false);
    await load();
    resize();
    expect(renderer.render).not.toHaveBeenCalled();
    expect(frames.size).toBe(0);
    if (reason === "hidden") page.change(false);
    else intersect(true);
    expect(renderer.render).toHaveBeenCalledTimes(1);
    expect(frames.size).toBe(0);
    viewer.cleanup();
  });

  it("waits for an intersection result before rendering a loaded model", async () => {
    vi.stubGlobal("IntersectionObserver", class {
      constructor(callback: IntersectionObserverCallback) {
        intersect = (visible) => callback([{ target: mount, isIntersecting: visible } as unknown as IntersectionObserverEntry], this as unknown as IntersectionObserver);
      }
      observe() {}
      disconnect = intersectionDisconnect;
    });
    const viewer = component();
    await load();
    expect(renderer.render).not.toHaveBeenCalled();
    intersect(true);
    expect(renderer.render).toHaveBeenCalledTimes(1);
    expect(frames.size).toBe(0);
    viewer.cleanup();
  });

  it.each(["hidden", "offscreen"])("suspends an active animation while %s without advancing hidden time", async (reason) => {
    const actions = vi.spyOn(THREE.AnimationMixer.prototype, "clipAction");
    const viewer = component();
    await load();
    canvas.dispatchEvent(new Event("pointerdown"));
    frame();
    frame();
    const action = actions.mock.results.at(-1)!.value as THREE.AnimationAction;
    const time = action.time;
    const renders = renderer.render.mock.calls.length;
    if (reason === "hidden") page.change(true);
    else intersect(false);
    resize();
    canvas.dispatchEvent(new Event("pointerdown"));
    expect(frames.size).toBe(0);
    expect(renderer.render).toHaveBeenCalledTimes(renders);
    expect(action.time).toBe(time);
    if (reason === "hidden") page.change(false);
    else intersect(true);
    expect(frames.size).toBe(1);
    frame(frameTime + 60_000);
    expect(action.time).toBe(time);
    expect(frames.size).toBe(1);
    settle();
    viewer.cleanup();
  });

  it("keeps document and intersection visibility independent and does not restart a reduced pose", async () => {
    const viewer = component();
    await load();
    canvas.dispatchEvent(new Event("pointerdown"));
    page.change(true);
    intersect(false);
    const renders = renderer.render.mock.calls.length;
    motion.change(true);
    page.change(false);
    expect(frames.size).toBe(0);
    expect(renderer.render).toHaveBeenCalledTimes(renders);
    intersect(true);
    expect(renderer.render).toHaveBeenCalledTimes(renders + 1);
    expect(frames.size).toBe(0);
    motion.change(false);
    expect(frames.size).toBe(0);
    viewer.cleanup();
  });

  it("coalesces rapid activations, resize and repeated visibility notifications into one RAF", async () => {
    const actions = vi.spyOn(THREE.AnimationMixer.prototype, "clipAction");
    const viewer = component();
    await load();
    for (let i = 0; i < 9; i++) {
      canvas.dispatchEvent(new Event("pointerdown"));
      resize();
      page.change(false);
      intersect(true);
      expect(frames.size).toBe(1);
    }
    const mixer = actions.mock.contexts[0] as THREE.AnimationMixer;
    const finishes = vi.fn();
    mixer.addEventListener("finished", finishes);
    settle();
    expect(finishes).toHaveBeenCalledTimes(1);
    expect(frames.size).toBe(0);
    viewer.cleanup();
  });

  it("supports missing observers/matchMedia with demand rendering and a cleaned resize fallback", async () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    vi.stubGlobal("ResizeObserver", undefined);
    vi.stubGlobal("window", {
      devicePixelRatio: 1,
      addEventListener: windowEvents.addEventListener.bind(windowEvents),
      removeEventListener: windowEvents.removeEventListener.bind(windowEvents),
    });
    const add = vi.spyOn(windowEvents, "addEventListener");
    // Bind after spying so the wrapper records the actual subscription.
    window.addEventListener = windowEvents.addEventListener.bind(windowEvents);
    const remove = vi.spyOn(windowEvents, "removeEventListener");
    window.removeEventListener = windowEvents.removeEventListener.bind(windowEvents);
    const viewer = component();
    await load();
    expect(frames.size).toBe(0);
    windowEvents.dispatchEvent(new Event("resize"));
    expect(renderer.render).toHaveBeenCalledTimes(2);
    expect(add).toHaveBeenCalledTimes(1);
    viewer.cleanup();
    expect(remove.mock.calls[0]).toEqual(add.mock.calls[0]);
    windowEvents.dispatchEvent(new Event("resize"));
    expect(renderer.render).toHaveBeenCalledTimes(2);
  });

  it("supports legacy media listeners and removes the exact callback", async () => {
    const addListener = vi.fn((listener: EventListener) => motion.addEventListener("change", listener));
    const removeListener = vi.fn((listener: EventListener) => motion.removeEventListener("change", listener));
    window.matchMedia = () => ({ get matches() { return motion.matches; }, addListener, removeListener }) as unknown as MediaQueryList;
    const viewer = component();
    await load();
    canvas.dispatchEvent(new Event("pointerdown"));
    expect(frames.size).toBe(1);
    motion.change(true);
    expect(frames.size).toBe(0);
    viewer.cleanup();
    expect(removeListener.mock.calls).toEqual(addListener.mock.calls);
  });

  it.each(["unmount", "context loss", "load failure"])("removes motion/visibility/observer/canvas listeners on %s", async (end) => {
    const motionAdd = vi.spyOn(motion, "addEventListener");
    const motionRemove = vi.spyOn(motion, "removeEventListener");
    const pageAdd = vi.spyOn(page, "addEventListener");
    const pageRemove = vi.spyOn(page, "removeEventListener");
    const canvasAdd = vi.spyOn(canvas, "addEventListener");
    const canvasRemove = vi.spyOn(canvas, "removeEventListener");
    const viewer = component();
    if (end === "load failure") {
      rejectLoad(new Error("Offline failure"));
      await Promise.resolve(); await Promise.resolve();
    } else {
      await load();
      canvas.dispatchEvent(new Event("pointerdown"));
      if (end === "context loss") canvas.dispatchEvent(new Event("webglcontextlost"));
    }
    const stale = [...frames.values()][0];
    viewer.cleanup();
    viewer.cleanup();
    expect(motionRemove.mock.calls).toEqual(motionAdd.mock.calls);
    expect(pageRemove.mock.calls).toEqual(pageAdd.mock.calls);
    for (const call of canvasAdd.mock.calls) expect(canvasRemove.mock.calls).toContainEqual(call);
    expect(disconnect).toHaveBeenCalledTimes(1);
    expect(intersectionDisconnect).toHaveBeenCalledTimes(1);
    expect(renderer.dispose).toHaveBeenCalledTimes(1);
    const renders = renderer.render.mock.calls.length;
    stale?.(frameTime + 50);
    motion.change(true);
    page.change(true);
    intersect(true);
    resize();
    expect(renderer.render).toHaveBeenCalledTimes(renders);
    expect(frames.size).toBe(0);
  });

  it("contains a live preference update failure and tears down its listeners", async () => {
    const remove = vi.spyOn(motion, "removeEventListener");
    const viewer = component();
    await load();
    canvas.dispatchEvent(new Event("pointerdown"));
    vi.spyOn(THREE.AnimationMixer.prototype, "update").mockImplementation(() => { throw new Error("Pose update"); });
    motion.change(true);
    expect(viewer.render().props.children).toBe("Static jersey");
    expect(frames.size).toBe(0);
    expect(remove).toHaveBeenCalledTimes(1);
    viewer.cleanup();
    expect(renderer.dispose).toHaveBeenCalledTimes(1);
  });

  it("models StrictMode setup/cleanup replay and disposes stale load results without affecting the fresh effect", async () => {
    const firstAsset = asset();
    const first = component();
    const finishFirst = resolveLoad;
    first.cleanup();
    first.cleanup();
    const firstCanvas = canvas;
    const firstRenderer = renderer;
    canvas = new Canvas();
    renderer = { domElement: canvas, setPixelRatio: vi.fn(), setSize: vi.fn(), render: vi.fn(), dispose: vi.fn() };
    const second = component();
    finishFirst(firstAsset.gltf);
    await Promise.resolve(); await Promise.resolve();
    const secondAsset = asset();
    await load(secondAsset.gltf);
    firstCanvas.dispatchEvent(new Event("pointerdown"));
    expect(firstRenderer.render).not.toHaveBeenCalled();
    expect(renderer.render).toHaveBeenCalledTimes(1);
    expect(frames.size).toBe(0);
    canvas.dispatchEvent(new Event("pointerdown"));
    expect(frames.size).toBe(1);
    second.cleanup();
    expect(frames.size).toBe(0);
    expect(fakes.load).toHaveBeenCalledTimes(2);
    expect(firstRenderer.dispose).toHaveBeenCalledTimes(1);
    expect(renderer.dispose).toHaveBeenCalledTimes(1);
    for (const dispose of [...firstAsset.disposers, ...secondAsset.disposers]) expect(dispose).toHaveBeenCalledTimes(1);
    expect(hooks.setFailed).not.toHaveBeenCalled();
  });
});
