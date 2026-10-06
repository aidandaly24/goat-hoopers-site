#!/usr/bin/env python3
"""
GOAT Hoopers — prop builders: basketball, trophy, backboard/hoop.

Each prop is a self-contained bpy script run headless:
    blender --background --python build_props.py -- --prop basketball \
        --out ../public/3d/basketball.glb [--preview ...]

Click animations (one NLA track per animated object; tracks sharing a name
merge into ONE glTF animation clip — verified with check_glb_anims.py):

  basketball.glb
    idle    (120f loop) - slow spin showing off the seams.
    bounce  (55f)       - click: juicy squash-and-stretch double bounce.
  trophy.glb
    idle    (180f loop) - slow turntable.
    celebrate (70f)     - click: 360 spin + hop with squash & stretch,
                          14-piece confetti burst, and a gleam light pulse.
  hoop.glb
    (static)            - backboard + rim + net + pole. No animation.

Object (not armature) animation is used, so location/scale are plain
parent-space values — none of the bone-local gotchas from build_hooper.py.
"""

import argparse
import bpy
import json
import math
import os
import random
import struct
import sys
from mathutils import Vector

# ---------------------------------------------------------------- args

def parse_args():
    ap = argparse.ArgumentParser()
    ap.add_argument('--prop', required=True,
                    choices=['basketball', 'trophy', 'crown', 'hoop'])
    ap.add_argument('--out', required=True)
    ap.add_argument('--preview', default=None)
    ap.add_argument('--preview-clip', default='idle')
    ap.add_argument('--preview-frame', type=int, default=1)
    ap.add_argument('--preview-res', type=int, default=600)
    ap.add_argument('--preview-target', default=None)
    ap.add_argument('--preview-dist', type=float, default=1.0)
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
    for coll in (bpy.data.meshes, bpy.data.materials, bpy.data.actions,
                 bpy.data.curves):
        for x in list(coll):
            coll.remove(x)

def make_mat(name, hexcolor, roughness=0.65, metallic=0.0):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes['Principled BSDF']
    bsdf.inputs['Base Color'].default_value = hexcol(hexcolor)
    bsdf.inputs['Roughness'].default_value = roughness
    bsdf.inputs['Metallic'].default_value = metallic
    return mat

def smooth(o):
    if o.data and hasattr(o.data, 'polygons'):
        for p in o.data.polygons:
            p.use_smooth = True
    return o

def _finish(o, name, mat):
    o.name = name
    if mat:
        o.data.materials.append(mat)
    return smooth(o)

def sphere(name, loc, r, mat, seg=24, rings=16):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=rings,
                                        radius=r, location=loc)
    return _finish(bpy.context.active_object, name, mat)

def cyl(name, loc, r, depth, mat, verts=20):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=depth,
                                       location=loc)
    return _finish(bpy.context.active_object, name, mat)

def cone(name, loc, r_bottom, r_top, depth, mat, verts=20):
    bpy.ops.mesh.primitive_cone_add(radius1=r_bottom, radius2=r_top, depth=depth,
                                   vertices=verts, location=loc)
    return _finish(bpy.context.active_object, name, mat)

def torus(name, loc, r_major, r_minor, mat, rot=(0, 0, 0), seg=28, segm=12):
    bpy.ops.mesh.primitive_torus_add(
        major_radius=r_major, minor_radius=r_minor,
        major_segments=seg, minor_segments=segm, location=loc,
        rotation=tuple(math.radians(a) for a in rot))
    return _finish(bpy.context.active_object, name, mat)

def cube(name, loc, dims, mat):
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=loc)
    o = bpy.context.active_object
    o.scale = dims
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return _finish(o, name, mat)

def empty(name, loc=(0, 0, 0)):
    bpy.ops.object.empty_add(location=loc)
    o = bpy.context.active_object
    o.name = name
    return o

def _select_only(*objs):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs:
        o.select_set(True)

def parent_keep(child, parent):
    _select_only(child, parent)
    bpy.context.view_layer.objects.active = parent
    bpy.ops.object.parent_set(type='OBJECT', keep_transform=True)
    _select_only()

# ---------------------------------------------------------------- animation helpers

def new_action(obj, clip_name):
    ad = obj.animation_data or obj.animation_data_create()
    # Action names are unique per object (for preview lookup); NLA TRACK names
    # carry the clip name, which is what the exporter merges on.
    act = bpy.data.actions.new(name=f'{clip_name}__{obj.name}')
    ad.action = act
    return act, ad

def stash(ad, action, clip_name):
    track = ad.nla_tracks.new()
    track.name = clip_name
    track.strips.new(name=clip_name, start=1, action=action)
    return track

def key(obj, prop, value, frame):
    setattr(obj, prop, value)
    obj.keyframe_insert(data_path=prop, frame=frame)

def set_linear(action):
    for fc in action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = 'LINEAR'

def finish_clips(objs):
    """Leave every animated object with unmuted NLA tracks and no active action."""
    for o in objs:
        ad = o.animation_data
        for track in ad.nla_tracks:
            track.mute = False
            for strip in track.strips:
                strip.mute = False
        ad.action = None

# ---------------------------------------------------------------- basketball

BALL_ORANGE = '#E2701D'
SEAM_DARK = '#2A1A0E'

def build_basketball():
    """BallRig (world-space bounce + squash) -> BallSpin (rotation) -> ball+seams."""
    ball_mat = make_mat('BallMat', BALL_ORANGE, 0.85)
    seam_mat = make_mat('SeamMat', SEAM_DARK, 0.6)

    rig = empty('BallRig')
    spinner = empty('BallSpin')
    parent_keep(spinner, rig)
    ball = sphere('Ball', (0, 0, 0.5), 0.5, ball_mat, 28, 20)
    parent_keep(ball, spinner)
    for i, rot in enumerate([(0, 0, 0), (90, 0, 0), (0, 90, 0)]):
        seam = torus(f'BallSeam_{i}', (0, 0, 0.5), 0.495, 0.016, seam_mat,
                     rot=rot, seg=36, segm=8)
        parent_keep(seam, ball)

    # ---- idle: slow spin (120f loop) — on the spinner only
    act, ad = new_action(spinner, 'idle')
    key(spinner, 'rotation_euler', (0, 0, 0), 1)
    key(spinner, 'rotation_euler', (0, 0, math.tau), 120)
    set_linear(act)
    stash(ad, act, 'idle')

    # ---- bounce: juicy squash-and-stretch double bounce (55f)
    # rig carries height + world-aligned squash; spinner carries the roll
    act, ad = new_action(rig, 'bounce')
    for f, z, s in [
        (1, 0.50, (1, 1, 1)),
        (8, 0.36, (1.18, 1.18, 0.72)),
        (20, 2.00, (0.88, 0.88, 1.18)),
        (30, 2.30, (0.92, 0.92, 1.10)),
        (38, 0.36, (1.25, 1.25, 0.65)),
        (46, 1.10, (0.95, 0.95, 1.05)),
        (55, 0.50, (1, 1, 1)),
    ]:
        key(rig, 'location', (0, 0, z), f)
        key(rig, 'scale', s, f)
    stash(ad, act, 'bounce')

    act, ad = new_action(spinner, 'bounce')
    for f, rx in ((1, 0), (20, 2.2), (38, 4.6), (55, 6.0)):
        key(spinner, 'rotation_euler', (rx, 0, 0), f)
    stash(ad, act, 'bounce')

    finish_clips([rig, spinner])
    return rig

# ---------------------------------------------------------------- trophy

CONFETTI_COLORS = ['#F0B429', '#F472B6', '#38BDF8', '#A3E635', '#FFFFFF', '#FB923C']

def build_trophy():
    gold = make_mat('Gold', '#E8A91C', 0.32, 0.9)
    wood = make_mat('Wood', '#3A2415', 0.7)
    ball_mat = make_mat('TopperBall', BALL_ORANGE, 0.85)
    seam_mat = make_mat('TopperSeam', SEAM_DARK, 0.6)

    root = empty('TrophyRoot')
    parts = []
    parts.append(cube('TrophyBase1', (0, 0, 0.07), (0.55, 0.55, 0.14), wood))
    parts.append(cube('TrophyBase2', (0, 0, 0.20), (0.42, 0.42, 0.12), wood))
    parts.append(cyl('TrophyStem', (0, 0, 0.48), 0.07, 0.45, gold))
    parts.append(cone('TrophyCup', (0, 0, 0.93), 0.09, 0.30, 0.45, gold, 24))
    parts.append(torus('TrophyRim', (0, 0, 1.155), 0.30, 0.035, gold, seg=32))
    for s, sx in (('L', -1), ('R', 1)):
        # vertical ring, inner half embedded in the cup -> reads as a handle
        parts.append(torus(f'TrophyHandle_{s}', (sx * 0.30, 0, 0.95), 0.16, 0.035,
                           gold, rot=(0, 90, 0), seg=24))
    parts.append(sphere('TopperBall', (0, 0, 1.38), 0.14, ball_mat, 20, 14))
    for i, rot in enumerate([(0, 0, 0), (90, 0, 0)]):
        parts.append(torus(f'TopperSeam_{i}', (0, 0, 1.38), 0.138, 0.010,
                           seam_mat, rot=rot, seg=24, segm=6))
    for p in parts:
        parent_keep(p, root)

    # ---- confetti: 14 thin boxes, hidden until the burst
    rng = random.Random(7)
    confetti = []
    for i in range(14):
        mat = make_mat(f'ConfettiMat_{i}', CONFETTI_COLORS[i % len(CONFETTI_COLORS)], 0.5)
        c = cube(f'Confetti_{i:02d}', (0, 0, 1.55), (0.075, 0.05, 0.012), mat)
        parent_keep(c, root)
        c.scale = (0, 0, 0)
        confetti.append(c)

    # ---- static glow light on the spin axis (exports as a static punctual light)
    bpy.ops.object.light_add(type='POINT', location=(0, 0, 1.9))
    gleam = bpy.context.active_object
    gleam.name = 'Gleam'
    gleam.data.color = (1.0, 0.93, 0.80)
    gleam.data.energy = 60
    parent_keep(gleam, root)

    # ---- shockwave ring: the export-safe "gleam pulse" (mesh scale animation)
    shock = torus('Shockwave', (0, 0, 0.06), 0.55, 0.035, gold, seg=40)
    # NOTE: parented to the scene (not the root) so it stays grounded while
    # the trophy hops.

    # ---- TrophyRoot: idle turntable (180f)
    act, ad = new_action(root, 'idle')
    key(root, 'rotation_euler', (0, 0, 0), 1)
    key(root, 'rotation_euler', (0, 0, math.tau), 180)
    set_linear(act)
    stash(ad, act, 'idle')

    # ---- TrophyRoot: celebrate (70f) — spin + hop with squash & stretch
    act, ad = new_action(root, 'celebrate')
    key(root, 'rotation_euler', (0, 0, 0), 1)
    key(root, 'rotation_euler', (0, 0, math.tau), 50)
    key(root, 'rotation_euler', (0, 0, math.tau), 70)
    set_linear(act)
    for f, z in ((1, 0), (14, 0), (28, 0.45), (40, 0), (70, 0)):
        key(root, 'location', (0, 0, z), f)
    for f, s in ((1, (1, 1, 1)), (14, (1.15, 1.15, 0.85)), (28, (0.9, 0.9, 1.15)),
                 (42, (1.12, 1.12, 0.88)), (55, (1, 1, 1)), (70, (1, 1, 1))):
        key(root, 'scale', s, f)
    stash(ad, act, 'celebrate')

    # ---- confetti burst (in root space; the root spin makes it spiral)
    for i, c in enumerate(confetti):
        a = i * math.tau / 14 + rng.uniform(-0.2, 0.2)
        d = 0.55 + rng.uniform(0, 0.35)
        h = 0.55 + rng.uniform(0, 0.45)
        p_mid = (math.cos(a) * d, math.sin(a) * d, 1.55 + h)
        p_end = (math.cos(a) * d * 1.7, math.sin(a) * d * 1.7, 0.12)
        r_mid = (rng.uniform(0, 6), rng.uniform(0, 6), rng.uniform(0, 6))
        r_end = (r_mid[0] + rng.uniform(2, 5), r_mid[1] + rng.uniform(2, 5), r_mid[2])
        act, ad = new_action(c, 'celebrate')
        key(c, 'location', (0, 0, 1.55), 1)
        key(c, 'scale', (0, 0, 0), 14)
        key(c, 'location', (0, 0, 1.55), 16)
        key(c, 'scale', (1, 1, 1), 18)
        key(c, 'location', p_mid, 30)
        key(c, 'rotation_euler', r_mid, 30)
        key(c, 'location', p_end, 48)
        key(c, 'rotation_euler', r_end, 48)
        key(c, 'scale', (0, 0, 0), 56)
        stash(ad, act, 'celebrate')

    # ---- shockwave ring pulse (stays grounded; expands as the trophy lands)
    act, ad = new_action(shock, 'celebrate')
    key(shock, 'scale', (0.01, 0.01, 0.01), 1)
    key(shock, 'scale', (0.01, 0.01, 0.01), 22)
    key(shock, 'scale', (1.5, 1.5, 1.5), 34)
    key(shock, 'scale', (1.5, 1.5, 1.5), 44)
    key(shock, 'scale', (0.01, 0.01, 0.01), 56)
    stash(ad, act, 'celebrate')

    finish_clips([root] + confetti + [shock])
    return root

# ---------------------------------------------------------------- champion's crown

def build_crown():
    gold = make_mat('CrownGold', '#E8A91C', 0.30, 0.9)
    gold_bright = make_mat('CrownGoldBright', '#F6C453', 0.25, 0.95)
    velvet = make_mat('CrownVelvet', '#7A1E2B', 0.85)
    jewel_mats = {
        'ruby': make_mat('Ruby', '#E63946', 0.15),
        'sapphire': make_mat('Sapphire', '#3B82F6', 0.15),
        'emerald': make_mat('Emerald', '#4ADE80', 0.15),
    }
    # slight emissive kick so jewels pop
    for jm in jewel_mats.values():
        bsdf = jm.node_tree.nodes['Principled BSDF']
        bsdf.inputs['Emission Color'].default_value = bsdf.inputs['Base Color'].default_value
        bsdf.inputs['Emission Strength'].default_value = 0.6

    root = empty('CrownRoot')
    parts = []
    # band
    parts.append(cyl('CrownBand', (0, 0, 0.16), 0.40, 0.32, gold, 24))
    parts.append(torus('CrownTrimTop', (0, 0, 0.32), 0.40, 0.035, gold_bright, seg=32))
    parts.append(torus('CrownTrimBottom', (0, 0, 0.015), 0.40, 0.035, gold_bright, seg=32))
    # velvet cap visible inside
    parts.append(cyl('CrownVelvet', (0, 0, 0.24), 0.355, 0.22, velvet, 24))
    parts.append(sphere('CrownDome', (0, 0, 0.33), 0.355, velvet, 24, 12))
    # 8 pyramid spikes around the rim
    for i in range(8):
        a = i * math.tau / 8
        x, y = math.cos(a) * 0.355, math.sin(a) * 0.355
        bpy.ops.mesh.primitive_cone_add(radius1=0.115, radius2=0.0, depth=0.36,
                                       vertices=4, location=(x, y, 0.50),
                                       rotation=(0, 0, a + math.pi / 4))
        spike = bpy.context.active_object
        _finish(spike, f'CrownSpike_{i:02d}', gold)
        parts.append(spike)
        # jewel ball on each spike tip
        jm = jewel_mats[['ruby', 'sapphire', 'emerald'][i % 3]]
        parts.append(sphere(f'SpikeJewel_{i:02d}', (x, y, 0.70), 0.045, jm, 12, 8))
    # jewels around the band
    for i in range(8):
        a = (i + 0.5) * math.tau / 8
        x, y = math.cos(a) * 0.405, math.sin(a) * 0.405
        jm = jewel_mats[['sapphire', 'emerald', 'ruby'][i % 3]]
        parts.append(sphere(f'BandJewel_{i:02d}', (x, y, 0.16), 0.055, jm, 12, 8))
    for p in parts:
        parent_keep(p, root)

    # ---- idle: slow turntable (240f loop)
    act, ad = new_action(root, 'idle')
    key(root, 'rotation_euler', (0, 0, 0), 1)
    key(root, 'rotation_euler', (0, 0, math.tau), 240)
    set_linear(act)
    stash(ad, act, 'idle')

    # ---- spin: click — wind-up, fast double spin with a hop (60f)
    act, ad = new_action(root, 'spin')
    key(root, 'rotation_euler', (0, 0, 0), 1)
    key(root, 'rotation_euler', (0, 0, -0.35), 8)
    key(root, 'rotation_euler', (0, 0, 4 * math.pi - 0.35), 42)
    key(root, 'rotation_euler', (0, 0, 4 * math.pi), 52)
    key(root, 'rotation_euler', (0, 0, 4 * math.pi), 60)
    for f, z in ((1, 0), (8, -0.05), (25, 0.40), (40, 0), (45, -0.06), (60, 0)):
        key(root, 'location', (0, 0, z), f)
    for f, s in ((1, (1, 1, 1)), (8, (1.12, 1.12, 0.85)), (25, (0.92, 0.92, 1.12)),
                 (45, (1.10, 1.10, 0.88)), (60, (1, 1, 1))):
        key(root, 'scale', s, f)
    stash(ad, act, 'spin')

    finish_clips([root])
    return root
# ---------------------------------------------------------------- backboard / hoop (static)

def build_hoop():
    white = make_mat('HoopWhite', '#F5F2EA', 0.5)
    orange = make_mat('HoopOrange', '#E8631A', 0.55)
    steel = make_mat('HoopSteel', '#8A8F98', 0.4, 0.8)

    root = empty('HoopRoot')
    # backboard: thin box, slightly transparent white
    board = cube('Backboard', (0, 0, 2.30), (1.30, 0.06, 0.85), white)
    board_mat = board.data.materials[0]
    board_mat.use_nodes = True
    bsdf = board_mat.node_tree.nodes['Principled BSDF']
    bsdf.inputs['Alpha'].default_value = 0.45
    board_mat.blend_method = 'BLEND'
    parent_keep(board, root)
    # rim
    parent_keep(torus('Rim', (0, 0.38, 1.92), 0.28, 0.028, orange, seg=32), root)
    # net: 8 cords from rim down to a smaller ring
    for i in range(8):
        a = i * math.tau / 8
        x0, y0 = math.cos(a) * 0.28, 0.38 + math.sin(a) * 0.28
        x1, y1 = math.cos(a + 0.35) * 0.13, 0.38 + math.sin(a + 0.35) * 0.13
        dx, dy, dz = x1 - x0, y1 - y0, 1.42 - 1.90
        length = math.sqrt(dx * dx + dy * dy + dz * dz)
        cord = cyl(f'NetCord_{i}', ((x0 + x1) / 2, (y0 + y1) / 2, 1.66),
                   0.012, length, white, verts=6)
        # aim the cylinder along the cord direction
        d = Vector((dx, dy, dz)).normalized()
        q = Vector((0, 0, 1)).rotation_difference(d)
        cord.rotation_euler = q.to_euler()
        bpy.context.view_layer.objects.active = cord
        bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)
        parent_keep(cord, root)
    parent_keep(torus('NetRing', (0, 0.38, 1.42), 0.13, 0.015, white, seg=20), root)
    # pole + arm
    parent_keep(cyl('Pole', (0, -0.55, 1.15), 0.07, 2.30, steel), root)
    parent_keep(cube('HoopArm', (0, -0.28, 2.30), (0.10, 0.60, 0.10), steel), root)
    return root

# ---------------------------------------------------------------- preview + export + main

def setup_preview_scene(scene, res, target, dist):
    world = bpy.data.worlds['World']
    world.use_nodes = True
    world.node_tree.nodes['Background'].inputs[0].default_value = (0.045, 0.045, 0.065, 1.0)
    bpy.ops.object.camera_add(location=(2.9 * dist, 4.1 * dist, 2.35 * dist))
    cam = bpy.context.active_object
    d = Vector(target) - cam.location
    cam.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
    scene.camera = cam
    bpy.ops.object.light_add(type='SUN', location=(2.5, 3, 4))
    bpy.context.active_object.data.energy = 2.5
    bpy.ops.object.light_add(type='AREA', location=(0.5, 4.2, 2.6))
    area = bpy.context.active_object
    area.data.energy = 400
    area.data.size = 3.0
    bpy.ops.object.light_add(type='AREA', location=(-2.5, 2.5, 3.2))
    rim = bpy.context.active_object
    rim.data.energy = 250
    rim.data.size = 2.0
    scene.render.engine = 'CYCLES'
    scene.cycles.samples = 64
    scene.cycles.device = 'CPU'
    scene.render.resolution_x = res
    scene.render.resolution_y = res
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = False
    scene.render.image_settings.file_format = 'PNG'

def render_preview(objs, clip_name, frame, path, res, target, dist):
    # Remove NLA tracks so exactly one clip evaluates (NLA muting is
    # unreliable in 4.5); then drive every animated object from its clip
    # action (named "<clip>__<object>" by new_action).
    for o in objs:
        ad = o.animation_data
        if ad:
            while len(ad.nla_tracks):
                ad.nla_tracks.remove(ad.nla_tracks[0])
            act = bpy.data.actions.get(f'{clip_name}__{o.name}')
            ad.action = act
            # reset to rest so undriven channels don't leak stale values
            o.location = (0, 0, 0)
            o.rotation_euler = (0, 0, 0)
            o.scale = (1, 1, 1)
    bpy.context.scene.frame_set(frame)
    bpy.context.view_layer.update()
    bpy.context.scene.render.filepath = path
    bpy.ops.render.render(write_still=True)
    print(f'PREVIEW_WRITTEN {path}')

def export_glb(path, with_anims):
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format='GLB',
        export_animations=with_anims,
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
    }

BUILDERS = {
    'basketball': (build_basketball, True, (0, 0, 0.9), 1.0),
    'trophy': (build_trophy, True, (0, 0, 0.95), 1.25),
    'crown': (build_crown, True, (0, 0, 0.45), 1.1),
    'hoop': (build_hoop, False, (0, 0, 1.6), 1.6),
}

def main():
    args = parse_args()
    builder, with_anims, default_target, default_dist = BUILDERS[args.prop]
    clear_scene()
    rig = builder()
    scene = bpy.context.scene
    scene.render.fps = 30

    os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
    export_glb(args.out, with_anims)
    print('GLB_SUMMARY ' + json.dumps(glb_summary(args.out)))

    if args.preview:
        target = (tuple(float(v) for v in args.preview_target.split(','))
                  if args.preview_target else default_target)
        dist = args.preview_dist if args.preview_dist != 1.0 else default_dist
        setup_preview_scene(scene, args.preview_res, target, dist)
        # all objects with animation data participate in the preview
        objs = [o for o in bpy.data.objects
                if o.animation_data and o.animation_data.nla_tracks]
        render_preview(objs, args.preview_clip, args.preview_frame,
                       args.preview, args.preview_res, target, dist)

if __name__ == '__main__':
    main()

