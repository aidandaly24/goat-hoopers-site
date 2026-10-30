"""Private QA delivery bundles; no hosting or external publication."""
import base64
import hashlib
import io
import json
from pathlib import Path
import zipfile

ROOT = Path('qa/homepage-personal-20')
OUT = ROOT / 'catalog'
manifest = json.loads((OUT / 'manifest.json').read_text())
assert len(manifest['concepts']) == 20
sha = lambda data: hashlib.sha256(data).hexdigest()
LIMIT = 10 * 1024 * 1024


def gallery(group, only_persona=None):
    entries = []
    for concept in group:
        images = {}
        for persona in ([only_persona] if only_persona else ['reaves', 'neural', 'guest']):
            path = ROOT / concept['id'] / 'review' / f'{persona}-designed-desktop-full.jpg'
            images[persona] = 'data:image/jpeg;base64,' + base64.b64encode(path.read_bytes()).decode()
        if not only_persona:
            path = ROOT / concept['id'] / 'review' / 'reaves-structure-desktop-full.jpg'
            images['structure'] = 'data:image/jpeg;base64,' + base64.b64encode(path.read_bytes()).decode()
        entries.append({key: concept[key] for key in ['id', 'name', 'description']} | {'images': images})
    data = json.dumps(entries).replace('<', '\\u003c')
    template = '''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>GOAT complete desktop homepages</title><style>body{font:16px/1.5 Arial,sans-serif;margin:0;background:#eee;color:#171717}header,main,footer{max-width:1440px;margin:auto;padding:24px}h1{font-size:28px}p{max-width:85ch}.controls{display:flex;gap:14px;flex-wrap:wrap;align-items:center;position:sticky;top:0;background:#fff;padding:12px;z-index:1}button,select{font:inherit;min-height:44px;padding:8px}label{display:flex;gap:8px;align-items:center}#image{display:block;width:100%;height:auto;margin-top:24px}a{color:#164c77}:focus-visible{outline:3px solid #1672c9;outline-offset:3px}</style><header><h1>GOAT complete desktop homepage studies</h1><p>Every image contains the entire homepage through its footer. These are separate authors' complete site directions, with two contrasting member states and a public guest state. Current data is synthetic. Desktop first; mobile later.</p><p>This gallery embeds its images and works without external resources. The ZIP also includes each complete interactive HTML concept with its fonts, images and license notices.</p></header><main><div class="controls"><button id="prev" aria-label="Previous concept">←</button><label>Concept<select id="concept"></select></label><button id="next" aria-label="Next concept">→</button><label>State<select id="persona"><option value="reaves">Reaves Dropper</option><option value="neural">NeuralNets</option><option value="guest">Guest</option><option value="structure">Grayscale Reaves structure</option></select></label></div><h2 id="heading"></h2><p id="description"></p><p><a id="play">Open the complete interactive concept included in the ZIP</a></p><img id="image" alt=""></main><footer><p>QA only. Twenty fresh author identities are recorded in the repository. No production replacement, live account/API, merge or deployment. Interactive concepts were verified with local HTTP Chromium; no mobile, physical-device or assistive-technology certification is claimed.</p></footer><script>const entries=DATA;const choose=document.querySelector('#concept'),persona=document.querySelector('#persona');for(const entry of entries){const option=document.createElement('option');option.value=entry.id;option.textContent=entry.id+' — '+entry.name;choose.append(option)}function render(){const c=entries.find(c=>c.id===choose.value),p=persona.value;document.querySelector('#heading').textContent=c.id+' — '+c.name;document.querySelector('#description').textContent=c.description;document.querySelector('#image').src=c.images[p];document.querySelector('#image').alt='Entire '+p+' homepage: '+c.name;document.querySelector('#play').href='GOAT-personal-'+c.id+'.html?persona='+(p==='structure'?'reaves':p)}choose.onchange=render;persona.onchange=render;for(const[id,delta]of[['prev',-1],['next',1]])document.querySelector('#'+id).onclick=()=>{choose.selectedIndex=(choose.selectedIndex+delta+entries.length)%entries.length;render();choose.focus()};render();</script></html>'''
    if only_persona:
        label = {'reaves':'Reaves Dropper', 'neural':'NeuralNets', 'guest':'Public guest'}[only_persona]
        start = template.index('<select id="persona">')
        end = template.index('</select>', start) + len('</select>')
        template = template[:start] + f'<select id="persona"><option value="{only_persona}">{label}</option></select>' + template[end:]
        template = template.replace('<h1>GOAT complete desktop homepage studies</h1>', f'<h1>All 20 complete desktop homepages — {label}</h1>')
        template = template.replace('<p><a id="play">Open the complete interactive concept included in the ZIP</a></p>', '<p hidden><a id="play"></a></p>')
    return template.replace('DATA', data).encode()


def make_zip(group, html):
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        archive.writestr('gallery.html', html)
        archive.writestr('README.txt', 'Open gallery.html for complete embedded page images and all three states. Each GOAT-personal-NN.html is a self-contained interactive concept. No live account or backend is connected. Desktop only. Original sources, full-size JPGs, actual author receipts and verification are in the QA repository catalog.\n')
        for concept in group:
            archive.write(concept['standalone']['path'], Path(concept['standalone']['path']).name)
            archive.write(ROOT / concept['id'] / 'NOTES.md', f"notes/{concept['id']}.md")
        archive.writestr('source-manifest.json', json.dumps({'catalogManifestSha256': sha((OUT / 'manifest.json').read_bytes()), 'concepts': [{key: c[key] for key in ['id', 'author', 'name', 'sources', 'standalone']} for c in group]}, indent=2))
    return buffer.getvalue()


deliveries = []
concepts = manifest['concepts']
index = 0
while index < len(concepts):
    count = 3 if len(concepts) - index == 5 else min(4, len(concepts) - index)
    while True:
        group = concepts[index:index+count]
        html = gallery(group)
        zipped = make_zip(group, html)
        if len(html) < LIMIT and len(zipped) < LIMIT:
            break
        count -= 1
        if not count:
            raise RuntimeError('A single concept exceeds the delivery cap')
    stem = f"GOAT-desktop-{group[0]['id']}-{group[-1]['id']}"
    files = []
    for suffix, content in [('.html', html), ('.zip', zipped)]:
        path = OUT / (stem + suffix)
        path.write_bytes(content)
        files.append({'path': str(path), 'bytes': len(content), 'sha256': sha(content)})
    deliveries.append({'concepts': [c['id'] for c in group], 'files': files})
    index += count

all_twenty=[]
for persona in ['reaves','neural','guest']:
    content=gallery(concepts,persona)
    assert len(content)<LIMIT
    path=OUT/f'GOAT-all-20-desktop-{persona}.html'
    path.write_bytes(content)
    all_twenty.append({'persona':persona,'path':str(path),'bytes':len(content),'sha256':sha(content)})
result = {'freshAuthors': 20, 'completeConcepts': 20, 'designedFullPageImages': 60, 'neutralFullPageImages': 20, 'catalogManifestSha256': sha((OUT / 'manifest.json').read_bytes()), 'allTwentyGalleries':all_twenty,'bundles': deliveries, 'limits': 'Each native image gallery and ZIP is below10MiB. Galleries embed complete full-height images; ZIPs also include unchanged compiled interactive websites and author notes. Desktop synthetic states, no live backend/auth, mobile or deployment.'}
(OUT / 'delivery-manifest.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps({'allTwentyGalleries':all_twenty,'bundles': deliveries}, indent=2))
