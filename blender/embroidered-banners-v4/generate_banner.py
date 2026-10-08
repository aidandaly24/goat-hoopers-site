"""Generate one physical-embroidery banner from a local JSON config. No network."""
import bpy,sys,os,json,re,argparse,hashlib
from math import sin,pi
ROOT=os.path.dirname(os.path.abspath(__file__));sys.path.insert(0,ROOT)
try:
    from PIL import Image,ImageFont
    import numpy,scipy
    import satin_lettering as satin
except ImportError as e:
    raise RuntimeError('This generator needs Pillow, NumPy and SciPy in Blender\'s Python. No packages have been installed automatically. See README.txt.') from e
def rgb(h):
    h=h.lstrip('#')
    if not re.fullmatch('[0-9a-fA-F]{6}',h):raise ValueError('Colors must be six-digit hexadecimal values.')
    return tuple(v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in [int(h[i:i+2],16)/255 for i in (0,2,4)])
def surface(x,z):
    u=x/.95+.5;t=1-z/1.65
    return .018*sin(2.5*pi*u+.4)*(.2+.8*t)+.006*sin(6*pi*u-.2)*t
def lines_for_name(name):
    words=name.upper().split()
    if len(words)<=3:return words
    from itertools import combinations
    choices=[]
    for cuts in combinations(range(1,len(words)),2):
        a,b=cuts;ls=[' '.join(words[:a]),' '.join(words[a:b]),' '.join(words[b:])]
        choices.append((max(map(len,ls))*10+sum((len(x)-len(name)/3)**2 for x in ls),ls))
    return min(choices)[1]
def set_color(matname,color):
    bpy.data.materials[matname].node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value=(*rgb(color),1)
def make_letters(lines,widths,heights,centers,color,label):
    root=satin.build_satin_lettering(lines,widths,heights,centers,surface)
    root.name=label
    for ob in root.children:
        for mat in ob.data.materials:
            mat.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value=(*rgb(color),1)
    return root
def main():
    parser=argparse.ArgumentParser();parser.add_argument('--config',required=True);parser.add_argument('--output-dir',default=ROOT+'/generated');parser.add_argument('--no-render',action='store_true');args=parser.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
    with open(args.config,encoding='utf-8') as f:cfg=json.load(f)
    aid=cfg.get('asset_id','banner')
    if not re.fullmatch('[a-z0-9][a-z0-9_-]{0,99}',aid):raise ValueError('asset_id must contain lowercase letters, numbers, hyphens or underscores.')
    palettes=json.load(open(ROOT+'/palettes.json'))
    palette=cfg.get('palette','burgundy_cream');pal=palettes[palette] if isinstance(palette,str) else palette
    for k in ['body','border','border_thread','letter_thread','seam']:rgb(pal[k])
    name=cfg.get('team_name','')
    if not isinstance(name,str):raise ValueError('team_name must be a string.')
    lines=cfg.get('name_lines',lines_for_name(name))
    if not isinstance(lines,list) or any(not isinstance(x,str) for x in lines):raise ValueError('name_lines must be an array of text strings.')
    lines=[x.upper() for x in lines]
    if len(lines)>3 or any(not x.strip() or len(x)>16 for x in lines):raise ValueError('Use at most three nonempty name lines, each at most 16 characters. Shorter lines read best on phones.')
    if any(not re.fullmatch(r"[A-Z0-9 À-ɏ’'&.!?()\-]+",x) for x in lines):raise ValueError('Use Latin letters, numbers and common punctuation; emoji and unsupported scripts are not supported by the bundled font.')
    champ=cfg.get('championship');footer=[]
    if champ:
        if champ.get('confirmed') is not True:raise ValueError('Championship text requires confirmed:true. Do not invent a title.')
        year=str(champ.get('year',''));label=str(champ.get('label','CHAMPION')).upper()
        if not re.fullmatch('[0-9]{4}',year) or not label or len(label)>14:raise ValueError('Championship requires a four-digit year and label of 1–14 characters.')
        footer=[year,label]
    render=cfg.get('render',{});width=int(render.get('width',512));height=int(render.get('height',896));samples=int(render.get('samples',96))
    if not(128<=width<=2048 and 128<=height<=2048 and 16<=samples<=512):raise ValueError('Render dimensions must be 128–2048 and samples 16–512.')
    bpy.ops.wm.open_mainfile(filepath=ROOT+'/GOAT_HOOPERS_Banner_Template.blend');s=bpy.context.scene;s.cycles.seed=2608;s.cycles.use_animated_seed=False;s.cycles.samples=samples;s.cycles.use_denoising=False
    mix=next(n for n in bpy.data.materials['Traditional colored woven banner cloth'].node_tree.nodes if n.type=='MIX_RGB');mix.inputs[1].default_value=(*(v*.60 for v in rgb(pal['body'])),1)
    for matname,color in [('Broad padded woven binding',pal['border']),('Binding satin sewing thread',pal['border_thread']),('Subtle recessed double seam thread',pal['seam']),('Charcoal sewing thread',pal['body'])]:set_color(matname,color)
    # The dividers retain the approved original thread material.
    old=next(m for m in bpy.data.materials if m.name.startswith('Ivory satin embroidery'))
    old.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value=(*rgb(pal['letter_thread']),1)
    roots=[]
    if lines:
        n=len(lines);heights={1:[.24],2:[.21,.21],3:[.165,.165,.165]}[n];centers={1:[.96],2:[1.08,.78],3:[1.16,.95,.74]}[n]
        widths=[.80]*n
        # Avoid stretching a short three-line word across the whole banner.
        if n==3:
            font=ImageFont.truetype(satin.FONT,360)
            widths=[min(.80,(font.getbbox(x)[2]-font.getbbox(x)[0])/(font.getbbox(x)[3]-font.getbbox(x)[1])*h) for x,h in zip(lines,heights)]
        roots.append(make_letters(lines,widths,heights,centers,pal['letter_thread'],'TEAM NAME | physical satin embroidery'))
    if footer:
        bpy.data.objects['Raised sewn divider bars'].hide_render=True
        bpy.data.objects['Raised sewn divider bars'].hide_viewport=True
        roots.append(make_letters(footer,[.33,.70],[.10,.10],[.43,.265],pal['letter_thread'],'CONFIRMED CHAMPIONSHIP | physical satin embroidery'))
    out=os.path.abspath(args.output_dir);os.makedirs(out,exist_ok=True);base=os.path.join(out,aid)
    s.render.resolution_x=width;s.render.resolution_y=height;s.render.resolution_percentage=100;s.render.filepath=base+'.png';s.render.film_transparent=True;s.render.image_settings.color_mode='RGBA'
    s['team_name']=name;s['palette']=palette if isinstance(palette,str) else 'custom';s['championship']=json.dumps(champ);s['asset_id']=aid
    text=bpy.data.texts.get('ACTIVE_CONFIG.json') or bpy.data.texts.new('ACTIVE_CONFIG.json');text.clear();text.from_string(json.dumps(cfg,indent=2,ensure_ascii=False))
    bpy.context.preferences.filepaths.save_version=0;bpy.ops.file.pack_all();bpy.ops.wm.save_as_mainfile(filepath=base+'.blend',compress=True)
    if not args.no_render:
        bpy.ops.render.render(write_still=True);Image.open(base+'.png').save(base+'.webp','WEBP',quality=88,method=6,exact=True)
    report={'asset_id':aid,'team_name':name,'name_lines':lines,'palette':palette,'championship':champ,'dimensions_px':[width,height],'transparent':True,'stitch_count':sum(int(r['stitch_count']) for r in roots),'template_version':'4.0','geometry_sha256':hashlib.sha256(b''.join(__import__('struct').pack('<fff',*v.co) for r in roots for ob in sorted(r.children,key=lambda o:o.name) for v in ob.data.vertices)).hexdigest(),'blender_version':bpy.app.version_string,'dependencies':{'numpy':numpy.__version__,'scipy':scipy.__version__,'pillow':Image.__version__},'files':{ext:os.path.basename(base+'.'+ext) for ext in (['blend','png','webp'] if not args.no_render else ['blend'])}}
    with open(base+'.json','w',encoding='utf-8') as f:json.dump(report,f,indent=2,ensure_ascii=False)
    print('BANNER_READY',json.dumps(report,ensure_ascii=False),flush=True)
if __name__=='__main__':main()
