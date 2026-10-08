"""Raised satin-stitched ivory lettering. All visible ridges are actual mesh yarn.
Use in Blender: build_satin_lettering(..., surface_fn=lambda x,z: cloth_y).
Returns parent Empty. Coordinates: X across, Z up, stitches face -Y.
"""
import os, math, random
import bpy
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy.ndimage import gaussian_filter1d, distance_transform_edt
from mathutils import Vector
FONT=os.path.join(os.path.dirname(os.path.abspath(__file__)),'fonts','DejaVuSansCondensed-Bold.ttf')


def _mask(text, width, height, ppm=1100):
    font=ImageFont.truetype(FONT, 360)
    box=font.getbbox(text)
    im=Image.new('L',(box[2]-box[0],box[3]-box[1]),0)
    ImageDraw.Draw(im).text((-box[0],-box[1]),text,font=font,fill=255)
    im=im.resize((round(width*ppm), round(height*ppm)),Image.Resampling.LANCZOS)
    # Border protects thinning and ray-casting at the outside edge.
    return np.pad(np.array(im)>127,4), ppm


def _thin(mask):
    a=mask.astype(np.uint8).copy()
    while True:
        changed=False
        for phase in (0,1):
            p=a[1:-1,1:-1]
            n=[a[:-2,1:-1],a[:-2,2:],a[1:-1,2:],a[2:,2:],a[2:,1:-1],a[2:,:-2],a[1:-1,:-2],a[:-2,:-2]]
            count=sum(n)
            transitions=sum((n[k]==0)&(n[(k+1)%8]==1) for k in range(8))
            if phase==0:
                c1=n[0]*n[2]*n[4]; c2=n[2]*n[4]*n[6]
            else:
                c1=n[0]*n[2]*n[6]; c2=n[0]*n[4]*n[6]
            remove=(p==1)&(count>=2)&(count<=6)&(transitions==1)&(c1==0)&(c2==0)
            if remove.any():
                p[remove]=0; changed=True
        if not changed: break
    return a.astype(bool)


def _paths(skel, mask=None):
    nodes={tuple(p) for p in np.argwhere(skel)}
    adj={p:[] for p in nodes}
    for y,x in sorted(nodes):
        for dy,dx in ((-1,0),(1,0),(0,-1),(0,1),(-1,-1),(-1,1),(1,-1),(1,1)):
            q=(y+dy,x+dx)
            if q not in nodes: continue
            # Avoid diagonal shortcut triangles at a right-angle skeleton pixel.
            if dx and dy and ((y,x+dx) in nodes or (y+dy,x) in nodes): continue
            adj[(y,x)].append(q)
    used=set(); paths=[]
    seeds=[p for p in sorted(nodes) if len(adj[p])!=2]+sorted(nodes)
    for start in seeds:
        for nxt in adj[start]:
            edge=tuple(sorted((start,nxt)))
            if edge in used: continue
            used.add(edge); path=[start,nxt]; prev=start; cur=nxt
            while len(adj[cur])==2:
                other=adj[cur][0] if adj[cur][0]!=prev else adj[cur][1]
                e=tuple(sorted((cur,other)))
                if e in used: break
                used.add(e); path.append(other); prev,cur=cur,other
            if len(path)>=4:
                chain=np.array(path,dtype=float)
                if mask is not None:
                    for at_start in (True,False):
                        endpoint=path[0] if at_start else path[-1]
                        if len(adj[endpoint])!=1:continue
                        end=chain[0] if at_start else chain[-1]
                        inner=chain[min(7,len(chain)-1)] if at_start else chain[max(0,len(chain)-8)]
                        direction=end-inner; norm=np.linalg.norm(direction)
                        if norm<1:continue
                        direction/=norm; extra=[]
                        for step in range(1,50):
                            q=end+direction*step; yy,xx=np.round(q).astype(int)
                            if yy<0 or xx<0 or yy>=mask.shape[0] or xx>=mask.shape[1] or not mask[yy,xx]: break
                            extra.append(q)
                        if extra:
                            chain=np.vstack((extra[::-1],chain)) if at_start else np.vstack((chain,extra))
                paths.append(chain)
    return paths


def _material():
    m=bpy.data.materials.new('Ivory satin embroidery • softly twisted cotton')
    m.use_nodes=True; nt=m.node_tree; p=nt.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value=(.80,.76,.66,1)
    p.inputs['Roughness'].default_value=.49
    if p.inputs.get('Sheen Weight'): p.inputs['Sheen Weight'].default_value=.28
    if p.inputs.get('Sheen Roughness'): p.inputs['Sheen Roughness'].default_value=.48
    if p.inputs.get('Anisotropic IOR Level'): p.inputs['Anisotropic IOR Level'].default_value=.30
    # The geometry carries the relief. This microscopic bump only breaks perfect plastic smoothness.
    tex=nt.nodes.new('ShaderNodeTexNoise'); tex.inputs['Scale'].default_value=1500
    tex.inputs['Detail'].default_value=2
    bump=nt.nodes.new('ShaderNodeBump'); bump.inputs['Strength'].default_value=.14; bump.inputs['Distance'].default_value=.00008
    nt.links.new(tex.outputs['Fac'],bump.inputs['Height']); nt.links.new(bump.outputs['Normal'],p.inputs['Normal'])
    return m


def _add_tube(verts, faces, points, radius, sides=6):
    start=len(verts)
    for i,p in enumerate(points):
        p=Vector(p)
        tangent=Vector(points[min(i+1,len(points)-1)])-Vector(points[max(0,i-1)])
        tangent.normalize()
        normal=Vector((0,-1,0)); side=tangent.cross(normal).normalized(); normal=side.cross(tangent).normalized()
        # Soft, tucked thread ends; no blunt floating caps.
        t=i/(len(points)-1); rad=radius*(.44+.56*math.sin(math.pi*t)**.30)
        for k in range(sides):
            a=2*math.pi*k/sides
            v=p+rad*(normal*math.cos(a)+side*math.sin(a))
            verts.append(tuple(v))
    for j in range(len(points)-1):
        for k in range(sides):
            a=start+j*sides+k; b=start+j*sides+(k+1)%sides
            faces.append((a,b,b+sides,a+sides))
    faces.append(tuple(start+i for i in reversed(range(sides))))
    last=start+(len(points)-1)*sides; faces.append(tuple(last+i for i in range(sides)))


def _mesh(name,vertices,faces,mat,parent):
    me=bpy.data.meshes.new(name); me.from_pydata(vertices,[],faces); me.update()
    ob=bpy.data.objects.new(name,me); bpy.context.collection.objects.link(ob)
    ob.parent=parent; ob.data.materials.append(mat)
    for poly in me.polygons: poly.use_smooth=True
    return ob


def build_satin_lettering(text_lines=['REAVES','DROPPER'], width=.78,
                         line_height=.18, centers_z=[1.05,.77], surface_fn=None):
    """Build true yarn geometry over padded lettering; returns root Empty.

    surface_fn(x,z) returns the banner's Y coordinate. Height is visible cap height.
    Thread diameter ~1.6 mm; thread tops ~5.8 mm proud of the cloth.
    Width may be scalar or per-line list. No emission, metallic, colored outlines.
    """
    surface_fn=surface_fn or (lambda x,z:0.0)
    root=bpy.data.objects.new('Satin embroidery | ivory raised lettering',None)
    bpy.context.collection.objects.link(root)
    mat=_material(); rng=random.Random(2608); total_stitches=0
    for li,text in enumerate(text_lines):
        w=width[li] if isinstance(width,(tuple,list)) else width
        h=line_height[li] if isinstance(line_height,(tuple,list)) else line_height
        zcenter=centers_z[li]
        mask,ppm=_mask(text,w,h)
        ny,nx=mask.shape
        def world(q): return ((q[1]-(nx-1)/2)/ppm,zcenter-((q[0]-(ny-1)/2)/ppm))
        # A low padded foundation fills tiny gaps and keeps the glyph silhouette clean.
        # It is deliberately below the stitched dome, never used as visible flat type.
        dist=distance_transform_edt(mask)
        verts=[]; faces=[]; lookup={}
        step=3
        for iy in range(0,ny-step,step):
            for ix in range(0,nx-step,step):
                if not mask[iy:iy+step+1,ix:ix+step+1].all():continue
                corners=[]
                for yy,xx in ((iy,ix),(iy+step,ix),(iy+step,ix+step),(iy,ix+step)):
                    key=(yy,xx)
                    if key not in lookup:
                        x,z=world(key)
                        lift=.00045+min(dist[yy,xx]/(ppm*.007),1)*.00075
                        lookup[key]=len(verts); verts.append((x,surface_fn(x,z)-lift,z))
                    corners.append(lookup[key])
                faces.append(tuple(corners))
        base=_mesh(text+' • padded ivory underlay',verts,faces,mat,root)
        verts=[];faces=[]; count=0
        for raw in _paths(_thin(mask),mask):
            path=gaussian_filter1d(raw,1.5,axis=0,mode='nearest')
            distances=np.r_[0,np.cumsum(np.sqrt(np.sum(np.diff(path,axis=0)**2,axis=1)))]
            length=distances[-1]
            if length<3:continue
            spacing=.0016*ppm
            for pos in np.arange(.45*spacing,length-.15*spacing,spacing):
                q=np.array([np.interp(pos,distances,path[:,0]),np.interp(pos,distances,path[:,1])])
                qa=np.array([np.interp(max(0,pos-4),distances,path[:,0]),np.interp(max(0,pos-4),distances,path[:,1])])
                qb=np.array([np.interp(min(length,pos+4),distances,path[:,0]),np.interp(min(length,pos+4),distances,path[:,1])])
                tangent=qb-qa; norm=np.linalg.norm(tangent)
                if norm<.01:continue
                tangent/=norm
                normal=np.array([-tangent[1],tangent[0]])
                # Deliberately slight stitch slant, like machine satin rows.
                normal+=tangent*(.10+.035*rng.uniform(-1,1)); normal/=np.linalg.norm(normal)
                ends=[]
                for sign in (-1,1):
                    r=0.
                    while r<95:
                        p=q+normal*sign*r; yy,xx=np.round(p).astype(int)
                        if yy<0 or xx<0 or yy>=ny or xx>=nx or not mask[yy,xx]:break
                        r+=.35
                    ends.append(q+normal*sign*max(.0,r-.65))
                span=np.linalg.norm(ends[1]-ends[0])/ppm
                if span<.002:continue
                points=[]; arch=.00365+rng.uniform(-.00022,.00022)
                # Nine samples create real rounded arched strands across each local stroke.
                for j in range(9):
                    t=j/8; p=ends[0]*(1-t)+ends[1]*t
                    p+=tangent*math.sin(math.pi*t)*rng.uniform(-.11,.11)
                    x,z=world(p)
                    lift=.00090+arch*math.sin(math.pi*t)**.56
                    points.append((x,surface_fn(x,z)-lift,z))
                _add_tube(verts,faces,points,.00081*rng.uniform(.91,1.06))
                count+=1
        yarn=_mesh(text+' • individual arched satin threads',verts,faces,mat,root)
        yarn['stitch_count']=count; yarn['real_geometry']=True
        total_stitches+=count
    root['stitch_count']=total_stitches
    root['technique']='Actual rounded mesh threads arched across local letter-stroke widths'
    root['thread_diameter_m']=.00162
    root['maximum_raise_m']=.0056
    return root
