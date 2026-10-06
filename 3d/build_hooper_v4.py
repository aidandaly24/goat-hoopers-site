#!/usr/bin/env python3
"""
GOAT Hoopers — v4 hooper builder (Quaternius-based).

Uses the Quaternius "Universal Base Characters" CC0 model as the professional
base geometry, customized per reference study:
  - Face: Quaternius minimal (small dark eyes, subtle mouth) — already matches
    the reference findings (Quaternius/Fall Guys/Funko all use minimal faces).
  - Team identity: sleeveless jersey + shorts in team colors (hard color
    blocking, per reference study decision #4).
  - Silhouette: athletic broad-shouldered base, jersey adds basketball read.

Animation clips (one NLA track each -> one glTF animation each):
    idle  (60f loop) - gentle bounce + arm sway.
    spin  (45f)      - click: 360 spin with little hops.
    jump  (50f)      - click: crouch -> spring up -> land.
    dunk  (75f)      - click: deep crouch -> big leap, right arm up with ball.

Quaternius bone local-axis cheat sheet (probed, Blender 4.5):
    root      : world-aligned. rotation_euler z = spin, location z = up.
    pelvis/spine_02 : local X = world X. rotation.x NEGATIVE = lean forward.
    upperarm_l: local Z POSITIVE = raise arm up (arm points +X in T-pose).
    upperarm_r: local Z NEGATIVE = raise arm up (arm points -X in T-pose).
    lowerarm_l/r: rotation.x or z bends elbow (test visually).
    thigh_l/r : local X = world X. rotation.x NEGATIVE = swing leg forward.

Usage (headless):
    blender --background --python build_hooper_v4.py -- \
        --team 1 --out ../public/3d/hooper-1.glb \
        [--preview ../3d/previews/v4-hooper-1.png --preview-clip idle --preview-frame 30]
"""

import argparse
import bpy
import json
import math
import os
import struct
import sys
from mathutils import Vector

QB_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'quaternius-base')

# ---------------------------------------------------------------- args

def parse_args():
    ap = argparse.ArgumentParser()
    ap.add_argument('--team', required=True, help='team id from team-colors.json (or "generic")')
    ap.add_argument('--colors', default=os.path.join(os.path.dirname(os.path.abspath(__file__)), 'team-colors.json'))
    ap.add_argument('--out', required=True, help='output .glb path')
    ap.add_argument('--preview', default=None)
    ap.add_argument('--preview-clip', default='idle')
    ap.add_argument('--preview-frame', type=int, default=1)
    ap.add_argument('--preview-res', type=int, default=600)
    argv = sys.argv
    args = argv[argv.index('--') + 1:] if '--' in argv else []
    return ap.parse_args(args)

# ---------------------------------------------------------------- helpers

def hexcol(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) / 255.0 for i in (0, 2, 4)) + (1.0,)

def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for coll in (bpy.data.meshes, bpy.data.materials, bpy.data.armatures, bpy.data.actions):
        for x in list(coll):
            coll.remove(x)

def make_mat(name, hexcolor, roughness=0.7, metallic=0.0):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes['Principled BSDF']
    bsdf.inputs['Base Color'].default_value = hexcol(hexcolor)
    bsdf.inputs['Roughness'].default_value = roughness
    bsdf.inputs['Metallic'].default_value = metallic
    return mat

def _select_only(*objs):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs:
        o.select_set(True)

def parent_to_bone(obj, arm, bone_name):
    """Rigid-bind a mesh object to one bone, keeping its world transform."""
    _select_only(obj, arm)
    bpy.context.view_layer.objects.active = arm
    arm.data.bones.active = arm.data.bones[bone_name]
    bpy.ops.object.parent_set(type='BONE', keep_transform=True)
    _select_only()

def parent_to_bone_at_head(obj, arm, bone_name):
    """Rigid-bind to a bone with the object AT the bone head (origin).
    Use for props that should sit exactly at a joint (e.g. ball in hand)."""
    _select_only(obj, arm)
    bpy.context.view_layer.objects.active = arm
    arm.data.bones.active = arm.data.bones[bone_name]
    bpy.ops.object.parent_set(type='BONE', keep_transform=False)
    _select_only()
    obj.location = (0, 0, 0)

# ---------------------------------------------------------------- import base

def import_quaternius():
    """Import the Quaternius base, fix texture paths, clean up, optimize."""
    import shutil
    # Build a fixed gltf with local texture paths
    # Uses pre-optimized 1k textures (see quaternius-base/*_1k.png) for web
    gltf_path = os.path.join(QB_DIR, 'Superhero_Male_FullBody.gltf')
    with open(gltf_path) as f:
        d = json.load(f)
    tmpdir = '/tmp/qv4'
    os.makedirs(tmpdir, exist_ok=True)
    # Map full-res textures to pre-optimized 1k versions
    TEX_1K = {
        'T_Superhero_Male_Dark.png': 'T_Superhero_Male_Dark_1k.png',
        'T_Superhero_Male_Normal.png': 'T_Superhero_Male_Normal_1k.png',
    }
    for img in d.get('images', []):
        base = os.path.basename(img.get('uri', ''))
        # Map the odd _png-infix names to files we have
        candidates = [base, base.replace('_png.png', '.png'), base.replace('_png', '.png')]
        found = None
        for c in candidates:
            # Prefer the 1k optimized version if available
            c_1k = TEX_1K.get(c, c)
            src = os.path.join(QB_DIR, c_1k)
            if os.path.exists(src):
                found = c_1k
                shutil.copy(src, os.path.join(tmpdir, c_1k))
                break
            src = os.path.join(QB_DIR, c)
            if os.path.exists(src):
                found = c
                shutil.copy(src, os.path.join(tmpdir, c))
                break
        if found:
            img['uri'] = found
        else:
            print(f"WARNING: texture not found: {base}")
    for buf in d.get('buffers', []):
        base = os.path.basename(buf.get('uri', ''))
        shutil.copy(os.path.join(QB_DIR, base), os.path.join(tmpdir, base))
        buf['uri'] = base
    tmp_gltf = os.path.join(tmpdir, 'base.gltf')
    with open(tmp_gltf, 'w') as f:
        json.dump(d, f)
    bpy.ops.import_scene.gltf(filepath=tmp_gltf)
    # Remove stray icosphere
    if 'Icosphere' in bpy.data.objects:
        bpy.data.objects.remove(bpy.data.objects['Icosphere'])
    # Remove unused hair material (character is bald; saves 1.6MB)
    if 'MI_Hair_1' in bpy.data.materials:
        bpy.data.materials.remove(bpy.data.materials['MI_Hair_1'])
    # Remove unused hair image
    for img in list(bpy.data.images):
        if 'Hair' in img.name:
            bpy.data.images.remove(img)
    arm = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
    arm.name = 'HooperArmature'
    for pb in arm.pose.bones:
        pb.rotation_mode = 'XYZ'
    return arm

# ---------------------------------------------------------------- jersey + shorts

def build_jersey(team, arm):
    """Sleeveless basketball jersey: tapered tube + shoulder straps, team primary."""
    primary = team['primary']
    secondary = team.get('secondary', '#ffffff')
    mat_jersey = make_mat('Jersey', primary, roughness=0.75)
    mat_trim = make_mat('JerseyTrim', secondary, roughness=0.7)

    # Main torso tube: waist z~1.02 to chest z~1.48
    # Torso is roughly elliptical: wider in X (~0.20 half-width) than Y (~0.14)
    bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=1.0, depth=1.0,
                                        location=(0, 0, 1.25))
    jersey = bpy.context.active_object
    jersey.name = 'Jersey'
    # Shape the cylinder: scale to torso, taper
    mesh = jersey.data
    for v in mesh.vertices:
        # v.co is in object space, cylinder radius 1, height 1 (z -0.5..0.5)
        t = v.co.z + 0.5  # 0 at bottom, 1 at top
        # Radius profile: waist 0.21, chest 0.23, shoulders 0.20
        r = 0.21 + 0.02 * math.sin(t * math.pi) - 0.01 * t
        v.co.x *= r * 1.15  # wider in X
        v.co.y *= r * 0.85  # narrower in Y (front-back)
        v.co.z *= 0.46      # total height 0.46 (z 1.02..1.48)
    jersey.data.materials.append(mat_jersey)
    for p in jersey.data.polygons:
        p.use_smooth = True

    # Shoulder straps: two boxes over shoulders
    straps = []
    for sx in (1, -1):
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(sx * 0.13, 0, 1.50))
        strap = bpy.context.active_object
        strap.name = f'JerseyStrap_{"L" if sx > 0 else "R"}'
        strap.scale = (0.09, 0.10, 0.06)
        bpy.context.view_layer.objects.active = strap
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        strap.data.materials.append(mat_jersey)
        straps.append(strap)

    # Trim: thin torus at waist (bottom hem)
    bpy.ops.mesh.primitive_torus_add(major_radius=0.215, minor_radius=0.012,
                                     major_segments=24, minor_segments=8,
                                     location=(0, 0, 1.03))
    hem = bpy.context.active_object
    hem.name = 'JerseyHem'
    hem.scale = (1.15, 0.85, 1.0)
    bpy.context.view_layer.objects.active = hem
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    hem.data.materials.append(mat_trim)

    # Trim: neckline torus
    bpy.ops.mesh.primitive_torus_add(major_radius=0.13, minor_radius=0.010,
                                     major_segments=20, minor_segments=8,
                                     location=(0, 0.02, 1.47))
    neck = bpy.context.active_object
    neck.name = 'JerseyNeck'
    neck.scale = (1.2, 0.9, 1.0)
    bpy.context.view_layer.objects.active = neck
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    neck.data.materials.append(mat_trim)

    for obj in [jersey, hem, neck] + straps:
        parent_to_bone(obj, arm, 'spine_02')
    return [jersey, hem, neck] + straps

def build_shorts(team, arm):
    """Basketball shorts: tapered tube over hips/upper thighs, team secondary."""
    shorts_color = team.get('shorts', team.get('secondary', '#232329'))
    trim_color = team.get('primary', '#ffffff')
    mat_shorts = make_mat('Shorts', shorts_color, roughness=0.8)
    mat_trim = make_mat('ShortsTrim', trim_color, roughness=0.7)

    # Hips z~1.02 to mid-thigh z~0.72
    bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=1.0, depth=1.0,
                                        location=(0, 0, 0.87))
    shorts = bpy.context.active_object
    shorts.name = 'Shorts'
    mesh = shorts.data
    for v in mesh.vertices:
        t = v.co.z + 0.5  # 0 bottom, 1 top
        # Hips wider, taper slightly at thigh
        r = 0.20 - 0.02 * (1 - t) + 0.015 * t
        v.co.x *= r * 1.12
        v.co.y *= r * 0.88
        v.co.z *= 0.30  # z 0.72..1.02
    shorts.data.materials.append(mat_shorts)
    for p in shorts.data.polygons:
        p.use_smooth = True

    # Waistband trim
    bpy.ops.mesh.primitive_torus_add(major_radius=0.205, minor_radius=0.012,
                                     major_segments=24, minor_segments=8,
                                     location=(0, 0, 1.00))
    waist = bpy.context.active_object
    waist.name = 'ShortsWaist'
    waist.scale = (1.12, 0.88, 1.0)
    bpy.context.view_layer.objects.active = waist
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    waist.data.materials.append(mat_trim)

    for obj in [shorts, waist]:
        parent_to_bone(obj, arm, 'pelvis')
    return [shorts, waist]

def build_basketball_v4(arm):
    """Basketball prop for the dunk: improved per reference study.
    Burnt orange #C75B12, seams as recessed valleys (darker torus insets)."""
    mat_ball = make_mat('Ball', '#C75B12', roughness=0.85)
    mat_seam = make_mat('BallSeam', '#5a2d0a', roughness=0.9)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=16,
                                         radius=0.12, location=(0, 0, 0))
    ball = bpy.context.active_object
    ball.name = 'Ball'
    ball.data.materials.append(mat_ball)
    for p in ball.data.polygons:
        p.use_smooth = True
    # Seams: great-circle torus insets, slightly darker
    for i, rot in enumerate([(0, 0, 0), (90, 0, 0), (0, 90, 0)]):
        bpy.ops.mesh.primitive_torus_add(
            major_radius=0.118, minor_radius=0.006,
            major_segments=28, minor_segments=6,
            location=ball.location,
            rotation=tuple(math.radians(a) for a in rot))
        seam = bpy.context.active_object
        seam.name = f'BallSeam_{i}'
        seam.data.materials.append(mat_seam)
        # Parent seam to ball (keep world transform)
        _select_only(seam, ball)
        bpy.context.view_layer.objects.active = ball
        bpy.ops.object.parent_set(type='OBJECT', keep_transform=True)
        _select_only()
    # Ball follows right hand: place at the wrist joint, then rigid-parent
    hand_head = arm.data.bones['hand_r'].head_local
    ball.location = (hand_head.x, hand_head.y, hand_head.z)
    # Update world matrix before parenting
    bpy.context.view_layer.update()
    parent_to_bone(ball, arm, 'hand_r')
    return ball

# ---------------------------------------------------------------- animations

def key(arm, bone, prop, value, frame):
    pb = arm.pose.bones[bone]
    setattr(pb, prop, value)
    pb.keyframe_insert(data_path=prop, frame=frame)

def reset_pose(arm):
    for pb in arm.pose.bones:
        pb.location = (0.0, 0.0, 0.0)
        pb.rotation_euler = (0.0, 0.0, 0.0)
        pb.scale = (1.0, 1.0, 1.0)

def new_action(arm, name):
    ad = arm.animation_data or arm.animation_data_create()
    act = bpy.data.actions.new(name=name)
    ad.action = act
    reset_pose(arm)
    return act

def stash(arm, action, clip_name):
    ad = arm.animation_data
    track = ad.nla_tracks.new()
    track.name = clip_name
    track.strips.new(name=clip_name, start=1, action=action)
    track.mute = True
    return track

def set_linear(action):
    for fc in action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = 'LINEAR'

def animate_idle(arm):
    act = new_action(arm, 'idle')
    for f, z in ((1, 0), (15, -0.04), (30, 0), (45, -0.04), (60, 0)):
        key(arm, 'root', 'location', (0, 0, z), f)
    for f, x in ((1, 0), (30, -0.05), (60, 0)):
        key(arm, 'spine_02', 'rotation_euler', (x, 0, 0), f)
    for f, z in ((1, 0.06), (30, -0.06), (60, 0.06)):
        key(arm, 'Head', 'rotation_euler', (0, 0, z), f)
    # Gentle arm sway: L z+ raises, R z- raises
    for f, s in ((1, 0.08), (30, -0.08), (60, 0.08)):
        key(arm, 'upperarm_l', 'rotation_euler', (0, 0, s), f)
        key(arm, 'upperarm_r', 'rotation_euler', (0, 0, -s), f)
    stash(arm, act, 'idle')

def animate_spin(arm):
    act = new_action(arm, 'spin')
    key(arm, 'root', 'rotation_euler', (0, 0, 0), 1)
    key(arm, 'root', 'rotation_euler', (0, 0, math.tau), 45)
    set_linear(act)
    for f, z in ((1, 0), (11, 0.08), (22, 0), (33, 0.08), (45, 0)):
        key(arm, 'root', 'location', (0, 0, z), f)
    for f in (1, 45):
        key(arm, 'upperarm_l', 'rotation_euler', (0, 0, 0.7), f)
        key(arm, 'upperarm_r', 'rotation_euler', (0, 0, -0.7), f)
    stash(arm, act, 'spin')

def animate_jump(arm):
    act = new_action(arm, 'jump')
    for f, z in ((1, 0), (10, -0.12), (24, 0.45), (34, 0), (38, -0.08), (50, 0)):
        key(arm, 'root', 'location', (0, 0, z), f)
    for f, s in ((1, (1, 1, 1)), (10, (1.06, 1.06, 0.90)), (24, (0.96, 0.96, 1.06)),
                 (38, (1.08, 1.08, 0.88)), (50, (1, 1, 1))):
        key(arm, 'root', 'scale', s, f)
    for f, x in ((1, 0), (10, -0.25), (24, 0.12), (38, -0.04), (50, 0)):
        key(arm, 'spine_02', 'rotation_euler', (x, 0, 0), f)
    # Knees bend: thigh forward (x negative = forward if facing +Y)
    for f, x in ((1, 0), (10, -0.5), (24, 0.1), (38, -0.15), (50, 0)):
        key(arm, 'thigh_l', 'rotation_euler', (x, 0, 0), f)
        key(arm, 'thigh_r', 'rotation_euler', (x, 0, 0), f)
    for f, x in ((1, 0), (10, 0.7), (24, 0.05), (38, 0.2), (50, 0)):
        key(arm, 'calf_l', 'rotation_euler', (x, 0, 0), f)
        key(arm, 'calf_r', 'rotation_euler', (x, 0, 0), f)
    # Arms up at apex
    for f, s in ((1, (0, 0)), (10, (0.3, 0.3)), (24, (1.0, 1.0)), (38, (0, 0)), (50, (0, 0))):
        lz, rz = s
        key(arm, 'upperarm_l', 'rotation_euler', (0, 0, lz), f)
        key(arm, 'upperarm_r', 'rotation_euler', (0, 0, -rz), f)
    stash(arm, act, 'jump')

def animate_dunk(arm):
    act = new_action(arm, 'dunk')
    for f, z in ((1, 0), (12, -0.14), (36, 0.80), (52, 0), (57, -0.08), (75, 0)):
        key(arm, 'root', 'location', (0, 0, z), f)
    for f, s in ((1, (1, 1, 1)), (12, (1.08, 1.08, 0.88)), (36, (0.95, 0.95, 1.08)),
                 (57, (1.10, 1.10, 0.86)), (75, (1, 1, 1))):
        key(arm, 'root', 'scale', s, f)
    for f, x in ((1, 0), (12, -0.28), (36, 0.10), (52, 0.04), (75, 0)):
        key(arm, 'spine_02', 'rotation_euler', (x, 0, 0), f)
    for f, x in ((1, 0), (12, -0.5), (36, 0.1), (57, -0.12), (75, 0)):
        key(arm, 'thigh_l', 'rotation_euler', (x, 0, 0), f)
        key(arm, 'thigh_r', 'rotation_euler', (x, 0, 0), f)
    for f, x in ((1, 0), (12, 0.7), (36, 0.3), (57, 0.15), (75, 0)):
        key(arm, 'calf_l', 'rotation_euler', (x, 0, 0), f)
        key(arm, 'calf_r', 'rotation_euler', (x, 0, 0), f)
    # Right arm: back at crouch, extended UP at apex (ball in hand)
    for f, z in ((1, 0), (12, -0.5), (36, -2.6), (52, 0), (75, 0)):
        key(arm, 'upperarm_r', 'rotation_euler', (0, 0, z), f)
    for f, z in ((1, 0), (12, 0.3), (36, -0.4), (75, 0)):
        key(arm, 'lowerarm_r', 'rotation_euler', (0, 0, z), f)
    # Left arm out for balance
    for f, z in ((1, 0), (12, 0.4), (36, 1.2), (52, 0), (75, 0)):
        key(arm, 'upperarm_l', 'rotation_euler', (0, 0, z), f)
    for f, x in ((1, 0), (12, 0.12), (36, 0.28), (75, 0)):
        key(arm, 'Head', 'rotation_euler', (x, 0, 0), f)
    stash(arm, act, 'dunk')

def build_all_animations(arm):
    animate_idle(arm)
    animate_spin(arm)
    animate_jump(arm)
    animate_dunk(arm)
    ad = arm.animation_data
    for track in ad.nla_tracks:
        track.mute = False
        for strip in track.strips:
            strip.mute = False
    ad.action = None

# ---------------------------------------------------------------- preview + export

def setup_preview_scene(scene, res=600):
    world = bpy.data.worlds.new('PrevWorld')
    world.use_nodes = True
    world.node_tree.nodes['Background'].inputs[0].default_value = (0.92, 0.92, 0.94, 1.0)
    scene.world = world
    bpy.ops.object.camera_add(location=(1.6, -2.6, 1.4))
    cam = bpy.context.active_object
    d = Vector((0, 0, 0.9)) - cam.location
    cam.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
    scene.camera = cam
    bpy.ops.object.light_add(type='SUN', location=(2, 3, 4))
    bpy.context.active_object.data.energy = 2.5
    bpy.ops.object.light_add(type='AREA', location=(-1.5, 2.5, 3))
    area = bpy.context.active_object
    area.data.energy = 300
    area.data.size = 2.0
    scene.render.engine = 'CYCLES'
    scene.cycles.samples = 64
    scene.render.resolution_x = res
    scene.render.resolution_y = int(res * 1.25)
    scene.render.image_settings.file_format = 'PNG'

def render_preview(arm, clip_name, frame, path, res):
    ad = arm.animation_data
    while len(ad.nla_tracks):
        ad.nla_tracks.remove(ad.nla_tracks[0])
    ad.action = None
    action = bpy.data.actions.get(clip_name)
    if action is None:
        raise RuntimeError(f'action for clip {clip_name!r} not found')
    ad.action = action
    reset_pose(arm)
    bpy.context.scene.frame_set(frame)
    bpy.context.view_layer.update()
    bpy.context.scene.render.filepath = path
    bpy.ops.render.render(write_still=True)
    ad.action = None
    print(f'PREVIEW_WRITTEN {path}')

def export_glb(path):
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format='GLB',
        export_animations=True,
        export_animation_mode='NLA_TRACKS',
        export_nla_strips=True,
        export_frame_range=True,
        export_force_sampling=True,
        export_optimize_animation_size=True,
    )
    print(f'GLB_WRITTEN {path} ({os.path.getsize(path)} bytes)')

def glb_summary(path):
    with open(path, 'rb') as f:
        f.read(12)
        clen, ctype = struct.unpack('<II', f.read(8))
        js = json.loads(f.read(clen).decode('utf-8'))
    return {
        'meshes': len(js.get('meshes', [])),
        'materials': len(js.get('materials', [])),
        'animations': [a.get('name') for a in js.get('animations', [])],
        'skins': len(js.get('skins', [])),
    }

# ---------------------------------------------------------------- main

def main():
    args = parse_args()
    with open(args.colors) as f:
        colors = json.load(f)
    if args.team == 'generic':
        team = dict(colors['generic'])
    else:
        team = next(t for t in colors['teams'] if t['id'] == args.team)
    team['id'] = args.team

    clear_scene()
    arm = import_quaternius()
    build_jersey(team, arm)
    build_shorts(team, arm)
    build_basketball_v4(arm)
    build_all_animations(arm)

    scene = bpy.context.scene
    scene.render.fps = 30

    os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
    export_glb(args.out)
    print('GLB_SUMMARY ' + json.dumps(glb_summary(args.out)))

    if args.preview:
        ad = arm.animation_data
        while len(ad.nla_tracks):
            ad.nla_tracks.remove(ad.nla_tracks[0])
        ad.action = None
        setup_preview_scene(scene, args.preview_res)
        render_preview(arm, args.preview_clip, args.preview_frame, args.preview, args.preview_res)

if __name__ == '__main__':
    main()
