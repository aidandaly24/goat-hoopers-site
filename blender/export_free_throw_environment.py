"""Derive browser scenery from the approved Outdoor Art Study, never rebuild it.

blender -b -t 5 --python blender/export_free_throw_environment.py -- \
  --source /path/GOAT_HOOPERS_Outdoor_Art_Study.blend \
  --out public/3d/free-throw/environment
"""
import argparse, bpy, gzip, hashlib, json, math, os, sys
from mathutils import Vector
from mathutils.bvhtree import BVHTree
from mathutils.geometry import barycentric_transform

parser=argparse.ArgumentParser()
parser.add_argument('--source',required=True);parser.add_argument('--out',required=True)
parser.add_argument('--cache')
args=parser.parse_args(sys.argv[sys.argv.index('--')+1:])
source=os.path.abspath(args.source);out=os.path.abspath(args.out);os.makedirs(out,exist_ok=True)
source_hash=hashlib.sha256(open(source,'rb').read()).hexdigest()
bpy.ops.wm.open_mainfile(filepath=source)
scene=bpy.context.scene;scene.frame_set(1);scene.cycles.samples=8;scene.cycles.use_denoising=False
scene.render.threads_mode='FIXED';scene.render.threads=5
original=list(scene.objects)
placements=[]
for o in bpy.data.collections['03 · MODELED CROWD · COLLECTION INSTANCES'].objects:
    kind='standing' if o['standing'] else 'seated'
    placements.append({'variant':kind+'_%02d'%o['archetype'],'position':[round(o.location.x,5),round(o.location.z,5),round(-o.location.y,5)],'rotation':round(o.rotation_euler.z,6),'scale':[round(o.scale.x,5),round(o.scale.z,5),round(o.scale.y,5)],'group':o['reaction_group']})
placements.sort(key=lambda x:(x['position'][2],x['position'][0]))
for o in original:o.hide_render=True

# Bake only the existing world shader. No replacement sky or downloaded images.
camera=bpy.data.objects.new('Export sky camera',bpy.data.cameras.new('Export sky camera'))
scene.collection.objects.link(camera);camera.data.type='PANO';camera.data.panorama_type='EQUIRECTANGULAR'
camera.rotation_euler=(math.pi/2,0,0);scene.camera=camera
scene.render.resolution_x=2048;scene.render.resolution_y=1024;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='JPEG';scene.render.image_settings.quality=90
scene.render.filepath=os.path.join(out,'sky.jpg');bpy.ops.render.render(write_still=True)
camera.hide_render=True

exports=bpy.data.collections.new('Derived runtime assets');scene.collection.children.link(exports)
def select_only(objects):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objects:o.hide_set(False);o.select_set(True)
    bpy.context.view_layer.objects.active=objects[0]

material=bpy.data.materials.new('Outdoor · shared vertex color + baked AO');material.use_nodes=True
p=material.node_tree.nodes.get('Principled BSDF');p.inputs['Roughness'].default_value=.78
attribute=material.node_tree.nodes.new('ShaderNodeVertexColor');attribute.layer_name='Color'
material.node_tree.links.new(attribute.outputs['Color'],p.inputs['Base Color'])
def color_and_ao(o,minimum=.55):
    """Retain authored colors and bake self/contact occlusion into shared color."""
    mesh=o.data
    base=[]
    for poly in mesh.polygons:
        m=mesh.materials[poly.material_index] if poly.material_index<len(mesh.materials) else None
        color=(.3,.3,.3,1)
        if m:
            shader=m.node_tree.nodes.get('Principled BSDF') if m.use_nodes else None
            color=tuple(shader.inputs['Base Color'].default_value) if shader else tuple(m.diffuse_color)
        for i in poly.loop_indices:base.append((i,color))
    ao=mesh.color_attributes.new(name='Color',type='FLOAT_COLOR',domain='CORNER')
    mesh.color_attributes.active_color=ao;mesh.color_attributes.render_color_index=mesh.color_attributes.find('Color')
    scene.render.bake.target='VERTEX_COLORS';scene.render.bake.use_clear=True
    o.hide_render=False;select_only([o]);bpy.ops.object.bake(type='AO')
    for i,c in base:
        factor=minimum+(1-minimum)*max(0,min(1,ao.data[i].color[0]))
        ao.data[i].color=(*[max(0,min(1,value*factor)) for value in c[:3]],1)
    o.hide_render=True

# Static scenery: evaluate the actual beveled architecture, text and foliage.
copies=[]
for name in ['02 · TERRACES, BENCHES & AISLES','04 · CITY · NEAR / MIDDLE / FAR','05 · TREES & STREET DETAILS']:
    for obj in bpy.data.collections[name].objects:
        if obj.type not in ['MESH','CURVE','FONT']:continue
        copy=obj.copy();copy.data=obj.data.copy();exports.objects.link(copy);copy.hide_render=True;copies.append(copy)
select_only(copies);bpy.ops.object.convert(target='MESH');bpy.ops.object.join();static=bpy.context.object;static.name='Outdoor_Static'
static.data.name='Outdoor_Static';color_and_ao(static,.28)
# Dissolve coplanar construction splits, retaining modeled reveals/cornices.
select_only([static]);d=static.modifiers.new('Remove coplanar construction splits','DECIMATE');d.decimate_type='DISSOLVE';d.angle_limit=.003
bpy.ops.object.modifier_apply(modifier=d.name)
dec=static.modifiers.new('Scenery silhouette LOD','DECIMATE');dec.ratio=.22;dec.use_collapse_triangulate=True
bpy.ops.object.modifier_apply(modifier=dec.name)
static.data.validate(clean_customdata=False)
exported=[static];stats=[]
static.data.calc_loop_triangles();stats.append({'name':static.name,'triangles':len(static.data.loop_triangles)})

# Decimate each existing mesh, then transfer original morph deltas by surface
# barycentrics. No alternate character builder or replacement crowd is used.
for kind,label in [('seated','Seated'),('standing','Standing')]:
    scene.cycles.samples=32
    for index in range(18):
        if kind+'_%02d'%index not in {p['variant'] for p in placements}:continue
        original_model=next(o for o in bpy.data.collections[label+' archetype %02d'%index].objects if o.type=='MESH')
        orig=original_model.data;orig.calc_loop_triangles()
        rest=[Vector(v.co) for v in orig.vertices];triangles=[tuple(t.vertices) for t in orig.loop_triangles]
        bvh=BVHTree.FromPolygons(rest,triangles,all_triangles=True)
        poses={name:[Vector(v.co) for v in orig.shape_keys.key_blocks[name].data] for name in ['Applause','Cheer','Disappointment']}
        template=original_model.copy();template.data=orig.copy();exports.objects.link(template)
        template.animation_data_clear();template.shape_key_clear();template.location=(0,0,0);template.hide_render=True
        color_and_ao(template)
        for lod,ratio in [('near',.42),('far',.25)]:
            model=template.copy();model.data=template.data.copy();exports.objects.link(model)
            model.name='%s_%02d_%s'%(kind,index,lod);model.data.name=model.name
            select_only([model]);dec=model.modifiers.new('Derived crowd '+lod,'DECIMATE');dec.ratio=ratio;dec.use_collapse_triangulate=True
            bpy.ops.object.modifier_apply(modifier=dec.name)
            model.data.validate(clean_customdata=False)
            model.shape_key_add(name='Basis')
            maps=[]
            for v in model.data.vertices:
                hit,normal,tri,distance=bvh.find_nearest(v.co)
                maps.append((hit,tri))
            for name,posed in poses.items():
                key=model.shape_key_add(name=name)
                for i,(hit,tri) in enumerate(maps):
                    a,b,c=triangles[tri]
                    delta=barycentric_transform(hit,rest[a],rest[b],rest[c],posed[a],posed[b],posed[c])-hit
                    key.data[i].co=model.data.vertices[i].co+delta
            model.data.calc_loop_triangles();stats.append({'name':model.name,'triangles':len(model.data.loop_triangles),'vertices':len(model.data.vertices)})
            model['source_archetype']=label+' archetype %02d'%index;model['lod_ratio']=ratio
            exported.append(model)
        bpy.data.objects.remove(template,do_unlink=True)
        print('Derived',kind,index,flush=True)

select_only(exported)
for o in exported:
    o.hide_render=False
    surface=o.data.attributes.new(name='_SURFACE',type='FLOAT_VECTOR',domain='CORNER')
    for poly in o.data.polygons:
        m=o.data.materials[poly.material_index]
        p=m.node_tree.nodes.get('Principled BSDF') if m.use_nodes else None
        values=(p.inputs['Roughness'].default_value,p.inputs['Metallic'].default_value,p.inputs['Emission Strength'].default_value) if p else (.8,0,0)
        for loop in poly.loop_indices:surface.data[loop].vector=values
    o.data.materials.clear();o.data.materials.append(material)
    for poly in o.data.polygons:poly.material_index=0
path=os.path.join(out,'outdoor.glb')
if args.cache:bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(args.cache),compress=True)
bpy.ops.export_scene.gltf(filepath=path,export_format='GLB',use_selection=True,export_animations=False,export_morph=True,export_morph_normal=True,export_extras=True,export_vertex_color='ACTIVE',export_all_vertex_colors=False,export_texcoords=False,export_attributes=True)
raw=open(path,'rb').read()
with open(path+'.gz','wb') as f:f.write(gzip.compress(raw,compresslevel=9,mtime=0))
manifest={'version':1,'source_library_file_id':'libfile_b28d1e8cf25c8191ad44b666b4bfd61a','source_blend_sha256':source_hash,'method':'Derived from original approved mesh data; decimated LODs, surface-transferred morph targets, authored base colors with baked AO, shared PBR material, original world baked to sky. No rebuilt characters.','spectators':placements,'geometry':stats,'asset_bytes':len(raw),'gzip_bytes':os.path.getsize(path+'.gz'),'sky_bytes':os.path.getsize(os.path.join(out,'sky.jpg')),'morph_targets':['Applause','Cheer','Disappointment'],'source_spectator_count':416,'runtime_tested':False}
open(os.path.join(out,'manifest.json'),'w').write(json.dumps(manifest,separators=(',',':')))
print('EXPORT COMPLETE',json.dumps({k:v for k,v in manifest.items() if k not in ['spectators','geometry']}),flush=True)
