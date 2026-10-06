#!/usr/bin/env python3
"""
GOAT Hoopers — bobblehead character template builder.

Builds ONE parameterized low-poly basketball figurine (big-head collectible
aesthetic), rigs it with a simple armature, authors 4 animation clips, and
exports a GLB.

Usage (headless):
    blender --background --python build_hooper.py -- \
        --team reaves-dropper --out ../public/3d/hooper-reaves-dropper.glb \
        [--preview ../3d/previews/hooper-reaves-dropper.png --preview-clip dunk --preview-frame 36]

Animation clips (one NLA track each -> one glTF animation each):
    idle  (60f loop) - gentle bounce + head sway + arm swing. Meant to loop ambiently.
    spin  (45f)      - click: 360 spin with little hops, arms out.
    jump  (50f)      - click: crouch -> spring up -> land with squash & stretch.
    dunk  (75f)      - click: deep crouch -> big leap, right arm extended up with ball.

Bone local-axis cheat sheet (verified by probe, Blender 4.5):
    spine/head/root : local X = world X. spine.x NEGATIVE = lean forward,
                      head.x POSITIVE = look up, root SPIN = rotation.y.
    upperarm.R      : rotation.x POSITIVE = swing forward; rotation.z POSITIVE = raise up.
    upperarm.L      : rotation.x POSITIVE = swing forward; rotation.z NEGATIVE = raise up.
    forearm.R/L     : rotation.x POSITIVE = bend forward.
"""

import argparse
import bpy
import json
import math
import os
import struct
import sys
from mathutils import Vector

# ---------------------------------------------------------------- args

def parse_args():
    ap = argparse.ArgumentParser()
    ap.add_argument('--team', required=True, help='team id from team-colors.json (or "generic")')
    ap.add_argument('--colors', default=os.path.join(os.path.dirname(os.path.abspath(__file__)), 'team-colors.json'))
    ap.add_argument('--out', required=True, help='output .glb path')
    ap.add_argument('--preview', default=None, help='optional preview png path')
    ap.add_argument('--preview-clip', default='idle')
    ap.add_argument('--preview-frame', type=int, default=1)
    ap.add_argument('--preview-res', type=int, default=600)
    ap.add_argument('--preview-target', default='0,0,1.12',
                    help='camera look-at as x,y,z')
    ap.add_argument('--preview-dist', type=float, default=1.0,
                    help='camera distance multiplier')
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

def make_mat(name, hexcolor, roughness=0.65, metallic=0.0):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes['Principled BSDF']
    bsdf.inputs['Base Color'].default_value = hexcol(hexcolor)
    bsdf.inputs['Roughness'].default_value = roughness
    bsdf.inputs['Metallic'].default_value = metallic
    return mat

def smooth(obj):
    for p in obj.data.polygons:
        p.use_smooth = True
    return obj

def prim_sphere(name, loc, r, mat, seg=20, rings=12):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=rings, radius=r, location=loc)
    o = bpy.context.active_object
    o.name = name
    o.data.materials.append(mat)
    return smooth(o)

def prim_cyl(name, loc, r, depth, mat, verts=18):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=depth, location=loc)
    o = bpy.context.active_object
    o.name = name
    o.data.materials.append(mat)
    return smooth(o)

def prim_cone(name, loc, r_bottom, r_top, depth, mat, verts=18):
    bpy.ops.mesh.primitive_cone_add(radius1=r_bottom, radius2=r_top, depth=depth,
                                    vertices=verts, location=loc)
    o = bpy.context.active_object
    o.name = name
    o.data.materials.append(mat)
    return smooth(o)

def prim_torus(name, loc, r_major, r_minor, mat, rot=(0, 0, 0), seg=24, segm=12):
    bpy.ops.mesh.primitive_torus_add(major_radius=r_major, minor_radius=r_minor,
                                     major_segments=seg, minor_segments=segm,
                                     location=loc,
                                     rotation=tuple(math.radians(a) for a in rot))
    o = bpy.context.active_object
    o.name = name
    o.data.materials.append(mat)
    return smooth(o)

def prim_smile(name, loc, width, depth, tube, mat):
    """Smile as a beveled 2-point Bezier arc, facing +Y."""
    bpy.ops.curve.primitive_bezier_curve_add(location=loc, rotation=(math.radians(90), 0, 0))
    o = bpy.context.active_object
    o.name = name
    spline = o.data.splines[0]
    p0, p1 = spline.bezier_points[0], spline.bezier_points[1]
    p0.co = (-width / 2, 0.015, 0)
    p0.handle_left = (-width / 2 - 0.06, 0.015, 0)
    p0.handle_right = (-width / 2 + width * 0.38, -0.055, 0)
    p0.handle_left_type = p0.handle_right_type = 'FREE'
    p1.co = (width / 2, 0.015, 0)
    p1.handle_left = (width / 2 - width * 0.38, -0.055, 0)
    p1.handle_right = (width / 2 + 0.06, 0.015, 0)
    p1.handle_left_type = p1.handle_right_type = 'FREE'
    o.data.bevel_depth = tube
    o.data.bevel_resolution = 4
    o.data.materials.append(mat)
    return o

def prim_cube(name, loc, dims, mat):
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=loc)
    o = bpy.context.active_object
    o.name = name
    o.scale = dims
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    o.data.materials.append(mat)
    return o

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

def parent_to_obj(obj, parent):
    _select_only(obj, parent)
    bpy.context.view_layer.objects.active = parent
    bpy.ops.object.parent_set(type='OBJECT', keep_transform=True)
    _select_only()

# ---------------------------------------------------------------- character

BALL_ORANGE = '#E2701D'

def build_character(team):
    """The Baller v2 — delegates mesh to new_character.py, keeps proven rig."""
    import importlib.util
    spec = importlib.util.spec_from_file_location(
        "new_character",
        os.path.join(os.path.dirname(os.path.abspath(__file__)), "new_character.py"))
    nc = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(nc)

    helpers = {
        'prim_sphere': prim_sphere,
        'prim_cyl': prim_cyl,
        'prim_cone': prim_cone,
        'prim_torus': prim_torus,
        'prim_cube': prim_cube,
        'make_mat': make_mat,
    }
    # Jersey number per team (1-10, generic = 0)
    try:
        num = int(team['id'])
    except (ValueError, KeyError):
        num = 0
    team = dict(team)
    team['number'] = str(num) if num > 0 else '00'

    parts, mats = nc.build_character_v2(team, helpers)

    # Ball seams (parented to ball object)
    ball_obj = next(o for o, b in parts if o.name == 'Ball')
    seams = []
    for i, rot in enumerate([(0, 0, 0), (90, 0, 0), (0, 90, 0)]):
        seams.append(prim_torus(f'BallSeam_{i}',
                                ball_obj.location, 0.173, 0.011,
                                mats['dark'], rot=rot, seg=24, segm=6))

    # ---- armature (same proven rig as v1)
    bpy.ops.object.armature_add(location=(0, 0, 0))
    arm = bpy.context.active_object
    arm.name = 'HooperArmature'
    bpy.ops.object.mode_set(mode='EDIT')
    eb = arm.data.edit_bones
    bones = [
        ('root', (0, 0, 0), (0, 0, 0.25), None),
        ('spine', (0, 0, 0.55), (0, 0, 1.34), 'root'),
        ('neck', (0, 0, 1.34), (0, 0, 1.54), 'spine'),
        ('head', (0, 0, 1.54), (0, 0, 1.90), 'neck'),
    ]
    for s, sx in (('L', -1), ('R', 1)):
        bones += [
            (f'upperarm.{s}', (sx * 0.27, 0, 1.30), (sx * 0.33, 0, 1.05), 'spine'),
            (f'forearm.{s}', (sx * 0.33, 0, 1.05), (sx * 0.35, 0, 0.80), f'upperarm.{s}'),
            (f'hand.{s}', (sx * 0.35, 0, 0.80), (sx * 0.35, 0, 0.68), f'forearm.{s}'),
            (f'thigh.{s}', (sx * 0.13, 0, 0.62), (sx * 0.13, 0, 0.38), 'root'),
            (f'shin.{s}', (sx * 0.13, 0, 0.38), (sx * 0.13, 0, 0.16), f'thigh.{s}'),
            (f'foot.{s}', (sx * 0.13, 0, 0.16), (sx * 0.13, 0.16, 0.06), f'shin.{s}'),
        ]
    for name, h, t, parent in bones:
        b = eb.new(name)
        b.head, b.tail = h, t
        if parent:
            b.parent = eb[parent]
    bpy.ops.object.mode_set(mode='OBJECT')

    for obj, bone_name in parts:
        parent_to_bone(obj, arm, bone_name)
    for seam in seams:
        parent_to_obj(seam, ball_obj)

    for pb in arm.pose.bones:
        pb.rotation_mode = 'XYZ'
    return arm


# ---------------------------------------------------------------- animations

def _bone_rest_R(arm, bone):
    return arm.data.bones[bone].matrix_local.to_3x3()

def key(arm, bone, prop, value, frame):
    """Keyframe a pose-bone channel.

    `location` and `scale` are authored in ARMATURE space (what you mean when
    you say "move up" or "squash vertically") and converted to the bone's
    rest-local frame, because Blender applies PoseBone location/scale in the
    bone's rest-local axes (gotcha: for our +Z-pointing root bone, raw (0,0,z)
    would move it along -Y!). `rotation_euler` stays bone-local, which is the
    natural posing semantic.
    """
    pb = arm.pose.bones[bone]
    if prop == 'location':
        R = _bone_rest_R(arm, bone)
        value = tuple(R.transposed() @ Vector(value))
    elif prop == 'scale':
        R = _bone_rest_R(arm, bone)
        sx, sy, sz = value
        s_a = (sx, sy, sz)
        b = [1.0, 1.0, 1.0]
        for j in range(3):
            col = R.col[j]
            i = max(range(3), key=lambda k: abs(col[k]))
            b[j] = s_a[i]
        value = tuple(b)
    setattr(pb, prop, value)
    pb.keyframe_insert(data_path=prop, frame=frame)

def reset_pose(arm):
    """Return every pose bone to rest. CRITICAL: key() leaves property values
    behind as it authors; without a reset, channels NOT driven by an action
    keep stale values from a previously authored action (e.g. spin's 2pi)."""
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
    """Push an action to its own NLA track (muted while authoring others)."""
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
    for f, z in ((1, 0), (15, -0.06), (30, 0), (45, -0.06), (60, 0)):
        key(arm, 'root', 'location', (0, 0, z), f)
    for f, x in ((1, 0), (30, -0.07), (60, 0)):      # spine.x negative = lean fwd
        key(arm, 'spine', 'rotation_euler', (x, 0, 0), f)
    for f, z in ((1, 0.09), (30, -0.09), (60, 0.09)):  # head tilt sway
        key(arm, 'head', 'rotation_euler', (0, 0, z), f)
    for f, x in ((1, 0.12), (30, -0.12), (60, 0.12)):  # arm swing (x+ = fwd)
        key(arm, 'upperarm.R', 'rotation_euler', (x, 0, 0), f)
        key(arm, 'upperarm.L', 'rotation_euler', (-x, 0, 0), f)
    stash(arm, act, 'idle')

def animate_spin(arm):
    act = new_action(arm, 'spin')
    key(arm, 'root', 'rotation_euler', (0, 0, 0), 1)
    key(arm, 'root', 'rotation_euler', (0, math.tau, 0), 45)  # local Y = world Z
    set_linear(act)
    for f, z in ((1, 0), (11, 0.10), (22, 0), (33, 0.10), (45, 0)):
        key(arm, 'root', 'location', (0, 0, z), f)
    for f in (1, 45):  # arms slightly out the whole spin (R z- = out, L z+ = out)
        key(arm, 'upperarm.R', 'rotation_euler', (0, 0, -0.8), f)
        key(arm, 'upperarm.L', 'rotation_euler', (0, 0, 0.8), f)
    stash(arm, act, 'spin')

def animate_jump(arm):
    act = new_action(arm, 'jump')
    for f, z in ((1, 0), (10, -0.14), (24, 0.55), (34, 0), (38, -0.10), (50, 0)):
        key(arm, 'root', 'location', (0, 0, z), f)
    for f, s in ((1, (1, 1, 1)), (10, (1.08, 1.08, 0.88)), (24, (0.94, 0.94, 1.10)),
                 (38, (1.12, 1.12, 0.85)), (50, (1, 1, 1))):
        key(arm, 'root', 'scale', s, f)
    for f, x in ((1, 0), (10, -0.28), (24, 0.15), (38, -0.05), (50, 0)):
        key(arm, 'spine', 'rotation_euler', (x, 0, 0), f)
    for f, (x, z) in ((1, (0, 0)), (10, (-0.5, 0)), (24, (0.25, -1.15)),
                       (38, (0, 0)), (50, (0, 0))):
        key(arm, 'upperarm.R', 'rotation_euler', (x, 0, z), f)
        key(arm, 'upperarm.L', 'rotation_euler', (x, 0, -z), f)
    for f, x in ((1, 0), (10, 0.12), (24, -0.22), (50, 0)):
        key(arm, 'head', 'rotation_euler', (x, 0, 0), f)
    stash(arm, act, 'jump')

def animate_dunk(arm):
    act = new_action(arm, 'dunk')
    for f, z in ((1, 0), (12, -0.16), (36, 0.95), (52, 0), (57, -0.10), (75, 0)):
        key(arm, 'root', 'location', (0, 0, z), f)
    for f, s in ((1, (1, 1, 1)), (12, (1.10, 1.10, 0.85)), (36, (0.93, 0.93, 1.12)),
                 (57, (1.12, 1.12, 0.85)), (75, (1, 1, 1))):
        key(arm, 'root', 'scale', s, f)
    for f, x in ((1, 0), (12, -0.30), (36, 0.12), (52, 0.05), (75, 0)):
        key(arm, 'spine', 'rotation_euler', (x, 0, 0), f)
    # right arm: swung back at crouch, extended up-forward at apex (ball follows)
    for f, x in ((1, 0), (12, -0.6), (36, 2.85), (52, 0), (75, 0)):
        key(arm, 'upperarm.R', 'rotation_euler', (x, 0, 0), f)
    for f, x in ((1, 0), (12, -0.5), (36, 0.15), (75, 0)):
        key(arm, 'forearm.R', 'rotation_euler', (x, 0, 0), f)
    # left arm lower, out for balance
    for f, x in ((1, 0), (12, -0.6), (36, 2.0), (52, 0), (75, 0)):
        key(arm, 'upperarm.L', 'rotation_euler', (x, 0, 0), f)
    for f, x in ((1, 0), (12, 0.15), (36, 0.32), (75, 0)):  # look up at the rim
        key(arm, 'head', 'rotation_euler', (x, 0, 0), f)
    stash(arm, act, 'dunk')

def build_all_animations(arm):
    animate_idle(arm)
    animate_spin(arm)
    animate_jump(arm)
    animate_dunk(arm)
    ad = arm.animation_data
    set_nla_mute(arm, False)
    ad.action = None  # avoid exporting the stray active action as a dupe clip

# ---------------------------------------------------------------- preview + export

def setup_preview_scene(scene, res=600, target=(0, 0, 1.12), dist=1.0):
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

def set_nla_mute(arm, mute):
    # NOTE: in Blender 4.5, strip.mute is the mute that NLA evaluation honors
    # (track.mute alone does not take effect). Mute both to be safe.
    ad = arm.animation_data
    for track in ad.nla_tracks:
        track.mute = mute
        for strip in track.strips:
            strip.mute = mute

def render_preview(arm, clip_name, frame, path, res):
    # Caller must have removed NLA tracks already (see main): with NLA gone,
    # the active action evaluates alone, which is the only trustworthy way to
    # preview a single clip in Blender 4.5's viewport.
    ad = arm.animation_data
    action = bpy.data.actions.get(clip_name)
    if action is None:
        raise RuntimeError(f'action for clip {clip_name!r} not found')
    ad.action = action
    reset_pose(arm)  # clear any values left over from authoring
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

def glb_animation_names(path):
    with open(path, 'rb') as f:
        magic, ver, _len = struct.unpack('<III', f.read(12))
        assert magic == 0x46546C67, 'not a GLB'
        clen, ctype = struct.unpack('<II', f.read(8))
        assert ctype == 0x4E4F534A, 'first chunk is not JSON'
        js = json.loads(f.read(clen).decode('utf-8'))
    return [a.get('name', f'anim{i}') for i, a in enumerate(js.get('animations', []))]

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
        'images': len(js.get('images', [])),
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
    arm = build_character(team)
    build_all_animations(arm)

    scene = bpy.context.scene
    scene.render.fps = 30

    os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
    export_glb(args.out)
    summary = glb_summary(args.out)
    print('GLB_SUMMARY ' + json.dumps(summary))

    if args.preview:
        # Export is done: NLA tracks did their job. Remove them so the preview
        # evaluates exactly one clip (NLA muting is unreliable in 4.5).
        ad = arm.animation_data
        while len(ad.nla_tracks):
            ad.nla_tracks.remove(ad.nla_tracks[0])
        ad.action = None
        target = tuple(float(v) for v in args.preview_target.split(','))
        setup_preview_scene(scene, args.preview_res, target, args.preview_dist)
        render_preview(arm, args.preview_clip, args.preview_frame, args.preview, args.preview_res)

if __name__ == '__main__':
    main()
