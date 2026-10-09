"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import styles from "./GLBViewer.module.css";

export type GLBViewerProps = {
  /** Path to the .glb, e.g. "/3d/hoop.glb". */
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
  /** Static content to show if this asset cannot be displayed. */
  fallback?: ReactNode;
};

/**
 * GLBViewer — loads a GLB, plays its ambient idle loop, and fires a
 * one-shot click animation (cycling through `clickClips`) on click/tap
 * or keyboard activation, cross-fading back to idle when done.
 * Respects `prefers-reduced-motion` (renders a still frame, no
 * click animations).
 */
export function GLBViewer(props: GLBViewerProps) {
  // A new asset gets fresh failure/click state, without an automatic retry loop.
  return <GLBViewerAsset key={props.src} {...props} />;
}

function GLBViewerAsset({
  src,
  clickClips,
  idleClip = "idle",
  className,
  ariaLabel,
  fov = 35,
  fallback,
}: GLBViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const clickIndexRef = useRef(0);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let stopped = false;
    let renderer: THREE.WebGLRenderer | undefined;
    let observer: ResizeObserver | undefined;
    let raf = 0;
    let mixer: THREE.AnimationMixer | null = null;
    let idleAction: THREE.AnimationAction | null = null;
    let clips: THREE.AnimationClip[] = [];
    let models: THREE.Object3D[] = [];
    let finished: ((e: { action: THREE.AnimationAction }) => void) | undefined;
    const released = new Set<object>();

    // Cleanup must continue even if a lost context makes a disposer throw.
    const safely = (release: () => void) => {
      try {
        release();
      } catch {
        // Keep releasing the remaining resources.
      }
    };
    const disposeOnce = (resource: { dispose: () => void }) => {
      if (released.has(resource)) return;
      released.add(resource);
      safely(() => resource.dispose());
    };
    const disposeModels = (roots: THREE.Object3D[]) => {
      for (const root of roots) {
        root.traverse((object) => {
          const mesh = object as THREE.Mesh;
          if (mesh.geometry) disposeOnce(mesh.geometry);
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          for (const material of materials) {
            if (!material) continue;
            for (const value of Object.values(material)) {
              if (!(value instanceof THREE.Texture)) continue;
              disposeOnce(value);
              // Texture.dispose releases GPU memory; GLTF image bitmaps also
              // own CPU memory and can be shared by several textures.
              const image = value.image;
              if (typeof ImageBitmap !== "undefined" && image instanceof ImageBitmap && !released.has(image)) {
                released.add(image);
                safely(() => image.close());
              }
            }
            disposeOnce(material);
          }
          const skinned = object as THREE.SkinnedMesh;
          if (skinned.skeleton) disposeOnce(skinned.skeleton);
        });
      }
    };
    const cleanup = () => {
      if (stopped) return;
      stopped = true;
      safely(() => cancelAnimationFrame(raf));
      safely(() => observer?.disconnect());
      const el = renderer?.domElement;
      if (el) {
        el.removeEventListener("pointerdown", onPointerDown);
        el.removeEventListener("keydown", onKeyDown);
        el.removeEventListener("webglcontextlost", onContextLost);
      }
      if (mixer) {
        if (finished) mixer.removeEventListener("finished", finished);
        safely(() => mixer?.stopAllAction());
        for (const model of models) safely(() => mixer?.uncacheRoot(model));
      }
      disposeModels(models);
      if (renderer) disposeOnce(renderer);
      if (el?.parentElement === mount) mount.removeChild(el);
    };
    const fail = () => {
      if (stopped) return;
      cleanup();
      setFailed(true);
    };
    const guard = (work: () => void) => {
      if (stopped) return;
      try {
        work();
      } catch {
        fail();
      }
    };
    const onContextLost = (event: Event) => {
      event.preventDefault();
      fail();
    };
    const onPointerDown = () => guard(playClickClip);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        guard(playClickClip);
      }
    };

    let playClickClip = () => {};
    try {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const activeRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer = activeRenderer;
      const el = activeRenderer.domElement;
      el.addEventListener("webglcontextlost", onContextLost);
      activeRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      mount.appendChild(el);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 100);

      // Preserve the studio lighting and camera used by both viewer callers.
      scene.add(new THREE.HemisphereLight(0xffffff, 0x1a2332, 0.9));
      const key = new THREE.DirectionalLight(0xfff2dd, 1.6);
      key.position.set(3, 5, 4);
      scene.add(key);
      const rim = new THREE.DirectionalLight(0xe8a13c, 0.8);
      rim.position.set(-4, 3, -3);
      scene.add(rim);
      const loader = new GLTFLoader();
      const clock = new THREE.Clock();

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

      playClickClip = () => {
        if (!mixer || clickClips.length === 0 || reduceMotion) return;
        const name = clickClips[clickIndexRef.current % clickClips.length];
        clickIndexRef.current += 1;
        const clip = clips.find((c) => c.name === name);
        if (!clip) return;
        if (finished) mixer.removeEventListener("finished", finished);
        // Stop any in-flight one-shot so rapid clicks feel responsive.
        mixer.stopAllAction();
        const action = mixer.clipAction(clip);
        action.setLoop(THREE.LoopOnce, 1);
        action.clampWhenFinished = true;
        finished = (e: { action: THREE.AnimationAction }) => guard(() => {
          if (e.action !== action) return;
          if (finished) mixer?.removeEventListener("finished", finished);
          finished = undefined;
          if (idleAction) {
            action.crossFadeTo(idleAction, 0.25, false);
            idleAction.reset().play();
          }
        });
        mixer.addEventListener("finished", finished);
        action.reset().play();
      };

      loader
        .loadAsync(src)
        .then((gltf) => {
          const roots = gltf.scenes.length ? gltf.scenes : [gltf.scene];
          if (stopped) {
            disposeModels(roots);
            return;
          }
          models = roots;
          guard(() => {
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

            el.addEventListener("pointerdown", onPointerDown);
            el.addEventListener("keydown", onKeyDown);
            el.tabIndex = 0;
            el.setAttribute("role", "button");
            el.setAttribute(
              "aria-label",
              ariaLabel ?? "Interactive 3D model. Activate to play an animation.",
            );
            el.style.cursor = clickClips.length > 0 ? "pointer" : "default";
            el.style.display = "block";

            const tick = () => guard(() => {
              raf = 0;
              const dt = Math.min(clock.getDelta(), 0.05);
              if (mixer && !reduceMotion) mixer.update(dt);
              // A mixer "finished" callback can fail and dispose this viewer.
              if (stopped) return;
              activeRenderer.render(scene, camera);
              if (!stopped) raf = requestAnimationFrame(tick);
            });
            tick();
          });
        })
        .catch(fail);

      const resize = () => guard(() => {
        const w = mount.clientWidth || 1;
        const h = mount.clientHeight || 1;
        activeRenderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      });
      observer = new ResizeObserver(resize);
      observer.observe(mount);
      resize();
    } catch {
      fail();
    }
    return cleanup;
    // Re-create only when the asset changes; clip lists are static per asset.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  return (
    <div
      ref={mountRef}
      className={[styles.viewer, className].filter(Boolean).join(" ")}
      style={{ width: "100%", height: "100%" }}
    >
      {failed ? fallback : null}
    </div>
  );
}
