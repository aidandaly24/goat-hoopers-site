"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export type GLBViewerProps = {
  /** Path to the .glb, e.g. "/3d/hooper-8.glb". */
  src: string;
  /** One-shot animation clip names to cycle through on click. */
  clickClips: string[];
  /** Name of the ambient looping clip. Defaults to "idle". */
  idleClip?: string;
  /** Extra class names for the wrapper. */
  className?: string;
  /** Accessible label for the interactive canvas. */
  ariaLabel?: string;
  /** Camera field of view in degrees. */
  fov?: number;
};

/**
 * GLBViewer — loads a GLB, plays its ambient idle loop, and fires a
 * one-shot click animation (cycling through `clickClips`) on click/tap
 * or keyboard activation, cross-fading back to idle when done.
 * Respects `prefers-reduced-motion` (renders a still frame, no
 * click animations).
 */
export function GLBViewer({
  src,
  clickClips,
  idleClip = "idle",
  className,
  ariaLabel,
  fov = 35,
}: GLBViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const clickIndexRef = useRef(0);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let disposed = false;

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 100);

    // Studio-ish lighting: key + fill + warm rim so the figurines read
    // well against the dark broadcast background.
    scene.add(new THREE.HemisphereLight(0xffffff, 0x1a2332, 0.9));
    const key = new THREE.DirectionalLight(0xfff2dd, 1.6);
    key.position.set(3, 5, 4);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xe8a13c, 0.8);
    rim.position.set(-4, 3, -3);
    scene.add(rim);

    const loader = new GLTFLoader();
    const clock = new THREE.Clock();
    let raf = 0;
    let mixer: THREE.AnimationMixer | null = null;
    let idleAction: THREE.AnimationAction | null = null;
    let clips: THREE.AnimationClip[] = [];

    const fitCamera = (object: THREE.Object3D) => {
      const box = new THREE.Box3().setFromObject(object);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const fitDist =
        maxDim / 2 / Math.tan(THREE.MathUtils.degToRad(fov / 2));
      const dir = new THREE.Vector3(0.35, 0.45, 1).normalize();
      camera.position.copy(center).addScaledVector(dir, fitDist * 1.9);
      camera.lookAt(center);
      camera.updateProjectionMatrix();
    };

    const playClickClip = () => {
      if (!mixer || clickClips.length === 0 || reduceMotion) return;
      const name = clickClips[clickIndexRef.current % clickClips.length];
      clickIndexRef.current += 1;
      const clip = clips.find((c) => c.name === name);
      if (!clip) return;
      // Stop any in-flight one-shot so rapid clicks feel responsive.
      const action = mixer.clipAction(clip);
      action.setLoop(THREE.LoopOnce, 1);
      action.clampWhenFinished = true;
      const onFinished = (e: { action: THREE.AnimationAction }) => {
        if (e.action !== action) return;
        mixer?.removeEventListener("finished", onFinished as never);
        if (idleAction) {
          action.crossFadeTo(idleAction, 0.25, false);
          idleAction.reset().play();
        }
      };
      mixer.addEventListener("finished", onFinished as never);
      if (idleAction) idleAction.stop();
      action.reset().play();
    };

    const onPointerDown = () => playClickClip();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        playClickClip();
      }
    };

    loader
      .loadAsync(src)
      .then((gltf) => {
        if (disposed) return;
        const model = gltf.scene;
        scene.add(model);
        fitCamera(model);

        clips = gltf.animations;
        mixer = new THREE.AnimationMixer(model);
        const idle = clips.find((c) => c.name === idleClip);
        if (idle && !reduceMotion) {
          idleAction = mixer.clipAction(idle);
          idleAction.play();
        }

        const el = renderer.domElement;
        el.addEventListener("pointerdown", onPointerDown);
        el.addEventListener("keydown", onKeyDown);
        el.tabIndex = 0;
        el.setAttribute("role", "button");
        el.setAttribute(
          "aria-label",
          ariaLabel ?? "Interactive 3D model. Activate to play an animation.",
        );
        el.style.cursor = clickClips.length > 0 ? "pointer" : "default";
        el.style.outline = "none";
        el.style.display = "block";

        const tick = () => {
          raf = requestAnimationFrame(tick);
          const dt = Math.min(clock.getDelta(), 0.05);
          if (mixer && !reduceMotion) mixer.update(dt);
          renderer.render(scene, camera);
        };
        tick();
      })
      .catch(() => {
        if (!disposed) setFailed(true);
      });

    const resize = () => {
      const w = mount.clientWidth || 1;
      const h = mount.clientHeight || 1;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      observer.disconnect();
      const el = renderer.domElement;
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("keydown", onKeyDown);
      scene.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const mat = mesh.material as THREE.Material | THREE.Material[];
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else if (mat) mat.dispose();
      });
      renderer.dispose();
      if (el.parentElement === mount) mount.removeChild(el);
    };
    // Re-create only when the asset changes; clip lists are static per asset.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  if (failed) return null;
  return (
    <div
      ref={mountRef}
      className={className}
      style={{ width: "100%", height: "100%" }}
    />
  );
}
