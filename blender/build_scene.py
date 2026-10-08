import bpy, math, random, os, sys, argparse
from mathutils import Vector
from math import sin, cos, pi

ROOT=os.path.dirname(os.path.abspath(__file__))
random.seed(44)
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
for block in bpy.data.materials: bpy.data.materials.remove(block)

def material(name, color, metallic=0, roughness=.5, emission=0):
    m=bpy.data.materials.new(name); m.diffuse_color=(*color,1); m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF'); p.inputs['Base Color'].default_value=(*color,1)
    p.inputs['Metallic'].default_value=metallic; p.inputs['Roughness'].default_value=roughness
    if emission:
        p.inputs['Emission Color'].default_value=(*color,1); p.inputs['Emission Strength'].default_value=emission
    return m

def box(name, loc, scale, mat, bevel=0):
    x,y,z=[v/2 for v in scale]
    vs=[(-x,-y,-z),(x,-y,-z),(x,y,-z),(-x,y,-z),(-x,-y,z),(x,-y,z),(x,y,z),(-x,y,z)]
    fs=[(3,2,1,0),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)]
    me=bpy.data.meshes.new(name);me.from_pydata(vs,[],fs);me.update();o=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(o);o.location=loc
    if mat: o.data.materials.append(mat)
    if bevel: mod=o.modifiers.new('Soft manufactured edges','BEVEL'); mod.width=bevel; mod.segments=2
    return o

def mesh(name, verts, faces, mat):
    me=bpy.data.meshes.new(name); me.from_pydata(verts,[],faces); me.update(); o=bpy.data.objects.new(name,me); bpy.context.collection.objects.link(o)
    if mat: me.materials.append(mat)
    return o

def tube(name, points, radius, mat, closed=False):
    cu=bpy.data.curves.new(name,'CURVE'); cu.dimensions='3D'; cu.resolution_u=1; cu.bevel_depth=radius; cu.bevel_resolution=2
    s=cu.splines.new('POLY'); s.points.add(len(points)-1)
    for p,co in zip(s.points,points): p.co=(*co,1)
    s.use_cyclic_u=closed; o=bpy.data.objects.new(name,cu); bpy.context.collection.objects.link(o); cu.materials.append(mat); return o

def line(name, pts, width=.035, mat=None): return tube(name,pts,width,mat or ivory)
def circle(name, center, r, mat, radius=.032, start=0, end=2*pi, n=96):
    return tube(name,[(center[0]+r*cos(start+(end-start)*i/n),center[1]+r*sin(start+(end-start)*i/n),center[2]) for i in range(n+1)],radius,mat)

def text(name, content, loc, size, mat, rot=(0,0,0), align='CENTER', font=None, depth=.006):
    cu=bpy.data.curves.new(name,'FONT'); cu.body=content; cu.size=size; cu.align_x=align; cu.align_y='CENTER'; cu.extrude=depth; cu.bevel_depth=.003; cu.bevel_resolution=2
    if font: cu.font=font
    o=bpy.data.objects.new(name,cu); bpy.context.collection.objects.link(o); o.location=loc; o.rotation_euler=rot; cu.materials.append(mat); return o

dark=material('Midnight lacquer',(.013,.022,.035),.2,.35)
concrete=material('Architectural charcoal',(.033,.041,.055),.1,.75)
gold=material('Champagne brushed gold',(.72,.43,.12),.72,.28)
ivory=material('Court lines ivory',(.89,.88,.76),.05,.42)
orange=material('Rim orange enamel',(.95,.13,.012),.45,.27)
black=material('Rubber and seam black',(.008,.01,.015),.05,.58)
metal=material('Structural brushed steel',(.12,.16,.20),.75,.3)
asphalt=material('Surrounding dark concrete plaza',(.027,.033,.044),0,.83)
box('Ground · arena surrounding plaza',(0,0,-.79),(250,250,.25),asphalt)
lamp=material('Stadium warm LED',(.8,.87,1),0,.2,14)
amber=material('Amber architectural lights',(1,.39,.07),0,.4,5)
teal=material('Teal architectural lights',(.025,.65,.85),0,.4,3)
whitecloth=material('Basket nylon net',(.85,.84,.76),0,.58)
font=bpy.data.fonts.load('/usr/share/fonts/opentype/urw-base35/NimbusSansNarrow-Bold.otf')

# A continuous varnished maple surface with staggered planks and real-sized grain.
wood=bpy.data.materials.new('Varnished maple · procedural planks'); wood.use_nodes=True
nt=wood.node_tree; p=nt.nodes.get('Principled BSDF'); p.inputs['Roughness'].default_value=.43; p.inputs['Coat Weight'].default_value=.16; p.inputs['Coat Roughness'].default_value=.32
tex=nt.nodes.new('ShaderNodeTexCoord'); mapping=nt.nodes.new('ShaderNodeVectorMath'); mapping.operation='MULTIPLY'; mapping.inputs[1].default_value=(.38,8,2); nt.links.new(tex.outputs['Object'],mapping.inputs[0])
noise=nt.nodes.new('ShaderNodeTexNoise'); noise.inputs['Scale'].default_value=3.7; noise.inputs['Detail'].default_value=3; nt.links.new(mapping.outputs['Vector'],noise.inputs['Vector'])
ramp=nt.nodes.new('ShaderNodeValToRGB'); ramp.color_ramp.elements[0].position=.12; ramp.color_ramp.elements[0].color=(.23,.095,.028,1); ramp.color_ramp.elements[1].position=.9; ramp.color_ramp.elements[1].color=(.66,.36,.13,1); nt.links.new(noise.outputs['Fac'],ramp.inputs[0]); nt.links.new(ramp.outputs['Color'],p.inputs['Base Color'])
bump=nt.nodes.new('ShaderNodeBump'); bump.inputs['Strength'].default_value=.16; bump.inputs['Distance'].default_value=.013; nt.links.new(noise.outputs['Fac'],bump.inputs['Height']); nt.links.new(bump.outputs['Normal'],p.inputs['Normal'])
box('Arena platform',(0,0,-.34),(34,22,.6),dark,.18)
box('Solid maple hardwood court',(0,0,-.018),(28.65,15.24,.15),wood,.035)
# Subtle plank joints: geometry thin enough to read as real floor texture.
joint=material('Maple plank seams',(.13,.075,.037),0,.65)
for j in range(39):
    y=-7.62+j*.4
    line('Lengthwise plank joint',[(-14.3,y,.060),(14.3,y,.060)],.0038,joint)
    for k in range(8):
        x=-14.2+((j%3)*1.17)+k*3.6
        if x<14.25: line('Staggered wood end grain',[(x,y,.060),(x,min(y+.4,7.62),.060)],.0038,joint)

# Court paint and regulation geometry.
paint=material('Deep petrol painted keys',(.018,.105,.12),.05,.31)
for side in [-1,1]:
    box('Painted key',(side*11.46,0,.069),(5.7,4.88,.016),paint)
    x0=side*14.22; xf=side*8.55
    line('Key outline',[(x0,-2.44,.09),(xf,-2.44,.09),(xf,2.44,.09),(x0,2.44,.09)],.028)
    circle('Free throw circle',(xf,0,.089),1.83,ivory,.028)
    # Accurate arc/straight combination for a three-point line.
    xc=side*12.75; r=7.24
    if side==1: a,b=math.radians(112),math.radians(248)
    else: a,b=math.radians(-68),math.radians(68)
    circle('Three point arc',(xc,0,.09),r,ivory,.034,a,b)
    for sign in [-1,1]: line('Corner three line',[(side*14.24,sign*6.71,.09),(side*10.04,sign*6.71,.09)],.034)
    circle('Restricted area',(side*12.75,0,.09),1.22,ivory,.022,pi/2 if side==1 else -pi/2,3*pi/2 if side==1 else pi/2)
line('Court boundary',[(-14.22,-7.5,.09),(14.22,-7.5,.09),(14.22,7.5,.09),(-14.22,7.5,.09),(-14.22,-7.5,.09)],.036)
line('Half court',[(0,-7.5,.09),(0,7.5,.09)],.03)
circle('Center circle',(0,0,.093),1.83,gold,.045)
circle('Center logo outer',(0,0,.095),1.47,gold,.023)
text('Center monogram','GH',(0,0,.10),1.27,gold,font=font,depth=.001)
text('Near sideline brand','G O A T   H O O P E R S',(0,-8.6,.065),.54,gold,font=font,depth=.001)

# Basketball goals, glass boards, detailed hanging rope nets.
glass=material('Tempered backboard glass',(.42,.62,.7),0,.12)
g=glass.node_tree.nodes.get('Principled BSDF'); g.inputs['Transmission Weight'].default_value=.82; g.inputs['Alpha'].default_value=.26
for side in [-1,1]:
    x=side*12.75
    box('Basket support padded base',(side*15.1,0,.63),(1.42,1.35,1.2),dark,.18)
    tube('Basket cantilever',[(side*15.5,0,.85),(side*15.5,0,3.5),(side*13.31,0,3.75)],.13,metal)
    board=box('Glass backboard',(side*13.25,0,3.85),(.055,1.83,1.07),glass,.02)
    for y in [-.94,.94]: tube('Board vertical rim',[(side*13.28,y,3.30),(side*13.28,y,4.40)],.029,ivory)
    for z in [3.3,4.4]: tube('Board horizontal rim',[(side*13.28,-.94,z),(side*13.28,.94,z)],.029,ivory)
    tube('Backboard target rectangle',[(side*13.19,-.295,3.4),(side*13.19,-.295,3.85),(side*13.19,.295,3.85),(side*13.19,.295,3.4)],.022,ivory)
    circle('Orange iron basket',(x,0,3.05),.23,orange,.026)
    for i in range(12):
        a=i*2*pi/12
        pts=[]
        for j in range(7):
            t=j/6; ang=a+.19*sin(t*pi*3); r=.235*(1-t)+.135*t
            pts.append((x+r*cos(ang),r*sin(ang),3.03-.46*t))
        tube('Woven basket net',pts,.009,whitecloth)
    for j in range(1,6): circle('Net horizontal weave',(x,0,3.03-.46*j/6),.235*(1-j/6)+.135*j/6,whitecloth,.006)
    box('Shot clock',(side*13.30,0,4.8),(.14,.65,.38),black,.025)
    # Readable sideline-facing score panel.
    text('Shot clock digits','24',(side*13.15,-.35,4.8),.24,amber,rot=(pi/2,0,0),font=font)

# Stadium bowl: rear and side terraces. Built as continuous architecture.
rows=20
print('Building stadium and audience',flush=True)
for row in range(rows):
    y=10.1+row*.73; z=.12+row*.36
    box('Rear terrace '+str(row),(0,y,z-.28),(44+row*.36,.77,.52),concrete,.015)
    if row in [0,7,15,22]: line('Golden terrace strip',[(-22-row*.18,y-.35,z+.005),(22+row*.18,y-.35,z+.005)],.022,amber)
for side in [-1,1]:
    for row in range(14):
        x=side*(17.4+row*.73); z=.1+row*.34
        box('Side arena seating',(x,4.5,z-.29),(.77,19,.52),concrete,.02)

# Crowd geometry combined by shirt color. Each fan has head, torso and bent arms.
crowd_mats=[material('Crowd shirt '+str(i),c,0,.84) for i,c in enumerate([(.045,.085,.13),(.12,.17,.22),(.42,.055,.035),(.075,.22,.2),(.59,.42,.18),(.53,.57,.57),(.11,.16,.31),(.2,.065,.12)])]
skin_mats=[material('Crowd skin '+str(i),c,0,.75) for i,c in enumerate([(.44,.24,.13),(.25,.105,.054),(.59,.36,.22),(.15,.06,.03)])]
for m in crowd_mats+skin_mats:
    p=m.node_tree.nodes.get('Principled BSDF');c=p.inputs['Base Color'].default_value;p.inputs['Base Color'].default_value=(c[0]*.38,c[1]*.38,c[2]*.38,1)
verts=[[] for _ in range(12)]; faces=[[] for _ in range(12)]
def cylbatch(idx,a,b,r1,r2=None,n=6):
    a,b=Vector(a),Vector(b); d=(b-a).normalized(); u=d.cross(Vector((0,0,1)))
    if u.length<.05:u=d.cross(Vector((0,1,0)))
    u.normalize();v=d.cross(u); start=len(verts[idx]); r2=r1 if r2 is None else r2
    for c,r in [(a,r1),(b,r2)]:
        for j in range(n): verts[idx].append(tuple(c+r*(u*cos(j*2*pi/n)+v*sin(j*2*pi/n))))
    faces[idx].append(tuple(start+j for j in range(n-1,-1,-1)));faces[idx].append(tuple(start+n+j for j in range(n)))
    for j in range(n):faces[idx].append((start+j,start+(j+1)%n,start+n+(j+1)%n,start+n+j))
def fan(x,y,z,theta=0):
    c=random.randrange(8); sk=8+random.randrange(4); h=random.uniform(.92,1.12); lean=random.uniform(-.07,.07)
    def p(dx,dy,dz):return(x+dx*cos(theta)-dy*sin(theta),y+dx*sin(theta)+dy*cos(theta),z+dz*h)
    cylbatch(c,p(0,0,.10),p(lean,0,.56),.16,.21)
    cylbatch(sk,p(lean,0,.6),p(lean,0,.83),.12,.12,7)
    for s in [-1,1]:
        shoulder=p(s*.2,0,.48)
        if random.random()<.28:
            elbow=p(s*.31,-.02,.7);hand=p(s*.35,-.07,.99)
        else:elbow=p(s*.24,-.10,.28);hand=p(s*.13,-.22,.29)
        cylbatch(c,shoulder,elbow,.065,.055);cylbatch(sk,elbow,hand,.045,.04)
        cylbatch(c,p(s*.085,-.03,.17),p(s*.105,-.29,.1),.075,.06)
for row in range(rows):
    n=70+row//2
    for col in range(n):
        if col%18==0:continue
        fan((col-(n-1)/2)*.58+random.uniform(-.05,.05),10.2+row*.73,.25+row*.36)
for side in [-1,1]:
    for row in range(14):
        for col in range(27):
            if col%11==0:continue
            fan(side*(17.4+row*.73),-4+col*.61,.24+row*.34,theta=side*pi/2)
for i,m in enumerate(crowd_mats+skin_mats):
    o=mesh('Packed audience · material batch '+str(i),verts[i],faces[i],m)
    for p in o.data.polygons:p.use_smooth=True

# Courtside LED hoardings and railings, leaving the front open.
led=material('LED sign black',(.006,.012,.019),0,.4)
for x in [-10,0,10]:
    box('Courtside digital board',(x,9,.55),(9.65,.2,.86),led,.035)
    text('League perimeter branding','GOAT HOOPERS',(x,8.87,.62),.43,gold,rot=(pi/2,0,0),font=font)
    line('LED board accent',[(x-4.8,8.85,.12),(x+4.8,8.85,.12)],.017,teal)
for y,z in [(9.7,1.3),(15.5,4.4),(21.2,7.2)]:
    line('Safety handrail',[(-23,y,z),(23,y,z)],.026,metal)
    for x in range(-22,23,4):line('Rail stanchion',[(x,y,z),(x,y,z-.8)],.025,metal)

# Distant city silhouette and warm window lights behind the open-air bowl.
city=material('Distant city dusk',(.028,.038,.065),.1,.7)
print('Building city and lighting',flush=True)
window=material('Window warm glow',(.62,.39,.17),0,.7,1.7)
for i in range(54):
    x=-55+i*2.15; y=random.uniform(51,63); w=random.uniform(1.3,3); h=random.uniform(5,12)
    box('Distant skyline',(x,y,h/2-1),(w,random.uniform(2,5),h),city)
    if i%5==0:box('Rooftop silhouette',(x,y,h-.4),(w*.45,1.1,1.6),city)
    for floor in range(3,int(h/.85)):
        if random.random()<.6:
            for col in range(2):box('City illuminated window',(x+(col-.5)*w*.4,y-2.6,floor*.83-1),(.18,.012,.26),window)

def area(name,loc,target,power,color,size):
    d=bpy.data.lights.new(name,'AREA'); d.energy=power; d.color=color; d.shape='DISK'; d.size=size
    o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o);o.location=loc;o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler();return o
for x,y in [(-20,-6),(20,-6),(-21,18),(21,18)]:
    # Keep the skyline and headline unobstructed; floodlight geometry is behind camera.
    if y<0:
        tube('Arena floodlight mast',[(x*1.7,y,0),(x*1.7,y,9.5)],.14,metal)
        panel=box('Floodlight housing',(x*1.7,y,9.4),(2.4,.35,.75),dark,.08)
        for j in range(5):box('Floodlight illuminated array',(x*1.7-.93+j*.46,y-.21,9.4),(.35,.03,.45),lamp,.03)
    area('Arena key flood',(x,y,12.9),(0,0,0),1250,(.73,.83,1),5)
area('Warm golden-hour key',(-12,-16,15),(0,0,1),2600,(1,.64,.31),12)
area('Sky fill',(6,-9,14),(0,0,2),1500,(.58,.73,1),13)
area('Back rim',(-5,17,12),(0,0,2),2200,(1,.54,.21),9)

# Camera and sky-facing 3D league title. Keep words exact and editable.
bpy.ops.object.camera_add(location=(21,-31,8.5)); cam=bpy.context.object; cam.name='Hero wide camera'
cam.rotation_euler=(Vector((0,1,4.3))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.lens=39;cam.data.sensor_width=36
bpy.context.scene.camera=cam; q=cam.rotation_euler.to_quaternion(); right=q@Vector((1,0,0));up=q@Vector((0,1,0));forward=q@Vector((0,0,-1))
center=cam.location+forward*47
title=text('GOAT HOOPERS · sky title','GOAT HOOPERS',center+up*8.6,4.2,gold,rot=cam.rotation_euler,font=font,depth=.09)
bpy.context.view_layer.update();fac=31/title.dimensions.x;title.scale=(fac,fac,fac)
sub=text('Fantasy basketball league · sky subtitle','FANTASY BASKETBALL LEAGUE',center+up*5.8,1.12,ivory,rot=cam.rotation_euler,font=font,depth=.027)
bpy.context.view_layer.update();fac=23/sub.dimensions.x;sub.scale=(fac,fac,fac)
for s in [-1,1]:
    a=center+up*5.8+right*s*13.3;b=center+up*5.8+right*s*16.1
    line('Title side rule',[tuple(a),tuple(b)],.032,gold)
area('Title softbox',center-forward*12+up*8,center+up*8,2400,(1,.85,.55),17)

# Sky with physical sun, simple atmospheric blue-hour blend.
world=bpy.data.worlds.new('Golden dusk sky');bpy.context.scene.world=world;world.use_nodes=True
wn=world.node_tree; bg=wn.nodes.get('Background');sky=wn.nodes.new('ShaderNodeTexSky');sky.sky_type='NISHITA';sky.sun_elevation=math.radians(3);sky.sun_rotation=math.radians(135);sky.altitude=.1;sky.air_density=1.1;sky.dust_density=3;sky.ozone_density=1
coord=wn.nodes.new('ShaderNodeTexCoord');sep=wn.nodes.new('ShaderNodeSeparateXYZ');wn.links.new(coord.outputs['Normal'],sep.inputs[0])
remap=wn.nodes.new('ShaderNodeMapRange');remap.inputs['From Min'].default_value=.18;remap.inputs['From Max'].default_value=-.38;wn.links.new(sep.outputs['Z'],remap.inputs[0])
colors=wn.nodes.new('ShaderNodeValToRGB');cr=colors.color_ramp;cr.elements[0].position=0;cr.elements[0].color=(.32,.13,.055,1);cr.elements[1].position=1;cr.elements[1].color=(.028,.07,.16,1)
e=cr.elements.new(.38);e.color=(.29,.205,.205,1);e=cr.elements.new(.68);e.color=(.095,.145,.25,1)
wn.links.new(remap.outputs['Result'],colors.inputs[0]);wn.links.new(colors.outputs['Color'],bg.inputs['Color']);bg.inputs['Strength'].default_value=.7

# Import original player meshes when ready. Positions intentionally leave readable silhouettes.
players_path=os.path.join(ROOT,'goat_players.py')
if not os.path.exists(players_path):players_path=os.path.join(os.path.dirname(ROOT),'goat_players.py')
if os.path.exists(players_path):
    print('Building ten original player characters',flush=True)
    sys.path.insert(0,os.path.dirname(players_path));from goat_players import build_player
    specs=[
      ('LeBron James',(-7,-3.2,.10),-.10,'dribble'),
      ('Jayson Tatum',(-3,-1.4,.10),-.4,'defend'),
      ('Luka Doncic',(1.0,-4.2,.10),.05,'pass'),
      ('Cade Cunningham',(5.0,-1.9,.10),.5,'defend'),
      ('Scottie Barnes',(8.7,1.0,.10),.3,'run'),
      ('Nikola Jokic',(-9.6,2.9,.10),-.2,'ready'),
      ('Giannis Antetokounmpo',(-5.3,4.2,.10),-.4,'run'),
      ('Shai Gilgeous-Alexander',(.0,3.3,.10),.3,'dribble'),
      ('Victor Wembanyama',(4.3,4.5,.10),.5,'shoot'),
      ('Anthony Edwards',(8.9,-4.5,.10),.4,'ready')]
    for name,pos,rot,pose in specs:
        try:build_player(name,position=pos,rotation=rot,pose=pose,with_ball=(name=='LeBron James'))
        except Exception as exc:print('PLAYER ERROR',name,exc);raise
else:print('BUILDING SCENE WITHOUT PLAYERS: module not ready')

# Render pipeline: CPU path tracing, contact shadows, restrained bloom.
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=96;scene.cycles.use_denoising=False
scene.cycles.max_bounces=5;scene.cycles.diffuse_bounces=3;scene.cycles.glossy_bounces=3;scene.cycles.transmission_bounces=4
scene.render.resolution_x=1920;scene.render.resolution_y=1080;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGB';scene.render.image_settings.color_depth='8'
scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast';scene.view_settings.exposure=.2
scene.render.film_transparent=False;scene.use_nodes=True
nodes=scene.node_tree.nodes;nodes.clear();rl=nodes.new('CompositorNodeRLayers');gl=nodes.new('CompositorNodeGlare');gl.glare_type='FOG_GLOW';gl.quality='HIGH';gl.threshold=2.5;gl.size=7;gl.mix=-.94
scene.node_tree.links.new(rl.outputs['Image'],gl.inputs['Image']);out=nodes.new('CompositorNodeComposite');scene.node_tree.links.new(gl.outputs['Image'],out.inputs['Image'])
scene['Artwork']='GOAT HOOPERS FANTASY BASKETBALL LEAGUE';scene['Method']='Original procedural Blender models; best-effort player likenesses. No purchased or downloaded character models.'
scene['Players']='Tatum, LeBron, Luka, Cade, Scottie Barnes, Jokic, Giannis, Shai, Wembanyama, Anthony Edwards'
for src in [__file__,players_path]:
    if os.path.exists(src):
        datablock=bpy.data.texts.new(os.path.basename(src));datablock.from_string(open(src).read())
notes=bpy.data.texts.new('READ ME · GOAT HOOPERS')
notes.from_string('Original Blender artwork for GOAT HOOPERS FANTASY BASKETBALL LEAGUE.\nAll scene geometry is editable. Character likenesses are approximate original constructions, not scans or licensed player meshes.\nHero wide camera is the intended composition. Materials and crowd batches are named.\nThe scene uses Cycles CPU and packed fonts. No external character assets or automatic Python execution are required.\n')
bpy.ops.file.pack_all()
argv=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
p=argparse.ArgumentParser();p.add_argument('--preview',action='store_true');p.add_argument('--save-only',action='store_true');args=p.parse_args(argv)
if args.preview:scene.render.resolution_percentage=50;scene.cycles.samples=32
bpy.ops.wm.save_as_mainfile(filepath=ROOT+'/GOAT_HOOPERS.blend',compress=True)
scene.render.filepath=ROOT+('/GOAT_HOOPERS_preview.png' if args.preview else '/GOAT_HOOPERS.png')
if not args.save_only:bpy.ops.render.render(write_still=True)
print('SCENE COMPLETE',scene.render.filepath)
