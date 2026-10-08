/*
 * Optional existing-figurine inspection for the isolated clubhouse preview.
 * No league fetching, account changes, gameplay, or reward logic lives here.
 * The host owns the modal and supplies #club-scene and #scene-status.
 *
 * openClubScene(teamId, teamName): loads one unchanged team GLB on demand.
 * closeClubScene(): aborts downloads and releases GPU/texture resources.
 * rotateClubScene(): turns the selected figurine 45 degrees, also in
 * reduced-motion mode. Canvas Left/Right arrows provide the same control.
 *
 * This disposable prototype uses locally vendored Three 0.186.1. Its browser
 * framing is the bounded experiment; new art and game engines are out of scope.
 */
(() => {
  "use strict";

  // Capture a stable base while this script is executing. Works as a normal
  // deferred script or an ES module; no import map or external CDN is required.
  const baseURL = new URL("./", document.currentScript?.src || location.href);
  let modulesPromise = null;
  let active = null;

  const isActive = (session) => active === session && !session.closed;
  const announce = (session, message) => {
    if (isActive(session) && session.status) session.status.textContent = message;
  };

  function loadModules() {
    if (!modulesPromise) {
      modulesPromise = Promise.all([
        import(new URL("./vendor/three.module.js", baseURL).href),
        import(new URL("./vendor/GLTFLoader.js", baseURL).href),
      ]).catch((error) => {
        modulesPromise = null;
        throw error;
      });
    }
    return modulesPromise;
  }

  function disposeModels(roots) {
    const geometries = new Set();
    const materials = new Set();
    const textures = new Set();
    const skeletons = new Set();
    const images = new Set();
    for (const root of roots) {
      root?.traverse((object) => {
        if (object.geometry) geometries.add(object.geometry);
        if (object.skeleton) skeletons.add(object.skeleton);
        const objectMaterials = Array.isArray(object.material)
          ? object.material
          : object.material ? [object.material] : [];
        objectMaterials.forEach((material) => materials.add(material));
      });
    }
    for (const material of materials) {
      for (const value of Object.values(material)) {
        if (value?.isTexture) textures.add(value);
      }
    }
    for (const skeleton of skeletons) skeleton.dispose();
    for (const geometry of geometries) geometry.dispose();
    for (const material of materials) material.dispose();
    for (const texture of textures) {
      const data = texture.source?.data || texture.image;
      for (const item of Array.isArray(data) ? data : [data]) {
        if (item && typeof item.close === "function") images.add(item);
      }
      texture.dispose();
    }
    // GLTFLoader uses ImageBitmap on supported browsers. texture.dispose()
    // releases the GPU upload, but the decoded bitmap needs an explicit close.
    for (const image of images) image.close();
  }

  function destroy(session) {
    if (!session || session.closed) return;
    session.closed = true;
    session.abort.abort();
    cancelAnimationFrame(session.raf);
    session.raf = 0;
    session.resizeObserver?.disconnect();
    session.intersectionObserver?.disconnect();
    session.listeners.forEach(([target, type, callback]) => {
      target.removeEventListener(type, callback);
    });
    session.mixer?.stopAllAction();
    if (session.model) session.mixer?.uncacheRoot(session.model);
    disposeModels(session.modelRoots);
    session.renderer?.dispose();
    session.renderer?.forceContextLoss();
    session.renderer?.domElement.remove();
    session.modelRoots = [];
    session.model = null;
    session.pivot = null;
    session.mixer = null;
    session.renderer = null;
    session.scene = null;
  }

  function fail(session, error) {
    if (!isActive(session)) return;
    announce(session, "The existing league figurine could not load on this device. The team information remains available. Close and reopen to retry.");
    console.warn("Clubhouse figurine viewer:", error);
    destroy(session);
    active = null;
  }

  function listen(session, target, type, callback) {
    target.addEventListener(type, callback);
    session.listeners.push([target, type, callback]);
  }

  function draw(session) {
    if (!isActive(session) || !session.renderer || !session.scene) return;
    try {
      session.renderer.render(session.scene, session.camera);
    } catch (error) {
      fail(session, error);
    }
  }

  function canAnimate(session) {
    return isActive(session) && session.idle && !session.motion.matches
      && session.visible && !document.hidden;
  }

  function start(session) {
    if (!canAnimate(session) || session.raf) return;
    session.lastFrame = null;
    const tick = (now) => {
      session.raf = 0;
      if (!canAnimate(session)) return;
      const delta = session.lastFrame === null
        ? 0 : Math.min((now - session.lastFrame) / 1000, 0.05);
      session.lastFrame = now;
      session.mixer.update(delta);
      draw(session);
      if (canAnimate(session)) session.raf = requestAnimationFrame(tick);
    };
    session.raf = requestAnimationFrame(tick);
  }

  function syncAnimation(session) {
    if (!isActive(session)) return;
    cancelAnimationFrame(session.raf);
    session.raf = 0;
    session.lastFrame = null;
    if (session.idle) session.idle.paused = session.motion.matches;
    if (session.visible && !document.hidden) draw(session);
    start(session);
  }

  function turn(session, angle) {
    if (!isActive(session) || !session.pivot) return;
    session.pivot.rotation.y += angle;
    draw(session);
  }

  function installInteraction(session) {
    const canvas = session.renderer.domElement;
    canvas.style.display = "block";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.touchAction = "pan-y";
    canvas.style.cursor = "grab";
    canvas.tabIndex = 0;
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", `${session.name}: existing league figurine, not a manager likeness. Drag horizontally or use Left and Right arrows to rotate.`);
    let pointer = null;
    let previousX = 0;
    listen(session, canvas, "pointerdown", (event) => {
      if (event.button !== 0 || pointer !== null || !session.pivot) return;
      pointer = event.pointerId;
      previousX = event.clientX;
      canvas.style.cursor = "grabbing";
      canvas.setPointerCapture(event.pointerId);
    });
    listen(session, canvas, "pointermove", (event) => {
      if (event.pointerId !== pointer) return;
      turn(session, (event.clientX - previousX) * 0.01);
      previousX = event.clientX;
    });
    const release = (event) => {
      if (event.pointerId !== pointer) return;
      if (canvas.hasPointerCapture(pointer)) canvas.releasePointerCapture(pointer);
      pointer = null;
      canvas.style.cursor = "grab";
    };
    listen(session, canvas, "pointerup", release);
    listen(session, canvas, "pointercancel", release);
    listen(session, canvas, "lostpointercapture", release);
    listen(session, canvas, "keydown", (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      turn(session, event.key === "ArrowLeft" ? -Math.PI / 4 : Math.PI / 4);
    });
    listen(session, canvas, "webglcontextlost", (event) => {
      event.preventDefault();
      fail(session, new Error("WebGL context was lost"));
    });
    listen(session, document, "visibilitychange", () => syncAnimation(session));
    listen(session, session.motion, "change", () => syncAnimation(session));
    if ("IntersectionObserver" in window) {
      session.intersectionObserver = new IntersectionObserver(([entry]) => {
        session.visible = entry.isIntersecting;
        syncAnimation(session);
      });
      session.intersectionObserver.observe(session.mount);
    }
  }

  window.closeClubScene = () => {
    const previous = active;
    active = null;
    destroy(previous);
    const status = document.getElementById("scene-status");
    if (status) status.textContent = "";
  };

  window.rotateClubScene = () => {
    if (active) turn(active, Math.PI / 4);
  };

  window.openClubScene = async (teamId, teamName) => {
    window.closeClubScene();
    const mount = document.getElementById("club-scene");
    const status = document.getElementById("scene-status");
    const id = Number(teamId);
    if (!mount) {
      if (status) status.textContent = "The figurine display is unavailable.";
      return false;
    }
    if (!Number.isInteger(id) || id < 1 || id > 10) {
      if (status) status.textContent = "Choose one of the ten league teams to inspect its existing figurine.";
      return false;
    }
    const session = {
      mount, status, name: String(teamName || `Team ${id}`),
      closed: false, abort: new AbortController(), listeners: [],
      modelRoots: [], raf: 0, visible: true,
      motion: window.matchMedia("(prefers-reduced-motion: reduce)"),
    };
    active = session;
    announce(session, `Loading ${session.name}’s existing league figurine…`);

    try {
      const [THREE, { GLTFLoader }] = await loadModules();
      if (!isActive(session)) return false;
      session.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      session.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      session.renderer.outputColorSpace = THREE.SRGBColorSpace;
      session.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      session.renderer.toneMappingExposure = 1.15;
      session.renderer.setClearColor(0x000000, 0);
      session.mount.appendChild(session.renderer.domElement);
      session.scene = new THREE.Scene();
      session.camera = new THREE.PerspectiveCamera(35, 1, 0.01, 100);
      session.scene.add(new THREE.HemisphereLight(0xffffff, 0x263042, 1.9));
      const key = new THREE.DirectionalLight(0xfff4e7, 2.2);
      key.position.set(4, 6, 7);
      session.scene.add(key);
      const rim = new THREE.DirectionalLight(0xffffff, 1.2);
      rim.position.set(-4, 3, -3);
      session.scene.add(rim);
      installInteraction(session);

      let radius = 1;
      const resize = () => {
        if (!isActive(session)) return;
        const width = Math.max(1, mount.clientWidth);
        const height = Math.max(1, mount.clientHeight);
        session.renderer.setSize(width, height, false);
        session.camera.aspect = width / height;
        const vertical = THREE.MathUtils.degToRad(session.camera.fov);
        const horizontal = 2 * Math.atan(Math.tan(vertical / 2) * session.camera.aspect);
        const distance = radius / Math.sin(Math.min(vertical, horizontal) / 2) * 1.12;
        session.camera.position.set(0, radius * 0.1, distance);
        session.camera.near = Math.max(0.01, distance / 100);
        session.camera.far = distance + radius * 5;
        session.camera.lookAt(0, 0, 0);
        session.camera.updateProjectionMatrix();
        draw(session);
      };
      session.resizeObserver = new ResizeObserver(resize);
      session.resizeObserver.observe(mount);
      resize();

      // Fetch is abortable. Embedded GLB texture decoding can finish later;
      // the stale-result check below disposes it without reattaching a canvas.
      const assetURL = new URL(`./assets/hoopers/hooper-${id}.glb`, baseURL);
      const response = await fetch(assetURL, { signal: session.abort.signal });
      if (!response.ok) throw new Error(`Figurine response ${response.status}`);
      const bytes = await response.arrayBuffer();
      if (!isActive(session)) return false;
      const gltf = await new GLTFLoader().parseAsync(bytes, new URL("./", assetURL).href);
      if (!isActive(session)) {
        disposeModels(gltf.scenes);
        return false;
      }
      session.modelRoots = gltf.scenes;
      session.model = gltf.scene;
      const box = new THREE.Box3().setFromObject(session.model, true);
      const center = box.getCenter(new THREE.Vector3());
      radius = Math.max(0.1, box.getBoundingSphere(new THREE.Sphere()).radius);
      session.model.position.sub(center);
      session.pivot = new THREE.Group();
      session.pivot.rotation.y = -0.2;
      session.pivot.add(session.model);
      session.scene.add(session.pivot);
      session.mixer = new THREE.AnimationMixer(session.model);
      const idle = gltf.animations.find((clip) => clip.name === "idle");
      if (idle) {
        session.idle = session.mixer.clipAction(idle);
        session.idle.play();
        session.mixer.setTime(0);
        session.idle.paused = session.motion.matches;
      }
      resize();
      announce(session, `${session.name}’s existing league figurine. Drag to rotate, use Left/Right arrows, or press Rotate. This is not a manager likeness.`);
      syncAnimation(session);
      return true;
    } catch (error) {
      if (error.name !== "AbortError") fail(session, error);
      return false;
    }
  };
})();
