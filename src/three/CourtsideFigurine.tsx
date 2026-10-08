"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import styles from "@/ui/CourtsideFigurine.module.css";

function disposeModel(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  const skeletons = new Set<THREE.Skeleton>();
  root.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      geometries.add(object.geometry);
      (Array.isArray(object.material)
        ? object.material
        : [object.material]
      ).forEach((material) => materials.add(material));
    }
    if (object instanceof THREE.SkinnedMesh) skeletons.add(object.skeleton);
  });
  materials.forEach((material) =>
    Object.values(material).forEach((value) => {
      if (value instanceof THREE.Texture) textures.add(value);
    }),
  );
  skeletons.forEach((skeleton) => skeleton.dispose());
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
  const images = new Set<ImageBitmap>();
  textures.forEach((texture) => {
    const source = texture.source.data as ImageBitmap | ImageBitmap[] | null;
    for (const image of Array.isArray(source) ? source : [source])
      if (image && typeof image.close === "function") images.add(image);
    texture.dispose();
  });
  images.forEach((image) => image.close());
}

/** One existing model, rendered on load/resize/manual turn. No ambient RAF loop. */
export function CourtsideFigurine({
  teamId,
  name,
}: {
  teamId: string;
  name: string;
}) {
  const mount = useRef<HTMLDivElement>(null);
  const turn = useRef<(direction: number) => void>(() => {});
  const [status, setStatus] = useState("Loading the existing league figurine…");
  useEffect(() => {
    const node = mount.current;
    if (!node) return;
    let disposed = false;
    let visible = true;
    let model: THREE.Object3D | null = null;
    let mixer: THREE.AnimationMixer | null = null;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      queueMicrotask(() => {
        if (!disposed)
          setStatus(
            "The optional viewer is unavailable. The full team profile is still available.",
          );
      });
      return () => {
        disposed = true;
      };
    }
    const abort = new AbortController();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.domElement.setAttribute("aria-hidden", "true");
    node.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 100);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x173c3a, 1.1));
    const key = new THREE.DirectionalLight(0xfff2dd, 2);
    key.position.set(4, 6, 7);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xffffff, 1);
    fill.position.set(-4, 3, -3);
    scene.add(fill);
    const render = () => {
      if (!disposed && visible && !document.hidden)
        renderer.render(scene, camera);
    };
    const resize = () => {
      const rect = node.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      renderer.setSize(rect.width, rect.height);
      camera.aspect = rect.width / rect.height;
      camera.updateProjectionMatrix();
      render();
    };
    const resizer = new ResizeObserver(resize);
    resizer.observe(node);
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) render();
    });
    observer.observe(node);
    document.addEventListener("visibilitychange", render);
    turn.current = (direction) => {
      if (model) {
        model.rotation.y += (direction * Math.PI) / 4;
        render();
      }
    };
    async function load() {
      try {
        const response = await fetch(
          `/3d/hooper-${encodeURIComponent(teamId)}.glb`,
          { signal: abort.signal },
        );
        if (!response.ok) throw new Error("Model unavailable");
        const gltf = await new GLTFLoader().parseAsync(
          await response.arrayBuffer(),
          "/3d/",
        );
        if (disposed) {
          disposeModel(gltf.scene);
          return;
        }
        model = gltf.scene;
        const idle = gltf.animations.find((clip) => clip.name === "idle");
        if (idle) {
          mixer = new THREE.AnimationMixer(model);
          mixer.clipAction(idle).play();
          mixer.setTime(0);
        }
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        model.position.sub(center);
        const distance =
          (Math.max(size.x, size.y, size.z) /
            2 /
            Math.tan(THREE.MathUtils.degToRad(35 / 2))) *
          1.35;
        camera.position.set(0, distance * 0.12, distance);
        camera.lookAt(0, 0, 0);
        camera.near = Math.max(distance / 100, 0.01);
        camera.far = Math.max(distance * 10, 100);
        camera.updateProjectionMatrix();
        scene.add(model);
        resize();
        setStatus(
          "Existing league figurine. Use the turn buttons to inspect it.",
        );
      } catch {
        if (!disposed)
          setStatus(
            "The optional viewer is unavailable. The full team profile is still available.",
          );
      }
    }
    void load();
    return () => {
      disposed = true;
      abort.abort();
      turn.current = () => {};
      resizer.disconnect();
      observer.disconnect();
      document.removeEventListener("visibilitychange", render);
      if (model) {
        mixer?.stopAllAction();
        mixer?.uncacheRoot(model);
        disposeModel(model);
      }
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, [teamId]);
  return (
    <>
      <div
        ref={mount}
        className={styles.scene}
        role="img"
        aria-label={`${name} existing league figurine`}
      />
      <p className={styles.status} role="status">
        {status}
      </p>
      <div className={styles.controls}>
        <button className={styles.button} onClick={() => turn.current(-1)}>
          Turn left
        </button>
        <button className={styles.button} onClick={() => turn.current(1)}>
          Turn right
        </button>
      </div>
    </>
  );
}
