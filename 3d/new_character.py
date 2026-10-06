"""The Baller v2 — art-directed vinyl-toy basketball player mesh builder.

Replaces build_character() in build_hooper_v2.py. Keeps the same bone names
and rig layout; only the MESH is new (that's what looked AI — not the rig).

Design intent:
- Designer-toy proportions: big head, chunky limbs — but ATHLETIC, not baby-like
- Face with LIFE: catchlights in eyes, thick determined brows, confident smirk
- Real uniform: V-neck jersey with number + stripes, baggy shorts, headband
- High-top sneakers (not boxes), wristband, proper basketball
- Matte vinyl materials, not shiny plastic
"""

import bpy
import math


def prim_smirk(name, loc, width, tube, mat):
    """Confident smirk: asymmetric bezier arc (right side kicks up), facing +Y."""
    bpy.ops.curve.primitive_bezier_curve_add(
        location=loc, rotation=(math.radians(90), 0, 0))
    o = bpy.context.active_object
    o.name = name
    spline = o.data.splines[0]
    p0, p1 = spline.bezier_points[0], spline.bezier_points[1]
    # Left end lower, right end kicks up = smirk
    p0.co = (-width / 2, 0.015, -0.02)
    p0.handle_left = (-width / 2 - 0.05, 0.015, -0.02)
    p0.handle_right = (-width / 2 + width * 0.35, -0.045, -0.015)
    p0.handle_left_type = p0.handle_right_type = 'FREE'
    p1.co = (width / 2, 0.015, 0.045)
    p1.handle_left = (width / 2 - width * 0.30, -0.030, 0.020)
    p1.handle_right = (width / 2 + 0.05, 0.015, 0.065)
    p1.handle_left_type = p1.handle_right_type = 'FREE'
    o.data.bevel_depth = tube
    o.data.bevel_resolution = 4
    o.data.materials.append(mat)
    return o


def prim_jersey_number(name, loc, number_str, size, mat):
    """Jersey number as extruded text on the chest, facing +Y."""
    bpy.ops.object.text_add(location=loc, rotation=(math.radians(90), 0, 0))
    o = bpy.context.active_object
    o.name = name
    o.data.body = number_str
    o.data.size = size
    o.data.align_x = 'CENTER'
    o.data.align_y = 'CENTER'
    o.data.extrude = 0.012
    o.data.bevel_depth = 0.004
    # Convert to mesh so it exports cleanly in GLB
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.convert(target='MESH')
    o = bpy.context.active_object
    o.data.materials.append(mat)
    for p in o.data.polygons:
        p.use_smooth = True
    return o


def build_character_v2(team, helpers):
    """Build the Baller mesh. `helpers` is a dict of functions from the main
    script: prim_sphere, prim_cyl, prim_cone, prim_torus, prim_cube, make_mat,
    parent_to_bone, parent_to_obj, hexcol."""
    prim_sphere = helpers['prim_sphere']
    prim_cyl = helpers['prim_cyl']
    prim_cone = helpers['prim_cone']
    prim_torus = helpers['prim_torus']
    prim_cube = helpers['prim_cube']
    make_mat = helpers['make_mat']

    BALL_ORANGE = '#E2701D'
    P, S = team['primary'], team['secondary']
    mats = {
        'skin': make_mat('Skin', team['skin'], 0.85),
        'hair': make_mat('Hair', team['hair'], 0.9),
        'jersey': make_mat('Jersey', P, 0.62),
        'accent': make_mat('Accent', S, 0.55),
        'shorts': make_mat('Shorts', team['shorts'], 0.7),
        'white': make_mat('White', '#F5F2EA', 0.5),
        'dark': make_mat('Dark', '#1B1B20', 0.35),
        'ball': make_mat('Ball', BALL_ORANGE, 0.92),
    }

    parts = []

    def apply_scale(o):
        bpy.context.view_layer.objects.active = o
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

    # ================= HEAD =================
    # Cranium with jaw taper
    head = prim_sphere('Head', (0, 0, 1.88), 0.44, mats['skin'], 28, 18)
    head.scale = (1.0, 0.96, 1.03)
    apply_scale(head)
    parts.append((head, 'head'))

    # Jaw definition
    jaw = prim_sphere('Jaw', (0, 0.03, 1.66), 0.33, mats['skin'], 20, 12)
    jaw.scale = (0.86, 0.88, 0.72)
    apply_scale(jaw)
    parts.append((jaw, 'head'))

    # Hair: short fade (less cap-like)
    hair = prim_sphere('Hair', (0, -0.05, 2.03), 0.455, mats['hair'], 20, 12)
    hair.scale = (0.95, 0.95, 0.75)
    apply_scale(hair)
    parts.append((hair, 'head'))

    # Headband — team primary
    parts.append((prim_torus('Headband', (0, 0, 2.03), 0.43, 0.055,
                             mats['jersey'], seg=28), 'head'))

    # Ears
    for s, sx in (('L', -1), ('R', 1)):
        ear = prim_sphere(f'Ear_{s}', (sx * 0.415, 0, 1.86), 0.085,
                          mats['skin'], 12, 8)
        ear.scale = (0.55, 0.75, 1.0)
        apply_scale(ear)
        parts.append((ear, 'head'))

    # Eyes: big, alive (catchlights!), determined brows — not googly
    for s, sx in (('L', -1), ('R', 1)):
        parts.append((prim_sphere(f'EyeWhite_{s}', (sx * 0.160, 0.360, 1.945),
                                  0.095, mats['white'], 18, 12), 'head'))
        parts.append((prim_sphere(f'Pupil_{s}', (sx * 0.160, 0.430, 1.940),
                                  0.050, mats['dark'], 14, 10), 'head'))
        parts.append((prim_sphere(f'Catchlight_{s}',
                                  (sx * 0.160 - 0.020, 0.468, 1.963),
                                  0.017, mats['white'], 8, 6), 'head'))
        # Thick brow, angled down toward center = determined
        brow = prim_cube(f'Brow_{s}', (sx * 0.160, 0.395, 2.105),
                         (0.155, 0.055, 0.05), mats['hair'])
        brow.rotation_euler = (0, 0, sx * -0.20)
        bpy.context.view_layer.objects.active = brow
        bpy.ops.object.transform_apply(location=False, rotation=True,
                                       scale=False)
        parts.append((brow, 'head'))

    # Nose: subtle
    nose = prim_sphere('Nose', (0, 0.425, 1.845), 0.042, mats['skin'], 10, 8)
    nose.scale = (0.85, 0.65, 1.0)
    apply_scale(nose)
    parts.append((nose, 'head'))

    # Smirk: confident, asymmetric
    parts.append((prim_smirk('Smirk', (0.025, 0.370, 1.705), 0.27, 0.038,
                             mats['dark']), 'head'))

    # ================= TORSO =================
    parts.append((prim_cyl('Neck', (0, 0, 1.47), 0.105, 0.18, mats['skin']), 'neck'))

    # Jersey: tapered (wider at chest), not a capsule
    jersey = prim_cone('Jersey', (0, 0, 1.08), 0.27, 0.33, 0.56, mats['jersey'], 24)
    parts.append((jersey, 'spine'))

    # V-neck collar: two angled strips forming a V
    for s, sx in (('L', -1), ('R', 1)):
        vstrip = prim_cube(f'VNeck_{s}', (sx * 0.055, 0.245, 1.335),
                           (0.035, 0.02, 0.13), mats['accent'])
        vstrip.rotation_euler = (0.25, 0, sx * 0.35)
        bpy.context.view_layer.objects.active = vstrip
        bpy.ops.object.transform_apply(location=False, rotation=True,
                                       scale=False)
        parts.append((vstrip, 'spine'))
    parts.append((prim_torus('CollarBase', (0, 0, 1.375), 0.125, 0.028,
                             mats['accent'], seg=18), 'spine'))

    # Armhole trim
    for s, sx in (('L', -1), ('R', 1)):
        trim = prim_torus(f'ArmTrim_{s}', (sx * 0.295, 0, 1.28), 0.105, 0.025,
                          mats['accent'], seg=18)
        trim.rotation_euler = (0, math.radians(90), 0)
        bpy.context.view_layer.objects.active = trim
        bpy.ops.object.transform_apply(location=False, rotation=True,
                                       scale=False)
        parts.append((trim, 'spine'))

    # Side stripes
    for s, sx in (('L', -1), ('R', 1)):
        parts.append((prim_cube(f'JerseyStripe_{s}', (sx * 0.285, 0, 1.08),
                                (0.025, 0.02, 0.42), mats['accent']), 'spine'))

    # Jersey number on chest (pushed outside jersey surface)
    num = prim_jersey_number('JerseyNumber', (0, 0.325, 1.12),
                             team.get('number', '23'), 0.20, mats['white'])
    parts.append((num, 'spine'))

    # ================= SHORTS =================
    shorts = prim_cyl('Shorts', (0, 0, 0.68), 0.30, 0.38, mats['shorts'], 20)
    parts.append((shorts, 'root'))
    # Waistband
    parts.append((prim_torus('Waistband', (0, 0, 0.865), 0.295, 0.030,
                             mats['accent'], seg=20), 'root'))
    # Side stripes on shorts
    for s, sx in (('L', -1), ('R', 1)):
        parts.append((prim_cube(f'ShortStripe_{s}', (sx * 0.295, 0, 0.68),
                                (0.025, 0.02, 0.30), mats['accent']), 'root'))

    # ================= ARMS =================
    for s, sx in (('L', -1), ('R', 1)):
        # Shoulder cap (deltoid) — athletic, in jersey
        shoulder = prim_sphere(f'Shoulder_{s}', (sx * 0.295, 0, 1.30), 0.115,
                               mats['jersey'], 16, 12)
        parts.append((shoulder, f'upperarm.{s}'))
        # Upper arm: tapered
        parts.append((prim_cone(f'UpperArm_{s}', (sx * 0.325, 0, 1.13),
                                0.078, 0.088, 0.28, mats['skin'], 14), f'upperarm.{s}'))
        # Elbow
        parts.append((prim_sphere(f'Elbow_{s}', (sx * 0.34, 0, 1.00), 0.070,
                                  mats['skin'], 12, 8), f'forearm.{s}'))
        # Forearm: tapered
        parts.append((prim_cone(f'Forearm_{s}', (sx * 0.345, 0, 0.88),
                                0.068, 0.075, 0.26, mats['skin'], 14), f'forearm.{s}'))
        # Wristband (right arm) / sleeve (left arm)
        if s == 'R':
            parts.append((prim_torus('Wristband_R', (0.345, 0, 0.775), 0.072,
                                     0.030, mats['jersey'], seg=16), 'forearm.R'))
        else:
            parts.append((prim_cyl('ArmSleeve_L', (-0.345, 0, 0.90), 0.082, 0.24,
                                   mats['accent'], 14), 'forearm.L'))
        # Hand: mitt-like rounded box, not a sphere
        hand = prim_cube(f'Hand_{s}', (sx * 0.35, 0.01, 0.70),
                         (0.115, 0.135, 0.105), mats['skin'])
        # Round it by bevel modifier
        bpy.context.view_layer.objects.active = hand
        bpy.ops.object.modifier_add(type='BEVEL')
        hand.modifiers['Bevel'].width = 0.035
        hand.modifiers['Bevel'].segments = 3
        bpy.ops.object.modifier_apply(modifier='Bevel')
        parts.append((hand, f'hand.{s}'))

    # ================= LEGS =================
    for s, sx in (('L', -1), ('R', 1)):
        # Thigh: muscular taper
        parts.append((prim_cone(f'Thigh_{s}', (sx * 0.13, 0, 0.50),
                                0.095, 0.110, 0.30, mats['skin'], 14), f'thigh.{s}'))
        # Knee
        parts.append((prim_sphere(f'Knee_{s}', (sx * 0.13, 0.01, 0.36), 0.082,
                                  mats['skin'], 12, 8), f'shin.{s}'))
        # Calf: tapered
        parts.append((prim_cone(f'Calf_{s}', (sx * 0.13, 0, 0.24),
                                0.072, 0.085, 0.26, mats['skin'], 14), f'shin.{s}'))
        # Sock
        parts.append((prim_cyl(f'Sock_{s}', (sx * 0.13, 0, 0.13), 0.078, 0.13,
                                   mats['white'], 14), f'shin.{s}'))

        # SHOE: high-top sneaker (not a box!)
        # Sole
        sole = prim_cube(f'Sole_{s}', (sx * 0.13, 0.05, 0.035),
                         (0.20, 0.36, 0.07), mats['white'])
        bpy.context.view_layer.objects.active = sole
        bpy.ops.object.modifier_add(type='BEVEL')
        sole.modifiers['Bevel'].width = 0.025
        sole.modifiers['Bevel'].segments = 2
        bpy.ops.object.modifier_apply(modifier='Bevel')
        parts.append((sole, f'foot.{s}'))
        # Upper: rounded toe + ankle
        upper = prim_sphere(f'ShoeUpper_{s}', (sx * 0.13, 0.06, 0.12), 0.105,
                            mats['accent'], 16, 12)
        upper.scale = (0.95, 1.55, 0.85)
        apply_scale(upper)
        parts.append((upper, f'foot.{s}'))
        # Toe cap
        toe = prim_sphere(f'ToeCap_{s}', (sx * 0.13, 0.20, 0.085), 0.075,
                          mats['white'], 12, 8)
        toe.scale = (1.0, 0.9, 0.65)
        apply_scale(toe)
        parts.append((toe, f'foot.{s}'))
        # Ankle collar
        parts.append((prim_torus(f'AnkleCollar_{s}', (sx * 0.13, -0.02, 0.185),
                                 0.075, 0.028, mats['white'], seg=16), f'foot.{s}'))
        # Laces: 3 bars
        for i in range(3):
            lace = prim_cube(f'Lace_{s}_{i}', (sx * 0.13, 0.10 + i * 0.035, 0.175),
                             (0.11, 0.022, 0.018), mats['white'])
            parts.append((lace, f'foot.{s}'))

    # ================= BALL =================
    ball = prim_sphere('Ball', (0.35, 0.08, 0.50), 0.175, mats['ball'], 24, 16)
    parts.append((ball, 'hand.R'))

    return parts, mats
