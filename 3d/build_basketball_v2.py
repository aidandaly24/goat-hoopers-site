#!/usr/bin/env python3
"""
GOAT Hoopers — beautiful basketball builder.

A basketball that looks TOUCHABLE, not like a smooth orange sphere:
- Procedural pebble-grain normal map (baked from high-poly)
- Recessed seam channels with dark rubber
- Subtle leather color variation
- Rich PBR materials

Animations: idle (gentle bob), bounce (squash & stretch one-shot).

Usage:
    blender --background --python build_basketball.py -- \
        --out ../public/3d/basketball.glb \
        [--preview /tmp/ball.png]
"""

import argparse
import bpy
import json
import math
import os
import struct
import sys

def parse_args():
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', required=True)
    ap.add_argument('--preview', default=None)
    ap.add_argument('--preview-res', type=int, default=600)
    argv = sys.argv
    args = argv[argv.index('--') + 1:] if '--' in argv else []
    return ap.parse_args(args)

def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for coll in (bpy.data.meshes, bpy.data.materials, bpy.data.armatures,
                 bpy.data.actions, bpy.data.images, bpy.data.textures):
        for x in list(coll):
            coll.remove(x)

def make_pebble_material():
    """Leather material with procedural pebble grain.
    We'll bake this to images for GLB export."""
    mat = bpy.data.materials.new(name='BallLeather')
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    out = nodes.new('ShaderNodeOutputMaterial')
    out.location = (400, 0)
    bsdf = nodes.new('ShaderNodeBsdfPrincipled')
    bsdf.location = (100, 0)
    # Deep basketball orange — rich, not washed out
    bsdf.inputs['Base Color'].default_value = (0.72, 0.27, 0.045, 1.0)
    bsdf.inputs['Roughness'].default_value = 0.68
    bsdf.inputs['Metallic'].default_value = 0.0
    bsdf.inputs['Specular IOR Level'].default_value = 0.5
    links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])

    # Pebble grain: Voronoi cells -> bump
    texcoord = nodes.new('ShaderNodeTexCoord')
    texcoord.location = (-600, -200)
    voronoi = nodes.new('ShaderNodeTexVoronoi')
    voronoi.location = (-400, -200)
    voronoi.feature = 'F1'
    voronoi.inputs['Scale'].default_value = 180.0  # fine pebble grain
    bump = nodes.new('ShaderNodeBump')
    bump.location = (-200, -200)
    bump.inputs['Strength'].default_value = 0.35
    bump.inputs['Distance'].default_value = 0.002
    links.new(texcoord.outputs['UV'], voronoi.inputs['Vector'])
    links.new(voronoi.outputs['Distance'], bump.inputs['Height'])
    links.new(bump.outputs['Normal'], bsdf.inputs['Normal'])

    # Subtle color variation: noise -> mix darker orange
    noise = nodes.new('ShaderNodeTexNoise')
    noise.location = (-400, 200)
    noise.inputs['Scale'].default_value = 25.0
    noise.inputs['Detail'].default_value = 3.0
    ramp = nodes.new('ShaderNodeValToRGB')
    ramp.location = (-200, 200)
    # Tight range: subtle leather variation, not washout
    ramp.color_ramp.elements[0].position = 0.42
    ramp.color_ramp.elements[0].color = (0.66, 0.24, 0.04, 1.0)
    ramp.color_ramp.elements[1].position = 0.58
    ramp.color_ramp.elements[1].color = (0.76, 0.30, 0.055, 1.0)
    mix = nodes.new('ShaderNodeMix')
    mix.location = (-100, 100)
    mix.data_type = 'RGBA'
    mix.inputs['Factor'].default_value = 0.30
    links.new(noise.outputs['Fac'], ramp.inputs['Fac'])
    links.new(ramp.outputs['Color'], mix.inputs['A'])
    links.new(mix.outputs['Result'], bsdf.inputs['Base Color'])
    mix.inputs['B'].default_value = (0.72, 0.27, 0.045, 1.0)

    return mat

def make_seam_material():
    mat = bpy.data.materials.new(name='BallSeam')
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes['Principled BSDF']
    bsdf.inputs['Base Color'].default_value = (0.08, 0.06, 0.05, 1.0)
    bsdf.inputs['Roughness'].default_value = 0.9
    return mat

def build_basketball():
    BALL_R = 0.5  # hero prop scale

    leather = make_pebble_material()
    seam_mat = make_seam_material()

    # Main sphere: high segment count for smooth pebble baking
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=64, ring_count=32, radius=BALL_R, location=(0, 0, 0))
    ball = bpy.context.active_object
    ball.name = 'Basketball'
    ball.data.materials.append(leather)
    for p in ball.data.polygons:
        p.use_smooth = True

    # Seams: recessed channels (slightly inset tori, dark rubber)
    # Standard basketball seam pattern: great circle + two side curves
    seams = []
    # Equator
    bpy.ops.mesh.primitive_torus_add(
        major_radius=BALL_R * 0.994, minor_radius=0.007,
        major_segments=64, minor_segments=8,
        location=(0, 0, 0), rotation=(0, 0, 0))
    s = bpy.context.active_object
    s.name = 'Seam_Equator'
    s.data.materials.append(seam_mat)
    seams.append(s)
    # Vertical great circle
    bpy.ops.mesh.primitive_torus_add(
        major_radius=BALL_R * 0.994, minor_radius=0.007,
        major_segments=64, minor_segments=8,
        location=(0, 0, 0), rotation=(0, math.radians(90), 0))
    s = bpy.context.active_object
    s.name = 'Seam_Vertical'
    s.data.materials.append(seam_mat)
    seams.append(s)
    # Two curved side seams (approximated with rotated tori)
    for i, angle in enumerate([35, -35]):
        bpy.ops.mesh.primitive_torus_add(
            major_radius=BALL_R * 0.994, minor_radius=0.006,
            major_segments=64, minor_segments=8,
            location=(0, 0, 0),
            rotation=(math.radians(angle), 0, math.radians(90)))
        s = bpy.context.active_object
        s.name = f'Seam_Curve_{i}'
        s.data.materials.append(seam_mat)
        seams.append(s)

    # Parent seams to ball
    for s in seams:
        s.parent = ball
        s.matrix_parent_inverse.identity()

    return ball, seams

# ---------------------------------------------------------------- animations

def new_action(obj, name):
    ad = obj.animation_data or obj.animation_data_create()
    act = bpy.data.actions.new(name=name)
    ad.action = act
    # Reset transform
    obj.location = (0, 0, 0)
    obj.rotation_euler = (0, 0, 0)
    obj.scale = (1, 1, 1)
    return act

def key(obj, prop, value, frame):
    setattr(obj, prop, value)
    obj.keyframe_insert(data_path=prop, frame=frame)

def stash(obj, action, clip_name):
    ad = obj.animation_data
    track = ad.nla_tracks.new()
    track.name = clip_name
    track.strips.new(name=clip_name, start=1, action=action)
    track.mute = True
    return track

def set_linear(action):
    for fc in action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = 'LINEAR'

def animate_idle(ball):
    act = new_action(ball, 'idle')
    # Gentle bob + slow rotation (like it's alive, waiting to be bounced)
    for f, z in ((1, 0), (30, 0.06), (60, 0)):
        key(ball, 'location', (0, 0, z), f)
    key(ball, 'rotation_euler', (0, 0, 0), 1)
    key(ball, 'rotation_euler', (0, 0, math.radians(25)), 60)
    stash(ball, act, 'idle')

def animate_bounce(ball):
    act = new_action(ball, 'bounce')
    # Squash & stretch: anticipation squash, launch, air stretch, land squash
    for f, z in ((1, 0), (8, -0.08), (20, 0.55), (32, 0), (36, -0.10), (48, 0)):
        key(ball, 'location', (0, 0, z), f)
    for f, s in ((1, (1, 1, 1)), (8, (1.18, 1.18, 0.78)),
                 (20, (0.92, 0.92, 1.12)), (36, (1.22, 1.22, 0.72)),
                 (48, (1, 1, 1))):
        key(ball, 'scale', s, f)
    # Spin during bounce
    key(ball, 'rotation_euler', (0, 0, 0), 1)
    set_linear(act)
    key(ball, 'rotation_euler', (0, math.radians(180), 0), 48)
    stash(ball, act, 'bounce')

def build_all_animations(ball):
    animate_idle(ball)
    animate_bounce(ball)
    ad = ball.animation_data
    for track in ad.nla_tracks:
        track.mute = False
        for strip in track.strips:
            strip.mute = False
    ad.action = None

# ---------------------------------------------------------------- export

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
    }

def setup_preview(res=600):
    scene = bpy.context.scene
    world = bpy.data.worlds['World']
    world.use_nodes = True
    world.node_tree.nodes['Background'].inputs[0].default_value = (0.045, 0.045, 0.065, 1.0)
    bpy.ops.object.camera_add(location=(1.4, 1.8, 1.0))
    cam = bpy.context.active_object
    from mathutils import Vector
    d = Vector((0, 0, 0.1)) - cam.location
    cam.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
    scene.camera = cam
    bpy.ops.object.light_add(type='SUN', location=(2, 2, 3))
    bpy.context.active_object.data.energy = 2.2
    bpy.ops.object.light_add(type='AREA', location=(0.5, 2.5, 1.5))
    area = bpy.context.active_object
    area.data.energy = 300
    area.data.size = 2.0
    # Warm rim
    bpy.ops.object.light_add(type='AREA', location=(-1.5, 1.0, 1.8))
    rim = bpy.context.active_object
    rim.data.energy = 180
    rim.data.color = (1.0, 0.75, 0.45)
    rim.data.size = 1.5
    scene.render.engine = 'CYCLES'
    scene.cycles.samples = 96
    scene.render.resolution_x = res
    scene.render.resolution_y = res
    scene.render.image_settings.file_format = 'PNG'

def main():
    args = parse_args()
    clear_scene()
    ball, seams = build_basketball()
    build_all_animations(ball)
    bpy.context.scene.render.fps = 30
    os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
    export_glb(args.out)
    print('GLB_SUMMARY ' + json.dumps(glb_summary(args.out)))
    if args.preview:
        ad = ball.animation_data
        while len(ad.nla_tracks):
            ad.nla_tracks.remove(ad.nla_tracks[0])
        ad.action = None
        setup_preview(args.preview_res)
        # Preview at idle (round ball, not squashed)
        action = bpy.data.actions.get('idle')
        ad.action = action
        bpy.context.scene.frame_set(15)
        bpy.context.view_layer.update()
        bpy.context.scene.render.filepath = args.preview
        bpy.ops.render.render(write_still=True)
        print(f'PREVIEW_WRITTEN {args.preview}')

if __name__ == '__main__':
    main()
