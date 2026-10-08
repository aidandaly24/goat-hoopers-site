"""Original procedural basketball figures, Blender 4.3.
No downloaded geometry or textures. Authoring scale: metres; forward -Y, up Z.
Interface: build_player(name, position=(0,0,0), rotation=0, pose='ready', scale=1.0).
Rotation is yaw in radians. Returns a parent Empty with all parts parented.
Available poses: ready, drive, shoot, defend, pass, rebound, dunk, run.
Root custom properties include jersey_number/team/left_hand/right_hand (local).
"""
import bpy, math, random
from mathutils import Vector
from math import sin, cos, pi

PLAYERS = {
 'Jayson Tatum': dict(height=2.03, build=1.01, skin=(.39,.20,.115), team='BOSTON', number='0', jersey=(.015,.22,.095), trim=(.96,.97,.91), hair='curly', beard=.76, head=1.00),
 'LeBron James': dict(height=2.06, build=1.15, skin=(.23,.104,.055), team='LAKERS', number='23', jersey=(.98,.57,.025), trim=(.26,.055,.39), hair='recede', beard=1.0, head=1.06),
 'Luka Doncic': dict(height=1.98, build=1.12, skin=(.71,.43,.29), team='DALLAS', number='77', jersey=(.83,.87,.90), trim=(.015,.14,.37), hair='sweep', beard=.48, head=1.00),
 'Cade Cunningham': dict(height=1.98, build=.99, skin=(.43,.245,.135), team='DETROIT', number='2', jersey=(.018,.135,.61), trim=(.94,.055,.11), hair='afro', beard=.65, head=1.0),
 'Scottie Barnes': dict(height=2.03, build=1.07, skin=(.285,.135,.07), team='TORONTO', number='4', jersey=(.69,.018,.055), trim=(.96,.96,.93), hair='braids', beard=.0, head=1.0),
 'Nikola Jokic': dict(height=2.11, build=1.22, skin=(.76,.49,.36), team='DENVER', number='15', jersey=(.015,.043,.11), trim=(.98,.63,.08), hair='buzz', beard=.13, head=1.04),
 'Giannis Antetokounmpo': dict(height=2.11, build=1.05, skin=(.28,.13,.064), team='MILWAUKEE', number='34', jersey=(.015,.16,.095), trim=(.89,.82,.62), hair='fade', beard=.05, head=.98),
 'Shai Gilgeous-Alexander': dict(height=1.98, build=.91, skin=(.31,.145,.076), team='OKLAHOMA', number='2', jersey=(.025,.31,.75), trim=(.98,.30,.035), hair='braids', beard=.10, head=.96),
 'Victor Wembanyama': dict(height=2.24, build=.86, skin=(.46,.275,.15), team='SPURS', number='1', jersey=(.018,.021,.025), trim=(.71,.75,.77), hair='curly', beard=.0, head=.97),
 'Anthony Edwards': dict(height=1.93, build=1.09, skin=(.255,.105,.051), team='MINNESOTA', number='5', jersey=(.012,.052,.12), trim=(.25,.70,.32), hair='crop', beard=.14, head=1.01),
}
ALIASES = {k.split()[-1].lower():k for k in PLAYERS}
ALIASES.update({'lebron':'LeBron James','luka':'Luka Doncic','jokic':'Nikola Jokic','jokić':'Nikola Jokic','giannis':'Giannis Antetokounmpo','shai':'Shai Gilgeous-Alexander','wemby':'Victor Wembanyama','cade':'Cade Cunningham','tatum':'Jayson Tatum','scottie':'Scottie Barnes','edwards':'Anthony Edwards','dončić':'Luka Doncic'})

_MATS={}
_FONT=None

def material(name, color, rough=.45, metallic=0, skin=False, fabric=False):
    if name in bpy.data.materials: return bpy.data.materials[name]
    m=bpy.data.materials.new(name); m.diffuse_color=(*color,1); m.use_nodes=True
    n=m.node_tree.nodes; l=m.node_tree.links; p=n.get('Principled BSDF')
    p.inputs['Base Color'].default_value=(*color,1); p.inputs['Roughness'].default_value=rough; p.inputs['Metallic'].default_value=metallic
    if skin:
        p.inputs['Subsurface Weight'].default_value=.065
        p.inputs['Subsurface Radius'].default_value=(1,.40,.22)
    if skin or fabric:
        tex=n.new('ShaderNodeTexNoise'); tex.inputs['Scale'].default_value=135 if skin else 220; tex.inputs['Detail'].default_value=2
        bump=n.new('ShaderNodeBump'); bump.inputs['Strength'].default_value=.10 if skin else .18; bump.inputs['Distance'].default_value=.006 if skin else .009
        l.new(tex.outputs['Fac'],bump.inputs['Height']); l.new(bump.outputs['Normal'],p.inputs['Normal'])
    return m

def mesh(name, verts, faces, mat, sub=0):
    me=bpy.data.meshes.new(name); me.from_pydata(verts,[],faces); me.update()
    ob=bpy.data.objects.new(name,me); bpy.context.collection.objects.link(ob)
    if mat: ob.data.materials.append(mat)
    for p in me.polygons: p.use_smooth=True
    if sub:
        mod=ob.modifiers.new('Sculpt smoothing','SUBSURF'); mod.levels=sub; mod.render_levels=sub
    return ob

def ellipsoid(name, center, radii, mat, segments=20, rings=12):
    # UV surface is used only for small anatomical details, never for the figure silhouette.
    vs=[]; fs=[]
    for j in range(rings+1):
        a=pi*j/rings
        for i in range(segments):
            b=2*pi*i/segments
            vs.append((center[0]+radii[0]*sin(a)*cos(b),center[1]+radii[1]*sin(a)*sin(b),center[2]+radii[2]*cos(a)))
    for j in range(rings):
        for i in range(segments):
            k=j*segments+i; ni=j*segments+(i+1)%segments
            fs.append((k,ni,ni+segments,k+segments))
    return mesh(name,vs,fs,mat)

def catmull(points, vals, steps=4):
    ps=[Vector(p) for p in points]; P=[ps[0]]+ps+[ps[-1]]; V=[vals[0]]+list(vals)+[vals[-1]]; out=[]; widths=[]
    for j in range(len(ps)-1):
        for k in range(steps):
            t=k/steps; t2=t*t; t3=t*t2
            q=.5*((2*P[j+1])+(-P[j]+P[j+2])*t+(2*P[j]-5*P[j+1]+4*P[j+2]-P[j+3])*t2+(-P[j]+3*P[j+1]-3*P[j+2]+P[j+3])*t3)
            r=.5*(2*V[j+1]+(-V[j]+V[j+2])*t+(2*V[j]-5*V[j+1]+4*V[j+2]-V[j+3])*t2+(-V[j]+3*V[j+1]-3*V[j+2]+V[j+3])*t3)
            out.append(q); widths.append(max(.002,r))
    return out+[ps[-1]], widths+[vals[-1]]

def tube(name, points, radii, mat, sides=16, smooth=3, aspect=.88, sub=1):
    ps,rs=catmull(points,radii,smooth) if smooth else ([Vector(p) for p in points],radii)
    vs=[]; fs=[]
    old_u=None
    for j,p in enumerate(ps):
        tangent=(ps[min(j+1,len(ps)-1)]-ps[max(j-1,0)]).normalized()
        ref=Vector((0,-1,0))
        if abs(tangent.dot(ref))>.92: ref=Vector((1,0,0))
        u=tangent.cross(ref).normalized(); v=tangent.cross(u).normalized()
        if old_u is not None and u.dot(old_u)<0: u=-u; v=-v
        old_u=u
        for i in range(sides):
            a=2*pi*i/sides; point=p+u*(cos(a)*rs[j])+v*(sin(a)*rs[j]*aspect)
            vs.append(tuple(point))
    for j in range(len(ps)-1):
        for i in range(sides):
            a=j*sides+i; b=j*sides+(i+1)%sides; fs.append((a,b,b+sides,a+sides))
    fs.append(tuple(reversed(range(sides)))); fs.append(tuple((len(ps)-1)*sides+i for i in range(sides)))
    return mesh(name,vs,fs,mat,sub)

def curve(name, points, radius, mat, cyclic=False):
    cu=bpy.data.curves.new(name,'CURVE'); cu.dimensions='3D'; cu.resolution_u=10; cu.bevel_depth=radius; cu.bevel_resolution=3
    sp=cu.splines.new('BEZIER'); sp.bezier_points.add(len(points)-1)
    for b,p in zip(sp.bezier_points,points): b.co=p; b.handle_left_type='AUTO'; b.handle_right_type='AUTO'
    sp.use_cyclic_u=cyclic
    ob=bpy.data.objects.new(name,cu); bpy.context.collection.objects.link(ob); ob.data.materials.append(mat); return ob

def loft(name, rows, mat, sides=32, sub=1, ripple=0):
    # row: center x,y,z, width radius, front-back radius
    vs=[]; fs=[]
    for j,(x,y,z,rx,ry) in enumerate(rows):
        for i in range(sides):
            a=2*pi*i/sides; f=1+ripple*sin(9*a+j*.65)
            vs.append((x+rx*cos(a)*f,y+ry*sin(a)*f,z))
    for j in range(len(rows)-1):
        for i in range(sides):
            a=j*sides+i;b=j*sides+(i+1)%sides; fs.append((a,b,b+sides,a+sides))
    fs.append(tuple(reversed(range(sides))));fs.append(tuple((len(rows)-1)*sides+i for i in range(sides)))
    return mesh(name,vs,fs,mat,sub)

def text(name, words, pos, size, mat, width=None, back=False):
    global _FONT
    cu=bpy.data.curves.new(name,'FONT'); cu.body=words;cu.align_x='CENTER';cu.align_y='CENTER';cu.size=size;cu.extrude=.0006;cu.bevel_depth=.00035
    if _FONT is None:
        try:_FONT=bpy.data.fonts.load('/usr/share/fonts/truetype/dejavu/DejaVuSansCondensed-Bold.ttf')
        except:_FONT=False
    if _FONT:cu.font=_FONT
    ob=bpy.data.objects.new(name,cu);bpy.context.collection.objects.link(ob);ob.location=pos;ob.rotation_euler=(pi/2,0,pi if back else 0);ob.data.materials.append(mat)
    bpy.context.view_layer.update()
    if width and ob.dimensions.x>width:ob.scale.x*=width/ob.dimensions.x
    return ob

def head(name,cfg,base,skin,hairmat,lipmat,eyewhite,iris):
    # Individually proportioned jaw, temples, cheekbones and a subtly flattened facial plane.
    x0,y0,z0=base; hf=cfg['head']; name0=name
    facewidth={'LeBron James':1.08,'Luka Doncic':1.05,'Cade Cunningham':.97,'Scottie Barnes':1.07,'Anthony Edwards':1.09,'Victor Wembanyama':.96}.get(name,1.0)
    def P(x,y,z):return (x0+x*hf*facewidth,y0+y*hf,z0+z*hf)
    levels=[(-.143,.033,.049),(-.128,.063,.069),(-.102,.083,.079),(-.062,.101,.093),(-.022,.110,.095),(.024,.111,.099),(.073,.112,.105),(.119,.101,.093),(.148,.074,.070),(.161,.020,.022)]
    vs=[];fs=[];N=40
    for z,rx,ry in levels:
        for i in range(N):
            a=2*pi*i/N;x=rx*cos(a);y=ry*sin(a)
            if y<0:
                # Broad facial plane; structured cheeks at outer eyes and jaw.
                y=-ry*(.79+.21*abs(sin(a)))
                if -.07<z<.03:y-=.006*sin(2*a)**2
            vs.append(P(x,y,z))
    for j in range(len(levels)-1):
        for i in range(N):a=j*N+i;b=j*N+(i+1)%N;fs.append((a,b,b+N,a+N))
    fs.append(tuple(reversed(range(N))));fs.append(tuple((len(levels)-1)*N+i for i in range(N)))
    mesh(name+' sculpted head',vs,fs,skin,2)
    # Ears and inset helix ridges.
    earshade=material(name+' ear shadow',tuple(c*.68 for c in cfg['skin']),.54)
    for side in [-1,1]:
        ellipsoid(name+' ear',P(side*.111,.004,-.012),(.020*hf,.024*hf,.043*hf),skin)
        ellipsoid(name+' concha',P(side*.124,-.012,-.01),(.008*hf,.009*hf,.022*hf),earshade)
        curve(name+' ear helix',[P(side*.122,-.018,.016),P(side*.134,-.018,.008),P(side*.133,-.018,-.02),P(side*.120,-.018,-.034)],.0042*hf,skin)
    # Recessed narrow eye shapes, individual irises and pin highlights.
    pupil=material('Players pupil',(0.008,.005,.003),.23)
    glint=material('Players cornea glint',(.91,.94,.92),.12)
    for s in [-1,1]:
        ex=s*.044
        ellipsoid(name+' eye socket',P(ex,-.085,.018),(.026*hf,.012*hf,.013*hf),earshade)
        ellipsoid(name+' eye white',P(ex,-.094,.017),(.021*hf,.009*hf,.0085*hf),eyewhite)
        ellipsoid(name+' iris',P(ex,-.1022,.017),(.0061*hf,.0025*hf,.0064*hf),iris)
        ellipsoid(name+' pupil',P(ex,-.104,.017),(.0028*hf,.0011*hf,.0038*hf),pupil)
        ellipsoid(name+' eye catchlight',P(ex-.0015,-.105,.0194),(.00125*hf,.0007*hf,.0014*hf),glint,12,8)
        curve(name+' upper eyelid',[P(ex-s*.023,-.094,.015),P(ex,-.105,.026),P(ex+s*.023,-.093,.019)],.0032*hf,skin)
        curve(name+' lower eyelid',[P(ex-s*.021,-.094,.014),P(ex,-.101,.010),P(ex+s*.021,-.093,.016)],.0022*hf,skin)
        curve(name+' eyebrow',[P(ex-s*.025,-.090,.045),P(ex,-.104,.049),P(ex+s*.026,-.090,.043)],.0055*hf,hairmat)
    # Sculpted bridge with broad/narrow nasal wings rather than a ball nose.
    nw=.019 if cfg['skin'][0]>.6 else .024
    vs=[P(-.011,-.091,.045),P(.011,-.091,.045),P(-.013,-.117,-.006),P(.013,-.117,-.006),P(-nw,-.107,-.027),P(nw,-.107,-.027),P(-.010,-.129,-.025),P(.010,-.129,-.025),P(0,-.112,-.037)]
    fs=[(0,1,3,2),(2,3,7,6),(2,6,4),(3,5,7),(4,6,8),(6,7,8),(7,5,8),(0,2,4),(1,5,3)]
    mesh(name+' nose bridge and tip',vs,fs,skin,2)
    for s in [-1,1]:ellipsoid(name+' nostril',P(s*nw*.69,-.116,-.029),(.0055*hf,.003*hf,.0035*hf),earshade,12,8)
    # Soft cupid's bow and mouth crease.
    curve(name+' upper lip',[P(-.031,-.084,-.067),P(-.013,-.100,-.061),P(0,-.102,-.065),P(.013,-.100,-.061),P(.031,-.084,-.067)],.0036*hf,lipmat)
    curve(name+' lower lip',[P(-.029,-.086,-.070),P(0,-.101,-.075),P(.029,-.086,-.070)],.0045*hf,lipmat)
    curve(name+' mouth crease',[P(-.029,-.088,-.068),P(0,-.105,-.0685),P(.029,-.088,-.068)],.0016*hf,earshade)
    # Hair is a fitted scalp cap and coherent small curl/twist masses.
    typ=cfg['hair']; rows=[]
    minz={'recede':.099,'buzz':.089,'sweep':.075,'crop':.077,'fade':.070,'curly':.060,'afro':.073,'twists':.05,'braids':.070}[typ]
    hs={'recede':.001,'buzz':.004,'sweep':.022,'crop':.010,'fade':.020,'curly':.022,'afro':.067,'twists':.025,'braids':.009}[typ]
    vs=[];fs=[];NR=10;NA=40
    for j in range(NR+1):
        t=j/NR;z=minz+(0.164+hs-minz)*t
        zzref=z-hs*.6
        r=.009
        for q in range(len(levels)-1):
            za,ra,ya=levels[q];zb,rb,yb=levels[q+1]
            if za<=zzref<=zb:r=ra+(rb-ra)*(zzref-za)/(zb-za)+.008;break
        if zzref>levels[-1][0]:r=max(.003,(.169+hs-z)*2)
        for i in range(NA):
            a=2*pi*i/NA;front=max(0,-sin(a));zz=z
            if j==0:zz+=.008*front+.010*cos(a*2)
            rr=r+(.029*(1-t) if typ=='afro' else 0)
            xx=rr*cos(a); yy=rr*.93*sin(a)
            if typ=='sweep':zz+=.020*max(0,-cos(a))*(1-t);xx-=.012*t
            vs.append(P(xx,yy,zz))
    for j in range(NR):
        for i in range(NA):a=j*NA+i;b=j*NA+(i+1)%NA;fs.append((a,b,b+NA,a+NA))
    if typ!='recede':mesh(name+' fitted '+typ+' hair',vs,fs,hairmat,1)
    rng=random.Random(name)
    if typ in ['afro','curly','twists','crop','fade']:
        for i in range(76 if typ=='afro' else (48 if typ=='twists' else 30)):
            a=rng.random()*2*pi;t=rng.uniform(.10,1);z=minz+.085*t; r=.119*max(.18,(1-((z-.035)/.19)**2)**.5)
            if typ=='afro':r+=.025
            rr={'afro':.025,'curly':.014,'twists':.016,'crop':.010,'fade':.012}[typ]*rng.uniform(.75,1.25)
            ellipsoid(name+' hair texture',P(r*cos(a),r*.91*sin(a),z+hs), (rr,rr,rr*1.1),hairmat,10,6)
    if typ=='braids':
        for x in [-.077,-.047,-.016,.016,.047,.077]:
            pts=[]
            for j in range(9):
                y=-.079+j*.020;z=.075+.083*max(0,1-(x/.13)**2-(y/.13)**2)**.5
                pts.append(P(x+.004*sin(j*pi),y,z))
            curve(name+' cornrow',pts,.0075,hairmat)
    if name=='Shai Gilgeous-Alexander':
        band=material('Shai white headband',(.90,.91,.89),.72,fabric=True)
        loft(name+' white headband',[(x0,y0,z0+zz*hf,.122*hf*facewidth,.115*hf) for zz in [.047,.050,.099,.102]],band,40,1)
    if name in ['Scottie Barnes','Giannis Antetokounmpo','Victor Wembanyama','Anthony Edwards','Shai Gilgeous-Alexander']:
        curve(name+' small chin goatee',[P(-.031,-.081,-.112),P(0,-.091,-.129),P(.031,-.081,-.112)],.009 if name!='Anthony Edwards' else .005,hairmat)
        for side in [-1,1]:curve(name+' fine moustache',[P(side*.005,-.108,-.05),P(side*.02,-.104,-.052),P(side*.030,-.095,-.056)],.0024,hairmat)
    # A fitted jawline beard preserves cheek shape and the mouth opening.
    beard=cfg['beard']
    if beard>.10:
        beardmat=material(name+' beard',(.033,.020,.012) if name!='Luka Doncic' else (.10,.056,.027),.76,fabric=True)
        vs=[];fs=[];ns=28
        for j in range(6):
            t=j/5
            for i in range(ns+1):
                a=-pi+pi*i/ns # front half, negative y
                x=(.081+.022*t)*cos(a); y=(.080+.014*t)*sin(a)-.001
                top=-.057+.032*abs(cos(a));bot=-.132-.025*beard*(1-abs(cos(a)))
                z=bot*(1-t)+top*t
                if abs(x)<.036 and t>.67:z-=.027*(1-abs(x)/.036)
                vs.append(P(x*(1+.06*beard),y-.006,z))
        for j in range(5):
            for i in range(ns):a=j*(ns+1)+i;fs.append((a,a+1,a+ns+2,a+ns+1))
        mesh(name+' fitted beard',vs,fs,beardmat,1)
        for s in [-1,1]:curve(name+' moustache',[P(s*.004,-.111,-.050),P(s*.019,-.104,-.053),P(s*.031,-.094,-.059)],.004+beard*.002,beardmat)


def build_player(name, position=(0,0,0), rotation=0, pose='ready', scale=1.0, with_ball=True):
    name=ALIASES.get(name.lower(),name)
    if name not in PLAYERS:raise ValueError('Unknown player: '+name)
    if pose=='dribble':pose='drive'
    cfg=PLAYERS[name];before=set(bpy.data.objects); b=cfg['build']
    skin=material(name+' skin',cfg['skin'],.46,skin=True); jersey=material(name+' woven jersey',cfg['jersey'],.66,fabric=True)
    trim=material(name+' jersey trim',cfg['trim'],.51,fabric=True); white=material('Players warm white',(.89,.89,.85),.50)
    black=material('Players charcoal',(.014,.015,.020),.46); hair=material(name+' hair',(.018,.012,.009) if name!='Luka Doncic' else (.078,.043,.021),.77,fabric=True)
    lip=material(name+' lips',tuple(c*k for c,k in zip(cfg['skin'],(.84,.68,.68))),.49)
    eye=material('Players eye ivory',(.73,.71,.65),.29);iris=material('Players dark brown irises',(.044,.022,.010),.23)
    if name=='Luka Doncic':iris=material('Luka hazel iris',(.17,.21,.15),.25)
    if name=='Nikola Jokic':iris=material('Jokic blue iris',(.16,.23,.25),.25)
    # Anatomical landmarks for a 2 m neutral figure. Poses alter chains, not limb length.
    shift=Vector((0,0,0));hipz=1.02
    legs=[[( -.12,0,1.02),(-.18,-.065,.57),(-.21,.015,.17)],[( .12,0,1.02),(.19,.07,.57),(.24,.08,.17)]]
    arms=[[(-.235,0,1.60),(-.36,-.065,1.30),(-.42,-.24,1.08)],[(.235,0,1.60),(.37,-.07,1.31),(.41,-.29,1.15)]]
    if pose=='drive':
        shift=Vector((-.03,-.08,-.09));legs=[[(-.12,0,.93),(-.35,-.25,.52),(-.47,-.36,.16)],[(.12,0,.93),(.35,.27,.60),(.56,.54,.16)]]
        arms=[[(-.265,-.08,1.51),(-.49,-.18,1.26),(-.48,-.43,1.03)],[(.205,-.08,1.51),(.42,-.11,1.28),(.54,-.33,1.02)]]
    elif pose=='shoot':
        shift=Vector((0,0,.03));arms=[[(-.235,0,1.63),(-.26,-.25,1.81),(-.10,-.25,2.09)],[(.235,0,1.63),(.25,-.25,1.85),(.10,-.28,2.16)]]
        legs=[[(-.12,0,1.05),(-.17,-.11,.60),(-.21,.03,.17)],[(.12,0,1.05),(.15,-.13,.61),(.20,-.01,.17)]]
    elif pose=='defend':
        shift=Vector((0,0,-.11));legs=[[(-.12,0,.91),(-.36,-.11,.54),(-.52,.04,.17)],[(.12,0,.91),(.36,-.11,.54),(.52,.04,.17)]]
        arms=[[(-.235,0,1.49),(-.48,-.02,1.36),(-.75,-.15,1.44)],[(.235,0,1.49),(.48,-.02,1.35),(.76,-.14,1.47)]]
    elif pose=='pass':
        arms=[[(-.235,0,1.60),(-.30,-.21,1.39),(-.17,-.50,1.44)],[(.235,0,1.60),(.30,-.21,1.39),(.17,-.50,1.44)]]
    elif pose in ['rebound','dunk']:
        shift=Vector((0,0,.13));arms=[[(-.235,0,1.73),(-.35,-.04,2.02),(-.24,-.12,2.30)],[(.235,0,1.73),(.38,-.06,2.01),(.32,-.18,2.29)]]
        legs=[[(-.12,0,1.15),(-.21,.10,.72),(-.29,.42,.45)],[(.12,0,1.15),(.18,-.07,.69),(.22,.02,.23)]]
        if pose=='dunk':arms[0]=[(-.235,0,1.73),(-.45,.03,1.47),(-.61,-.14,1.29)]
    elif pose=='run':
        shift=Vector((0,-.03,.02));legs=[[(-.12,0,1.04),(-.22,-.25,.68),(-.30,-.37,.26)],[(.12,0,1.04),(.23,.20,.64),(.28,.52,.45)]]
        arms=[[(-.235,-.03,1.62),(-.36,-.15,1.36),(-.28,-.39,1.54)],[(.235,-.03,1.62),(.41,.20,1.43),(.51,.05,1.21)]]
    def S(x,y,z):return (x+shift.x,y+shift.y,z+shift.z)
    # Continuous torso with clavicle slope and tapered waist.
    loft(name+' anatomical torso',[(0,0,1.00,.14*b,.102),(0,0,1.08,.161*b,.117),(0,0,1.18,.146*b,.105),(0,0,1.32,.177*b,.117),(0,0,1.47,.221*b,.124),(0,0,1.57,.211*b,.106),(0,0,1.63,.136*b,.083),(0,0,1.67,.076,.062)],skin,32,2)
    torso=bpy.context.collection.objects[-1] if False else bpy.data.objects.get(name+' anatomical torso')
    torso.location=shift
    tube(name+' neck',[S(0,.009,1.60),S(0,.009,1.69),S(0,.006,1.77)],[.080*b,.063,.066],skin,24,3,.90,1)
    # Soft sleeveless jersey with shaped shoulder straps and open armholes.
    rows=[(0,0,1.075,.165*b,.124),(0,0,1.105,.168*b,.124),(0,0,1.21,.162*b,.12),(0,0,1.35,.189*b,.138),(0,0,1.46,.228*b,.143),(0,0,1.48,.228*b,.142)]
    shirt=loft(name+' jersey body',rows,jersey,40,1,ripple=.012);shirt.location=shift
    # Upper front/back shaped panels from underarm to clavicle; real gaps around neck and arms.
    for side in [-1,1]:
        xs=[-.228,-.19,-.145,-.09,0,.09,.145,.19,.228]
        top=[1.485,1.625,1.655,1.620,1.573 if side==-1 else 1.616,1.620,1.655,1.625,1.485]
        vs=[];fs=[]
        for j in range(5):
            t=j/4
            for x,z in zip(xs,top):
                yy=side*(.142-.039*t)*max(.38,(1-(x/.275)**2)**.5)
                vs.append(S(x*b,yy,1.455*(1-t)+z*t))
        for j in range(4):
            for i in range(8):a=j*9+i;fs.append((a,a+1,a+10,a+9))
        panel=mesh(name+(' chest cloth' if side<0 else ' back cloth'),vs,fs,jersey,1)
        sol=panel.modifiers.new('Fabric thickness','SOLIDIFY');sol.thickness=.005
        collar=[S(x*b,side*(.104)*max(.38,(1-(x/.275)**2)**.5),z+.001) for x,z in zip(xs[2:7],top[2:7])]
        curve(name+' neckline piping',collar,.007,trim)
        for s in [-1,1]:curve(name+' armhole piping',[S(s*.145*b,side*.089,1.655),S(s*.192*b,side*.069,1.621),S(s*.229*b,side*.068,1.50),S(s*.227*b,side*.075,1.47)],.006,trim)
    # A narrow strap bridges each shoulder; neckline remains open.
    for s in [-1,1]:
        vs=[S(s*.115*b,-.094,1.644),S(s*.185*b,-.073,1.644),S(s*.185*b,.073,1.644),S(s*.115*b,.094,1.644)]
        ob=mesh(name+' shoulder strap',vs,[(0,1,2,3)],jersey,1);so=ob.modifiers.new('Strap thickness','SOLIDIFY');so.thickness=.008
    # Uniform typography, sewn number edging and small shoulder marks.
    letter=trim if cfg['team'] in ['LAKERS','DALLAS'] else white
    text(name+' team wordmark',cfg['team'],S(0,-.143,1.449),.061,letter,.365*b)
    text(name+' front number',cfg['number'],S(0,-.151,1.306),.175,letter,.19*b)
    text(name+' surname',name.split()[-1].upper(),S(0,.137,1.473),.040,white,.34*b,True)
    text(name+' back number',cfg['number'],S(0,.14,1.298),.188,letter,.22*b,True)
    curve(name+' shoulder swoosh',[S(.114*b,-.128,1.541),S(.137*b,-.126,1.527),S(.165*b,-.119,1.546)],.0026,letter)
    # Waistband and draped split shorts; legs run through cloth rather than disconnected joints.
    loft(name+' elastic waistband',[(shift.x,shift.y,1.064+shift.z,.174*b,.127),(shift.x,shift.y,1.106+shift.z,.173*b,.128)],jersey,40,1)
    curve(name+' waistband seam',[S(.173*b*cos(a),.129*sin(a),1.082) for a in [2*pi*i/32 for i in range(32)]],.004,trim,True)
    loft(name+' shorts pelvic bridge',[(shift.x,shift.y,.932+shift.z,.115*b,.10),(shift.x,shift.y,1.025+shift.z,.177*b,.132),(shift.x,shift.y,1.079+shift.z,.173*b,.13)],jersey,32,1)
    for li,(hp,kn,an) in enumerate(legs):
        hp=Vector(hp);kn=Vector(kn);an=Vector(an); direction=(kn-hp).normalized();mid=hp.lerp(kn,.45)
        # Shorts tube opens above kneecap, with subtle fabric ripples.
        shorttop=hp+Vector((0,0,.064));shortbot=hp.lerp(kn,.59)
        shorts=tube(name+' shorts '+str(li),[shorttop,hp.lerp(kn,.18),shortbot],[.123*b,.137*b,.131*b],jersey,24,4,.87,1)
        for frac in [.56,.59]:
            cen=hp.lerp(kn,frac); tangent=(kn-hp).normalized();u=tangent.cross(Vector((0,-1,0))).normalized();v=tangent.cross(u)
            pts=[tuple(cen+u*(.132*b*cos(a))+v*(.116*b*sin(a))) for a in [2*pi*i/28 for i in range(28)]]
            curve(name+' shorts hem',pts,.005,trim,True)
        side=-1 if li==0 else 1
        curve(name+' shorts side stripe',[tuple(shorttop+Vector((side*.122*b,-.010,0))),tuple(mid+Vector((side*.138*b,-.015,0))),tuple(shortbot+Vector((side*.131*b,-.01,0)))],.009,trim)
        # Natural tapered quadriceps, patella and calf contours in one swept surface.
        pts=[hp,hp.lerp(kn,.27),hp.lerp(kn,.65),kn,kn.lerp(an,.23),kn.lerp(an,.53),an]
        rads=[.097*b,.111*b,.086*b,.063*b,.082*b,.072*b,.039*b]
        tube(name+' continuous leg '+str(li),pts,rads,skin,20,4,.90,1)
        socktop=an.lerp(kn,.30)
        tube(name+' ribbed sock '+str(li),[an,an.lerp(kn,.12),socktop],[.043*b,.043*b,.052*b],white,20,3,.90,1)
        # Low-top basketball shoes: asymmetrical articulated upper, sole, heel, laces.
        foot=Vector((an.x,an.y-.042,an.z-.085)); shoe=material(name+' shoe accent',cfg['trim'],.40)
        footrows=[(foot.x,foot.y-.041,foot.z-.026,.071*b,.143),(foot.x,foot.y-.043,foot.z+.006,.074*b,.148),(foot.x,foot.y-.031,foot.z+.042,.067*b,.133),(foot.x,foot.y+.004,foot.z+.063,.057*b,.105),(foot.x,foot.y+.037,foot.z+.080,.038*b,.060)]
        loft(name+' sculpted sneaker '+str(li),footrows,white,28,1)
        loft(name+' sneaker sole '+str(li),[(foot.x,foot.y-.041,foot.z-.04,.072*b,.143),(foot.x,foot.y-.041,foot.z-.019,.073*b,.143)],shoe,28,1)
        for k in range(4):
            y=foot.y-.005-k*.020;curve(name+' lace',[ (foot.x-.037,y,foot.z+.048),(foot.x,y-.007,foot.z+.058),(foot.x+.037,y,foot.z+.048)],.0022,black)
        for s in [-1,1]:curve(name+' shoe side flash',[(foot.x+s*.062,foot.y+.01,foot.z+.029),(foot.x+s*.072,foot.y-.044,foot.z+.018),(foot.x+s*.061,foot.y-.095,foot.z+.026)],.005,shoe)
    # Each entire shoulder-arm chain is one organic surface, with elbow taper and muscle bellies.
    hands=[]
    for ai,(sh,el,wr) in enumerate(arms):
        sh=Vector(sh);el=Vector(el);wr=Vector(wr)
        sh.x*=b;el.x*=b;wr.x*=b
        medial=sh.copy();medial.x*=.65;medial.z-=.018
        pts=[medial,sh,sh.lerp(el,.27),sh.lerp(el,.65),el,el.lerp(wr,.25),el.lerp(wr,.62),wr]
        rr=[.075*b,.088*b,.082*b,.067*b,.052*b,.060*b,.050*b,.034*b]
        tube(name+' continuous arm '+str(ai),pts,rr,skin,20,4,.87,1)
        # Connected palm and individually tapered, bent fingers.
        along=(wr-el).normalized();palm=wr+along*.067; hands.append(tuple(palm))
        tube(name+' palm '+str(ai),[wr,wr+along*.040,wr+along*.086],[.036*b,.050*b,.033*b],skin,16,3,.52,1)
        lateral=along.cross(Vector((0,-1,0)))
        if lateral.length<.2:lateral=Vector((1,0,0))
        lateral.normalize();bend=Vector((0,-1,0)); side=-1 if ai==0 else 1
        for fi in range(4):
            offs=(fi-1.5)*.019*b;start=wr+along*.078+lateral*offs
            length=[.075,.087,.083,.066][fi];p1=start+along*length*.48+bend*.009;p2=start+along*length*.86+bend*.017;tip=start+along*length+bend*.026
            tube(name+' finger '+str(ai)+' '+str(fi),[start,p1,p2,tip],[.010*b,.009*b,.008*b,.004*b],skin,10,3,.86,1)
        thumbstart=wr+along*.029+lateral*(side*.035*b);thumbtip=thumbstart+along*.052+lateral*(side*.035*b)+bend*.018
        tube(name+' thumb '+str(ai),[thumbstart,thumbstart.lerp(thumbtip,.53),thumbtip],[.015*b,.012*b,.006*b],skin,12,3,.87,1)
        # Thin athletic wrist band/sleeve choices differentiate silhouettes.
        if (name in ['LeBron James','Jayson Tatum','Cade Cunningham','Anthony Edwards'] and ai==0):
            tube(name+' shooting sleeve',[sh.lerp(el,.50),sh.lerp(el,.65),el,el.lerp(wr,.25),el.lerp(wr,.62),el.lerp(wr,.87)],[.076*b,.071*b,.057*b,.065*b,.055*b,.043*b],black if name in ['LeBron James','Anthony Edwards'] else white,20,4,.91,1)
    head(name,cfg,S(0,-.002,1.842),skin,hair,lip,eye,iris)
    # Faint, irregular ink lines are original decorative marks, not scans of player tattoos.
    if name in ['LeBron James','Jayson Tatum','Luka Doncic','Cade Cunningham']:
        ink=material(name+' tattoo ink',tuple(c*.37 for c in cfg['skin']),.63)
        sh,el,wr=[Vector(p) for p in arms[1]]
        rng=random.Random(name+'ink')
        for i in range(9):
            t=.19+i*.044;cen=sh.lerp(el,t);rad=.08*b
            pts=[tuple(cen+Vector((rad*.68*cos(a),-rad*.90,rad*.35*sin(a)))) for a in [j*pi/3 for j in range(5)]]
            curve(name+' abstract arm ink',pts,.0013,ink)
    if with_ball and pose in ['drive','shoot','pass','dunk']:
        if pose=='drive':ballcenter=Vector(hands[1])+Vector((0,-.024,-.163))
        elif pose=='pass':ballcenter=(Vector(hands[0])+Vector(hands[1]))*.5+Vector((0,-.10,0))
        elif pose=='shoot':ballcenter=(Vector(hands[0])+Vector(hands[1]))*.5+Vector((0,-.04,.12))
        else:ballcenter=Vector(hands[1])+Vector((0,-.015,.145))
        ballmat=material('Pebbled basketball leather',(.52,.155,.025),.64,fabric=True)
        seams=material('Basketball recessed seams',(.022,.012,.007),.72)
        ellipsoid(name+' basketball',ballcenter,(.122,.122,.122),ballmat,48,32)
        for axis in range(3):
            pts=[]
            for i in range(64):
                a=2*pi*i/64
                v=Vector((.1224*cos(a),.1224*sin(a),0))
                if axis==1:v=Vector((v.x,0,v.y))
                elif axis==2:v=Vector((0,v.x,v.y))
                pts.append(tuple(ballcenter+v))
            curve(name+' ball seam',pts,.0022,seams,True)
        for sign in [-1,1]:
            pts=[]
            for i in range(64):
                a=2*pi*i/64; yy=.072*sign*cos(a*.0);r=math.sqrt(.1224**2-yy*yy)
                pts.append(tuple(ballcenter+Vector((r*cos(a),yy,r*sin(a)))))
            curve(name+' ball channel',pts,.0018,seams,True)
    new=[o for o in bpy.data.objects if o not in before]
    root=bpy.data.objects.new(name+' | PLAYER',None);bpy.context.collection.objects.link(root);root.empty_display_type='PLAIN_AXES';root.empty_display_size=.15
    for ob in new:ob.parent=root
    fac=cfg['height']/2.003*scale;root.scale=(fac,fac,fac);root.location=position;root.rotation_euler.z=rotation
    root['player_name']=name;root['team']=cfg['team'];root['jersey_number']=cfg['number'];root['pose']=pose;root['left_hand']=hands[0];root['right_hand']=hands[1]
    root['original_model']=True;root['likeness_note']='Procedural artistic interpretation; no scan or downloaded mesh.'
    return root

def create_players(layout=None):
    """Build supplied list of dicts, or all ten in a neutral spaced lineup."""
    if layout is None:layout=[dict(name=n,position=((i-4.5)*1.1,0,0)) for i,n in enumerate(PLAYERS)]
    return [build_player(**item) for item in layout]
