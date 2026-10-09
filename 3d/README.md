# GOAT Hoopers 3D Assets

Bobblehead figurine characters, props, and a crown — built with Blender's
Python API (`bpy`), exported as binary glTF (`.glb`), served statically from
`public/3d/`.

**Do not touch the site code from here.** This directory is the asset
pipeline: scripts + docs. Another agent owns the Three.js integration.
The 3D preview renders live in `previews/` (one PNG per asset).

## Rejected hooper family — retired from public delivery

On 2026-10-09 Aidan rejected the Quaternius-based bald/blocky basketball
figurine in all 11 team/generic variants. `public/3d/hooper-*.glb` and the
site/preview loaders are removed. Authoring scripts, source base, color mapping
and historical preview/provenance files remain here; the removed generated
bytes are recoverable from Git history. Do not publish or reintroduce this family.

`build_all.sh` now rebuilds only basketball, trophy, crown and hoop props.
The historical `build_all_v3.sh` writes under `3d/archive/hoopers`, outside
public delivery. Single-model authoring commands below are historical examples,
not approved site output. The unrelated original arena scene, embroidered
banners, logo and playable free-throw assets retain their separate approval.

## Files in `public/3d/`

| File | What | Clips | Size |
|------|------|-------|------|
| `basketball.glb` | Ball with seam lines | `idle`, `bounce` | ~70 KB |
| `trophy.glb` | Championship cup + confetti | `idle`, `celebrate` | ~180 KB |
| `crown.glb` | Champion's crown (sits over the champ's avatar) | `idle`, `spin` | ~160 KB |
| `hoop.glb` | Backboard + rim + net + pole (static decor) | — | ~50 KB |

(Sizes are approximate; see build log. All well under the 1 MB budget.)

## Animation clips

Every clip is a named glTF animation (one NLA track per clip in Blender).
`idle` clips are designed to **loop**; the rest are **one-shots** for clicks.

| GLB | Clip | Frames | What happens |
|-----|------|--------|--------------|
| hooper-*.glb | `idle` | 60 | Gentle bounce, head sway, arm swing. Loop this ambiently. |
| hooper-*.glb | `spin` | 45 | Click: 360° spin with little hops, arms out. |
| hooper-*.glb | `jump` | 50 | Click: crouch → spring up, arms spread, squash & stretch landing. |
| hooper-*.glb | `dunk` | 75 | Click: deep crouch → big leap, right arm extended skyward with the ball. |
| basketball.glb | `idle` | 120 | Slow spin showing the seams. Loop ambiently. |
| basketball.glb | `bounce` | 55 | Click: juicy double bounce — anticipation squash, launch stretch, impact pancake, settle. |
| trophy.glb | `idle` | 180 | Slow turntable. Loop ambiently. |
| trophy.glb | `celebrate` | 70 | Click: 360° spin + hop (squash & stretch), 14-piece confetti burst, expanding gold shockwave ring. Also contains a static point light (`Gleam`) so the trophy glows in-scene. |
| crown.glb | `idle` | 240 | Slow turntable. Loop ambiently. |
| crown.glb | `spin` | 60 | Click: wind-up, fast double spin with a hop and squash & stretch. |
| hoop.glb | — | — | Static. No clips. |

## Integrator guide (three.js)

Use `GLTFLoader` + `AnimationMixer` — the standard three.js pattern:

```ts
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const gltf = await new GLTFLoader().loadAsync('/3d/hooper-8.glb');
const model = gltf.scene;
const mixer = new THREE.AnimationMixer(model);
const clips = new Map(gltf.animations.map((c) => [c.name, c]));

// ambient loop
const idle = mixer.clipAction(clips.get('idle')!);
idle.play();

// click -> one-shot (pick spin/jump/dunk, or cycle them)
model.traverse((o) => { o.userData.clickable = true; });
function onClick() {
  const name = ['spin', 'jump', 'dunk'][Math.floor(Math.random() * 3)];
  const action = mixer.clipAction(clips.get(name)!);
  action.setLoop(THREE.LoopOnce, 1);
  action.clampWhenFinished = true;
  // blend back into idle when done:
  action.getMixer().addEventListener('finished', () => {
    idle.reset().play();
  }, { once: true } as any);
  action.reset().play();
}
// in your render loop:
mixer.update(deltaSeconds);
```

Notes:
- All animations are baked (sampled) at 30 fps; no skeletons to configure —
  the hooper uses a real armature but ships as plain node animations, so
  `AnimationMixer` just works.
- Character faces **+Y** in Blender space; after glTF's Y-up conversion it
  faces **+Z** in three.js. Rotate the model if your camera expects otherwise.
- `trophy.glb` includes a `POINT` light (`Gleam`, warm, intensity ~60) via
  `KHR_lights_punctual` — three.js loads it automatically with the model.
  If you instance the trophy multiple times, watch your light count.
- `crown.glb` is sized to sit on/over a profile picture (~0.8 units wide).
  Scale to taste.
- Cross-fade one-shots into `idle` with `action.crossFadeTo(idleAction, 0.25)`
  for extra polish instead of the hard cut above.

## Regenerating

```bash
cd 3d
./build_all.sh            # rebuild every GLB into ../public/3d/
./build_all.sh --previews # also re-render previews/ (slow)
./build_all.sh --skip-hoopers  # props only
```

- `build_hooper.py` — parameterized figurine template. One script, 11
  variants driven by `team-colors.json`.
- `build_props.py` — `--prop basketball|trophy|crown|hoop`.
- `check_glb_anims.py` — inspect clip names + channel ranges in a GLB.
  Run it on any rebuild to confirm the clips survived export.

Blender lives at `~/workspace/blender/blender-4.5.3-linux-x64/` (4.5.3 LTS,
headless). The scripts assume it; see "Blender gotchas" below if you move it.

## Blender gotchas (learned the hard way)

1. **Parent to bones via the operator, not matrix math.** Setting
   `obj.parent_type='BONE'` + `matrix_parent_inverse` by hand produces a
   wrong offset in 4.5. Use
   `bpy.ops.object.parent_set(type='BONE', keep_transform=True)` with
   `arm.data.bones.active` set. (`parent_to_bone()` in build_hooper.py.)
2. **PoseBone `location`/`scale` are in the bone's rest-local frame.**
   For a +Z-pointing bone, setting `location=(0,0,z)` moves it along
   **−Y** in armature space. `key()` in build_hooper.py converts
   armature-space intents to bone-local automatically. Rotations are
   natively bone-local (which is what you want for posing).
3. **NLA track mute is unreliable in 4.5's viewport** — mute the
   **strips** (`strip.mute`), or better, remove NLA tracks before
   previewing a single clip. Export is unaffected (the exporter solos
   tracks itself — verified per-clip with check_glb_anims.py).
4. **Stale pose values leak across actions.** `key()` sets bone properties
   as it authors; channels an action *doesn't* drive keep whatever value
   was left behind. `new_action()` calls `reset_pose()` first.
5. **No `arc` parameter** on `primitive_torus_add` in 4.5 (the smile is a
   beveled Bezier curve instead).
6. **EEVEE can't render headless here** (no EGL/GPU). Previews use Cycles
   on CPU — slow but reliable.
7. Export with `export_animation_mode='NLA_TRACKS'` so same-named NLA
   tracks across objects (trophy's 14 confetti pieces) merge into one
   glTF clip.
