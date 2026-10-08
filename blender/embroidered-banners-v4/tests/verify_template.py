"""Run in Blender against a copied package; no rendering or network calls."""
import os,sys,json,tempfile,math
import bpy
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));sys.path.insert(0,ROOT)
import generate_banner as gen
OUT=os.path.join(ROOT,'tests','outputs');os.makedirs(OUT,exist_ok=True)
results=[]
def check(name,condition):
    assert condition,name
    results.append({'check':name,'passed':True})
def run(config):
    path=os.path.join(OUT,'active-test.json');json.dump(config,open(path,'w'))
    sys.argv=['verify_template.py','--','--config',path,'--output-dir',OUT,'--no-render'];gen.main()
    return json.load(open(os.path.join(OUT,config['asset_id']+'.json')))
configs={k:json.load(open(ROOT+'/configs/'+k+'.json')) for k in ['reaves-dropper','josh-diddys-roster','neutral']}
j=dict(configs['josh-diddys-roster']);j['asset_id']='qa-banner';r=run(j)
check('Three-line changed name and championship generate',r['name_lines']==['JOSH','DIDDY’S','ROSTER'] and any(o.name.startswith('CONFIRMED CHAMPIONSHIP') for o in bpy.data.objects))
c=dict(configs['reaves-dropper']);c['asset_id']='qa-banner';a=run(c)
check('Regeneration removes previous title and name',not any(o.name.startswith('CONFIRMED CHAMPIONSHIP') or 'JOSH' in o.name or 'DIDDY' in o.name for o in bpy.data.objects))
check('One team lettering root',sum(o.name.startswith('TEAM NAME |') for o in bpy.data.objects)==1)
b=run(c)
check('Same configuration regenerates identical vertex coordinates',a['geometry_sha256']==b['geometry_sha256'])
check('All file-backed images are packed',all(im.packed_file is not None for im in bpy.data.images if im.source=='FILE'))
check('No linked external .blend libraries',len(bpy.data.libraries)==0)
v=[v.co for root in bpy.data.objects if root.name.startswith('TEAM NAME |') for ob in root.children for v in ob.data.vertices]
check('Finite nonempty lettering geometry',bool(v) and all(math.isfinite(x) for p in v for x in p))
check('Lettering stays within reinforced frame',max(abs(p.x) for p in v)<.411 and min(p.z for p in v)>.067 and max(p.z for p in v)<1.571)
neutral=run(configs['neutral'])
check('Neutral preset has no name or title geometry',not any(o.name.startswith(('TEAM NAME |','CONFIRMED CHAMPIONSHIP')) for o in bpy.data.objects))
bad=[]
t=dict(c);t['name_lines']=[' '];bad.append(('Whitespace-only name is rejected',t))
t=dict(c);t['name_lines']=['A'*17];bad.append(('Oversized name is rejected',t))
t=dict(c);t['championship']={'year':'2025','label':'CHAMPION'};bad.append(('Unconfirmed championship is rejected',t))
t=dict(c);t['palette']=dict(gen.json.load(open(ROOT+'/palettes.json'))['burgundy_cream']);t['palette']['body']='broken';bad.append(('Malformed color is rejected',t))
t=dict(c);t['render']={'width':0};bad.append(('Invalid render size is rejected',t))
for label,cfg in bad:
    rejected=False
    try:run(cfg)
    except (ValueError,KeyError):rejected=True
    check(label,rejected)
report={'checks':results,'all_passed':True,'same_config_geometry_sha256':a['geometry_sha256'],'blender_version':bpy.app.version_string,'dependencies':a['dependencies'],'tested_in_relocated_copy':True,'render_device':'CPU','mac_regeneration_tested':False}
json.dump(report,open(ROOT+'/QA_REPORT.json','w'),indent=2)
print('QA_COMPLETE',json.dumps(report),flush=True)
