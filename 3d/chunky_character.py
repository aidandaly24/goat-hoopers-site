"""Chunky Baller v3 — designer-toy basketball player.

Design philosophy: BOLD, not busy. A toy you want to pick up.
- Exaggerated: huge head, huge shoes, big hands
- Squat and chunky, not tall and thin
- Simple face: eyes + smirk (no nose, minimal brows)
- One bold jersey design, not fiddly stripes
- Dynamic rest pose: triple-threat stance
"""

import bpy
import math


def prim_smirk(name, loc, width, tube, mat):
    bpy.ops.curve.primitive_bezier_curve_add(
        location=loc, rotation=(math.radians(90), 0, 0))
    o = bpy.context.active_object
    o.name = name
    spline = o.data.splines[0]
    p0, p1 = spline.bezier_points[0], spline.bezier_points[1]
    p0.co = (-width / 2, 0.015, -0.025)
    p0.handle_left = (-width / 2 - 0.06, 0.015, -0.025)
    p0.handle_right = (-width / 2 + width * 0.35, -0.050, -0.018)
    p0.handle_left_type = p0.handle_right_type = 'FREE'
    p1.co = (width / 2, 0.015, 0.050)
    p1.handle_left = (width / 2 - width * 0.30, -0.032, 0.022)
    p1.handle_right = (width / 2 + 0.06, 0.015, 0.072)
    p1.handle_left_type = p1.handle_right_type = 'FREE'
    o.data.bevel_depth = tube
    o.data.bevel_resolution = 4
    o.data.materials.append(mat)
    return o


def prim_jersey_number(name, loc, number_str, size, mat):
    bpy.ops.object.text_add(location=loc, rotation=(math.radians(90), 0, 0))
    o = bpy.context.active_object
    o.name = name
    o.data.body = number_str
    o.data.size = size
    o.data.align_x = 'CENTER'
    o.data.align_y = 'CENTER'
    o.data.extrude = 0.015
    o.data.bevel_depth = 0.005
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.convert(target='MESH')
    o = bpy.context.active_object
    o.data.materials.append(mat)
    for p in o.data.polygons:
        p.use_smooth = True
    return o


# Chunky bone layout (shorter, wider than v2)
BONES_V3 = [
    ('root', (0, 0, 0), (0, 0, 0.22), None),
    ('spine', (0, 0, 0.46), (0, 0, 1.08), 'root'),
    ('neck', (0, 0, 1.08), (0, 0, 1.24), 'spine'),
    ('head', (0, 0, 1.24), (0, 0, 1.60), 'neck'),
]
for s, sx in (('L', -1), ('R', 1)):
    BONES_V3 += [
        (f'upperarm.{s}', (sx * 0.30, 0, 1.04), (sx * 0.36, 0, 0.82), 'spine'),
        (f'forearm.{s}', (sx * 0.36, 0, 0.82), (sx * 0.38, 0, 0.60), f'upperarm.{s}'),
        (f'hand.{s}', (sx * 0.38, 0, 0.60), (sx * 0.38, 0, 0.50), f'forearm.{s}'),
        (f'thigh.{s}', (sx * 0.15, 0, 0.44), (sx * 0.15, 0, 0.26), 'root'),
        (f'shin.{s}', (sx * 0.15, 0, 0.26), (sx * 0.15, 0, 0.12), f'thigh.{s}'),
        (f'foot.{s}', (sx * 0.15, 0, 0.12), (sx * 0.15, 0.14, 0.05), f'shin.{s}'),
    ]


def build_character_v3(team, helpers):
    prim_sphere = helpers['prim_sphere']
    prim_cyl = helpers['prim_cyl']
    prim_cone = helpers['prim_cone']
    prim_torus = helpers['prim_torus']
    prim_cube = helpers['prim_cube']
    make_mat = helpers['make_mat']

    BALL_ORANGE = '#E2701D'
    P, S = team['primary'], team['secondary']
    mats = {
        'skin': make_mat('Skin', team['skin'], 0.88),
        'hair': make_mat('Hair', team['hair'], 0.92),
        'jersey': make_mat('Jersey', P, 0.60),
        'accent': make_mat('Accent', S, 0.55),
        'shorts': make_mat('Shorts', team['shorts'], 0.68),
        'white': make_mat('White', '#F5F2EA', 0.48),
        'dark': make_mat('Dark', '#1B1B20', 0.32),
        'ball': make_mat('Ball', BALL_ORANGE, 0.92),
    }

    parts = []

    def apply_scale(o):
        bpy.context.view_layer.objects.active = o
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

    def bevel(o, width=0.03, segs=3):
        bpy.context.view_layer.objects.active = o
        bpy.ops.object.modifier_add(type='BEVEL')
        o.modifiers['Bevel'].width = width
        o.modifiers['Bevel'].segments = segs
        bpy.ops.object.modifier_apply(modifier='Bevel')
        return o

    # ================= HEAD (huge — the star) =================
    head = prim_sphere('Head', (0, 0, 1.58), 0.52, mats['skin'], 24, 16)
    head.scale = (1.0, 0.97, 1.02)
    apply_scale(head)
    parts.append((head, 'head'))

    # Hair: dome covering top of head
    hair = prim_sphere('Hair', (0, -0.02, 1.82), 0.540, mats['hair'], 18, 12)
    hair.scale = (1.0, 1.0, 0.72)
    apply_scale(hair)
    parts.append((hair, 'head'))

    # Headband: sits ON hair surface
    parts.append((prim_torus('Headband', (0, 0, 1.78), 0.545, 0.070,
                             mats['jersey'], seg=24), 'head'))

    # Ears: simple
    for s, sx in (('L', -1), ('R', 1)):
        ear = prim_sphere(f'Ear_{s}', (sx * 0.495, 0, 1.56), 0.10,
                          mats['skin'], 12, 8)
        ear.scale = (0.5, 0.7, 1.0)
        apply_scale(ear)
        parts.append((ear, 'head'))

    # Eyes: BOLD but not googly — controlled size
    for s, sx in (('L', -1), ('R', 1)):
        parts.append((prim_sphere(f'EyeWhite_{s}', (sx * 0.185, 0.430, 1.625),
                                  0.098, mats['white'], 16, 12), 'head'))
        parts.append((prim_sphere(f'Pupil_{s}', (sx * 0.185, 0.508, 1.620),
                                  0.052, mats['dark'], 12, 10), 'head'))
        parts.append((prim_sphere(f'Catchlight_{s}',
                                  (sx * 0.185 - 0.022, 0.545, 1.645),
                                  0.018, mats['white'], 8, 6), 'head'))

    # Brows: simple thick bars, slight attitude
    for s, sx in (('L', -1), ('R', 1)):
        brow = prim_cube(f'Brow_{s}', (sx * 0.200, 0.465, 1.815),
                         (0.190, 0.060, 0.055), mats['hair'])
        brow.rotation_euler = (0, 0, sx * -0.12)
        bpy.context.view_layer.objects.active = brow
        bpy.ops.object.transform_apply(location=False, rotation=True,
                                       scale=False)
        parts.append((brow, 'head'))

    # Smirk: big and confident
    parts.append((prim_smirk('Smirk', (0.03, 0.440, 1.400), 0.34, 0.048,
                             mats['dark']), 'head'))

    # ================= TORSO (chunky) =================
    parts.append((prim_cyl('Neck', (0, 0, 1.18), 0.120, 0.16, mats['skin']), 'neck'))

    # Jersey: WIDE and chunky
    jersey = prim_cone('Jersey', (0, 0, 0.86), 0.320, 0.380, 0.52,
                       mats['jersey'], 20)
    parts.append((jersey, 'spine'))

    # Bold chest stripe (single, strong)
    stripe = prim_torus('ChestStripe', (0, 0, 1.02), 0.365, 0.035,
                        mats['accent'], seg=20)
    parts.append((stripe, 'spine'))

    # V-neck
    for s, sx in (('L', -1), ('R', 1)):
        vstrip = prim_cube(f'VNeck_{s}', (sx * 0.065, 0.285, 1.095),
                           (0.040, 0.025, 0.150), mats['accent'])
        vstrip.rotation_euler = (0.25, 0, sx * 0.35)
        bpy.context.view_layer.objects.active = vstrip
        bpy.ops.object.transform_apply(location=False, rotation=True,
                                       scale=False)
        parts.append((vstrip, 'spine'))

    # Jersey number: BIG
    num_str = team.get('number', '23')
    if len(num_str) == 1:
        num_str = '0' + num_str
    num = prim_jersey_number('JerseyNumber', (0, 0.375, 0.880),
                             num_str, 0.300, mats['white'])
    parts.append((num, 'spine'))

    # ================= SHORTS (baggy) =================
    shorts = prim_cyl('Shorts', (0, 0, 0.52), 0.340, 0.36, mats['shorts'], 18)
    parts.append((shorts, 'root'))
    parts.append((prim_torus('Waistband', (0, 0, 0.695), 0.335, 0.035,
                             mats['accent'], seg=18), 'root'))

    # ================= ARMS (chunky) =================
    for s, sx in (('L', -1), ('R', 1)):
        # Big shoulder
        shoulder = prim_sphere(f'Shoulder_{s}', (sx * 0.335, 0, 1.04), 0.140,
                               mats['jersey'], 18, 14)
        parts.append((shoulder, f'upperarm.{s}'))
        # Thick upper arm
        parts.append((prim_cone(f'UpperArm_{s}', (sx * 0.365, 0, 0.90),
                                0.090, 0.105, 0.26, mats['skin'], 12), f'upperarm.{s}'))
        # Elbow
        parts.append((prim_sphere(f'Elbow_{s}', (sx * 0.375, 0, 0.78), 0.082,
                                  mats['skin'], 14, 10), f'forearm.{s}'))
        # Thick forearm
        parts.append((prim_cone(f'Forearm_{s}', (sx * 0.380, 0, 0.68),
                                0.078, 0.088, 0.24, mats['skin'], 12), f'forearm.{s}'))
        # Wristband
        parts.append((prim_torus(f'Wristband_{s}', (sx * 0.380, 0, 0.585),
                                 0.082, 0.032, mats['jersey'], seg=18), f'forearm.{s}'))
        # BIG hand (beveled box)
        hand = prim_cube(f'Hand_{s}', (sx * 0.380, 0.01, 0.505),
                         (0.140, 0.160, 0.125), mats['skin'])
        bevel(hand, 0.040, 3)
        parts.append((hand, f'hand.{s}'))

    # ================= LEGS (chunky) =================
    for s, sx in (('L', -1), ('R', 1)):
        # Thick thigh
        parts.append((prim_cone(f'Thigh_{s}', (sx * 0.150, 0, 0.360),
                                0.110, 0.130, 0.28, mats['skin'], 12), f'thigh.{s}'))
        # Knee
        parts.append((prim_sphere(f'Knee_{s}', (sx * 0.150, 0.01, 0.235), 0.095,
                                  mats['skin'], 14, 10), f'shin.{s}'))
        # Thick calf
        parts.append((prim_cone(f'Calf_{s}', (sx * 0.150, 0, 0.150),
                                0.085, 0.100, 0.22, mats['skin'], 12), f'shin.{s}'))
        # Sock
        parts.append((prim_cyl(f'Sock_{s}', (sx * 0.150, 0, 0.075), 0.090, 0.120,
                                   mats['white'], 16), f'shin.{s}'))

        # SHOE: BIG and chunky (basketball players have huge feet!)
        sole = prim_cube(f'Sole_{s}', (sx * 0.150, 0.060, 0.030),
                         (0.240, 0.440, 0.075), mats['white'])
        bevel(sole, 0.028, 2)
        parts.append((sole, f'foot.{s}'))
        # Upper: big and round
        upper = prim_sphere(f'ShoeUpper_{s}', (sx * 0.150, 0.070, 0.125), 0.125,
                            mats['accent'], 14, 10)
        upper.scale = (0.95, 1.60, 0.90)
        bpy.context.view_layer.objects.active = upper
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        parts.append((upper, f'foot.{s}'))
        # Toe cap
        toe = prim_sphere(f'ToeCap_{s}', (sx * 0.150, 0.235, 0.095), 0.088,
                          mats['white'], 12, 8)
        toe.scale = (1.0, 0.9, 0.62)
        bpy.context.view_layer.objects.active = toe
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        parts.append((toe, f'foot.{s}'))
        # Bold ankle strap (instead of laces — cleaner)
        parts.append((prim_torus(f'AnkleStrap_{s}', (sx * 0.150, -0.010, 0.195),
                                 0.088, 0.032, mats['white'], seg=18), f'foot.{s}'))

    # ================= BALL =================
    ball = prim_sphere('Ball', (0.380, 0.100, 0.380), 0.190, mats['ball'], 20, 14)
    parts.append((ball, 'hand.R'))

    return parts, mats


def apply_dynamic_rest_pose(arm):
    """Triple-threat stance: the character looks ready to play, not at attention.
    Applied as the new rest pose BEFORE animations are authored."""
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode='POSE')
    for pb in arm.pose.bones:
        pb.rotation_mode = 'XYZ'

    def rot(bone, xyz):
        pb = arm.pose.bones[bone]
        pb.rotation_euler = tuple(math.radians(a) for a in xyz)

    # Slight crouch + forward lean (athletic)
    rot('root', (0, 0, 0))
    arm.pose.bones['root'].location = (0, 0.03, -0.04)
    rot('spine', (-7, 0, 4))       # lean forward, slight twist
    rot('head', (5, 0, -3))        # look up, confident
    # Right arm (ball): down at side
    rot('upperarm.R', (8, 0, -6))
    rot('forearm.R', (12, 0, 0))
    # Left arm: out for balance
    rot('upperarm.L', (5, 0, 18))
    rot('forearm.L', (15, 0, 0))
    # Legs: staggered, knees soft
    rot('thigh.R', (-10, 0, 0))    # right leg forward
    rot('shin.R', (14, 0, 0))      # knee bend
    rot('thigh.L', (6, 0, 0))      # left leg back
    rot('shin.L', (8, 0, 0))

    bpy.ops.pose.armature_apply()  # bake as rest pose
    bpy.ops.object.mode_set(mode='OBJECT')
    # Clear pose values (now redundant, but clean)
    for pb in arm.pose.bones:
        pb.location = (0, 0, 0)
        pb.rotation_euler = (0, 0, 0)
        pb.scale = (1, 1, 1)
